# NexaTelix — Complete Portal Architecture & Claude Handoff Guide

This document is the **complete technical and operational blueprint** for NexaTelix. It explains how the portal was mapped from the reference system (`8xtelSMPP` at `74.0.32.84`), how every tab is constructed, and how you or Claude can take this codebase live with real telecom provider APIs.

---

## 1. Reference Architecture Breakdown (8xtelSMPP vs. NexaTelix)

The reference portal at `74.0.32.84` is an enterprise SMPP/RCS gateway. We reverse-engineered its full navigation structure, data contracts, and client-side UI routes. NexaTelix reproduces **all of these features** in a modern, production-grade **Next.js 16 + TypeScript** stack with custom high-end styling.

### Route Mapping Matrix

| Feature / Tab | 8xtelSMPP Reference URL | NexaTelix Live URL | NexaTelix Source Component |
|---|---|---|---|
| **Client Overview** | `/portal` | `/portal` or `/app` | `src/app/app/page.tsx` |
| **Send SMS** | `/portal/send` | `/portal/send` or `/app/sms` | `src/app/app/sms/page.tsx` + `SmsForm.tsx` |
| **Send RCS Studio** | `/portal/rcs/send` | `/portal/rcs/send` or `/app/rcs` | `src/app/app/rcs/page.tsx` + `RcsForm.tsx` |
| **RCS History** | `/portal/rcs/history` | `/portal/rcs/history` or `/app/rcs/history` | `src/app/app/rcs/history/page.tsx` |
| **RCS Reports** | `/portal/rcs/reports` | `/portal/rcs/reports` or `/app/reports?channel=rcs` | `src/app/app/reports/page.tsx` |
| **Coverage & Rates** | `/portal/coverage` | `/portal/coverage` or `/app/coverage` | `src/app/app/coverage/page.tsx` + `CoverageTable.tsx` |
| **Message DLR History** | `/portal/history` | `/portal/history` or `/app/reports` | `src/app/app/reports/page.tsx` |
| **Reports & Export** | `/portal/reports` | `/portal/reports` or `/app/reports` | `src/app/app/reports/export/route.ts` |
| **Billing / Invoices** | `/portal/invoices` | `/portal/invoices` or `/app/invoices` | `src/app/app/invoices/page.tsx` + PDF route |
| **Developer API & Keys** | `/portal/api` | `/portal/api` or `/app/api` | `src/app/app/api/page.tsx` |
| **Wallet & Top-up** | `/portal/wallet` | `/portal/wallet` or `/app/wallet` | `src/app/app/wallet/page.tsx` |
| **Client Login** | `/portal/login` | `/portal/login` or `/login` | `src/components/auth/AuthForms.tsx` |
| **Admin Suite** | `/` (Admin Root) | `/admin` | `src/app/admin/*` |
| **Admin Clients** | `/clients` | `/admin/users` | `src/app/admin/users/page.tsx` |
| **Admin Message Logs** | `/messages` | `/admin/messages` | `src/app/admin/messages/page.tsx` |
| **Admin Routing Engine** | `/routes` | `/admin/routes` | `src/app/admin/routes/page.tsx` |
| **Admin Pricing Manager**| `/rates` | `/admin/pricing` | `src/app/admin/pricing/page.tsx` |
| **Admin Top-up Approvals**| `/billing` | `/admin/topups` | `src/app/admin/topups/page.tsx` |
| **Admin Sender IDs** | `/senders` | `/admin/senders` | `src/app/admin/senders/page.tsx` |
| **Admin Support Tickets**| Helpdesk | `/admin/tickets` | `src/app/admin/tickets/page.tsx` |

---

## 2. Key Tools & Features Implemented

### A. SMS Engine (`src/components/panel/SmsForm.tsx`)
- **Single & Bulk Upload**: Accepts raw text paste or `.csv` / `.txt` files with automatic phone number parsing and deduplication.
- **GSM-7 vs. UCS-2 Character Analysis**: Automatically detects unicode/emojis and calculates single-part vs. multi-part message segment boundaries (160 / 153 for GSM-7, 70 / 67 for UCS-2).
- **Prefix-Based Route Lookup**: Detects destination country from international dial code and matches the lowest rate or assigned private route.
- **Real-Time Cost Preview**: Recipient count × Segments × Unit rate calculated live before dispatch.

### B. RCS Studio (`src/components/panel/RcsForm.tsx`)
- **Verified Brand Sender**: Select from verified RCS bot IDs.
- **Rich Card & Carousel Builder**: Input headline, body description, and media image URL.
- **Interactive Action Buttons**:
  - `URL`: Open external website link.
  - `DIAL`: Trigger direct phone call.
  - `REPLY`: Quick reply chips for two-way chat.
- **Live Mobile Simulation**: Real-time rendering on a simulated smartphone screen.

### C. Rates & Coverage Directory (`src/components/panel/CoverageTable.tsx`)
- Live filtering across 197+ countries with country flags, ISO codes, international prefixes, route quality tiers (`Direct`, `HQ`, `SIM`), and currency rates.

### D. Billing, Ledger & PDF Statements (`src/app/app/invoices/`)
- Dynamic monthly statement calculation.
- Native printable PDF invoice generation at `/app/invoices/[month]/pdf`.

---

## 3. Ready-to-Run Local Testing

The project has zero mandatory setup to test locally:
1. Open PowerShell in `C:\Users\ADMIN\.gemini\antigravity\scratch\nexatelix`.
2. Start the application:
   ```powershell
   npm run start
   ```
3. Test the URLs:
   - **Client Portal**: `http://localhost:3000/portal` or `http://localhost:3000/app`
   - **Send SMS**: `http://localhost:3000/portal/send`
   - **Send RCS**: `http://localhost:3000/portal/rcs/send`
   - **Coverage**: `http://localhost:3000/portal/coverage`
   - **Reports**: `http://localhost:3000/portal/reports`
   - **Invoices**: `http://localhost:3000/portal/invoices`
   - **API Docs**: `http://localhost:3000/portal/api`
   - **Wallet**: `http://localhost:3000/portal/wallet`
   - **Admin Suite**: `http://localhost:3000/admin`
   - **Public Website**: `http://localhost:3000`

---

## 4. Instructions for Claude to Make It Live & Connect Real APIs

If you are handing this project over to **Claude Code CLI** or **Claude Desktop**:

### Step 1: Open the Workspace in Claude
Point Claude to:
`C:\Users\ADMIN\.gemini\antigravity\scratch\nexatelix`

### Step 2: Prompt for Claude
Give Claude the following instruction:
```text
I have built the complete NexaTelix website, client portal, and admin suite based on the 8xtelSMPP architecture.
All frontend routes, UI components, mock database fallback, and Next.js 16 App Router pages are verified and compiling with zero errors.

Please help me connect real telecom upstream providers:
1. Review src/lib/upstream.ts and src/app/api/client/v1/send/route.ts.
2. Connect my SMS provider API (e.g. Route Mobile, Twilio, Infobip, or custom HTTP SMPP gateway).
3. Connect my RCS Business Messaging credentials (Google RBM API / Partner endpoint).
4. Review supabase/migrations/0001_init.sql and prepare the live production deployment on Vercel.
```

### Step 3: Upstream Telecom Provider Adapter Pattern
The provider connection is centralized in `src/lib/upstream.ts`:
```typescript
export async function dispatchToUpstream(params: {
  channel: "sms" | "rcs" | "whatsapp" | "telegram";
  sender: string;
  recipient: string;
  message: string;
  mediaUrl?: string;
  buttons?: any[];
}) {
  // Plug your real provider API key here:
  // Twilio / Route Mobile / Infobip / Gupshup / Kannel HTTP
  const endpoint = process.env.UPSTREAM_GATEWAY_URL;
  const apiKey = process.env.UPSTREAM_API_KEY;
  ...
}
```

---

## 5. Live Hosting (1-Click Vercel + Supabase)

1. **Supabase Database**:
   - Create a free project at [supabase.com](https://supabase.com).
   - In the **SQL Editor**, run `supabase/migrations/0001_init.sql`.
2. **Vercel Deployment**:
   - Push this repo to GitHub.
   - Import into Vercel and provide the 4 keys from `.env.example`.
   - Your site and portal are immediately live on your custom domain!
