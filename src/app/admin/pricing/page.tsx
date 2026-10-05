import type { Metadata } from "next";
import { PageHead } from "@/components/panel/PanelShell";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { savePrice } from "../actions";

export const metadata: Metadata = { title: "Pricing" };

export default async function AdminPricing() {
  await requireAdmin();
  const { data } = await createAdminClient().from("prices").select("*").order("channel").order("sort");
  return (
    <>
      <PageHead title="Pricing" sub="Rates are in USD per message (per part for SMS). Changes show on the website and in new campaigns straight away." />
      <section className="pcard">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Channel</th><th>Plan name</th><th>Description</th><th>From volume</th><th>Rate (USD)</th><th>Live</th><th /></tr></thead>
            <tbody>
              {(data ?? []).map((p) => {
                const f = `price-${p.id}`;
                return (
                  <tr key={p.id}>
                    <td className="mono">{p.channel.toUpperCase()}<small>{p.tier}</small></td>
                    <td><input form={f} name="label" defaultValue={p.label} className="input" style={{ height: 40, minWidth: 140 }} aria-label="Plan name" /></td>
                    <td><input form={f} name="description" defaultValue={p.description ?? ""} className="input" style={{ height: 40, minWidth: 220 }} aria-label="Description" /></td>
                    <td><input form={f} name="min_volume" type="number" min={0} defaultValue={p.min_volume} className="input" style={{ height: 40, width: 120 }} aria-label="From volume" /></td>
                    <td><input form={f} name="unit_price" type="number" step="0.00001" min={0} defaultValue={Number(p.unit_price)} className="input" style={{ height: 40, width: 120 }} aria-label="Rate" /></td>
                    <td><input form={f} name="active" type="checkbox" defaultChecked={p.active} aria-label="Live" /></td>
                    <td>
                      <form id={f} action={savePrice}><input type="hidden" name="id" value={p.id} /><button type="submit" className="btn btn-ghost btn-sm">Save</button></form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
