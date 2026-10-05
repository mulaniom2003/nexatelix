"use client";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { sendRcsAction, type ActionState } from "@/app/app/actions";
import { estimate, parseNumbers, type LiteRoute } from "@/lib/numbers";
import { count, money } from "@/lib/format";
import { SubmitBtn, Btn } from "../Btn";
import { Icon } from "../icons";

type Mode = "single" | "bulk" | "file";
type Kind = "text" | "card" | "carousel";

function Buttons({ prefix }: { prefix: string }) {
  return (
    <div className="field">
      <label>Buttons (optional)</label>
      {[1, 2].map((i) => (
        <div className="form-grid" key={i}>
          <input name={`${prefix}btn${i}_text`} className="input" placeholder={`Button ${i} label`} maxLength={25} aria-label={`Button ${i} label`} />
          <input name={`${prefix}btn${i}_url`} type="url" className="input" placeholder="https://…" aria-label={`Button ${i} link`} />
        </div>
      ))}
    </div>
  );
}

export function RcsForm({ routes, senders, balance }: { routes: LiteRoute[]; senders: string[]; balance: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendRcsAction, null);
  const [mode, setMode] = useState<Mode>("single");
  const [kind, setKind] = useState<Kind>("text");
  const [to, setTo] = useState("");
  const [numbers, setNumbers] = useState("");
  const [fileName, setFileName] = useState("");
  const [cards, setCards] = useState(2);
  const [chars, setChars] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setTo("");
      setNumbers("");
      setFileName("");
      setChars(0);
      formRef.current?.reset();
    }
  }, [state]);

  const parsed = useMemo(() => parseNumbers(mode === "single" ? to : numbers), [mode, to, numbers]);
  const est = useMemo(() => estimate(parsed.list, routes, 1), [parsed.list, routes]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setNumbers(await f.text());
    setFileName(f.name);
  }

  return (
    <form ref={formRef} action={action} className="pgrid-2" onChange={(e) => {
      const t = e.target as unknown as HTMLInputElement;
      if (t.name === "text" || t.name === "description" || t.name === "title") setChars(t.value.length);
    }}>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="numbers" value={numbers} />

      <section className="pcard pform">
        <div className="seg-tabs" role="tablist" aria-label="Send mode">
          {(["single", "bulk", "file"] as Mode[]).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>{m === "single" ? "Single" : m === "bulk" ? "Bulk" : "File"}</button>
          ))}
        </div>
        <div className="seg-tabs sub" role="tablist" aria-label="Message type">
          {(["text", "card", "carousel"] as Kind[]).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{k === "text" ? "Text" : k === "card" ? "Rich card" : "Carousel"}</button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="rcs-from">Sender ID (RCS)</label>
          {senders.length ? (
            <div className="inline-form">
              <select id="rcs-from" name="from" className="select" defaultValue={senders[0]} style={{ height: 52 }}>
                {senders.map((s) => <option key={s} value={s}>{s} (approved)</option>)}
              </select>
              <Btn href="/app/wallet#senders" variant="ghost" size="sm" arrow={false}>Other</Btn>
            </div>
          ) : (
            <p className="alert err">You don&apos;t have an approved RCS sender yet. <Link href="/app/wallet#senders" className="link-u">Request one in Wallet</Link>.</p>
          )}
          <p className="muted" style={{ fontSize: 12.5 }}>Only approved RCS senders can be used.</p>
        </div>

        <div className="field">
          <label htmlFor="rcs-camp">Campaign name <span className="muted" style={{ textTransform: "none", letterSpacing: 0 }}>(optional · shown in RCS reports)</span></label>
          <input id="rcs-camp" name="campaign" className="input" placeholder="e.g. Diwali RCS — Mumbai" maxLength={120} />
        </div>

        {mode === "single" && (
          <div className="field">
            <label htmlFor="rcs-to">To (E.164, e.g. +919876543210)</label>
            <input id="rcs-to" name="to" className="input mono" value={to} onChange={(e) => setTo(e.target.value)} placeholder="+919876543210" inputMode="tel" autoComplete="off" />
          </div>
        )}
        {mode === "bulk" && (
          <div className="field">
            <label htmlFor="rcs-bulk">Numbers (one per line)</label>
            <textarea id="rcs-bulk" className="textarea mono" rows={6} value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder={"+919876543210\n+919812345678"} style={{ fontSize: 13 }} />
          </div>
        )}
        {mode === "file" && (
          <div className="field">
            <label>Number list (.txt or .csv)</label>
            <div className="btn-row">
              <span className="btn btn-ghost btn-sm file-btn"><Icon.upload /> {fileName ? "Choose another file" : "Choose file"}<input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={onFile} aria-label="Upload number list" /></span>
              {fileName && <span className="muted" style={{ fontSize: 13 }}>{fileName}</span>}
            </div>
          </div>
        )}
        {mode !== "single" && (
          <div className="hint-row">
            <span className="signal">{count(parsed.list.length)} numbers</span>
            {parsed.duplicates > 0 && <span>{count(parsed.duplicates)} duplicates removed</span>}
            {parsed.invalid > 0 && <span className="bad">{count(parsed.invalid)} invalid</span>}
          </div>
        )}

        {kind === "text" && (
          <div className="field">
            <label htmlFor="rcs-text">Message text</label>
            <textarea id="rcs-text" name="text" className="textarea" rows={5} placeholder="Hello — your RCS message" required />
          </div>
        )}
        {kind === "card" && (
          <>
            <div className="field"><label htmlFor="rc-title">Title</label><input id="rc-title" name="title" className="input" maxLength={200} required /></div>
            <div className="field"><label htmlFor="rc-desc">Description</label><textarea id="rc-desc" name="description" className="textarea" rows={4} maxLength={2000} /></div>
            <div className="field"><label htmlFor="rc-media">Image or video URL (optional)</label><input id="rc-media" name="media_url" type="url" className="input" placeholder="https://…/banner.jpg" /></div>
            <Buttons prefix="" />
          </>
        )}
        {kind === "carousel" && (
          <>
            {Array.from({ length: cards }, (_, k) => k + 1).map((i) => (
              <fieldset key={i} className="card-block">
                <legend>Card {i}</legend>
                <input name={`c${i}_title`} className="input" placeholder="Title" maxLength={200} aria-label={`Card ${i} title`} />
                <textarea name={`c${i}_description`} className="textarea" rows={2} placeholder="Description" style={{ minHeight: 70 }} aria-label={`Card ${i} description`} />
                <input name={`c${i}_media`} type="url" className="input" placeholder="Image URL (optional)" aria-label={`Card ${i} image`} />
                <div className="form-grid">
                  <input name={`c${i}_btn1_text`} className="input" placeholder="Button label (optional)" maxLength={25} aria-label={`Card ${i} button label`} />
                  <input name={`c${i}_btn1_url`} type="url" className="input" placeholder="https://…" aria-label={`Card ${i} button link`} />
                </div>
              </fieldset>
            ))}
            {cards < 5 && <button type="button" className="tag" style={{ justifySelf: "start" }} onClick={() => setCards((c) => c + 1)}>+ Add card</button>}
          </>
        )}

        {state?.message && <p className={`alert ${state.ok ? "ok" : "err"}`} role="status">{state.message}</p>}
        <SubmitBtn pending={pending} variant="signal" block>{mode === "single" ? "Send RCS" : `Send RCS to ${count(parsed.list.length)}`}</SubmitBtn>
      </section>

      <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <div className="pcard summary" style={{ position: "static" }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 500 }}>Estimate</h2>
            <p className="muted" style={{ fontSize: 13 }}>Content size · recipients · cost</p>
          </div>
          {parsed.list.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>Enter content and recipients to see the estimate.</p>
          ) : (
            <>
              <dl>
                <dt>Type</dt><dd>{kind === "text" ? "Text" : kind === "card" ? "Rich card" : `Carousel · ${cards} cards`}</dd>
                {chars > 0 && (<><dt>Characters</dt><dd>{chars}</dd></>)}
                <dt>Recipients</dt><dd>{count(est.covered)}</dd>
                {est.uncovered > 0 && (<><dt>No route</dt><dd style={{ color: "var(--danger)" }}>{count(est.uncovered)}</dd></>)}
              </dl>
              <div className="total">{money(est.cost, 4)}</div>
              {est.cost > balance && <p className="alert err">Not enough RCS balance. <Link href="/app/wallet" className="link-u">Top up</Link></p>}
            </>
          )}
        </div>
        <div className="pcard">
          <div className="pcard-head">
            <div><h2>RCS wallet</h2><p className="muted" style={{ fontSize: 13 }}>Balance</p></div>
            <b className="mono" style={{ fontSize: 18 }}>{money(balance)}</b>
          </div>
          <Btn href="/app/rcs/history" variant="ghost" size="sm">View RCS history</Btn>
        </div>
      </aside>
    </form>
  );
}
