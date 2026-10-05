"use client";
import { useActionState } from "react";
import { sendContact, type ContactState } from "@/app/(site)/contact/actions";
import { SubmitBtn } from "../Btn";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, null);
  return (
    <form action={action} className="form-grid" noValidate>
      <div className="field">
        <label htmlFor="c-name">Name</label>
        <input id="c-name" name="name" className="input" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="c-email">Email</label>
        <input id="c-email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="c-company">Company</label>
        <input id="c-company" name="company" className="input" autoComplete="organization" />
      </div>
      <div className="field">
        <label htmlFor="c-channel">Channel</label>
        <select id="c-channel" name="channel" className="select" defaultValue="rcs">
          <option value="rcs">RCS</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="telegram">Telegram</option>
          <option value="other">Not sure yet</option>
        </select>
      </div>
      <div className="field full">
        <label htmlFor="c-volume">Monthly volume</label>
        <select id="c-volume" name="volume" className="select" defaultValue="10K–100K">
          <option>Under 10K</option>
          <option>10K–100K</option>
          <option>100K–1M</option>
          <option>Over 1M</option>
        </select>
      </div>
      <div className="field full">
        <label htmlFor="c-msg">What are you sending?</label>
        <textarea id="c-msg" name="message" className="textarea" placeholder="OTP for our app, about 50K a month to Indian numbers…" required />
      </div>
      {state && <p className={`alert full ${state.ok ? "ok" : "err"}`} role="status">{state.message}</p>}
      <div className="full">
        <SubmitBtn pending={pending}>Send message</SubmitBtn>
      </div>
    </form>
  );
}
