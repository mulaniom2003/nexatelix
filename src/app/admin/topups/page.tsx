import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Status, Empty } from "@/components/panel/PanelShell";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { money, when } from "@/lib/format";
import { approveTopup, rejectTopup } from "../actions";

export const metadata: Metadata = { title: "Top-ups" };

export default async function AdminTopups({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requireAdmin();
  const { s = "pending" } = await searchParams;
  let q = createAdminClient().from("topups").select("id, amount, wallet, method, reference, status, admin_note, created_at, profiles(email, full_name)").order("created_at", { ascending: s === "pending" }).limit(200);
  if (s !== "all") q = q.eq("status", s);
  const { data } = await q;

  return (
    <>
      <PageHead title="Top-ups" sub="Check the payment arrived (match the UTR in your bank or UPI app), then approve to credit the wallet." />
      <div className="filters">
        {["pending", "approved", "rejected", "all"].map((f) => <Link key={f} href={`/admin/topups?s=${f}`} className={s === f ? "on" : ""}>{f.charAt(0).toUpperCase() + f.slice(1)}</Link>)}
      </div>
      <section className="pcard">
        {(data ?? []).length === 0 ? <Empty title="No top-ups here" /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Client</th><th>Payment</th><th>Wallet</th><th className="num">Amount</th><th>Status</th><th /></tr></thead>
              <tbody>
                {data!.map((t) => {
                  const p = t.profiles as unknown as { email: string; full_name: string | null } | null;
                  return (
                    <tr key={t.id}>
                      <td>{p?.full_name || "—"}<small>{p?.email}</small></td>
                      <td className="mono">{t.method.toUpperCase()} · {t.reference}<small>{when(t.created_at)}</small>{t.admin_note && <small>{t.admin_note}</small>}</td>
                      <td>{String(t.wallet ?? "sms").toUpperCase()}</td><td className="num">{money(Number(t.amount))}</td>
                      <td><Status s={t.status === "approved" ? "completed" : t.status} /></td>
                      <td>
                        {t.status === "pending" && (
                          <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                            <form action={approveTopup}><input type="hidden" name="id" value={t.id} /><button className="btn btn-signal btn-sm" type="submit">Approve</button></form>
                            <form action={rejectTopup} className="inline-form">
                              <input type="hidden" name="id" value={t.id} />
                              <input name="note" className="input" placeholder="Reason (optional)" aria-label="Reason" style={{ maxWidth: 170 }} />
                              <button className="btn btn-sm btn-danger" type="submit">Reject</button>
                            </form>
                          </div>
                        )}
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
