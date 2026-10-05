"use client";
import Link from "next/link";
import { Fragment, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { sendSmsAction, type ActionState } from "@/app/app/actions";
import { estimate, parseNumbers, type LiteRoute } from "@/lib/numbers";
import { smsSegments } from "@/lib/pricing";
import { toGsmFriendly } from "@/lib/gsm";
import { count, money } from "@/lib/format";
import { SubmitBtn } from "../Btn";
import { Icon } from "../icons";

type Mode = "single" | "bulk" | "file";

export function SmsForm({ routes, senders, balance }: { routes: LiteRoute[]; senders: string[]; balance: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendSmsAction, null);
  const [mode, setMode] = useState<Mode>("single");
  const [to, setTo] = useState("");
  const [numbers, setNumbers] = useState("");
  const [fileName, setFileName] = useState("");
  const [raw, setRaw] = useState("");
  const [fit, setFit] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setTo("");
      setNumbers("");
      setFileName("");
      setRaw("");
      formRef.current?.reset();
    }
  }, [state]);

  const text = fit ? toGsmFriendly(raw) : raw;
  const seg = smsSegments(text);
  const plain = smsSegments(raw);
  const parsed = useMemo(() => parseNumbers(mode === "single" ? to : numbers), [mode, to, numbers]);
  const est = useMemo(() => estimate(parsed.list, routes, seg.segments), [parsed.list, routes, seg.segments]);
  const short = est.cost > balance;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3_500_000) {
      setFileName("File is over 3.5 MB. Split it into smaller lists.");
      return;
    }
    setNumbers(await f.text());
    setFileName(f.name);
  }

  return (
    <form ref={formRef} action={action} className="pgrid-2">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="text" value={text} />
      <input type="hidden" name="numbers" value={numbers} />

      <section className="pcard pform">
        <div className="seg-tabs" role="tablist" aria-label="Send mode">
          {(["single", "bulk", "file"] as Mode[]).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
              {m === "single" ? "Single" : m === "bulk" ? "Bulk" : "File"}
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="sms-from">Sender ID</label>
          <input id="sms-from" name="from" className="input mono" list="sms-senders" placeholder="Your sender ID" maxLength={15} required autoComplete="off" />
          <datalist id="sms-senders">{senders.map((s) => <option key={s} value={s} />)}</datalist>
          <p className="muted" style={{ fontSize: 12.5 }}>
            {senders.length ? `Approved: ${senders.join(", ")}. ` : ""}Approved IDs send instantly. <Link href="/app/wallet#senders" className="link-u">Request a sender ID</Link>
          </p>
        </div>

        <div className="field">
          <label htmlFor="sms-camp">Campaign name <span className="muted" style={{ textTransform: "none", letterSpacing: 0 }}>(optional · shown in reports)</span></label>
          <input id="sms-camp" name="campaign" className="input" placeholder="e.g. Diwali promo — Mumbai list" maxLength={120} />
        </div>

        {mode === "single" && (
          <div className="field">
            <label htmlFor="sms-to">To (one number)</label>
            <input id="sms-to" name="to" className="input mono" value={to} onChange={(e) => setTo(e.target.value)} placeholder="919876543210" inputMode="tel" autoComplete="off" />
          </div>
        )}
        {mode === "bulk" && (
          <div className="field">
            <label htmlFor="sms-bulk">Numbers (one per line, with country code)</label>
            <textarea id="sms-bulk" className="textarea mono" rows={7} value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder={"919876543210\n919812345678"} style={{ fontSize: 13 }} />
          </div>
        )}
        {mode === "file" && (
          <div className="field">
            <label>Number list (.txt or .csv)</label>
            <div className="btn-row">
              <span className="btn btn-ghost btn-sm file-btn">
                <Icon.upload /> {fileName ? "Choose another file" : "Choose file"}
                <input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={onFile} aria-label="Upload number list" />
              </span>
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

        <div className="field">
          <label htmlFor="sms-text">Message</label>
          <textarea id="sms-text" className="textarea" rows={6} value={raw} onChange={(e) => setRaw(e.target.value)} required />
        </div>
        <label className="check">
          <input type="checkbox" checked={fit} onChange={(e) => setFit(e.target.checked)} />
          <span>Fit in fewer parts: replace ş→s, ğ→g, “ ”→&quot;, —→- and similar characters</span>
        </label>

        {state?.message && <p className={`alert ${state.ok ? "ok" : "err"}`} role="status">{state.message}</p>}
        <SubmitBtn pending={pending} variant="signal" block>
          {mode === "single" ? "Send SMS" : `Send to ${count(parsed.list.length)} numbers`}
        </SubmitBtn>
      </section>

      <aside className="pcard summary">
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 500 }}>Parts & cost</h2>
          <p className="muted" style={{ fontSize: 13 }}>Live preview · billed per SMS part</p>
        </div>
        {!raw ? (
          <p className="muted" style={{ fontSize: 14 }}>Type a message to see encoding, parts and cost.</p>
        ) : (
          <>
            <dl>
              <dt>Encoding</dt><dd>{seg.encoding}</dd>
              <dt>Characters</dt><dd>{seg.length}</dd>
              <dt>Parts per SMS</dt><dd>{seg.segments}{fit && plain.segments > seg.segments ? <span className="signal"> (was {plain.segments})</span> : null}</dd>
              <dt>Recipients</dt><dd>{count(est.covered)}</dd>
              {est.uncovered > 0 && (<><dt>No route</dt><dd style={{ color: "var(--danger)" }}>{count(est.uncovered)}</dd></>)}
              {est.countries.slice(0, 3).map(([c, n]) => (<Fragment key={c}><dt>{c}</dt><dd>{count(n)}</dd></Fragment>))}
            </dl>
            <div>
              <div className="total">{money(est.cost, 4)}</div>
              <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>Balance after: <span style={{ color: short ? "var(--danger)" : undefined }}>{money(balance - est.cost)}</span></p>
            </div>
            {seg.encoding === "UCS-2" && !fit && <p className="muted" style={{ fontSize: 13 }}>Special characters switch the SMS to Unicode (70 characters per part). Tick &ldquo;Fit in fewer parts&rdquo; to convert them where possible.</p>}
            {short && <p className="alert err">Not enough balance. <Link href="/app/wallet" className="link-u">Top up</Link></p>}
          </>
        )}
      </aside>
    </form>
  );
}
