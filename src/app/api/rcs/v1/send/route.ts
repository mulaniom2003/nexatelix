import { apiError, apiUser } from "@/lib/api-auth";
import { apiSend, isUrl, readJson } from "@/lib/client-api";
import { cleanNumber } from "@/lib/numbers";
import type { RcsContent } from "@/lib/upstream";

export const maxDuration = 300;

/** POST /api/rcs/v1/send — Body: { from, to (one or a list), content: { type: "text"|"card"|"carousel", ... }, dlr_url? } */
export async function POST(req: Request) {
  const auth = await apiUser(req);
  if ("res" in auth) return auth.res;
  const b = await readJson(req);
  if (!b) return apiError(400, "Send a JSON body: { from, to, content }.");
  const c = (b.content ?? {}) as Record<string, unknown>;
  let content: RcsContent;
  if (c.type === "card") content = { type: "card", title: String(c.title ?? ""), description: String(c.description ?? ""), media_url: c.media_url ? String(c.media_url) : undefined, suggestions: Array.isArray(c.suggestions) ? (c.suggestions as { text: string; url: string }[]).slice(0, 4) : [] };
  else if (c.type === "carousel") content = { type: "carousel", cards: (Array.isArray(c.cards) ? c.cards : []).slice(0, 10) as { title: string; description: string; media_url?: string }[] };
  else content = { type: "text", text: String(c.text ?? b.text ?? "") };
  const raw = Array.isArray(b.to) ? b.to : [b.to];
  const numbers = [...new Set(raw.map((n) => cleanNumber(String(n ?? ""))).filter((n) => /^\d{7,15}$/.test(n)))];
  if (numbers.length === 0) return apiError(400, "`to` must be a number in E.164 format, e.g. +919876543210.");
  if (numbers.length > 5000) return apiError(400, "Up to 5000 numbers per request.");
  return apiSend(
    {
      userId: auth.userId,
      channel: "rcs",
      from: String(b.from ?? ""),
      numbers,
      content,
      source: "api",
      clientRef: b.client_msg_id ? String(b.client_msg_id).slice(0, 64) : null,
      clientDlr: isUrl(b.dlr_url) ? String(b.dlr_url) : null,
      origin: new URL(req.url).origin,
    },
    numbers.length === 1
  );
}
