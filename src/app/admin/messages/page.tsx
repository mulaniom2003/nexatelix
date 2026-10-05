import type { Metadata } from "next";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { MsgStatus } from "@/components/panel/MsgStatus";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { cleanNumber } from "@/lib/numbers";
import { money, when } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

export default async function AdminMessages({ searchParams }: { searchParams: Promise<{ to?: string; status?: string; channel?: string; client?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = createAdminClient();
  let q = db.from("messages").select("id, channel, sender, recipient, iso, status, error, price, upstream_id, source, created_at, profiles(email, full_name)").order("created_at", { ascending: false }).limit(300);
  const num = cleanNumber(sp.to ?? "");
  if (num) q = q.like("recipient", `%${num}%`);
  if (sp.status && sp.status !== "all") q = sp.status === "failed" ? q.in("status", ["failed", "rejected", "expired", "undelivered"]) : q.eq("status", sp.status);
  if (sp.channel === "sms" || sp.channel === "rcs") q = q.eq("channel", sp.channel);
  if (sp.client) {
    const { data: u } = await db.from("profiles").select("id").ilike("email", `%${sp.client.replace(/[%,()]/g, "")}%`).limit(20);
    q = q.in("user_id", (u ?? []).map((x) => x.id).concat("00000000-0000-0000-0000-000000000000"));
  }
  const { data } = await q;

  return (
    <>
      <PageHead title="Messages" sub="Every message from every client, newest first (300 max)." />
      <form className="pcard inline-form">
        <div className="field" style={{ flex: "1 1 180px" }}><label htmlFor="m-c">Client email</label><input id="m-c" name="client" defaultValue={sp.client ?? ""} className="input" /></div>
        <div className="field" style={{ flex: "1 1 160px" }}><label htmlFor="m-to">Number</label><input id="m-to" name="to" defaultValue={sp.to ?? ""} className="input mono" /></div>
        <div className="field" style={{ flex: "1 1 120px" }}><label htmlFor="m-ch">Channel</label><select id="m-ch" name="channel" defaultValue={sp.channel ?? "all"} className="select"><option value="all">All</option><option value="sms">SMS</option><option value="rcs">RCS</option></select></div>
        <div className="field" style={{ flex: "1 1 140px" }}><label htmlFor="m-st">Status</label><select id="m-st" name="status" defaultValue={sp.status ?? "all"} className="select">{["all", "queued", "submitted", "accepted", "delivered", "failed"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <button className="btn btn-signal btn-sm" type="submit" style={{ marginBottom: 6 }}>Filter</button>
      </form>
      <section className="pcard">
        {(data ?? []).length === 0 ? <Empty title="No messages match" /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Time</th><th>Client</th><th>From → To</th><th>Status</th><th className="num">Price</th></tr></thead>
              <tbody>
                {data!.map((m) => {
                  const p = m.profiles as unknown as { email: string; full_name: string | null } | null;
                  return (
                    <tr key={m.id}>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>{when(m.created_at)}<small>{m.channel.toUpperCase()} · {m.source}</small></td>
                      <td>{p?.full_name || "—"}<small>{p?.email}</small></td>
                      <td className="mono-num">{m.sender} → {m.recipient}<small>{m.iso} · {m.upstream_id ?? "no platform id"}</small></td>
                      <td><MsgStatus s={m.status} />{m.error && <small>{m.error}</small>}</td>
                      <td className="num">{money(Number(m.price), 4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
