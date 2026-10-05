import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Status } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { when } from "@/lib/format";
import { staffReply, closeTicket } from "../../actions";

export const metadata: Metadata = { title: "Ticket" };

export default async function AdminTicket({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();
  const { data: t } = await db.from("tickets").select("id, subject, status, user_id, profiles(email, full_name)").eq("id", id).maybeSingle();
  if (!t) notFound();
  const { data: msgs } = await db.from("ticket_messages").select("id, body, is_staff, created_at").eq("ticket_id", id).order("created_at");
  const p = t.profiles as unknown as { email: string; full_name: string | null } | null;

  return (
    <>
      <PageHead title={t.subject} sub={<><Link href="/admin/tickets" className="link-u">← Tickets</Link> · <Link href={`/admin/users/${t.user_id}`} className="link-u">{p?.full_name || p?.email}</Link></>} action={<Status s={t.status} />} />
      <section className="pcard">
        <div className="thread">
          {(msgs ?? []).map((m) => (
            <div key={m.id} className={`m ${m.is_staff ? "staff mine" : ""}`}>
              {m.body}
              <small>{m.is_staff ? "You (support)" : p?.full_name || "Client"} · {when(m.created_at)}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="pcard">
        <ActionForm action={staffReply} submit="Send reply">
          <input type="hidden" name="id" value={t.id} />
          <div className="field"><label htmlFor="sr-body">Reply</label><textarea id="sr-body" name="body" className="textarea" rows={4} required /></div>
          <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}><input type="checkbox" name="close" /> Close the ticket after replying</label>
        </ActionForm>
        {t.status !== "closed" && (
          <form action={closeTicket}><input type="hidden" name="id" value={t.id} /><button className="btn btn-ghost btn-sm" type="submit">Close without replying</button></form>
        )}
      </section>
    </>
  );
}
