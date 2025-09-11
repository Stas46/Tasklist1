-- SQL migration: create tasks table and Row Level Security policies
-- Run this in Supabase Dashboard -> SQL Editor -> New query

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  quadrant text check ( quadrant in ('Q1','Q2','Q3','Q4') ) default 'Q4',
  project_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at on public.tasks;
create trigger trg_set_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

create index if not exists idx_tasks_user_id on public.tasks (user_id);

alter table public.tasks enable row level security;

create policy "read own" on public.tasks
  for select using ( auth.uid() = user_id );

create policy "insert own" on public.tasks
  for insert with check ( auth.uid() = user_id );

create policy "update own" on public.tasks
  for update using ( auth.uid() = user_id );

create policy "delete own" on public.tasks
  for delete using ( auth.uid() = user_id );
