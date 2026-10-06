import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { site } from "@/lib/site";

/** Downloadable API reference for clients (NexaTelix-branded). */
export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const B = `${site.url}/api/client/v1`;
  const md = `# NexaTelix Client HTTP API (v1)

Send SMS and RCS over HTTPS, check status and balance, receive delivery callbacks.

## 1. Authentication

Create a key in the panel (API → New key). Send it on every request:

\`\`\`http
Authorization: Bearer <api_key>
\`\`\`

Alternative: \`?api_key=<key>\` as a query parameter. Anyone with a key can spend your balance — revoke unused keys in the panel.

## 2. Base URL

\`\`\`
${B}
\`\`\`

## 3. Send one SMS

\`\`\`http
POST ${B}/send
Content-Type: application/json
Authorization: Bearer <api_key>

{ "from": "SENDER", "to": "919876543210", "text": "Hello via API", "dlr_url": "https://you.com/dlr" }
\`\`\`

\`202\` → \`{ "id": "<message-id>", "client_msg_id": null, "to": "919876543210", "status": "submitted" }\`

Save \`id\` — you need it for status checks and it comes back in callbacks.

## 4. Send bulk (up to 5000 per request)

\`\`\`http
POST ${B}/send-bulk

{ "from": "SENDER", "to": ["919876543210", "918888888888"], "text": "Hello", "campaign": "Optional name" }
\`\`\`

\`to\` also accepts a comma / space / newline separated string.
\`202\` → \`{ "accepted": 2, "invalid": [], "messages": [{ "to": "919876543210", "id": "<message-id>" }] }\`

## 5. Delivery status

\`\`\`http
GET ${B}/status/:id
\`\`\`

\`{ "message": { "id": "…", "source": "SENDER", "destination": "919876543210", "status": "delivered", "error_code": null, "submit_time": "…", "dlr_time": "…" } }\`

Statuses: \`submitted\` → \`delivered\` / \`undelivered\` / \`expired\` / \`rejected\` / \`failed\`.

## 6. Balance

\`\`\`http
GET ${B}/balance
\`\`\`

\`{ "balance": "12.50", "rcs_balance": "40.00", "credit_limit": "0", "currency": "EUR" }\`

## 7. RCS

\`\`\`http
POST ${site.url}/api/rcs/v1/send

{ "from": "<approved RCS sender>", "to": "919876543210", "content": { "type": "text", "text": "Hello" } }
\`\`\`

- \`card\`: \`{ "type": "card", "title", "description", "media_url", "suggestions": [{ "text", "url" }] }\`
- \`carousel\`: \`{ "type": "carousel", "cards": [{ "title", "description", "media_url" }] }\`

## 8. Delivery callbacks

Pass \`dlr_url\` on any send. We POST JSON on every status change until a final state:

\`\`\`json
{ "message_id": "<id from send>", "vendor_msg_id": null, "status": "delivered", "ts": "2026-01-01T00:00:00.000Z" }
\`\`\`

Answer HTTP \`2xx\` within ~10 s. Match on \`message_id\`.

## 9. Errors

| Code | Meaning |
|------|---------|
| 400 | Invalid payload / no valid destinations |
| 401 | Missing or bad API key |
| 402 | Insufficient balance |
| 403 | Account not active |
| 404 | Message not found |
| 429 | Too many requests — wait a second and retry |
| 502 / 503 | Message couldn't be submitted / temporarily unavailable |

Support: ${site.contact.supportEmail}
`;
  return new NextResponse(md, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'attachment; filename="nexatelix-api-v1.md"' } });
}
