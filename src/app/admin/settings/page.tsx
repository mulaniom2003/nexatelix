import type { Metadata } from "next";
import { PageHead } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { requireAdmin, getSetting } from "@/lib/auth";
import { upstreamConfigured } from "@/lib/upstream";
import { saveSettings } from "../actions";

export const metadata: Metadata = { title: "Settings" };

type PaymentDetails = { upi?: string; bank?: string; usdt_trc20?: string };
const clean = (v?: string) => (!v || /—|nexatelix@upi/.test(v) ? "" : v);

export default async function AdminSettings() {
  await requireAdmin();
  const [pay, min, inr, refund, reqSender] = await Promise.all([getSetting<PaymentDetails>("payment_details", {}), getSetting<number>("min_topup_usd", 10), getSetting<number>("usd_inr_rate", 88), getSetting<boolean>("refund_failed", false), getSetting<boolean>("require_approved_sms_sender", false)]);
  return (
    <>
      <PageHead title="Settings" />
      <div className="pgrid-even">
        <section className="pcard">
          <div className="pcard-head"><h2>Payments</h2></div>
          <p className="muted" style={{ fontSize: 14 }}>Shown to clients on their Wallet page. Leave a field empty to hide that method.</p>
          <ActionForm action={saveSettings} submit="Save settings" resetOnSuccess={false}>
            <div className="field"><label htmlFor="st-upi">UPI ID</label><input id="st-upi" name="upi" className="input" defaultValue={clean(pay.upi)} placeholder="yourname@okaxis" /></div>
            <div className="field"><label htmlFor="st-bank">Bank details</label><textarea id="st-bank" name="bank" className="textarea" rows={3} defaultValue={clean(pay.bank)} placeholder={"Name: …\nA/C: …\nIFSC: …"} style={{ minHeight: 100 }} /></div>
            <div className="field"><label htmlFor="st-usdt">USDT (TRC20) address</label><input id="st-usdt" name="usdt" className="input" defaultValue={clean(pay.usdt_trc20)} /></div>
            <div className="form-grid">
              <div className="field"><label htmlFor="st-min">Minimum top-up (USD)</label><input id="st-min" name="min_topup" type="number" min={1} className="input" defaultValue={min} /></div>
              <div className="field"><label htmlFor="st-inr">₹ per $1 (shown to clients)</label><input id="st-inr" name="usd_inr" type="number" min={1} step="0.01" className="input" defaultValue={inr} /></div>
            </div>
            <div className="pcard-head" style={{ marginTop: 8 }}><h2>Sending rules</h2></div>
            <label className="check"><input type="checkbox" name="refund_failed" defaultChecked={refund} /> Refund messages that fail to deliver</label>
            <label className="check"><input type="checkbox" name="require_sender" defaultChecked={reqSender} /> SMS needs an approved sender ID (RCS always does)</label>
          </ActionForm>
        </section>
        <section className="pcard">
          <div className="pcard-head"><h2>Delivery platform</h2></div>
          <p style={{ fontSize: 14 }}>
            Status: {upstreamConfigured ? <span className="badge b-delivered">Connected</span> : <span className="badge b-pending">Not connected</span>}
          </p>
          <p className="muted" style={{ fontSize: 14 }}>
            Messages are sent the moment a client presses Send or calls the API. The connection is set with UPSTREAM_BASE_URL, UPSTREAM_API_KEY and DLR_SECRET in Vercel → Settings → Environment Variables. Delivery reports come back automatically.
          </p>
        </section>
      </div>
    </>
  );
}
