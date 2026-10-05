import type { Metadata } from "next";
import { PageHead } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { addRoute, saveRoute } from "../actions";

export const metadata: Metadata = { title: "Routes" };

const cell = { height: 40 } as const;

export default async function AdminRoutes() {
  await requireAdmin();
  const { data } = await createAdminClient().from("routes").select("*").order("channel").order("country");
  return (
    <>
      <PageHead title="Routes & coverage" sub="What clients see on Coverage and pay per message. Global routes are open to every client; others are assigned per client on their page." />
      <section className="pcard">
        <div className="pcard-head"><h2>Add a route</h2></div>
        <ActionForm action={addRoute} submit="Add route" variant="signal">
          <div className="inline-form">
            <select name="channel" className="select" aria-label="Channel" defaultValue="sms" style={{ flex: "0 1 100px" }}><option value="sms">SMS</option><option value="rcs">RCS</option></select>
            <input name="name" className="input" placeholder="Route name, e.g. IN_PRIORITY" aria-label="Route name" required />
            <input name="country" className="input" placeholder="Country" aria-label="Country" required />
            <input name="iso" className="input" placeholder="ISO (IN)" aria-label="ISO code" maxLength={3} required style={{ flex: "0 1 90px" }} />
            <input name="dial_code" className="input" placeholder="Dial code (91)" aria-label="Dial code" required style={{ flex: "0 1 120px" }} />
            <input name="price" type="number" step="0.00001" min={0} className="input" placeholder="Price USD" aria-label="Price" required style={{ flex: "0 1 130px" }} />
            <label className="check" style={{ alignSelf: "center" }}><input type="checkbox" name="is_global" defaultChecked /> Global</label>
          </div>
        </ActionForm>
      </section>
      <section className="pcard">
        <div className="tbl-wrap">
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead><tr><th>Channel</th><th>Name</th><th>Country</th><th>ISO</th><th>Dial</th><th>Price (USD)</th><th>Global</th><th>Live</th><th /></tr></thead>
            <tbody>
              {(data ?? []).map((r) => {
                const f = `route-${r.id}`;
                return (
                  <tr key={r.id}>
                    <td><select form={f} name="channel" defaultValue={r.channel} className="select" style={{ ...cell, width: 90 }} aria-label="Channel"><option value="sms">SMS</option><option value="rcs">RCS</option></select></td>
                    <td><input form={f} name="name" defaultValue={r.name} className="input" style={{ ...cell, minWidth: 130 }} aria-label="Name" /></td>
                    <td><input form={f} name="country" defaultValue={r.country} className="input" style={{ ...cell, minWidth: 120 }} aria-label="Country" /></td>
                    <td><input form={f} name="iso" defaultValue={r.iso} className="input" style={{ ...cell, width: 64 }} aria-label="ISO" /></td>
                    <td><input form={f} name="dial_code" defaultValue={r.dial_code} className="input mono" style={{ ...cell, width: 90 }} aria-label="Dial code" /></td>
                    <td><input form={f} name="price" type="number" step="0.00001" min={0} defaultValue={Number(r.price)} className="input" style={{ ...cell, width: 120 }} aria-label="Price" /></td>
                    <td><input form={f} name="is_global" type="checkbox" defaultChecked={r.is_global} aria-label="Global" /></td>
                    <td><input form={f} name="active" type="checkbox" defaultChecked={r.active} aria-label="Live" /><input form={f} type="hidden" name="active_present" value="1" /></td>
                    <td><form id={f} action={saveRoute}><input type="hidden" name="id" value={r.id} /><button className="btn btn-ghost btn-sm" type="submit">Save</button></form></td>
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
