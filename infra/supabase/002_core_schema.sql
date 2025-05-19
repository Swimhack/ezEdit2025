-- 002_core_schema.sql  ─────────────────────────────────────────────
-- Core tables + helpers for ezEdit.com
-- Run with: supabase db push

-- 1 ▪ Extensions ──────────────────────────────────────────────────
create extension if not exists pgcrypto;   -- used for PGP-sym encryption

-- 2 ▪ Helper settings & funcs ────────────────────────────────────
-- Store your passphrase once per DB (DO NOT commit the value)
alter database current set sym.key to 'replace-with-32-char-passphrase';

create or replace function public.encrypt_pass(raw text)
returns bytea
language sql
stable security definer
as $$
select pgp_sym_encrypt(raw, current_setting('sym.key'));
$$;

create or replace function public.decrypt_pass(enc bytea)
returns text
language sql
stable security definer
as $$
select pgp_sym_decrypt(enc, current_setting('sym.key'));
$$;

-- 3 ▪ User-owned sites (FTP creds) ────────────────────────────────
create table if not exists public.mysites (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users
                 on delete cascade,               -- clean up on user-delete
  name        text not null,
  host        text not null,
  username    text not null,
  password    bytea not null,                     -- encrypted with pgcrypto
  root_path   text default '/',
  created_at  timestamptz default now()
);

comment on column public.mysites.password  is
'PGP-sym encrypted FTP/SFTP password. Use decrypt_pass() to read.';

-- 4 ▪ File-change audit log (optional but handy) ──────────────────
create table if not exists public.file_events (
  id          bigserial primary key,
  site_id     uuid references public.mysites on delete cascade,
  path        text            not null,
  action      text            not null check (action in ('create','update','delete')),
  prev_size   integer         null,
  next_size   integer         null,
  who         uuid references auth.users,
  ts          timestamptz     default now()
);

-- 5 ▪ RLS basics (lock everyone out by default) ───────────────────
alter table public.mysites  enable row level security;
alter table public.file_events enable row level security;

create policy "Users see their own sites"
  on public.mysites
  for select using (auth.uid() = owner_id);

create policy "Users modify their own sites"
  on public.mysites
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Site owner can read their audit log"
  on public.file_events
  for select
  using (
    exists (
      select 1
      from public.mysites s
      where s.id = file_events.site_id
        and s.owner_id = auth.uid()
    )
  ); 