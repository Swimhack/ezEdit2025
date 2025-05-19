create extension if not exists pgcrypto;

create table public.mysites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users,
  name text not null,
  host text not null,
  username text not null,
  password text not null,         -- store with pgp_sym_encrypt
  root_path text default '/',
  created_at timestamptz default now()
); 