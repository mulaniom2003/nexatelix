import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { Icon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { syncPending } from "@/lib/messaging";
import { addDays, count, isYmd, istDate, istStart, money, when } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

type Camp = { id: string; name: string; channel: string; created_at: string; total: number; delivered: number; failed: number; pending: number; cost: number };
type Ctry = { iso: string; country: string; total: number; delivered: number; failed: number; pending: number; cost: number };

export default async function Reports({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; day?: string }> }) {
  const { user } = await requireUser();
  const sp = await searchParams;
  const today = istDate();
  const from = isYmd(sp.from) ? sp.from : addDays(today, -29);
  const to = isYmd(sp.to) ? sp.to : today;
  const day = sp.day === "yesterday" ? addDays(today, -1) : today;
  await syncPending(user.id, 30);

  const db = createAdminClient();
  const [{ data: camps }, { data: ctry }] = await Promise.all([
    db.rpc("msg_campaign_stats", { p_user: user.id, p_from: istStart(from).toISOString(), p_to: istStart(addDays(to, 1)).toISOString() }),
    db.rpc("msg_country_summary", { p_user: user.id, p_from: istStart(day).toISOString(), p_to: istStart(addDays(day, 1)).toISOString() }),
  ]);
  const list = (camps ?? []) as Camp[];
  const countries = (ctry ?? []) as Ctry[];
  const tot = list.reduce((a, c) => ({ n: a.n + Number(c.total), d: a.d + Number(c.delivered), f: a.f + Number(c.failed) }), { n: 0, d: 0, f: 0 });
  const dayQ = `from=${day}&to=${day}`;
  const keep = `from=${from}&to=${to}`;

  return (
    <>
      <PageHead title="Reports" sub="Campaign overview · date-wise · per-number detail" />
      <div className="kpis">
        <div className="kpi"><span className="lbl">Campaigns</span><span className="val">{count(list.length)}</span></div>
        <div className="kpi"><span className="lbl">Numbers pushed</span><span className="val">{count(tot.n)}</span></div>
        <div className="kpi"><span className="lbl">Delivered</span><span className="val" style={{ color: "var(--signal)" }}>{count(tot.d)}</span></div>
        <div className="kpi"><span className="lbl">Failed</span><span className="val" style={{ color: tot.f ? "var(--danger)" : undefined }}>{count(tot.f)}</span></div>
      </div>

      <form className="pcard inline-form">
        <input type="hidden" name="day" value={sp.day ?? ""} />
        <div className="field" style={{ flex: "1 1 160px" }}><label htmlFor="r-from">From date</label><input id="r-from" name="from" type="date" defaultValue={from} max={today} className="input" /></div>
        <div className="field" style={{ flex: "1 1 160px" }}><label htmlFor="r-to">To date</label><input id="r-to" name="to" type="date" defaultValue={to} max={today} className="input" /></div>
        <button type="submit" className="btn btn-signal btn-sm" style={{ marginBottom: 6 }}>Apply</button>
      </form>

      <section className="pcard">
        <div className="pcard-head">
          <div>
            <h2>Country summary</h2>
            <p className="muted" style={{ fontSize: 13 }}>Totals per country · {day === today ? "today" : "yesterday"} (India time) · downloads include every message</p>
          </div>
          <div className="btn-row">
            <div className="filters">
              <Link href={`/app/reports?${keep}`} className={day === today ? "on" : ""}>Today</Link>
              <Link href={`/app/reports?${keep}&day=yesterday`} className={day !== today ? "on" : ""}>Yesterday</Link>
            </div>
            <a href={`/app/reports/export?${dayQ}`} className="btn btn-signal btn-sm"><Icon.download /> Full report (CSV)</a>
          </div>
        </div>
        {countries.length === 0 ? (
          <p className="muted" style={{ fontSize: 14 }}>No messages {day === today ? "today" : "yesterday"}.</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Country</th><th className="num">Total</th><th className="num">Delivered</th><th className="num">Failed</th><th className="num">Pending</th><th className="num">Cost</th><th className="num">Report</th></tr></thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.iso}>
                    <td><span className="flag">{c.iso}</span>{c.country}</td>
                    <td className="num">{count(c.total)}</td>
                    <td className="num signal">{count(c.delivered)}</td>
                    <td className="num" style={{ color: Number(c.failed) ? "var(--danger)" : undefined }}>{count(c.failed)}</td>
                    <td className="num">{count(c.pending)}</td>
                    <td className="num">{money(Number(c.cost), 4)}</td>
                    <td className="num"><a href={`/app/reports/export?${dayQ}&iso=${c.iso}`} className="tag"><Icon.download width={14} height={14} /> CSV</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="pcard">
        <div className="pcard-head"><h2>Campaigns</h2><span className="muted" style={{ fontSize: 13 }}>{from} → {to}</span></div>
        {list.length === 0 ? (
          <Empty title="No campaigns in this period">Bulk and file sends appear here as campaigns.</Empty>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Time</th><th>Campaign</th><th className="num">Numbers</th><th className="num">Delivered</th><th className="num">Failed</th><th className="num">DLR %</th><th className="num">Report</th></tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{when(c.created_at)}</td>
                    <td>{c.name}<small>{String(c.channel).toUpperCase()} · {money(Number(c.cost), 4)}{Number(c.pending) ? ` · ${count(c.pending)} pending` : ""}</small></td>
                    <td className="num">{count(c.total)}</td>
                    <td className="num signal">{count(c.delivered)}</td>
                    <td className="num" style={{ color: Number(c.failed) ? "var(--danger)" : undefined }}>{count(c.failed)}</td>
                    <td className="num">{Number(c.total) ? ((Number(c.delivered) / Number(c.total)) * 100).toFixed(1) : "0.0"}%</td>
                    <td className="num"><a href={`/app/reports/export?campaign=${c.id}`} className="tag"><Icon.download width={14} height={14} /> CSV</a></td>
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
