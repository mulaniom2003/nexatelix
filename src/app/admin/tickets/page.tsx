import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Status, Empty } from "@/components/panel/PanelShell";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { when } from "@/lib/format";

export const metadata: Metadata = { title: "Tickets" };

export default async function AdminTickets({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requireAdmin();
  const { s = "open" } = await searchParams;
  let q = createAdminClient().from("tickets").select("id, subject, status, updated_at, profiles(email, full_name)").order("updated_at", { ascending: false }).limit(200);
  if (s !== "all") q = q.eq("status", s);
  const { data } = await q;
  return (
    <>
      <PageHead title="Tickets" />
      <div className="filters">
        {["open", "answered", "closed", "all"].map((f) => <Link key={f} href={`/admin/tickets?s=${f}`} className={s === f ? "on" : ""}>{f.charAt(0).toUpperCase() + f.slice(1)}</Link>)}
      </div>
      <section className="pcard">
        {(data ?? []).length === 0 ? <Empty title="No tickets here" /> : (
          <table className="tbl"><tbody>
            {data!.map((t) => {
              const p = t.profiles as unknown as { email: string; full_name: string | null } | null;
              return (
                <tr key={t.id}><td><Link href={`/admin/tickets/${t.id}`} className="row-link">{t.subject}</Link><small>{p?.full_name || p?.email} · {when(t.updated_at)}</small></td><td className="num"><Status s={t.status} /></td></tr>
              );
            })}
          </tbody></table>
        )}
      </section>
    </>
  );
}
