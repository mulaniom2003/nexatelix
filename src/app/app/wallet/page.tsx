import type { Metadata } from "next";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { MsgStatus } from "@/components/panel/MsgStatus";
import { ActionForm } from "@/components/panel/ActionForm";
import { requireUser, getSetting } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { day, money, when } from "@/lib/format";
import { requestTopup, requestSender } from "../actions";

export const metadata: Metadata = { title: "Wallet" };

type PaymentDetails = { upi?: string; bank?: string; usdt_trc20?: string };
const unset = (v?: string) => !v || /—|nexatelix@upi/.test(v);
const topupStatus = (s: string) => (s === "approved" ? "delivered" : s === "rejected" ? "failed" : "queued");

export default async function Wallet() {
  const { user, profile } = await requireUser();
  const db = createAdminClient();
  const [{ data: w }, { data: tx }, { data: topups }, { data: senders }, pay, min, inr] = await Promise.all([
    db.from("wallets").select("balance, rcs_balance").eq("user_id", user.id).single(),
    db.from("transactions").select("id, amount, balance_after, kind, note, wallet, created_at").eq("user_id", user.id).in("kind", ["topup", "adjustment", "refund"]).order("created_at", { ascending: false }).limit(50),
    db.from("topups").select("id, amount, wallet, method, reference, status, admin_note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    db.from("sender_ids").select("id, channel, sender, status, note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    getSetting<PaymentDetails>("payment_details", {}),
    getSetting<number>("min_topup_usd", 10),
    getSetting<number>("usd_inr_rate", 88),
  ]);

  return (
    <>
      <PageHead title="Wallet" sub="Balance, ledger, top-ups and sender IDs" />
      <div className="pgrid-even">
        <section className="pcard">
          <div className="wallet-pair">
            <div><span className="eyebrow">SMS balance</span><div className="tnum" style={{ fontSize: 34, letterSpacing: "-0.04em", color: "var(--signal)", marginTop: 6 }}>{money(Number(w?.balance ?? 0))}</div></div>
            <div><span className="eyebrow">RCS balance</span><div className="tnum" style={{ fontSize: 34, letterSpacing: "-0.04em", marginTop: 6 }}>{money(Number(w?.rcs_balance ?? 0))}</div></div>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>Prepaid{Number(profile.credit_limit ?? 0) > 0 ? ` · credit limit ${money(Number(profile.credit_limit))}` : ""} · €1 ≈ ₹{inr}</p>

          <div className="pcard-head" style={{ marginTop: 6 }}><h2>Request a top-up</h2></div>
          <dl className="kv" style={{ fontSize: 13.5 }}>
            {!unset(pay.upi) && (<><dt>UPI</dt><dd className="mono">{pay.upi}</dd></>)}
            {!unset(pay.bank) && (<><dt>Bank transfer</dt><dd className="mono" style={{ whiteSpace: "pre-line" }}>{pay.bank}</dd></>)}
            {!unset(pay.usdt_trc20) && (<><dt>USDT (TRC20)</dt><dd className="mono">{pay.usdt_trc20}</dd></>)}
            {unset(pay.upi) && unset(pay.bank) && unset(pay.usdt_trc20) && (<><dt>How to pay</dt><dd>Message support for payment details.</dd></>)}
          </dl>
          <ActionForm action={requestTopup} submit="Request" variant="signal">
            <div className="form-grid">
              <div className="field"><label htmlFor="t-amount">Amount (EUR)</label><input id="t-amount" name="amount" type="number" min={min} step="0.01" className="input" placeholder={`${min} or more`} required /></div>
              <div className="field"><label htmlFor="t-wallet">Add to</label><select id="t-wallet" name="wallet" className="select" defaultValue="sms"><option value="sms">SMS wallet</option><option value="rcs">RCS wallet</option></select></div>
              <div className="field"><label htmlFor="t-method">Paid by</label><select id="t-method" name="method" className="select" defaultValue="upi"><option value="upi">UPI</option><option value="bank">Bank transfer</option><option value="usdt">USDT</option></select></div>
              <div className="field"><label htmlFor="t-ref">UTR / transaction ID</label><input id="t-ref" name="reference" className="input" placeholder="e.g. 412345678901" required /></div>
            </div>
          </ActionForm>
          {(topups ?? []).length > 0 && (
            <table className="tbl">
              <tbody>
                {topups!.map((t) => (
                  <tr key={t.id}>
                    <td className="mono-num">{Number(t.amount).toFixed(2)} <span className="muted">{t.wallet.toUpperCase()}</span>{t.admin_note && <small>{t.admin_note}</small>}</td>
                    <td><MsgStatus s={topupStatus(t.status)} /></td>
                    <td className="num muted">{day(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="pcard" id="senders">
          <div className="pcard-head"><div><h2>Sender IDs</h2><p className="muted" style={{ fontSize: 13 }}>Only approved IDs can be used in From</p></div></div>
          {(senders ?? []).length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>None yet. Request one below.</p>
          ) : (
            <table className="tbl">
              <tbody>
                {senders!.map((sd) => (
                  <tr key={sd.id}>
                    <td className="mono-num">{sd.sender}<small>{sd.channel.toUpperCase()}{sd.note ? ` · ${sd.note}` : ""}</small></td>
                    <td className="num"><span className={`badge ${sd.status === "approved" ? "b-approved" : sd.status === "rejected" ? "b-rejected" : "b-pending"}`}>{sd.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="pcard-head" style={{ marginTop: 6 }}><h2>Request a sender ID</h2></div>
          <ActionForm action={requestSender} submit="Request" variant="signal">
            <div className="form-grid">
              <div className="field"><label htmlFor="s-sender">Sender ID</label><input id="s-sender" name="sender" className="input mono" placeholder="e.g. MYBRAND" maxLength={40} required /></div>
              <div className="field"><label htmlFor="s-ch">For</label><select id="s-ch" name="channel" className="select" defaultValue="sms"><option value="sms">SMS</option><option value="rcs">RCS</option></select></div>
            </div>
            <div className="field"><label htmlFor="s-note">What will you send with it? (optional)</label><input id="s-note" name="note" className="input" placeholder="OTP for our app, order updates…" maxLength={200} /></div>
          </ActionForm>
        </section>
      </div>

      <section className="pcard">
        <div className="pcard-head"><h2>Ledger <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>· top-ups, refunds and adjustments; per-message cost is in Reports</span></h2></div>
        {(tx ?? []).length === 0 ? (
          <Empty title="No entries yet" />
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Time</th><th>Type</th><th>Wallet</th><th className="num">Amount</th><th className="num">Balance after</th><th>Remark</th></tr></thead>
              <tbody>
                {tx!.map((t) => (
                  <tr key={t.id}>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{when(t.created_at)}</td>
                    <td><span className="badge b-closed">{Number(t.amount) >= 0 ? "credit" : "debit"}</span><small>{t.kind}</small></td>
                    <td>{String(t.wallet ?? "sms").toUpperCase()}</td>
                    <td className="num" style={{ color: Number(t.amount) >= 0 ? "var(--signal)" : undefined }}>{money(Number(t.amount))}</td>
                    <td className="num">{money(Number(t.balance_after))}</td>
                    <td className="muted">{t.note ?? "—"}</td>
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
