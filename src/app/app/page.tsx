import Link from "next/link";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { MsgStatus } from "@/components/panel/MsgStatus";
import { Btn } from "@/components/Btn";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { count, money, when } from "@/lib/format";

export default async function Overview() {
  const { user, profile } = await requireUser();
  const db = createAdminClient();
  const [{ data: w }, { data: stats }, { data: recent }] = await Promise.all([
    db.from("wallets").select("balance, rcs_balance").eq("user_id", user.id).single(),
    db.rpc("msg_overview", { p_user: user.id }),
    db.from("messages").select("id, channel, sender, recipient, status, price, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);
  const st = (Array.isArray(stats) ? stats[0] : stats) as { sent_today: number; sent_month: number; delivered_all: number } | null;
  const first = (profile.full_name ?? "").split(" ")[0];

  return (
    <>
      <PageHead title={first ? <>Hello, {first}</> : "Overview"} sub="Your account at a glance." action={<div className="btn-row"><Btn href="/app/rcs" variant="ghost" size="sm">Send RCS</Btn><Btn href="/app/sms" variant="signal" size="sm">Send SMS</Btn></div>} />
      <div className="kpis">
        <div className="kpi hl">
          <span className="lbl">Balance (EUR)</span>
          <span className="val">{money(Number(w?.balance ?? 0))}</span>
          <span className="hint">RCS wallet {money(Number(w?.rcs_balance ?? 0))}</span>
        </div>
        <div className="kpi"><span className="lbl">Sent today</span><span className="val">{count(st?.sent_today ?? 0)}</span></div>
        <div className="kpi"><span className="lbl">Sent this month</span><span className="val">{count(st?.sent_month ?? 0)}</span></div>
        <div className="kpi"><span className="lbl">Delivered (all time)</span><span className="val" style={{ color: "var(--signal)" }}>{count(st?.delivered_all ?? 0)}</span></div>
      </div>
      <section className="pcard">
        <div className="pcard-head">
          <h2>Recent messages</h2>
          <Link href="/app/reports" className="link-u muted" style={{ fontSize: 14 }}>Reports</Link>
        </div>
        {(recent ?? []).length === 0 ? (
          <Empty title="No messages yet">
            Add credit in Wallet, then send your first SMS.
            <div className="btn-row" style={{ justifyContent: "center", marginTop: 12 }}>
              <Btn href="/app/wallet" variant="ghost" size="sm">Wallet</Btn>
              <Btn href="/app/sms" size="sm">Send SMS</Btn>
            </div>
          </Empty>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Time</th><th>From → To</th><th>Channel</th><th>Status</th><th className="num">Cost</th></tr></thead>
              <tbody>
                {recent!.map((m) => (
                  <tr key={m.id}>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{when(m.created_at)}</td>
                    <td className="mono-num">{m.sender} → {m.recipient}</td>
                    <td>{m.channel.toUpperCase()}</td>
                    <td><MsgStatus s={m.status} /></td>
                    <td className="num">{money(Number(m.price), 4)}</td>
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
