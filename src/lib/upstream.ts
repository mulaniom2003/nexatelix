import "server-only";

/**
 * Bridge to the wholesale messaging platform that actually delivers traffic.
 * Clients never see this: they only ever talk to NexaTelix.
 *
 * Configure in .env.local and in Vercel → Settings → Environment Variables:
 *   UPSTREAM_BASE_URL   the provider panel address, e.g. https://panel.example.com
 *                       (…/api or …/api/client/v1 pasted from their docs also works)
 *   UPSTREAM_API_KEY    your API key from the provider's "Connect via API" page
 *   DLR_SECRET          any long random string; protects the delivery-report webhook
 *
 * Endpoints used (from the provider's API page):
 *   POST {panel}/api/client/v1/send       { from, to, text, dlr_url } → 202 { id, client_msg_id, to, status }
 *   POST {panel}/api/client/v1/send-bulk  { from, to: [..≤5000], text } → 202 { accepted, invalid: [], messages: [{ to, id }] }
 *   GET  {panel}/api/client/v1/status/:id → { message: { id, status, error_code, submit_time, dlr_time } }
 *   GET  {panel}/api/client/v1/balance    → { balance: "12.50", credit_limit: "0", currency: "EUR" }
 *   POST {panel}/api/rcs/v1/send          (RCS — payload to confirm with the RCS docs)
 * Callback: provider POSTs { message_id, vendor_msg_id, status, ts } to our dlr_url on every change.
 * Errors: 400 bad payload · 401 bad key · 422 inactive / no balance / sender blocked · 429 over TPS.
 */

const BASE = (process.env.UPSTREAM_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "")
  .replace(/(\/api)?(\/client\/v1)?$/, "");
const KEY = process.env.UPSTREAM_API_KEY ?? "";

export const upstreamConfigured = Boolean(BASE && KEY);
export const BULK_LIMIT = 5000;

export type UpResult = { to: string; id: string | null; status: string; error: string | null };

export class UpstreamError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

async function call<T = unknown>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  if (!upstreamConfigured) throw new UpstreamError("Sending is not connected yet.");
  let res: Response;
  // 429 = over the account's per-second limit: wait and retry (up to 4 times).
  for (let attempt = 0; ; attempt++) {
    res = await fetch(`${BASE}${path}`, {
      method: init?.method ?? "GET",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Accept: "application/json" },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });
    if (res.status !== 429 || attempt >= 4) break;
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const d = data as { error?: string; message?: string } | null;
    throw new UpstreamError(d?.error || d?.message || `HTTP ${res.status}`, res.status);
  }
  return data as T;
}

export function dlrUrl(base: string) {
  const s = process.env.DLR_SECRET;
  return s ? `${base.replace(/\/+$/, "")}/api/dlr/${encodeURIComponent(s)}` : undefined;
}

/** Normalise one result object from the provider into { to, id, status, error }. */
function norm(x: Record<string, unknown>, fallbackTo: string): UpResult {
  const id = (x.id ?? x.message_id ?? x.messageId ?? null) as string | null;
  const err = (x.error ?? x.reason ?? null) as string | null;
  const status = String(x.status ?? (id ? "submitted" : "failed")).toLowerCase();
  return { to: String(x.to ?? x.destination ?? fallbackTo), id: id ? String(id) : null, status: err && !id ? "failed" : status, error: err ? String(err) : null };
}

export async function sendSms(p: { from: string; to: string; text: string; dlr?: string }): Promise<UpResult> {
  const r = await call<Record<string, unknown>>("/api/client/v1/send", { method: "POST", body: { from: p.from, to: p.to, text: p.text, dlr_url: p.dlr } });
  return norm(r ?? {}, p.to);
}

/** Up to 5000 numbers, same text. Returns one result per number (in order when the provider returns a list). */
export async function sendSmsBulk(p: { from: string; to: string[]; text: string; dlr?: string }): Promise<UpResult[]> {
  const r = await call<unknown>("/api/client/v1/send-bulk", { method: "POST", body: { from: p.from, to: p.to, text: p.text, dlr_url: p.dlr } });
  const o = (r ?? {}) as Record<string, unknown>;
  const list = (Array.isArray(r) ? r : (o.messages ?? o.results ?? o.data)) as Record<string, unknown>[] | undefined;
  if (Array.isArray(list)) {
    // Match by digits only: the provider may echo numbers with or without "+".
    const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");
    const byTo = new Map(list.map((x) => [digits(x.to ?? x.destination), x]));
    const invalid = new Set((Array.isArray(o.invalid) ? o.invalid : []).map((v) => digits(typeof v === "object" && v ? (v as Record<string, unknown>).to : v)));
    return p.to.map((to) => {
      const hit = byTo.get(digits(to));
      if (hit) return norm(hit, to);
      return { to, id: null, status: "failed", error: invalid.has(digits(to)) ? "Invalid number" : "Not accepted" };
    });
  }
  // Provider accepted the batch without per-number ids.
  const batchId = o.id ?? o.batch_id;
  return p.to.map((to) => ({ to, id: batchId ? `${batchId}:${to}` : null, status: "submitted", error: null }));
}

export type RcsContent =
  | { type: "text"; text: string }
  | { type: "card"; title: string; description: string; media_url?: string; suggestions?: { text: string; url: string }[] }
  | { type: "carousel"; cards: { title: string; description: string; media_url?: string; suggestions?: { text: string; url: string }[] }[] };

export async function sendRcs(p: { from: string; to: string; content: RcsContent; dlr?: string }): Promise<UpResult> {
  const r = await call<Record<string, unknown>>("/api/rcs/v1/send", { method: "POST", body: { from: p.from, to: p.to, content: p.content, dlr_url: p.dlr } });
  return norm(r ?? {}, p.to);
}

export async function messageStatus(id: string): Promise<{ status: string; error: string | null } | null> {
  try {
    const r = await call<Record<string, unknown>>(`/api/client/v1/status/${encodeURIComponent(id)}`);
    const m = ((r?.message && typeof r.message === "object" ? r.message : r) ?? {}) as Record<string, unknown>;
    const code = m.error_code ?? m.error ?? null;
    return { status: String(m.status ?? "").toLowerCase(), error: code == null ? null : `Error ${code}` };
  } catch {
    return null;
  }
}

/** Your own balance on the provider account (admin only). */
export async function providerBalance(): Promise<{ balance: number; currency: string } | null> {
  if (!upstreamConfigured) return null;
  try {
    const r = await call<Record<string, unknown>>("/api/client/v1/balance");
    return { balance: Number(r?.balance ?? r?.amount ?? 0), currency: String(r?.currency ?? "") };
  } catch {
    return null;
  }
}

/** Errors shown to clients never mention the provider. */
export function clientSafe(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/not connected/i.test(m)) return "Sending is temporarily unavailable. Please try again shortly.";
  if (/rate|tps|429/i.test(m)) return "Sending is busy right now. Please retry in a few seconds.";
  if (/balance|credit|insufficient|not active/i.test(m)) return "Sending is temporarily unavailable. Please contact support.";
  if (/sender|from|blocked/i.test(m)) return "This sender ID isn't accepted on the route. Use an approved sender ID.";
  if (/no valid destination|invalid/i.test(m)) return "None of the numbers are valid. Use full international format, e.g. 919876543210.";
  return "The message couldn't be submitted. Please try again or contact support.";
}
