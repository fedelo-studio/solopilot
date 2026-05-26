-- 0003 — Invoice payments + reminder tracking
--
-- 1. New table `invoice_payments` to track individual payments per invoice
--    (record amount, date, method, notes). Cascades on invoice delete.
-- 2. New column `invoices.last_reminded_at` to track when the customer was last reminded.
-- 3. Trigger that keeps `invoices.amount_paid` and `invoices.status` consistent
--    after any insert/update/delete on `invoice_payments`.

create type payment_method as enum ('bank_transfer', 'cash', 'card', 'twint', 'other');

create table public.invoice_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  paid_on date not null default current_date,
  method payment_method not null default 'bank_transfer',
  notes text,
  created_at timestamptz not null default now()
);
create index invoice_payments_invoice_idx on public.invoice_payments (invoice_id);
create index invoice_payments_user_idx on public.invoice_payments (user_id, paid_on desc);

alter table public.invoices add column last_reminded_at timestamptz;

-- RLS
alter table public.invoice_payments enable row level security;
create policy "own rows invoice_payments" on public.invoice_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Trigger: keep invoice.amount_paid (and status) in sync.
-- When a payment is added/updated/removed, recompute amount_paid from the
-- payment rows, and flip status to 'paid' when the balance reaches the total
-- (and back to 'sent' if it falls below — only if the invoice isn't a draft).
create or replace function public.sync_invoice_payment_totals()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_invoice uuid;
  total_paid numeric(14, 2);
  invoice_total numeric(14, 2);
  invoice_status invoice_status;
begin
  target_invoice := coalesce(new.invoice_id, old.invoice_id);

  select coalesce(sum(amount), 0) into total_paid
  from public.invoice_payments
  where invoice_id = target_invoice;

  select total, status into invoice_total, invoice_status
  from public.invoices
  where id = target_invoice;

  if invoice_status not in ('draft', 'cancelled') then
    if total_paid >= invoice_total then
      update public.invoices set amount_paid = total_paid, status = 'paid', updated_at = now()
      where id = target_invoice;
    else
      update public.invoices set amount_paid = total_paid, status = 'sent', updated_at = now()
      where id = target_invoice;
    end if;
  else
    update public.invoices set amount_paid = total_paid, updated_at = now()
    where id = target_invoice;
  end if;

  return coalesce(new, old);
end;
$$;

revoke execute on function public.sync_invoice_payment_totals() from anon, authenticated, public;

create trigger invoice_payments_sync
  after insert or update or delete on public.invoice_payments
  for each row execute function public.sync_invoice_payment_totals();
