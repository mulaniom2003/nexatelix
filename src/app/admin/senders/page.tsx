import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Empty } from "@/components/panel/PanelShell";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { when } from "@/lib/format";
import { reviewSender } from "../actions";

export const metadata: Metadata = { title: "Sender IDs" };

export default async function AdminSenders({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requireAdmin();
  const { s = "pending" } = await searchParams;
  let q = createAdminClient().from("sender_ids").select("id, user_id, channel, sender, status, note, created_at, profiles(email, full_name)").order("created_at", { ascending: s === "pending" }).limit(300);
  if (s !== "all") q = q.eq("status", s);
  const { data } = await q;
  return (
    <>
      <PageHead title="Sender IDs" sub="Approve a sender only once it's registered and allowed on the delivery platform." />
      <div className="filters">{["pending", "approved", "rejected", "all"].map((f) => <Link key={f} href={`/admin/senders?s=${f}`} className={s === f ? "on" : ""}>{f.charAt(0).toUpperCase() + f.slice(1)}</Link>)}</div>
      <section className="pcard">
        {(data ?? []).length === 0 ? <Empty title="Nothing here" /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Sender</th><th>Client</th><th>Requested</th><th>Status</th><th /></tr></thead>
              <tbody>
                {data!.map((r) => {
                  const p = r.profiles as unknown as { email: string; full_name: string | null } | null;
                  return (
                    <tr key={r.id}>
                      <td className="mono-num">{r.sender}<small>{r.channel.toUpperCase()}{r.note ? ` · ${r.note}` : ""}</small></td>
                      <td><Link href={`/admin/users/${r.user_id}`} className="row-link">{p?.full_name || p?.email}</Link><small>{p?.email}</small></td>
                      <td className="muted">{when(r.created_at)}</td>
                      <td><span className={`badge ${r.status === "approved" ? "b-approved" : r.status === "rejected" ? "b-rejected" : "b-pending"}`}>{r.status}</span></td>
                      <td>
                        <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                          {r.status !== "approved" && <form action={reviewSender}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="approve" /><button className="btn btn-signal btn-sm" type="submit">Approve</button></form>}
                          {r.status !== "rejected" && <form action={reviewSender} className="inline-form"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="reject" /><input name="note" className="input" placeholder="Reason (optional)" aria-label="Reason" style={{ maxWidth: 160 }} /><button className="btn btn-sm btn-danger" type="submit">{r.status === "approved" ? "Revoke" : "Reject"}</button></form>}
                        </div>
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
