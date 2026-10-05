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
