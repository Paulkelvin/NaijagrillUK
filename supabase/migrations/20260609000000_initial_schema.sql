-- NaijaGrill lead generation and form tables

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  reservation_date date not null,
  guests integer not null check (guests between 1 and 20),
  notes text,
  status text not null default 'pending'
);

create table if not exists public.event_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  event_type text,
  event_date date,
  guests integer check (guests is null or guests between 1 and 200),
  message text,
  status text not null default 'pending'
);

create table if not exists public.newsletter_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  source text,
  offer_claimed boolean not null default true
);

create unique index if not exists newsletter_leads_email_idx on public.newsletter_leads (email);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'new'
);

alter table public.reservations enable row level security;
alter table public.event_inquiries enable row level security;
alter table public.newsletter_leads enable row level security;
alter table public.contact_messages enable row level security;

create policy "Allow anonymous insert on reservations"
  on public.reservations for insert to anon, authenticated
  with check (true);

create policy "Allow anonymous insert on event_inquiries"
  on public.event_inquiries for insert to anon, authenticated
  with check (true);

create policy "Allow anonymous insert on newsletter_leads"
  on public.newsletter_leads for insert to anon, authenticated
  with check (true);

create policy "Allow anonymous insert on contact_messages"
  on public.contact_messages for insert to anon, authenticated
  with check (true);
