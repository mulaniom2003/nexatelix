"use client";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import type { ActionState } from "@/app/app/actions";
import { SubmitBtn } from "../Btn";

/**
 * A form wired to a server action that returns { ok, message, secret }.
 * Shows the result message, a one-time secret with a copy button, and a pending submit button.
 */
export function ActionForm({
  action,
  submit,
  children,
  className = "pform",
  resetOnSuccess = true,
  variant = "primary",
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  submit: string;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  variant?: "primary" | "signal" | "ghost";
}) {
  const [state, run, pending] = useActionState<ActionState, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={run} className={className}>
      {children}
      {state?.secret && (
        <div style={{ display: "grid", gap: 8 }}>
          <div className="secret">{state.secret}</div>
          <button
            type="button"
            className="tag"
            style={{ justifySelf: "start" }}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.secret!);
                setCopied(true);
              } catch {
                /* select manually */
              }
            }}
          >
            {copied ? "Copied" : "Copy key"}
          </button>
        </div>
      )}
      {state?.message && (
        <p className={`alert ${state.ok ? "ok" : "err"}`} role="status">
          {state.message}
        </p>
      )}
      <div>
        <SubmitBtn pending={pending} variant={variant}>
          {submit}
        </SubmitBtn>
      </div>
    </form>
  );
}
