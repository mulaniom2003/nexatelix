import type { Metadata } from "next";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { CodeTabs } from "@/components/site/CodeTabs";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { when } from "@/lib/format";
import { site } from "@/lib/site";
import { createApiKey, revokeApiKey } from "../actions";

export const metadata: Metadata = { title: "API" };

export default async function ApiPage() {
  const { user } = await requireUser();
  const { data } = await createAdminClient().from("api_keys").select("id, name, prefix, last_used_at, revoked, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  const keys = data ?? [];
  const B = `${site.url}/api/client/v1`;
  const samples = [
    { label: "cURL", code: `curl -X POST ${B}/send \\\n  -H "Authorization: Bearer <API_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d '{"from":"SENDER","to":"919876543210","text":"Hello via API"}'` },
    { label: "PHP", code: `<?php\n$ch = curl_init("${B}/send");\ncurl_setopt_array($ch, [\n  CURLOPT_POST => true,\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_HTTPHEADER => ["Authorization: Bearer <API_KEY>", "Content-Type: application/json"],\n  CURLOPT_POSTFIELDS => json_encode(["from" => "SENDER", "to" => "919876543210", "text" => "Hello via API"]),\n]);\necho curl_exec($ch);` },
    { label: "Python", code: `import requests\n\nr = requests.post(\n    "${B}/send",\n    headers={"Authorization": "Bearer <API_KEY>"},\n    json={"from": "SENDER", "to": "919876543210", "text": "Hello via API"},\n)\nprint(r.json())` },
    { label: "JS", code: `const r = await fetch("${B}/send", {\n  method: "POST",\n  headers: { Authorization: "Bearer <API_KEY>", "Content-Type": "application/json" },\n  body: JSON.stringify({ from: "SENDER", to: "919876543210", text: "Hello via API" }),\n});\nconsole.log(await r.json());` },
  ];
  const ref = [
    { label: "Send SMS", code: `POST ${B}/send\nContent-Type: application/json\nAuthorization: Bearer <API_KEY>\n\n{\n  "from": "SENDER",\n  "to": "919876543210",\n  "text": "Hello via API",\n  "dlr_url": "https://you.com/dlr",      (optional)\n  "client_msg_id": "order-1029"          (optional)\n}\n\n202 → { "id": "<message-id>", "client_msg_id": "order-1029", "to": "919876543210", "status": "submitted" }` },
    { label: "Bulk", code: `POST ${B}/send-bulk\n\n{\n  "from": "SENDER",\n  "to": ["919876543210", "918888888888"],   (up to 5000; a comma/space/newline string also works)\n  "text": "Hello",\n  "campaign": "Diwali promo",              (optional, shown in Reports)\n  "dlr_url": "https://you.com/dlr"         (optional)\n}\n\n202 → { "accepted": 2, "invalid": [], "messages": [{ "to": "919876543210", "id": "<message-id>" }, …] }` },
    { label: "Status", code: `GET ${B}/status/<message-id>\n\n200 → { "message": { "id": "…", "source": "SENDER", "destination": "919876543210",\n        "status": "delivered", "error_code": null, "submit_time": "…", "dlr_time": "…" } }\n\nStatuses: submitted → delivered / undelivered / expired / rejected / failed` },
    { label: "Balance", code: `GET ${B}/balance\n\n200 → { "balance": "12.50", "rcs_balance": "40.00", "credit_limit": "0", "currency": "USD" }` },
    { label: "RCS", code: `POST ${site.url}/api/rcs/v1/send\n\n{\n  "from": "<approved RCS sender>",\n  "to": "+919876543210",\n  "content": { "type": "text", "text": "Hello" }\n}\n\ncontent.type "card":     { "title", "description", "media_url", "suggestions": [{ "text", "url" }] }\ncontent.type "carousel": { "cards": [{ "title", "description", "media_url" }, …] }` },
    { label: "Callback (DLR)", code: `Pass dlr_url on any send. We POST JSON to it on every status change until a final state:\n\n{ "message_id": "<id from send>", "vendor_msg_id": null, "status": "delivered", "ts": "2026-01-01T00:00:00.000Z" }\n\nReply 2xx within ~10s. Match on message_id.\n\n<?php\n$dlr = json_decode(file_get_contents("php://input"), true);\n// $dlr["message_id"], $dlr["status"], $dlr["ts"] → update your DB\nhttp_response_code(200);` },
    { label: "Errors", code: `400  Invalid payload / no valid destinations\n401  Missing or bad API key\n402  Insufficient balance\n403  Account not active\n404  Message not found\n429  Too many requests — wait a second and retry\n502  The message couldn't be submitted\n503  Sending temporarily unavailable` },
  ];

  return (
    <>
      <PageHead title="Connect via API" sub="Send SMS over HTTPS from your website or app" />
      <section className="pcard">
        <div className="pcard-head"><h2>Set up in 3 steps</h2></div>
        <ol style={{ paddingLeft: 20, display: "grid", gap: 10, fontSize: 15, color: "var(--paper-2)" }}>
          <li><b style={{ color: "var(--paper)", fontWeight: 500 }}>Create a key</b> below (label it e.g. &ldquo;website&rdquo;) and <b style={{ color: "var(--paper)", fontWeight: 500 }}>copy it now</b>. It&apos;s shown once, then only a hash is stored.</li>
          <li><b style={{ color: "var(--paper)", fontWeight: 500 }}>Send your first SMS</b>: copy a sample, replace SENDER with your approved sender ID, and run it.</li>
          <li><b style={{ color: "var(--paper)", fontWeight: 500 }}>Track delivery</b> with <span className="mono">GET /status/:id</span>, or pass <span className="mono">dlr_url</span> and we&apos;ll POST each status change to you.</li>
        </ol>
        <p className="muted mono" style={{ fontSize: 12 }}>Base URL: {B} · Auth: Authorization: Bearer &lt;key&gt; (or ?api_key=) · Bulk: up to 5000 per request · Balance checks apply exactly like panel sends.</p>
      </section>

      <section className="pcard">
        <div className="pcard-head"><div><h2>API keys</h2><p className="muted" style={{ fontSize: 13 }}>Keys are shown once</p></div></div>
        <ActionForm action={createApiKey} submit="New key" variant="signal" className="pform">
          <input name="name" className="input" placeholder="Key label (e.g. website)" maxLength={60} aria-label="Key label" />
        </ActionForm>
        {keys.length === 0 ? (
          <Empty title="No API keys yet">Create one above.</Empty>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Key</th><th>Label</th><th>Status</th><th>Last used</th><th /></tr></thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="mono-num">{k.prefix}…</td>
                    <td>{k.name}<small>Created {when(k.created_at)}</small></td>
                    <td><span className={`badge ${k.revoked ? "b-closed" : "b-completed"}`}>{k.revoked ? "Revoked" : "Active"}</span></td>
                    <td className="muted">{k.last_used_at ? when(k.last_used_at) : "Never"}</td>
                    <td className="num">
                      {!k.revoked && (
                        <form action={revokeApiKey}><input type="hidden" name="id" value={k.id} /><button type="submit" className="tag" style={{ color: "var(--danger)" }}>Revoke</button></form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pcard-head" style={{ marginTop: 8 }}><h2>Integration sample</h2></div>
        <CodeTabs tabs={samples} />
      </section>

      <section className="pcard">
        <div className="pcard-head"><div><h2>HTTP API reference</h2><p className="muted" style={{ fontSize: 13 }}>Every endpoint, the callback format and error codes</p></div><a href="/app/api/docs" className="btn btn-ghost btn-sm" download>API docs (.md)</a></div>
        <CodeTabs tabs={ref} />
      </section>
    </>
  );
}
