-- NexaTelix database setup. Paste this WHOLE file into Supabase > SQL Editor > New query > Run.
-- Safe to run more than once.

-- ============ PART 1 of 2 (0001_init.sql) ============
-- ════════════════════════════════════════════════════════════════════
-- NexaTelix — initial schema
-- Run in Supabase SQL editor (or `supabase db push`).
-- All money is stored in USD as numeric(14,5).
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('customer','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type channel as enum ('sms','rcs','whatsapp','telegram');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_status as enum ('pending','approved','sending','completed','rejected','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type topup_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('open','answered','closed');
exception when duplicate_object then null; end $$;

-- ── Profiles ────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  company     text,
  phone       text,
  telegram    text,
  role        user_role not null default 'customer',
  suspended   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── Wallets & ledger ────────────────────────────────────────────────
create table if not exists public.wallets (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  balance     numeric(14,5) not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now()
);

create table if not exists public.transactions (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      numeric(14,5) not null,           -- +credit / -debit
  balance_after numeric(14,5) not null,
  kind        text not null,                    -- topup | campaign | refund | adjustment
  reference   text,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions(user_id, created_at desc);

-- ── Prices ──────────────────────────────────────────────────────────
create table if not exists public.prices (
  id          serial primary key,
  channel     channel not null,
  tier        text not null,          -- e.g. sim | hq | direct | standard | buttons | official
  label       text not null,
  description text,
  unit_price  numeric(10,5) not null, -- USD per message (per segment for SMS)
  min_volume  integer not null default 0,
  active      boolean not null default true,
  sort        integer not null default 0,
  unique (channel, tier, min_volume)
);

-- ── Campaigns ───────────────────────────────────────────────────────
create table if not exists public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  channel       channel not null,
  tier          text not null,
  sender_id     text,
  message       text not null,
  media_url     text,
  buttons       jsonb not null default '[]'::jsonb,
  recipients_path text,               -- storage path in bucket campaign-files
  recipients_count integer not null default 0,
  segments      integer not null default 1,
  unit_price    numeric(10,5) not null,
  cost          numeric(14,5) not null,
  scheduled_at  timestamptz,
  status        campaign_status not null default 'pending',
  admin_note    text,
  delivered     integer,
  failed        integer,
  report_path   text,                 -- storage path of delivery report
  source        text not null default 'panel', -- panel | api
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists campaigns_user_idx on public.campaigns(user_id, created_at desc);
create index if not exists campaigns_status_idx on public.campaigns(status, created_at desc);

-- ── Top-ups (manual + gateway) ──────────────────────────────────────
create table if not exists public.topups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      numeric(14,5) not null check (amount > 0),
  method      text not null,          -- razorpay | upi | bank | usdt
  reference   text,                   -- UTR / tx hash / razorpay payment id
  gateway_order_id text unique,
  status      topup_status not null default 'pending',
  admin_note  text,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ── API keys ────────────────────────────────────────────────────────
create table if not exists public.api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  prefix      text not null,          -- first chars, shown in UI
  key_hash    text not null unique,   -- sha256 hex
  last_used_at timestamptz,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── Inquiries (contact form) ────────────────────────────────────────
create table if not exists public.inquiries (
  id          bigserial primary key,
  name        text not null,
  email       text not null,
  company     text,
  service     text,
  volume      text,
  message     text not null,
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── Support tickets ─────────────────────────────────────────────────
create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  subject     text not null,
  status      ticket_status not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id          bigserial primary key,
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  is_staff    boolean not null default false,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ── Settings (key/value) ────────────────────────────────────────────
create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);

-- ════════════════════════════════════════════════════════════════════
-- Functions
-- ════════════════════════════════════════════════════════════════════

-- New auth user → profile + wallet
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, company)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          coalesce(new.raw_user_meta_data->>'company', ''))
  on conflict (id) do nothing;
  insert into public.wallets (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- is_admin helper
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Atomic wallet movement. Only callable with service role.
create or replace function public.wallet_apply(
  p_user uuid, p_amount numeric, p_kind text, p_reference text default null, p_note text default null
) returns numeric language plpgsql security definer set search_path = public as $$
declare v_balance numeric;
begin
  update public.wallets
     set balance = balance + p_amount, updated_at = now()
   where user_id = p_user
   returning balance into v_balance;

  if v_balance is null then
    raise exception 'wallet not found';
  end if;
  if v_balance < 0 then
    raise exception 'insufficient balance';
  end if;

  insert into public.transactions (user_id, amount, balance_after, kind, reference, note)
  values (p_user, p_amount, v_balance, p_kind, p_reference, p_note);
  return v_balance;
end $$;

revoke all on function public.wallet_apply(uuid, numeric, text, text, text) from public, anon, authenticated;
grant execute on function public.wallet_apply(uuid, numeric, text, text, text) to service_role;

-- Create a campaign and charge the wallet in one transaction.
create or replace function public.create_campaign_charged(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_cost numeric := (p->>'cost')::numeric;
begin
  insert into public.campaigns
    (user_id, name, channel, tier, sender_id, message, media_url, buttons,
     recipients_path, recipients_count, segments, unit_price, cost, scheduled_at, source)
  values
    ((p->>'user_id')::uuid, p->>'name', (p->>'channel')::channel, p->>'tier', p->>'sender_id',
     p->>'message', nullif(p->>'media_url',''), coalesce(p->'buttons','[]'::jsonb),
     p->>'recipients_path', (p->>'recipients_count')::int, (p->>'segments')::int,
     (p->>'unit_price')::numeric, v_cost, nullif(p->>'scheduled_at','')::timestamptz,
     coalesce(p->>'source','panel'))
  returning id into v_id;

  perform public.wallet_apply((p->>'user_id')::uuid, -v_cost, 'campaign', v_id::text, p->>'name');
  return v_id;
end $$;

revoke all on function public.create_campaign_charged(jsonb) from public, anon, authenticated;
grant execute on function public.create_campaign_charged(jsonb) to service_role;

-- ════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.profiles        enable row level security;
alter table public.wallets         enable row level security;
alter table public.transactions    enable row level security;
alter table public.prices          enable row level security;
alter table public.campaigns       enable row level security;
alter table public.topups          enable row level security;
alter table public.api_keys        enable row level security;
alter table public.inquiries       enable row level security;
alter table public.tickets         enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.settings        enable row level security;

-- Customers: read own data. All writes go through server code (service role).
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());

drop policy if exists "own wallet" on public.wallets;
create policy "own wallet" on public.wallets for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "own tx" on public.transactions;
create policy "own tx" on public.transactions for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "public prices" on public.prices;
create policy "public prices" on public.prices for select using (true);

drop policy if exists "own campaigns" on public.campaigns;
create policy "own campaigns" on public.campaigns for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "own topups" on public.topups;
create policy "own topups" on public.topups for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "own keys" on public.api_keys;
create policy "own keys" on public.api_keys for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin inquiries" on public.inquiries;
create policy "admin inquiries" on public.inquiries for select using (public.is_admin());

drop policy if exists "own tickets" on public.tickets;
create policy "own tickets" on public.tickets for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "own ticket msgs" on public.ticket_messages;
create policy "own ticket msgs" on public.ticket_messages for select using (
  public.is_admin() or exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
);

drop policy if exists "public settings" on public.settings;
create policy "public settings" on public.settings for select using (true);

-- ════════════════════════════════════════════════════════════════════
-- Storage: private bucket for recipient lists, creatives and reports.
-- Path convention: <user_id>/<file>
-- ════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('campaign-files', 'campaign-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('creatives', 'creatives', true)
on conflict (id) do nothing;

drop policy if exists "upload own files" on storage.objects;
create policy "upload own files" on storage.objects for insert to authenticated
  with check (bucket_id in ('campaign-files','creatives') and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "read own files" on storage.objects;
create policy "read own files" on storage.objects for select to authenticated
  using (bucket_id = 'campaign-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "public creatives" on storage.objects;
create policy "public creatives" on storage.objects for select
  using (bucket_id = 'creatives');

-- ════════════════════════════════════════════════════════════════════
-- Seed prices (editable from /admin/pricing)
-- ════════════════════════════════════════════════════════════════════
insert into public.prices (channel, tier, label, description, unit_price, min_volume, sort) values
  ('sms','sim','SIM Route','Highest volume, lowest cost. Promotional blasts.',0.00150,0,1),
  ('sms','hq','HQ Route','Balanced quality and deliverability.',0.00250,0,2),
  ('sms','direct','Direct Route','Direct operator connections. Best for OTP.',0.00450,0,3),
  ('rcs','standard','RCS Starter','Up to 100K messages.',0.00350,0,1),
  ('rcs','standard','RCS Growth','100K – 500K messages.',0.00300,100000,2),
  ('rcs','standard','RCS Enterprise','500K+ messages.',0.00250,500000,3),
  ('whatsapp','official','Business API','Official Meta channel, template messages.',0.01200,0,1),
  ('whatsapp','standard','Broadcast Text','Text and media broadcast.',0.00600,0,2),
  ('whatsapp','buttons','Interactive Buttons','CTA and quick-reply buttons.',0.03800,0,3),
  ('telegram','standard','Telegram Bulk','Username-based delivery, 200K/day.',0.02000,0,1)
on conflict do nothing;

insert into public.settings (key, value) values
  ('usd_inr_rate', '88'::jsonb),
  ('min_topup_usd', '10'::jsonb),
  ('payment_details', '{"upi":"nexatelix@upi","bank":"Bank: —\nA/C: —\nIFSC: —","usdt_trc20":"T—"}'::jsonb)
on conflict (key) do nothing;

-- After your first sign-up, make yourself admin:
--   update public.profiles set role = 'admin' where email = 'you@example.com';

-- ============ PART 2 of 2 (0002_messaging.sql) ============
-- ════════════════════════════════════════════════════════════════════
-- NexaTelix — per-message messaging (run AFTER 0001_init.sql)
-- Adds: separate SMS / RCS wallets, routes & coverage, sender IDs,
-- a row per message with delivery status, and reporting functions.
-- Safe to run more than once.
-- ════════════════════════════════════════════════════════════════════

-- ── Two wallets: SMS (wallets.balance) and RCS (wallets.rcs_balance) ─
alter table public.wallets      add column if not exists rcs_balance numeric(14,5) not null default 0 check (rcs_balance >= 0);
alter table public.transactions add column if not exists wallet text not null default 'sms' check (wallet in ('sms','rcs'));
alter table public.topups       add column if not exists wallet text not null default 'sms' check (wallet in ('sms','rcs'));
alter table public.profiles     add column if not exists credit_limit numeric(14,5) not null default 0;

create or replace function public.wallet_move(
  p_user uuid, p_wallet text, p_amount numeric, p_kind text, p_reference text default null, p_note text default null
) returns numeric language plpgsql security definer set search_path = public as $$
declare v_balance numeric;
begin
  if p_wallet = 'rcs' then
    update public.wallets set rcs_balance = rcs_balance + p_amount, updated_at = now()
     where user_id = p_user returning rcs_balance into v_balance;
  else
    update public.wallets set balance = balance + p_amount, updated_at = now()
     where user_id = p_user returning balance into v_balance;
  end if;
  if v_balance is null then raise exception 'wallet not found'; end if;
  if v_balance < 0 then raise exception 'insufficient balance'; end if;
  insert into public.transactions (user_id, amount, balance_after, kind, reference, note, wallet)
  values (p_user, p_amount, v_balance, p_kind, p_reference, p_note, coalesce(p_wallet,'sms'));
  return v_balance;
end $$;
revoke all on function public.wallet_move(uuid, text, numeric, text, text, text) from public, anon, authenticated;
grant execute on function public.wallet_move(uuid, text, numeric, text, text, text) to service_role;

-- ── Routes & coverage ───────────────────────────────────────────────
create table if not exists public.routes (
  id           serial primary key,
  channel      text not null default 'sms' check (channel in ('sms','rcs')),
  name         text not null,                -- shown to clients, e.g. IN_PRIORITY
  country      text not null,                -- India
  iso          text not null,                -- IN
  dial_code    text not null,                -- 91 (digits only, longest match wins)
  price        numeric(10,5) not null check (price >= 0), -- USD per SMS part / per RCS message
  is_global    boolean not null default true, -- available to every client
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists routes_lookup_idx on public.routes(channel, dial_code) where active;

create table if not exists public.user_routes (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  route_id  int  not null references public.routes(id) on delete cascade,
  price     numeric(10,5),                     -- optional client-specific price
  primary key (user_id, route_id)
);

-- ── Sender IDs ──────────────────────────────────────────────────────
create table if not exists public.sender_ids (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  channel     text not null default 'sms' check (channel in ('sms','rcs')),
  sender      text not null,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  note        text,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (user_id, channel, sender)
);

-- ── Campaigns: allow per-message model (no single route price) ──────
alter table public.campaigns alter column tier drop not null;
alter table public.campaigns alter column unit_price drop not null;
alter table public.campaigns alter column message drop not null;

-- ── One row per message ─────────────────────────────────────────────
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  campaign_id   uuid references public.campaigns(id) on delete set null,
  channel       text not null default 'sms' check (channel in ('sms','rcs')),
  sender        text,
  recipient     text not null,
  country       text,
  iso           text,
  route_id      int references public.routes(id) on delete set null,
  body          text,
  content       jsonb,                         -- RCS card / carousel payload
  segments      int not null default 1,
  encoding      text,
  price         numeric(10,5) not null default 0,  -- what the client paid
  status        text not null default 'queued',    -- queued | submitted | accepted | delivered | failed | rejected | expired | undelivered
  error         text,
  upstream_id   text,
  client_ref    text,                          -- client_msg_id from the API
  dlr_url       text,                          -- client's callback URL (API only)
  source        text not null default 'panel', -- panel | api
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  delivered_at  timestamptz
);
create index if not exists messages_user_time_idx on public.messages(user_id, created_at desc);
create index if not exists messages_campaign_idx  on public.messages(campaign_id);
create index if not exists messages_upstream_idx  on public.messages(upstream_id);
create index if not exists messages_status_idx    on public.messages(status, created_at);

-- Record upstream ids/status for many messages in one call:
-- p = [{"id": "...", "upstream_id": "...", "status": "submitted", "error": null}, ...]
create or replace function public.messages_mark(p jsonb)
returns void language sql security definer set search_path = public as $$
  update public.messages m
     set upstream_id = coalesce(x.upstream_id, m.upstream_id),
         status      = coalesce(x.status, m.status),
         error       = x.error,
         updated_at  = now()
    from jsonb_to_recordset(p) as x(id uuid, upstream_id text, status text, error text)
   where m.id = x.id;
$$;
revoke all on function public.messages_mark(jsonb) from public, anon, authenticated;
grant execute on function public.messages_mark(jsonb) to service_role;

-- ── Reporting ───────────────────────────────────────────────────────
create or replace function public.msg_overview(p_user uuid)
returns table (sent_today bigint, sent_month bigint, delivered_all bigint)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'),
    count(*) filter (where created_at >= date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'),
    count(*) filter (where status = 'delivered')
  from public.messages where user_id = p_user;
$$;

create or replace function public.msg_campaign_stats(p_user uuid, p_from timestamptz, p_to timestamptz)
returns table (id uuid, name text, channel channel, created_at timestamptz, total bigint, delivered bigint, failed bigint, pending bigint, cost numeric)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, c.channel, c.created_at,
         count(m.id),
         count(m.id) filter (where m.status = 'delivered'),
         count(m.id) filter (where m.status in ('failed','rejected','expired','undelivered')),
         count(m.id) filter (where m.status in ('queued','submitted','accepted')),
         coalesce(sum(m.price), 0)
    from public.campaigns c
    left join public.messages m on m.campaign_id = c.id
   where c.user_id = p_user and c.created_at >= p_from and c.created_at < p_to
   group by c.id
   order by c.created_at desc;
$$;

create or replace function public.msg_country_summary(p_user uuid, p_from timestamptz, p_to timestamptz)
returns table (iso text, country text, total bigint, delivered bigint, failed bigint, pending bigint, cost numeric)
language sql stable security definer set search_path = public as $$
  select coalesce(iso, '??'), coalesce(max(country), 'Unknown'),
         count(*),
         count(*) filter (where status = 'delivered'),
         count(*) filter (where status in ('failed','rejected','expired','undelivered')),
         count(*) filter (where status in ('queued','submitted','accepted')),
         coalesce(sum(price), 0)
    from public.messages
   where (p_user is null or user_id = p_user) and created_at >= p_from and created_at < p_to
   group by iso
   order by count(*) desc;
$$;

create or replace function public.msg_monthly_usage(p_user uuid)
returns table (month date, sms_count bigint, rcs_count bigint, sms_cost numeric, rcs_cost numeric)
language sql stable security definer set search_path = public as $$
  select date_trunc('month', created_at at time zone 'Asia/Kolkata')::date,
         count(*) filter (where channel = 'sms'),
         count(*) filter (where channel = 'rcs'),
         coalesce(sum(price) filter (where channel = 'sms'), 0),
         coalesce(sum(price) filter (where channel = 'rcs'), 0)
    from public.messages
   where user_id = p_user and status not in ('rejected')
   group by 1
   order by 1 desc;
$$;

revoke all on function public.msg_overview(uuid) from public, anon;
revoke all on function public.msg_campaign_stats(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.msg_country_summary(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.msg_monthly_usage(uuid) from public, anon;
grant execute on function public.msg_overview(uuid) to service_role;
grant execute on function public.msg_campaign_stats(uuid, timestamptz, timestamptz) to service_role;
grant execute on function public.msg_country_summary(uuid, timestamptz, timestamptz) to service_role;
grant execute on function public.msg_monthly_usage(uuid) to service_role;

-- ── Row level security: clients read their own rows ─────────────────
alter table public.routes      enable row level security;
alter table public.user_routes enable row level security;
alter table public.sender_ids  enable row level security;
alter table public.messages    enable row level security;

drop policy if exists "routes visible" on public.routes;
create policy "routes visible" on public.routes for select using (
  public.is_admin() or (active and (is_global or exists (select 1 from public.user_routes ur where ur.route_id = routes.id and ur.user_id = auth.uid())))
);
drop policy if exists "own user_routes" on public.user_routes;
create policy "own user_routes" on public.user_routes for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own sender ids" on public.sender_ids;
create policy "own sender ids" on public.sender_ids for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own messages" on public.messages;
create policy "own messages" on public.messages for select using (user_id = auth.uid() or public.is_admin());

-- ── Settings used by the messaging engine ───────────────────────────
insert into public.settings (key, value) values
  ('refund_failed', 'false'::jsonb),
  ('require_approved_sms_sender', 'false'::jsonb)
on conflict (key) do nothing;

-- Example routes — edit or replace them in Admin → Routes.
insert into public.routes (channel, name, country, iso, dial_code, price, is_global)
select * from (values
  ('sms','IN_PRIORITY','India','IN','91',0.00450,true),
  ('rcs','IN_RCS','India','IN','91',0.00500,true)
) as v(channel, name, country, iso, dial_code, price, is_global)
where not exists (select 1 from public.routes);
