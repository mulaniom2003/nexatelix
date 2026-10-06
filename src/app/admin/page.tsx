import Link from "next/link";
import { PageHead } from "@/components/panel/PanelShell";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { providerBalance, upstreamConfigured } from "@/lib/upstream";
import { syncPending } from "@/lib/messaging";
import { addDays, count, istDate, istStart, money } from "@/lib/format";

type Ctry = { iso: string; country: string; total: number; delivered: number; failed: number; pending: number; cost: number };

export default async function AdminHome() {
  await requireAdmin();
  await syncPending(null, 40);
  const db = createAdminClient();
  const today = istDate();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [prov, clients, wallets, todayC, monthC, topups, senders] = await Promise.all([
    providerBalance(),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("wallets").select("balance"),
    db.rpc("msg_country_summary", { p_user: null, p_from: istStart(today).toISOString(), p_to: istStart(addDays(today, 1)).toISOString() }),
    db.rpc("msg_country_summary", { p_user: null, p_from: istStart(monthStart).toISOString(), p_to: istStart(addDays(today, 1)).toISOString() }),
    db.from("topups").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("sender_ids").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const sum = (rows: Ctry[] | null, k: keyof Ctry) => (rows ?? []).reduce((s, r) => s + Number(r[k]), 0);
  const t = (todayC.data ?? []) as Ctry[];
  const m = (monthC.data ?? []) as Ctry[];
  const owed = (wallets.data ?? []).reduce((s, w) => s + Number(w.balance), 0);

  return (
    <>
      <PageHead title="Overview" sub={upstreamConfigured ? "Delivery platform connected." : "Delivery platform not connected yet: add UPSTREAM_BASE_URL and UPSTREAM_API_KEY in the site settings."} />
      <div className="kpis">
        <div className="kpi hl"><span className="lbl">Platform balance</span><span className="val">{prov ? `${prov.balance.toFixed(2)} ${prov.currency}` : "—"}</span><span className="hint">Your account on the delivery platform</span></div>
        <div className="kpi"><span className="lbl">Sales today</span><span className="val">{money(sum(t, "cost"))}</span><span className="hint">{count(sum(t, "total"))} messages · {count(sum(t, "delivered"))} delivered</span></div>
        <div className="kpi"><span className="lbl">Sales this month</span><span className="val">{money(sum(m, "cost"))}</span><span className="hint">{count(sum(m, "total"))} messages</span></div>
        <div className="kpi"><span className="lbl">Client balances</span><span className="val">{money(owed)}</span><span className="hint">{count(clients.count ?? 0)} clients</span></div>
      </div>
      <div className="pgrid-even">
        <section className="pcard">
          <div className="pcard-head"><h2>Waiting on you</h2></div>
          <dl className="kv">
            <dt>Top-ups</dt><dd><Link href="/admin/topups" className="link-u signal">{count(topups.count ?? 0)} pending</Link></dd>
            <dt>Sender IDs</dt><dd><Link href="/admin/senders" className="link-u signal">{count(senders.count ?? 0)} pending</Link></dd>
          </dl>
        </section>
        <section className="pcard">
          <div className="pcard-head"><h2>Today by country</h2><Link href="/admin/messages" className="link-u muted" style={{ fontSize: 14 }}>Messages</Link></div>
          {t.length === 0 ? <p className="muted">No messages today.</p> : (
            <table className="tbl"><tbody>
              {t.map((c) => (
                <tr key={c.iso}><td><span className="flag">{c.iso}</span>{c.country}</td><td className="num">{count(c.total)}<small>{count(c.delivered)} delivered · {count(c.failed)} failed</small></td><td className="num">{money(Number(c.cost), 4)}</td></tr>
              ))}
            </tbody></table>
          )}
        </section>
      </div>
    </>
  );
}
