-- 0006 — People, Tasks, Time tracking
--
-- Adds a lightweight "people" roster (NOT tied to auth.users beyond the owning
-- account — no logins, no invites, no roles: just name + rates + capacity so
-- time entries and tasks can be attributed to a person), plus tasks and time
-- entries scoped to projects. Extends `projects` with billing/hour-budget
-- fields. Time entries carry a nullable `invoice_id` so they can be rolled up
-- into an invoice from tracked time (mirrors the quotes → invoices pattern),
-- and can't accidentally be billed twice.

create type project_billing_type as enum ('hourly', 'fixed_price', 'retainer', 'non_billable');
create type task_status as enum ('todo', 'in_progress', 'review', 'blocked', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');

-- -------------------------------------------------------------------------
-- PROJECTS — extend with billing/hour-budget fields
-- -------------------------------------------------------------------------
alter table public.projects
  add column description text,
  add column billing_type project_billing_type not null default 'hourly',
  add column hourly_rate numeric(10, 2),
  add column budget_hours numeric(8, 2),
  add column tags text[];

-- -------------------------------------------------------------------------
-- PEOPLE (lightweight roster)
-- -------------------------------------------------------------------------
create table public.people (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text,
  cost_rate numeric(10, 2) not null default 0,
  billable_rate numeric(10, 2) not null default 0,
  weekly_capacity_hours numeric(5, 2) not null default 40,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index people_user_idx on public.people (user_id);

-- -------------------------------------------------------------------------
-- TASKS
-- -------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  assignee_id uuid references public.people (id) on delete set null,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  category text,
  billable boolean not null default true,
  estimated_hours numeric(8, 2),
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_user_idx on public.tasks (user_id);
create index tasks_project_idx on public.tasks (project_id);
create index tasks_status_idx on public.tasks (user_id, status);
create index tasks_assignee_idx on public.tasks (assignee_id);

-- -------------------------------------------------------------------------
-- TIME ENTRIES
-- -------------------------------------------------------------------------
create table public.time_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  person_id uuid not null references public.people (id) on delete restrict,
  date date not null default current_date,
  start_time time,
  duration_minutes integer not null check (duration_minutes > 0),
  description text,
  billable boolean not null default true,
  invoice_id uuid references public.invoices (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index time_entries_user_idx on public.time_entries (user_id);
create index time_entries_project_idx on public.time_entries (project_id);
create index time_entries_task_idx on public.time_entries (task_id);
create index time_entries_person_idx on public.time_entries (person_id);
create index time_entries_date_idx on public.time_entries (user_id, date desc);
-- Fast lookup for "unbilled entries on this project" (invoice-from-time flow).
create index time_entries_unbilled_idx on public.time_entries (project_id) where invoice_id is null;

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY — own rows, matching the 0001 majority naming
-- convention ("own rows — X"), not 0004's drifted no-dash variant.
-- -------------------------------------------------------------------------
alter table public.people enable row level security;
alter table public.tasks enable row level security;
alter table public.time_entries enable row level security;

create policy "own rows — people" on public.people
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — time_entries" on public.time_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- No explicit grants needed: 0005_grant_authenticated_dml.sql's
-- `alter default privileges` covers new tables in this schema automatically.
