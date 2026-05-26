-- 0004 — Devis (quotes)
--
-- A quote is essentially a pre-invoice. Once a client accepts it, we can
-- promote it into a real invoice (and optionally create a project).
-- The schema is intentionally close to invoices so the UI can share patterns.

create type quote_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired');

create table public.quotes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  deal_id uuid references public.deals (id) on delete set null,
  number text not null,
  status quote_status not null default 'draft',
  issued_at date not null default current_date,
  valid_until date,
  currency text not null default 'CHF',
  subtotal numeric(14, 2) not null default 0,
  vat_amount numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  notes text,
  converted_invoice_id uuid references public.invoices (id) on delete set null,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, number)
);
create index quotes_user_idx on public.quotes (user_id);
create index quotes_status_idx on public.quotes (user_id, status);

create table public.quote_lines (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  description text not null,
  quantity numeric(14, 3) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  vat_rate numeric(5, 2) not null default 0,
  total numeric(14, 2) generated always as (quantity * unit_price) stored
);
create index quote_lines_quote_idx on public.quote_lines (quote_id);

-- RLS
alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;

create policy "own rows quotes" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows quote_lines" on public.quote_lines
  for all
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_lines.quote_id and q.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_lines.quote_id and q.user_id = auth.uid()
    )
  );
