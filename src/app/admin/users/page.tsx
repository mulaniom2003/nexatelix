import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { requireAdmin } from "@/lib/auth";
import { addClient } from "../actions";
import { createAdminClient } from "@/lib/supabase/server";
import { day, money } from "@/lib/format";

export const metadata: Metadata = { title: "Clients" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  let query = createAdminClient().from("profiles").select("id, email, full_name, company, role, suspended, created_at, wallets(balance, rcs_balance)").order("created_at", { ascending: false }).limit(300);
  const term = q.trim().replace(/[%,()]/g, "");
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%,company.ilike.%${term}%`);
  const { data } = await query;

  return (
    <>
      <PageHead title="Clients" sub="Everyone with an account. Open one to add credit, suspend or make admin." />
      <section className="pcard" style={{ marginBottom: 16, maxWidth: 680 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Add a client</div>
        <ActionForm action={addClient} submit="Create client">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="ac-email">Email</label>
              <input id="ac-email" name="email" type="email" className="input" autoComplete="off" required />
            </div>
            <div className="field">
              <label htmlFor="ac-pass">Password</label>
              <input id="ac-pass" name="password" type="text" className="input" autoComplete="off" minLength={8} required />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="ac-name">Name (optional)</label>
              <input id="ac-name" name="full_name" className="input" autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="ac-company">Company (optional)</label>
              <input id="ac-company" name="company" className="input" autoComplete="off" />
            </div>
          </div>
        </ActionForm>
      </section>
      <form className="inline-form" style={{ maxWidth: 480 }}>
        <input name="q" defaultValue={q} className="input" placeholder="Search name, email or company" aria-label="Search clients" />
        <button className="btn btn-ghost btn-sm" type="submit">Search</button>
      </form>
      <section className="pcard">
        {(data ?? []).length === 0 ? <Empty title="No clients found" /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Client</th><th>Company</th><th>Joined</th><th className="num">SMS</th><th className="num">RCS</th><th /></tr></thead>
              <tbody>
                {data!.map((u) => {
                  const w = (Array.isArray(u.wallets) ? u.wallets[0] : u.wallets) as { balance: number; rcs_balance: number } | null;
                  return (
                    <tr key={u.id}>
                      <td><Link href={`/admin/users/${u.id}`} className="row-link">{u.full_name || u.email}</Link><small>{u.email}</small></td>
                      <td className="muted">{u.company || "—"}</td>
                      <td className="muted">{day(u.created_at)}</td>
                      <td className="num">{money(Number(w?.balance ?? 0))}</td><td className="num">{money(Number(w?.rcs_balance ?? 0))}</td>
                      <td className="num">
                        {u.role === "admin" && <span className="tag on">Admin</span>} {u.suspended && <span className="badge b-rejected">Suspended</span>}
                      </td>
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
