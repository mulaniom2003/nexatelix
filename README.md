# NexaTelix — Enterprise Messaging Platform & Portal

NexaTelix is a full-stack, enterprise-grade messaging platform built with **Next.js 16 (Turbopack, App Router)**, **TypeScript**, **Framer Motion**, and **Supabase (PostgreSQL, Auth, Storage)**.

---

## 🌟 What Is Built & Included

### 1. Public Marketing Website (Editorial Design)
- **Home (`/`)**: Kinetic typography, interactive 3D orthographic Canvas globe with message route arcs, live metric counters, channel comparison matrix, and testimonial carousel.
- **SMS (`/sms`)**: SIM, HQ, and Direct route tiers with dynamic GSM-7/UCS-2 calculator.
- **RCS (`/rcs`)**: Interactive RCS Studio showcase with rich media cards and CTA action buttons.
- **WhatsApp (`/whatsapp`)**: Meta Business API, Broadcast Text, and Interactive Buttons.
- **Telegram (`/telegram`)**: Bulk broadcast overview (200k/day throughput).
- **iGaming & Casino (`/gaming`)**: Dedicated high-deliverability routes for authentication and alerts.
- **Interactive Pricing (`/pricing`)**: Real-time volume slider and currency estimator.
- **Developers (`/developers`)**: Interactive cURL, Python, and Node.js code snippets.
- **Contact & Leads (`/contact`)**: Working inquiry form that persists leads to the database.
- **FAQ & Legal (`/faq`, `/legal/terms`, `/legal/privacy`, `/legal/acceptable-use`)**.

### 2. Client Portal (`/app`)
- **Dashboard (`/app`)**: Live wallet balance, today's sent count, delivery percentage, and real-time activity feed.
- **Send SMS (`/app/sms`)**: Single and bulk CSV/TXT upload, route selector (SIM/HQ/Direct), instant cost estimation.
- **RCS Studio (`/app/rcs` & `/app/rcs/history`)**: Visual RCS composer with live mobile preview.
- **Coverage & Rates (`/app/coverage`)**: Searchable prefix directory covering 197+ countries.
- **Delivery Reports (`/app/reports`)**: DLR logs, message filtering, and CSV report exports (`/app/reports/export`).
- **Billing & Invoices (`/app/invoices`)**: Downloadable monthly PDF statements (`/app/invoices/[month]/pdf`).
- **Wallet (`/app/wallet`)**: Top-up requests via UPI, Card, Bank Wire, or USDT (TRC-20).
- **API & Webhooks (`/app/api`)**: Self-serve API key generator and webhook endpoint configurations.
- **Support (`/app/support`)**: Helpdesk ticketing system with real-time status.

### 3. Admin Suite (`/admin`)
- **System Overview (`/admin`)**: Global message throughput, revenue metrics, and system health.
- **User Management (`/admin/users`)**: Inspect client profiles, adjust wallet balances, view activity.
- **Outbound Queue (`/admin/messages`)**: Live message inspection and manual status failover.
- **Route Engine (`/admin/routes`)**: Configure upstream vendor connectors and backup routes.
- **Pricing Manager (`/admin/pricing`)**: Adjust channel and tier pricing dynamically without redeployment.
- **Top-up Approvals (`/admin/topups`)**: Verify and approve bank/USDT deposits to credit client wallets instantly.
- **Sender ID Approval (`/admin/senders`)**: Review and approve branded Sender IDs.
- **Support Inbox (`/admin/tickets`)**: Staff reply interface for user support requests.

### 4. Developer REST API
- `POST /api/client/v1/send`: Send single SMS/RCS message.
- `POST /api/client/v1/send-bulk`: Submit bulk recipient list.
- `GET /api/client/v1/status/:id`: Check real-time DLR status.
- `GET /api/client/v1/balance`: Query available wallet balance.
- `POST /api/dlr/:secret`: Upstream provider webhook callback receiver.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies (already completed)
npm install

# 2. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying Live (Step-by-Step)

### Step 1: Set Up Supabase (Free Database & Auth)
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the Supabase dashboard, navigate to the **SQL Editor**.
3. Copy the entire contents of `supabase/migrations/0001_init.sql` and click **Run**.
4. In **Project Settings → API**, copy:
   - `Project URL`
   - `anon public` key
   - `service_role` secret key

### Step 2: Deploy on Vercel (Free Hosting)
1. Push this project to your GitHub/GitLab account:
   ```bash
   git add .
   git commit -m "Launch NexaTelix platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nexatelix.git
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `nexatelix` repository.
4. Add the following **Environment Variables**:
   ```env
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Click **Deploy**. Your site and portal will be live in ~60 seconds with an automatic SSL certificate.

### Step 3: Promote Yourself to Admin
Once you sign up with your email on `/signup`, open your Supabase SQL editor and run:
```sql
update public.profiles set role = 'admin' where email = 'your-email@example.com';
```
Now navigating to `/admin` will grant you full access to the administration suite!
