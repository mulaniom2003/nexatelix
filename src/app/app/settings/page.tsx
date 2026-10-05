import type { Metadata } from "next";
import { PageHead } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { requireUser } from "@/lib/auth";
import { day } from "@/lib/format";
import { saveProfile, changePassword } from "../actions";

export const metadata: Metadata = { title: "Settings" };

export default async function Settings() {
  const { profile } = await requireUser();
  return (
    <>
      <PageHead title="Settings" sub={`Signed in as ${profile.email} · member since ${day(profile.created_at)}`} />
      <div className="pgrid-even">
        <section className="pcard">
          <div className="pcard-head"><h2>Profile</h2></div>
          <ActionForm action={saveProfile} submit="Save profile" resetOnSuccess={false}>
            <div className="field">
              <label htmlFor="p-name">Name</label>
              <input id="p-name" name="full_name" className="input" defaultValue={profile.full_name ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="p-company">Company</label>
              <input id="p-company" name="company" className="input" defaultValue={profile.company ?? ""} />
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="p-phone">Phone / WhatsApp</label>
                <input id="p-phone" name="phone" className="input" defaultValue={profile.phone ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="p-tg">Telegram</label>
                <input id="p-tg" name="telegram" className="input" defaultValue={profile.telegram ? `@${profile.telegram}` : ""} placeholder="@username" />
              </div>
            </div>
          </ActionForm>
        </section>
        <section className="pcard" id="password">
          <div className="pcard-head"><h2>Password</h2></div>
          <ActionForm action={changePassword} submit="Update password">
            <div className="field">
              <label htmlFor="pw-new">New password</label>
              <input id="pw-new" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required />
            </div>
            <div className="field">
              <label htmlFor="pw-confirm">Confirm new password</label>
              <input id="pw-confirm" name="confirm" type="password" className="input" autoComplete="new-password" minLength={8} required />
            </div>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
