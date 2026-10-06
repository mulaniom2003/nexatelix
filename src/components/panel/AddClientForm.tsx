"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import type { ActionState } from "@/app/app/actions";
import { addClient } from "@/app/admin/actions";
import { SubmitBtn } from "../Btn";

// Strong, unambiguous password (no 0/O/1/l mix-ups).
function genPassword(len = 14) {
  const sets = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*?";
  const a = new Uint32Array(len);
  crypto.getRandomValues(a);
  let out = "";
  for (let i = 0; i < len; i++) out += sets[a[i] % sets.length];
  return out;
}

export function AddClientForm() {
  const [state, run, pending] = useActionState<ActionState, FormData>(addClient, null);
  const formRef = useRef<HTMLFormElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const generate = () => {
    if (passRef.current) {
      passRef.current.value = genPassword();
      passRef.current.type = "text";
    }
  };
  const copy = async () => {
    if (!state?.secret) return;
    try {
      await navigator.clipboard.writeText(state.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* viewer can select the text manually */
    }
  };

  return (
    <form ref={formRef} action={run} className="pform">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="ac-email">Email</label>
          <input id="ac-email" name="email" type="email" className="input" autoComplete="off" required />
        </div>
        <div className="field">
          <label htmlFor="ac-pass">Password</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input ref={passRef} id="ac-pass" name="password" type="text" className="input" autoComplete="off" minLength={8} required style={{ flex: 1 }} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={generate} style={{ whiteSpace: "nowrap" }}>Generate</button>
          </div>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="ac-name">Name (optional)</label>
          <input id="ac-name" name="full_name" className="input" autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="ac-company">Company (optional)</label>
          <input id="ac-company" name="company" className="input" autoComplete="off" />
        </div>
      </div>

      {state?.secret && (
        <div style={{ display: "grid", gap: 8 }}>
          <pre className="secret" style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "var(--f-mono)", fontSize: 13, lineHeight: 1.6 }}>{state.secret}</pre>
          <button type="button" className="btn btn-signal btn-sm" style={{ justifySelf: "start" }} onClick={copy}>
            {copied ? "Copied ✓" : "Copy login details"}
          </button>
        </div>
      )}
      {state?.message && (
        <p className={`alert ${state.ok ? "ok" : "err"}`} role="status">{state.message}</p>
      )}
      <div>
        <SubmitBtn pending={pending}>Create client</SubmitBtn>
      </div>
    </form>
  );
}
