import { apiError, apiUser } from "@/lib/api-auth";
import { apiSend, isUrl, readJson } from "@/lib/client-api";
import { cleanNumber } from "@/lib/numbers";

export const maxDuration = 60;

/** POST /api/client/v1/send — one SMS. Body: { from, to, text, dlr_url?, client_msg_id? } */
export async function POST(req: Request) {
  const auth = await apiUser(req);
  if ("res" in auth) return auth.res;
  const b = await readJson(req);
  if (!b) return apiError(400, "Send a JSON body: { from, to, text }.");
  const to = cleanNumber(String(b.to ?? ""));
  if (!/^\d{7,15}$/.test(to)) return apiError(400, "`to` must be a number with country code, e.g. 919876543210.");
  return apiSend(
    {
      userId: auth.userId,
      channel: "sms",
      from: String(b.from ?? ""),
      numbers: [to],
      text: String(b.text ?? ""),
      source: "api",
      clientRef: b.client_msg_id ? String(b.client_msg_id).slice(0, 64) : null,
      clientDlr: isUrl(b.dlr_url) ? String(b.dlr_url) : null,
      origin: new URL(req.url).origin,
    },
    true
  );
}
