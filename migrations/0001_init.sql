-- Aries schema for Neon (Postgres). Run once against a fresh Neon database.
create extension if not exists pgcrypto;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  mint text not null,
  model text not null,
  chain text,
  token jsonb not null,
  reports jsonb not null,
  debate jsonb not null,
  risks jsonb not null,
  decision text not null,
  rating text,
  confidence text,
  wallet text,
  views integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists reports_wallet_created_at_idx on reports (wallet, created_at desc);

create table if not exists events (
  id bigserial primary key,
  wallet text not null,
  type text not null,
  report_id uuid references reports (id),
  created_at timestamptz not null default now()
);
create index if not exists events_wallet_type_created_at_idx on events (wallet, type, created_at desc);

create table if not exists usage (
  wallet text not null,
  day date not null,
  runs integer not null default 0,
  primary key (wallet, day)
);

create table if not exists payments (
  tx_hash text primary key,
  wallet text not null,
  amount_wei text not null,
  used_at timestamptz not null default now()
);
