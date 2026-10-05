import type { Metadata } from "next";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { MsgStatus } from "@/components/panel/MsgStatus";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { syncPending } from "@/lib/messaging";
import { cleanNumber } from "@/lib/numbers";
import { when } from "@/lib/format";

export const metadata: Metadata = { title: "RCS History" };
const STATUSES = ["all", "submitted", "accepted", "delivered", "failed"];

export default async function RcsHistory({ searchParams }: { searchParams: Promise<{ to?: string; status?: string }> }) {
  const { user } = await requireUser();
  const { to = "", status = "all" } = await searchParams;
  await syncPending(user.id, 20);
  let q = createAdminClient().from("messages").select("id, sender, recipient, status, price, error, created_at, campaign_id").eq("user_id", user.id).eq("channel", "rcs").order("created_at", { ascending: false }).limit(200);
  const num = cleanNumber(to);
  if (num) q = q.like("recipient", `%${num}%`);
  if (status !== "all") q = status === "failed" ? q.in("status", ["failed", "rejected", "expired", "undelivered"]) : q.eq("status", status);
  const { data } = await q;

  return (
    <>
      <PageHead title="RCS History" sub="Your RCS messages and delivery status" />
      <form className="pcard inline-form">
        <div className="field" style={{ flex: "1 1 200px" }}>
          <label htmlFor="h-to">Destination</label>
          <input id="h-to" name="to" defaultValue={to} className="input mono" placeholder="+9198…" />
        </div>
        <div className="field" style={{ flex: "1 1 160px" }}>
          <label htmlFor="h-st">Status</label>
          <select id="h-st" name="status" defaultValue={status} className="select">
            {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-signal btn-sm" style={{ marginBottom: 6 }}>Search</button>
      </form>
      <section className="pcard">
        {(data ?? []).length === 0 ? (
          <Empty title="No RCS messages found">{to || status !== "all" ? "Try a different number or status." : "Messages you send from Send RCS appear here."}</Empty>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Time</th><th>Sender</th><th>To</th><th>Status</th><th className="num">Price</th></tr></thead>
              <tbody>
                {data!.map((m) => (
                  <tr key={m.id}>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{when(m.created_at)}</td>
                    <td className="mono-num">{m.sender}</td>
                    <td className="mono-num">+{m.recipient}</td>
                    <td><MsgStatus s={m.status} />{m.error && <small>{m.error}</small>}</td>
                    <td className="num mono-num">{Number(m.price).toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
