import type { Metadata } from "next";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { Icon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { count, money } from "@/lib/format";
import { invoiceNumber, monthLabel } from "@/lib/invoice";

export const metadata: Metadata = { title: "Invoices" };

type Row = { month: string; sms_count: number; rcs_count: number; sms_cost: number; rcs_cost: number };

export default async function Invoices() {
  const { user } = await requireUser();
  const { data } = await createAdminClient().rpc("msg_monthly_usage", { p_user: user.id });
  const rows = ((data ?? []) as Row[]).filter((r) => Number(r.sms_cost) + Number(r.rcs_cost) > 0);
  const current = new Date().toISOString().slice(0, 7);

  return (
    <>
      <PageHead title="Invoices" sub="Your billing history · download a PDF for each month" />
      <section className="pcard">
        {rows.length === 0 ? (
          <Empty title="No invoices yet">An invoice is created for every month you send messages.</Empty>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Invoice</th><th>Period</th><th className="num">Messages</th><th className="num">Total</th><th>Status</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const ym = String(r.month).slice(0, 7);
                  const open = ym === current;
                  return (
                    <tr key={ym}>
                      <td className="mono-num">{invoiceNumber(user.id, ym)}</td>
                      <td>{monthLabel(ym)}{open && <small>In progress · final on the 1st</small>}</td>
                      <td className="num">{count(Number(r.sms_count) + Number(r.rcs_count))}<small>SMS {count(r.sms_count)} · RCS {count(r.rcs_count)}</small></td>
                      <td className="num">{money(Number(r.sms_cost) + Number(r.rcs_cost))}</td>
                      <td><span className={`badge ${open ? "b-pending" : "b-completed"}`}>{open ? "Open" : "Paid"}</span></td>
                      <td className="num"><a className="tag" href={`/app/invoices/${ym}/pdf`}><Icon.download width={14} height={14} /> PDF</a></td>
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
