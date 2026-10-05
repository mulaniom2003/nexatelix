import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Status, Empty } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { links, site } from "@/lib/site";
import { when } from "@/lib/format";
import { openTicket } from "../actions";

export const metadata: Metadata = { title: "Support" };

export default async function Support() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("tickets").select("id, subject, status, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  const tickets = data ?? [];

  return (
    <>
      <PageHead
        title="Support"
        sub={<>Open a ticket, or message us on <a href={links.telegramSupport} target="_blank" rel="noreferrer" className="link-u signal">Telegram @{site.contact.telegramSupport}</a> for anything urgent.</>}
      />
      <div className="pgrid-2">
        <section className="pcard">
          <div className="pcard-head"><h2>Your tickets</h2></div>
          {tickets.length === 0 ? (
            <Empty title="No tickets yet">Questions about a campaign, a payment or your account? Open one here.</Empty>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td><Link href={`/app/support/${t.id}`} className="row-link">{t.subject}</Link><small>Updated {when(t.updated_at)}</small></td>
                      <td className="num"><Status s={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="pcard">
          <div className="pcard-head"><h2>New ticket</h2></div>
          <ActionForm action={openTicket} submit="Open ticket">
            <div className="field">
              <label htmlFor="tk-subject">Subject</label>
              <input id="tk-subject" name="subject" className="input" maxLength={140} required />
            </div>
            <div className="field">
              <label htmlFor="tk-body">Message</label>
              <textarea id="tk-body" name="body" className="textarea" rows={5} required placeholder="Include the campaign name or payment UTR if it's about one." />
            </div>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
