import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { MsgStatus } from "@/components/panel/MsgStatus";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { count, day, money, when } from "@/lib/format";
import { addSender, adjustBalance, assignRoute, reviewSender, setUserFlag, unassignRoute } from "../../actions";

export const metadata: Metadata = { title: "Client" };

type Route = { id: number; channel: string; name: string; country: string; iso: string; dial_code: string; price: number; is_global: boolean; active: boolean };

export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const { user: me } = await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();
  const [{ data: u }, { data: w }, { data: msgs }, { data: tx }, { data: routes }, { data: assigned }, { data: senders }, ov] = await Promise.all([
    db.from("profiles").select("*").eq("id", id).maybeSingle(),
    db.from("wallets").select("balance, rcs_balance").eq("user_id", id).maybeSingle(),
    db.from("messages").select("id, channel, recipient, iso, status, price, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(15),
    db.from("transactions").select("id, amount, kind, wallet, note, created_at").eq("user_id", id).neq("kind", "charge").order("created_at", { ascending: false }).limit(20),
    db.from("routes").select("id, channel, name, country, iso, dial_code, price, is_global, active").order("channel").order("country"),
    db.from("user_routes").select("route_id, price").eq("user_id", id),
    db.from("sender_ids").select("id, channel, sender, status, note").eq("user_id", id).order("created_at", { ascending: false }),
    db.rpc("msg_overview", { p_user: id }),
  ]);
  if (!u) notFound();
  const self = u.id === me.id;
  const all = (routes ?? []) as Route[];
  const mine = new Map((assigned ?? []).map((a) => [a.route_id as number, a.price as number | null]));
  const assignable = all.filter((r) => r.active && !mine.has(r.id));
  const o = (Array.isArray(ov.data) ? ov.data[0] : ov.data) as Record<string, number> | null;

  return (
    <>
      <PageHead title={u.full_name || u.email} sub={<Link href="/admin/users" className="link-u">← All clients</Link>} action={u.suspended ? <span className="badge b-rejected">Suspended</span> : u.role === "admin" ? <span className="tag on">Admin</span> : undefined} />

      <div className="kpis">
        <div className="kpi hl"><span className="lbl">SMS balance</span><span className="val">{money(Number(w?.balance ?? 0))}</span></div>
        <div className="kpi"><span className="lbl">RCS balance</span><span className="val">{money(Number(w?.rcs_balance ?? 0))}</span></div>
        <div className="kpi"><span className="lbl">Sent today</span><span className="val">{count(Number(o?.sent_today ?? 0))}</span></div>
        <div className="kpi"><span className="lbl">Sent this month</span><span className="val">{count(Number(o?.sent_month ?? 0))}</span><span className="hint">{count(Number(o?.delivered_all ?? 0))} delivered all-time</span></div>
      </div>

      <div className="pgrid-2">
        <section className="pcard">
          <dl className="kv">
            <dt>Email</dt><dd>{u.email}</dd>
            <dt>Company</dt><dd>{u.company || "—"}</dd>
            <dt>Phone</dt><dd>{u.phone || "—"}</dd>
            <dt>Telegram</dt><dd>{u.telegram ? <a href={`https://t.me/${u.telegram}`} target="_blank" rel="noreferrer" className="link-u signal">@{u.telegram}</a> : "—"}</dd>
            <dt>Joined</dt><dd>{day(u.created_at)}</dd>
          </dl>
          {!self && (
            <div className="btn-row">
              <form action={setUserFlag}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="flag" value={u.suspended ? "unsuspend" : "suspend"} /><button className={`btn btn-sm ${u.suspended ? "btn-ghost" : "btn-danger"}`} type="submit">{u.suspended ? "Unsuspend" : "Suspend account"}</button></form>
              <form action={setUserFlag}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="flag" value={u.role === "admin" ? "customer" : "admin"} /><button className="btn btn-ghost btn-sm" type="submit">{u.role === "admin" ? "Remove admin" : "Make admin"}</button></form>
              <Link href={`/app/reports/export?user=${u.id}`} className="btn btn-ghost btn-sm">Export messages (CSV)</Link>
            </div>
          )}
        </section>
        <section className="pcard">
          <div className="pcard-head"><h2>Adjust balance</h2></div>
          <ActionForm action={adjustBalance} submit="Apply">
            <input type="hidden" name="user_id" value={u.id} />
            <div className="form-grid">
              <div className="field"><label htmlFor="ab-amt">Amount USD (− to deduct)</label><input id="ab-amt" name="amount" type="number" step="0.0001" className="input" placeholder="25" required /></div>
              <div className="field"><label htmlFor="ab-w">Wallet</label><select id="ab-w" name="wallet" className="select" defaultValue="sms"><option value="sms">SMS</option><option value="rcs">RCS</option></select></div>
            </div>
            <div className="field"><label htmlFor="ab-note">Note shown to client</label><input id="ab-note" name="note" className="input" placeholder="Welcome credit" /></div>
          </ActionForm>
        </section>
      </div>

      <section className="pcard">
        <div className="pcard-head"><div><h2>Routes &amp; prices</h2><p className="muted" style={{ fontSize: 13 }}>Global routes apply to everyone. Assign a route to give this client access or a custom price.</p></div></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Route</th><th>Channel</th><th className="num">Default</th><th className="num">This client</th><th /></tr></thead>
            <tbody>
              {all.filter((r) => r.active && (r.is_global || mine.has(r.id))).map((r) => {
                const custom = mine.get(r.id);
                return (
                  <tr key={r.id}>
                    <td><span className="flag">{r.iso}</span>{r.name}<small>{r.country} · +{r.dial_code}{r.is_global ? " · global" : ""}</small></td>
                    <td>{r.channel.toUpperCase()}</td>
                    <td className="num mono-num">{money(Number(r.price), 4)}</td>
                    <td className="num">
                      <form action={assignRoute} className="inline-form" style={{ justifyContent: "flex-end" }}>
                        <input type="hidden" name="user_id" value={u.id} /><input type="hidden" name="route_id" value={r.id} />
                        <input name="price" type="number" step="0.0001" min={0} className="input mono" defaultValue={custom != null ? String(custom) : ""} placeholder="default" aria-label="Client price" style={{ maxWidth: 120, height: 38 }} />
                        <button className="btn btn-ghost btn-sm" type="submit">Save</button>
                      </form>
                    </td>
                    <td className="num">
                      {mine.has(r.id) && (
                        <form action={unassignRoute}><input type="hidden" name="user_id" value={u.id} /><input type="hidden" name="route_id" value={r.id} /><button className="btn btn-sm btn-danger" type="submit">Remove</button></form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {assignable.filter((r) => !r.is_global).length > 0 && (
          <form action={assignRoute} className="inline-form" style={{ marginTop: 12 }}>
            <input type="hidden" name="user_id" value={u.id} />
            <select name="route_id" className="select" aria-label="Route" style={{ height: 44 }}>
              {assignable.filter((r) => !r.is_global).map((r) => <option key={r.id} value={r.id}>{r.channel.toUpperCase()} · {r.name} · {r.country} · {Number(r.price).toFixed(4)}</option>)}
            </select>
            <input name="price" type="number" step="0.0001" min={0} className="input mono" placeholder="Custom price (optional)" aria-label="Custom price" style={{ maxWidth: 200, height: 44 }} />
            <button className="btn btn-signal btn-sm" type="submit">Assign route</button>
          </form>
        )}
      </section>

      <div className="pgrid-even">
        <section className="pcard">
          <div className="pcard-head"><h2>Sender IDs</h2></div>
          {(senders ?? []).length === 0 ? <p className="muted">None yet.</p> : (
            <table className="tbl"><tbody>
              {senders!.map((s) => (
                <tr key={s.id}>
                  <td className="mono-num">{s.sender}<small>{s.channel.toUpperCase()}{s.note ? ` · ${s.note}` : ""}</small></td>
                  <td className="num"><span className={`badge ${s.status === "approved" ? "b-approved" : s.status === "rejected" ? "b-rejected" : "b-pending"}`}>{s.status}</span></td>
                  <td className="num">
                    <form action={reviewSender} className="btn-row" style={{ justifyContent: "flex-end" }}>
                      <input type="hidden" name="id" value={s.id} />
                      {s.status !== "approved" && <button className="btn btn-signal btn-sm" name="decision" value="approve" type="submit">Approve</button>}
                      {s.status !== "rejected" && <button className="btn btn-sm btn-danger" name="decision" value="reject" type="submit">Reject</button>}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody></table>
          )}
          <ActionForm action={addSender} submit="Add approved sender">
            <input type="hidden" name="user_id" value={u.id} />
            <div className="form-grid">
              <div className="field"><label htmlFor="as-s">Sender ID</label><input id="as-s" name="sender" className="input mono" placeholder="MYBRAND" maxLength={40} required /></div>
              <div className="field"><label htmlFor="as-c">Channel</label><select id="as-c" name="channel" className="select" defaultValue="sms"><option value="sms">SMS</option><option value="rcs">RCS</option></select></div>
            </div>
          </ActionForm>
        </section>
        <section className="pcard">
          <div className="pcard-head"><h2>Ledger</h2><span className="muted" style={{ fontSize: 13 }}>top-ups, refunds, adjustments</span></div>
          {(tx ?? []).length === 0 ? <p className="muted">None yet.</p> : (
            <table className="tbl"><tbody>
              {tx!.map((t) => (
                <tr key={t.id}><td style={{ textTransform: "capitalize" }}>{t.kind} <span className="muted">{String(t.wallet ?? "sms").toUpperCase()}</span><small>{t.note} · {when(t.created_at)}</small></td><td className="num">{Number(t.amount) >= 0 ? "+" : "−"}{money(Math.abs(Number(t.amount)), 4)}</td></tr>
              ))}
            </tbody></table>
          )}
        </section>
      </div>

      <section className="pcard">
        <div className="pcard-head"><h2>Latest messages</h2><Link href={`/admin/messages?client=${encodeURIComponent(u.email)}`} className="link-u muted" style={{ fontSize: 14 }}>All</Link></div>
        {(msgs ?? []).length === 0 ? <p className="muted">No messages yet.</p> : (
          <div className="tbl-wrap">
            <table className="tbl"><tbody>
              {msgs!.map((m) => (
                <tr key={m.id}><td className="mono-num">{m.recipient}<small>{m.channel.toUpperCase()} · {m.iso ?? "—"} · {when(m.created_at)}</small></td><td><MsgStatus s={m.status} /></td><td className="num mono-num">{money(Number(m.price), 4)}</td></tr>
              ))}
            </tbody></table>
          </div>
        )}
      </section>
    </>
  );
}
