-- User profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Team collaboration (site members) table
create table if not exists public.site_members (
  site_id uuid references public.mysites(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'editor',
  added_at timestamptz default now(),
  primary key (site_id, user_id)
); 