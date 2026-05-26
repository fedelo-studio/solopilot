-- =========================================================================
-- SoloPilot — Initial schema (vague 2)
--
-- Run this migration once after creating your Supabase project.
-- Every table is owned by the authenticated user via `user_id = auth.uid()`.
-- All access is gated by Row Level Security policies.
--
-- Apply via Supabase SQL editor, or with the Supabase CLI:
--   supabase db push
-- =========================================================================

set check_function_bodies = off;
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------------
-- ENUMS
-- -------------------------------------------------------------------------
create type client_kind as enum ('company', 'individual');
create type client_status as enum ('prospect', 'active', 'archived');
create type deal_stage as enum ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
create type project_status as enum ('active', 'paused', 'done', 'archived');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type account_kind as enum ('bank', 'cash', 'savings');
create type transaction_kind as enum ('in', 'out');
create type expense_link_type as enum ('deal', 'client', 'project', 'none');
create type alert_severity as enum ('info', 'warning', 'danger');
create type alert_type as enum (
  'invoice_overdue',
  'expense_uncategorized',
  'budget_near_limit',
  'budget_exceeded',
  'deal_stale',
  'cash_low'
);

-- -------------------------------------------------------------------------
-- COMPANY SETTINGS (1 row per user — workspace settings)
-- -------------------------------------------------------------------------
create table public.company_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  company_name text not null,
  owner_name text not null,
  default_currency text not null default 'CHF',
  default_vat_rate numeric(5, 2) not null default 8.1,
  reserve_percent numeric(5, 2) not null default 25,
  iban text,
  invoice_footer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- CLIENTS & CONTACTS
-- -------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind client_kind not null default 'company',
  status client_status not null default 'prospect',
  email text,
  phone text,
  address text,
  vat_number text,
  default_currency text not null default 'CHF',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_user_idx on public.clients (user_id);

create table public.contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  first_name text not null,
  last_name text not null,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_user_idx on public.contacts (user_id);
create index contacts_client_idx on public.contacts (client_id);

-- -------------------------------------------------------------------------
-- DEALS
-- -------------------------------------------------------------------------
create table public.deals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  title text not null,
  stage deal_stage not null default 'lead',
  estimated_amount numeric(14, 2) not null default 0,
  currency text not null default 'CHF',
  probability smallint not null default 10 check (probability between 0 and 100),
  expected_signature_date date,
  expected_payment_date date,
  source text,
  notes text,
  won_at timestamptz,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index deals_user_idx on public.deals (user_id);
create index deals_stage_idx on public.deals (user_id, stage);

-- -------------------------------------------------------------------------
-- PROJECTS
-- -------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  deal_id uuid references public.deals (id) on delete set null,
  name text not null,
  status project_status not null default 'active',
  sold_budget numeric(14, 2) not null default 0,
  internal_budget numeric(14, 2) not null default 0,
  currency text not null default 'CHF',
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_idx on public.projects (user_id);
create index projects_client_idx on public.projects (client_id);

-- -------------------------------------------------------------------------
-- INVOICES & INVOICE LINES
-- -------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  project_id uuid references public.projects (id) on delete set null,
  number text not null,
  status invoice_status not null default 'draft',
  issued_at date not null default current_date,
  due_date date not null,
  currency text not null default 'CHF',
  subtotal numeric(14, 2) not null default 0,
  vat_amount numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  amount_paid numeric(14, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, number)
);
create index invoices_user_idx on public.invoices (user_id);
create index invoices_status_idx on public.invoices (user_id, status);

create table public.invoice_lines (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity numeric(14, 3) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  vat_rate numeric(5, 2) not null default 0,
  total numeric(14, 2) generated always as (quantity * unit_price) stored
);
create index invoice_lines_invoice_idx on public.invoice_lines (invoice_id);

-- -------------------------------------------------------------------------
-- EXPENSE CATEGORIES & EXPENSES
-- -------------------------------------------------------------------------
create table public.expense_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#6b7280',
  created_at timestamptz not null default now()
);
create index expense_categories_user_idx on public.expense_categories (user_id);

create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  vendor text not null,
  description text,
  amount numeric(14, 2) not null,
  currency text not null default 'CHF',
  category_id uuid references public.expense_categories (id) on delete set null,
  link_type expense_link_type not null default 'none',
  link_id uuid,
  billable boolean not null default false,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expenses_user_idx on public.expenses (user_id);
create index expenses_date_idx on public.expenses (user_id, date desc);
create index expenses_link_idx on public.expenses (link_type, link_id) where link_type <> 'none';

-- -------------------------------------------------------------------------
-- BUDGETS
-- -------------------------------------------------------------------------
create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_month date not null,
  category_id uuid not null references public.expense_categories (id) on delete cascade,
  planned_amount numeric(14, 2) not null default 0,
  currency text not null default 'CHF',
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, period_month, category_id)
);
create index budgets_user_idx on public.budgets (user_id);

-- -------------------------------------------------------------------------
-- ACCOUNTS & TRANSACTIONS
-- -------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind account_kind not null default 'bank',
  initial_balance numeric(14, 2) not null default 0,
  currency text not null default 'CHF',
  created_at timestamptz not null default now()
);
create index accounts_user_idx on public.accounts (user_id);

create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  date date not null default current_date,
  amount numeric(14, 2) not null check (amount >= 0),
  label text not null,
  kind transaction_kind not null,
  linked_invoice_id uuid references public.invoices (id) on delete set null,
  linked_expense_id uuid references public.expenses (id) on delete set null,
  created_at timestamptz not null default now()
);
create index transactions_user_idx on public.transactions (user_id);
create index transactions_account_idx on public.transactions (account_id, date desc);

-- -------------------------------------------------------------------------
-- ALERTS
-- -------------------------------------------------------------------------
create table public.alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type alert_type not null,
  severity alert_severity not null default 'info',
  title text not null,
  body text,
  related_type text,
  related_id uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index alerts_user_idx on public.alerts (user_id) where resolved_at is null;

-- =========================================================================
-- ROW LEVEL SECURITY
-- Every table: user can only see/modify their own rows.
-- =========================================================================
alter table public.company_settings enable row level security;
alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.projects enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.alerts enable row level security;

-- A reusable policy pattern: read + write your own rows.
create policy "own rows — company_settings" on public.company_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — clients" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — contacts" on public.contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — deals" on public.deals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — invoices" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Invoice lines are scoped through their parent invoice.
create policy "own rows — invoice_lines" on public.invoice_lines
  for all
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_lines.invoice_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_lines.invoice_id and i.user_id = auth.uid()
    )
  );

create policy "own rows — expense_categories" on public.expense_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — budgets" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows — alerts" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================================
-- TRIGGER — bootstrap workspace settings + default categories on signup
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.company_settings (user_id, company_name, owner_name)
  values (new.id, 'Mon studio', coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));

  insert into public.expense_categories (user_id, name, color) values
    (new.id, 'Logiciels & abonnements', '#3b82f6'),
    (new.id, 'Sous-traitance', '#a855f7'),
    (new.id, 'Marketing & prospection', '#ff4a1c'),
    (new.id, 'Bureau & matériel', '#10b981'),
    (new.id, 'Déplacements & repas', '#f59e0b'),
    (new.id, 'Frais bancaires & comptables', '#6b7280');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
