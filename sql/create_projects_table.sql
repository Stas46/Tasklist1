-- create_projects_table.sql
-- Creates projects table and RLS policies for per-user access

create table if not exists public.projects (
  id text primary key,
  name text not null,
  emoji text,
  user_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_projects_user on public.projects (user_id);

create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_set_timestamp
before update on public.projects
for each row
execute procedure public.trigger_set_timestamp();

-- enable row level security and allow owners to manage their projects
alter table public.projects enable row level security;

create policy "select own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "insert own projects" on public.projects
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

