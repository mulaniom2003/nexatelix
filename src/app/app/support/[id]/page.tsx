import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Status } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { when } from "@/lib/format";
import { replyTicket } from "../../actions";

export const metadata: Metadata = { title: "Ticket" };

export default async function Ticket({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const { data: t } = await supabase.from("tickets").select("id, subject, status, created_at").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!t) notFound();
  const { data: msgs } = await supabase.from("ticket_messages").select("id, body, is_staff, created_at").eq("ticket_id", id).order("created_at");

  return (
    <>
      <PageHead title={t.subject} sub={<Link href="/app/support" className="link-u">← All tickets</Link>} action={<Status s={t.status} />} />
      <section className="pcard">
        <div className="thread">
          {(msgs ?? []).map((m) => (
            <div key={m.id} className={`m ${m.is_staff ? "staff" : "mine"}`}>
              {m.body}
              <small>{m.is_staff ? "NexaTelix support" : "You"} · {when(m.created_at)}</small>
            </div>
          ))}
        </div>
      </section>
      {t.status !== "closed" ? (
        <section className="pcard">
          <ActionForm action={replyTicket} submit="Send reply">
            <input type="hidden" name="id" value={t.id} />
            <div className="field">
              <label htmlFor="r-body">Reply</label>
              <textarea id="r-body" name="body" className="textarea" rows={4} required />
            </div>
          </ActionForm>
        </section>
      ) : (
        <p className="muted">This ticket is closed. Open a new one if you need more help.</p>
      )}
    </>
  );
}
