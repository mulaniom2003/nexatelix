import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { AddClientForm } from "@/components/panel/AddClientForm";
import { requireAdmin } from "@/lib/auth";
import { creditClient } from "../actions";
import { createAdminClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Clients" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const db = createAdminClient();
  let query = db.from("profiles").select("id, email, full_name, company, role, suspended, created_at, wallets(balance, rcs_balance)").order("created_at", { ascending: false }).limit(300);
  const term = q.trim().replace(/[%,()]/g, "");
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%,company.ilike.%${term}%`);
  const { data } = await query;
  const rows = data ?? [];

  // Lifetime spend per client = sum of their sending charges (negative "campaign" ledger entries).
  const spent = new Map<string, number>();
  const ids = rows.map((u) => u.id);
  if (ids.length) {
    const { data: txs } = await db.from("transactions").select("user_id, amount").eq("kind", "campaign").in("user_id", ids);
    (txs ?? []).forEach((t) => spent.set(t.user_id as string, (spent.get(t.user_id as string) ?? 0) + Math.abs(Number(t.amount))));
  }

  return (
    <>
      <PageHead title="Clients" sub="Each client's prepaid wallet and what they've spent. Add funds after they pay you. Your own supplier balance is on the Overview." />

      <section className="pcard" style={{ marginBottom: 16, maxWidth: 680 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Add a client</div>
        <AddClientForm />
      </section>

      <form className="inline-form" style={{ maxWidth: 480, marginBottom: 14 }}>
        <input name="q" defaultValue={q} className="input" placeholder="Search name, email or company" aria-label="Search clients" />
        <button className="btn btn-ghost btn-sm" type="submit">Search</button>
      </form>

      <section className="pcard">
        {rows.length === 0 ? <Empty title="No clients found" /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th>
                  <th className="num">SMS balance</th>
                  <th className="num">RCS balance</th>
                  <th className="num">Spent</th>
                  <th>Add funds</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const w = (Array.isArray(u.wallets) ? u.wallets[0] : u.wallets) as { balance: number; rcs_balance: number } | null;
                  return (
                    <tr key={u.id}>
                      <td>
                        <Link href={`/admin/users/${u.id}`} className="row-link">{u.full_name || u.email}</Link>
                        <small>{u.email}{u.company ? ` · ${u.company}` : ""}</small>
                        {u.role === "admin" && <span className="tag on" style={{ marginLeft: 6 }}>Admin</span>}
                        {u.suspended && <span className="badge b-rejected" style={{ marginLeft: 6 }}>Suspended</span>}
                      </td>
                      <td className="num mono-num">{money(Number(w?.balance ?? 0))}</td>
                      <td className="num mono-num">{money(Number(w?.rcs_balance ?? 0))}</td>
                      <td className="num mono-num">{money(spent.get(u.id) ?? 0)}</td>
                      <td>
                        <form action={creditClient} className="inline-form" style={{ gap: 6, flexWrap: "nowrap" }}>
                          <input type="hidden" name="user_id" value={u.id} />
                          <input name="amount" type="number" step="0.01" min="0.01" placeholder="25" className="input" aria-label="Amount to add" required style={{ width: 84 }} />
                          <select name="wallet" className="select" defaultValue="sms" aria-label="Wallet" style={{ width: 74 }}>
                            <option value="sms">SMS</option>
                            <option value="rcs">RCS</option>
                          </select>
                          <button className="btn btn-signal btn-sm" type="submit">Add</button>
                        </form>
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
