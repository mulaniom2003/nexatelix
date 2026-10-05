# NexaTelix — project brief (read this first)

Everything an assistant needs to continue this project without asking the owner to re-explain.
Owner: Om (Ahmedabad). Non-developer: do the work yourself, don't hand him code to paste. Keep replies short and plain.

## What this is
- **nexatelix.com** — premium marketing site + client portal + admin panel for a white-label **SMS / RCS** reseller business.
- Clients sign up on NexaTelix, top up a prepaid wallet, and send SMS/RCS from the panel or via our HTTP API.
- **We do not send messages ourselves.** Every send is forwarded to a partner platform ("upstream", an 8xtel-style SMPP panel) through its client HTTP API. Clients must **never** see or hear about the partner — no names, URLs or raw upstream errors in any client-facing text (`clientSafe()` in `src/lib/upstream.ts`).
- All client data (accounts, wallets, messages, reports) lives in **our** Supabase database.

## Stack / hosting (no VPS needed)
- Next.js 16 (App Router, Turbopack, `src/proxy.ts` instead of middleware) — **read `node_modules/next/dist/docs` before changing APIs** (see AGENTS.md).
- Supabase (Postgres + Auth + Storage). Migrations: `supabase/migrations/0001_init.sql`, `0002_messaging.sql` (both idempotent; run in Supabase SQL Editor in order).
- Vercel project **nexatelix** (Hobby). Deploy: double-click `Publish NexaTelix.bat` (runs `npx vercel deploy --prod`). Domain DNS at Porkbun.
- Local dev: `Start NexaTelix.bat` (npm run dev, LAN allowed via `allowedDevOrigins`).
- Fonts are local woff2 (Fraunces, Onest, JetBrains Mono) in `src/app/fonts`.

## Brand
- Dark UI, lime signal colour `#c6ff3d`. Logo = "A · Signal N": white single-line N with a lime dot. Owner rejected all variations — keep it.
- Contact: WhatsApp +91 98799 93043 · Telegram @MulaniOm · channel @NexaTelix · sales@ / support@nexatelix.com (Porkbun forwards → owner's Gmail, Gmail labels NexaTelix/Sales & NexaTelix/Support). **No physical address** on the site. No invented stats/claims.

## Code map
- Marketing: `src/app/(site)/…`, components in `src/components/site/`, copy in `src/lib/site.ts`, `channel-content.tsx`, `legal.tsx`.
- Client panel `/app`: Overview, Send SMS (`/app/sms`), Send RCS (`/app/rcs`), RCS History, Coverage, Reports (+CSV export), Invoices (+PDF via pdf-lib), API (keys, samples, `/app/api/docs` .md download), Wallet (SMS + RCS balances, top-up requests, sender IDs, ledger), Support tickets, Settings. Actions: `src/app/app/actions.ts`.
- Admin `/admin`: Overview (partner balance, sales), Messages, Top-ups (approve → credits wallet), Sender IDs, Routes (price per country, SMS/RCS), Clients (balances, custom route prices, sender IDs, suspend/admin), Tickets, Website prices, Settings (payment details UPI/bank/USDT, refund-failed toggle, require-approved-SMS-sender toggle). Actions: `src/app/admin/actions.ts`.
- Core logic: `src/lib/messaging.ts` (`sendMessages`: validate sender → route per number by longest dial-code → charge wallet via `wallet_move` → insert messages → send upstream → mark → refund unsubmitted; `applyDlr`; `syncPending`), `src/lib/upstream.ts` (partner bridge), `src/lib/routing.ts`, `src/lib/numbers.ts`, `src/lib/gsm.ts`.
- Our public API (mirrors the partner's format exactly): `POST /api/client/v1/send`, `/send-bulk` (≤5000), `GET /status/:id`, `GET /balance`, `POST /api/rcs/v1/send`. Keys `nx_live_…`, Bearer or `?api_key=`. DLR webhook from partner: `POST /api/dlr/<DLR_SECRET>`.
- Payments are manual (UPI / bank / USDT) — client submits UTR, admin approves.

## Partner (upstream) API — documented, implemented, mock-tested
- Base `{PANEL}/api/client/v1`, auth `Authorization: Bearer <key>`.
- send → 202 `{id, client_msg_id, to, status}`; send-bulk → `{accepted, invalid:[], messages:[{to,id}]}`; status → `{message:{status, error_code, …}}`; balance → `{balance:"12.50", credit_limit, currency:"EUR"}` (partner bills in **EUR**, we sell in **USD**).
- DLR push `{message_id, vendor_msg_id, status, ts}`; statuses submitted → delivered/undelivered/expired/rejected/failed. 429 = TPS limit (we retry ×4).
- **RCS:** owner said leave RCS for now; partner RCS payload is still a guess.

## Environment variables (owner sets these himself — never ask him to paste secrets into chat)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://nexatelix.com`, `UPSTREAM_BASE_URL` (partner panel origin), `UPSTREAM_API_KEY`, `DLR_SECRET`, optional `RESEND_API_KEY`, `CONTACT_TO`.
`Set keys NexaTelix.bat` (+ `set-keys.ps1`) prompts for them, writes `.env.local`, pushes to Vercel and redeploys. `.env*` and `*.ps1` are in `.vercelignore`.

## Status / what's left (in order)
1. **Supabase**: create project (if none), run 0001 then 0002, Auth → URL config (Site URL `https://nexatelix.com`, redirects `https://nexatelix.com/**`, `http://localhost:3000/**`), turn off "Confirm email".
2. **Partner TLS — must fix before go-live:** the partner panel is at a bare IP with a **self-signed HTTPS certificate**. Node `fetch` on Vercel will reject it. Fix in `src/lib/upstream.ts`: pin the partner's certificate (e.g. undici `Agent` with the cert's PEM as `ca` + `checkServerIdentity` comparing the SHA-256 fingerprint from an env var such as `UPSTREAM_CERT_SHA256`). Do **not** disable TLS globally.
3. Owner creates an API key in the partner panel (API tab → + New key), then runs `Set keys NexaTelix.bat`.
4. Owner signs up on the site, then: `update public.profiles set role='admin' where email='mulaniom2216@gmail.com';`
5. Fill `/admin/settings` payment details and `/admin/routes` selling prices; send a real test SMS.
6. Ask partner whether API calls need an IP whitelist — if yes, Vercel has no fixed IP and a small VPS proxy would be needed. Otherwise no VPS.
7. Later: owner's further marketing-site changes; RCS once partner docs arrive.

## Rules
- Never put passwords, API keys or the partner panel login in code, files or commits.
- Run `npx tsc --noEmit` and `npx next build` after changes; keep the build green.
- Client-facing copy: professional, no "AI" filler, no partner mentions.
