"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, sendReset, type AuthState } from "@/app/auth/actions";
import { SubmitBtn } from "../Btn";

function Alert({ state }: { state: AuthState }) {
  if (!state?.message) return null;
  return (
    <p className={`alert ${state.ok ? "ok" : "err"}`} role="status">
      {state.message}
    </p>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, notice ? { message: notice } : null);
  return (
    <div className="auth-form-wrap">
      <form action={action} className="auth-form">
        <input type="hidden" name="next" value={next ?? "/app"} />
        <div className="field">
          <label htmlFor="li-email">Email</label>
          <input id="li-email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
        <div className="field">
          <div className="field-row">
            <label htmlFor="li-pass">Password</label>
            <Link href="/forgot" className="link-u muted" style={{ fontSize: 13 }}>Forgot password?</Link>
          </div>
          <input id="li-pass" name="password" type="password" className="input" autoComplete="current-password" required />
        </div>
        <Alert state={state} />
        <SubmitBtn pending={pending} block>Log in</SubmitBtn>
        <p className="muted auth-switch">
          New to NexaTelix? <Link href="/signup" className="link-u signal">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, null);
  if (state?.ok) {
    return (
      <div className="auth-form">
        <Alert state={state} />
        <p className="muted auth-switch">
          Already confirmed? <Link href="/login" className="link-u signal">Log in</Link>
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="auth-form">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="su-name">Your name</label>
          <input id="su-name" name="full_name" className="input" autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="su-company">Company (optional)</label>
          <input id="su-company" name="company" className="input" autoComplete="organization" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="su-email">Email</label>
        <input id="su-email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="su-pass">Password</label>
        <input id="su-pass" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required />
      </div>
      <Alert state={state} />
      <SubmitBtn pending={pending} block>Create account</SubmitBtn>
      <p className="muted auth-switch">
        Already have an account? <Link href="/login" className="link-u signal">Log in</Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(sendReset, null);
  return (
    <form action={action} className="auth-form">
      <div className="field">
        <label htmlFor="fg-email">Email</label>
        <input id="fg-email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <Alert state={state} />
      <SubmitBtn pending={pending} block>Send reset link</SubmitBtn>
      <p className="muted auth-switch">
        Remembered it? <Link href="/login" className="link-u signal">Back to log in</Link>
      </p>
    </form>
  );
}
