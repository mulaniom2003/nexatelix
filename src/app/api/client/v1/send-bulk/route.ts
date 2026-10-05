import { apiError, apiUser } from "@/lib/api-auth";
import { apiSend, isUrl, readJson } from "@/lib/client-api";
import { cleanNumber } from "@/lib/numbers";

export const maxDuration = 300;

/** POST /api/client/v1/send-bulk — same text to up to 5000 numbers. Body: { from, to: [..], text, dlr_url?, campaign? } */
export async function POST(req: Request) {
  const auth = await apiUser(req);
  if ("res" in auth) return auth.res;
  const b = await readJson(req);
  if (!b) return apiError(400, "Send a JSON body: { from, to: [...], text }.");
  const raw = Array.isArray(b.to) ? b.to : String(b.to ?? "").split(/[\s,;]+/);
  const numbers = [...new Set(raw.map((n) => cleanNumber(String(n))).filter((n) => /^\d{7,15}$/.test(n)))];
  if (numbers.length === 0) return apiError(400, "`to` must be a list of numbers with country code.");
  if (numbers.length > 5000) return apiError(400, "Up to 5000 numbers per request.");
  return apiSend(
    {
      userId: auth.userId,
      channel: "sms",
      from: String(b.from ?? ""),
      numbers,
      text: String(b.text ?? ""),
      campaignName: b.campaign ? String(b.campaign) : undefined,
      source: "api",
      clientDlr: isUrl(b.dlr_url) ? String(b.dlr_url) : null,
      origin: new URL(req.url).origin,
    },
    false
  );
}
