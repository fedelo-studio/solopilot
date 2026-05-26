# CHANGELOG

Releases are dated, semver-compatible. Pre-1.0 means the data model can still
change without warning.

## [0.7.0] — 2026-05-23 — Quotes, reports, command palette, brand identity

### New product surfaces
- **Devis (quotes)** — full module: list, create, detail, PDF, convert-to-invoice action, status transitions (draft → sent → accepted/declined/expired).
- **Rapports** — `/rapports` with monthly revenue bars, top-5 clients table, expense breakdown donut, project margins. 12-month period.
- **Alertes** — `/alertes` full page (was only a dashboard widget). Tabs by severity, recompute button, explanation of every alert rule.
- **Aide** — `/aide` with FAQ, keyboard shortcuts overlay.
- **Comptes** — `/comptes` with imported transaction history.
- **Onboarding wizard** — `/bienvenue`, 3 steps: company → first account → first client. Auto-redirect on first login.
- **Edit screens** — `/clients/[id]/edit`, `/projets/nouveau`, plus convert/edit flows on quotes and invoices.

### Brand identity
- Replaced Fedelo orange (`#ff4a1c`) with the SoloPilot green (`#00EB89`) as the brand accent.
- Dark mode surfaces re-tuned to the official `#121619` / `#1E2930` anthracites.
- New `BrandMark` + `BrandWordmark` components. The mark inlines the Figma SVG paths verbatim — compass-lens + signal wave.
- Loading screens, 404, error boundary all use the brand splash.

### Modern reactive feel
- Global Cmd+K / Ctrl+K command palette (clients, deals, projects, invoices, quotes — fuzzy match via `cmdk`).
- "g d / g p / g f / g r / …" GitHub-style two-key navigation shortcuts.
- `?` opens the shortcuts overlay from anywhere.
- Live pulse dot on the dashboard hero ("Vue d'ensemble · live").
- Fade-in animations on metric cards. Skeleton shimmer utility. Spin-mark loader.
- `prefers-reduced-motion` honoured everywhere.

### Architecture
- New `_helpers.ts` for actions: `getAuthedSession()`, `parseInput()`, `parseFormData()`, `revalidateMany()`, `firstError()`. Each action shrinks to ~30 lines of business logic.
- New `lib/finance/lines.ts` shared between invoice/quote editors and server-side validation.
- New `lib/data/_sequences.ts` for auto-incrementing invoice/quote numbers across the year.
- Action results are now `ActionResult<T>` generic so callers get type-safe payloads.
- `tsconfig.json` excludes `supabase/functions` (Deno) and `tests/e2e` (Playwright runtime).

### Database
- Migrations `0002`, `0003`, `0004` saved locally — match what was applied to `solopilot.supabase.co`.
- Trigger `sync_invoice_payment_totals` keeps `invoices.amount_paid` and `invoices.status` consistent automatically.
- Quote conversion stamps `quotes.converted_invoice_id` so the link is traceable both ways.

### Mobile
- Hamburger menu via Sheet on `< md` viewports.
- Topbar responsive: search trigger shrinks, user info collapses, "Nouvelle facture" hides on small screens.

## [0.6.0] — 2026-05-23 (earlier) — Invoice operations + onboarding

- `invoice_payments` table + trigger.
- `/factures/[id]` detail page with status, payments timeline, actions sidebar.
- "Enregistrer un paiement" dialog with payment methods (virement / cash / carte / TWINT / autre).
- `setInvoiceStatus`, `sendReminder` Server Actions.
- Edge function `invoice-reminders` scaffold + documentation (`pg_cron` or Vercel Cron schedule).

## [0.5.0] — 2026-05-23 (earlier) — Intelligence

- Alert engine (factures en retard, dépenses non catégorisées, budgets dépassés, deals dormants, trésorerie basse).
- Cashflow scenarios — pessimiste / réaliste / optimiste.
- Paramètres entreprise — TVA par défaut, % de réserve, IBAN, footer facture.
- PDF facture imprimable.
- Import CSV transactions bancaires.

## [0.4.0] — 2026-05-23 (earlier) — Production tooling

- Vitest unit tests for `lib/finance/*` (deals, invoices, budget, cashflow, csv).
- Playwright e2e smoke tests + flow tests.
- GitHub Actions CI (`typecheck` + `lint` + unit tests + e2e).
- Vercel config (région Frankfurt, security headers).

## [0.3.0] — 2026-05-23 (earlier) — CRUD + data layer

- Server Actions Zod-validated.
- Creation dialogs (Client, Deal, Dépense).
- "Nouvelle facture" full-page editor with line items + auto VAT.
- Detail pages `/clients/[id]`, `/projets/[id]`.
- Data layer abstraction `lib/data/` — pages don't know mock from live.
- Seed script `pnpm seed <email>`.

## [0.2.0] — 2026-05-23 (earlier) — Supabase

- Connected to project `solopilot` (Frankfurt, Postgres 17).
- Initial schema migration applied — 13 tables with RLS.
- Auth trigger creates default `company_settings` + 6 expense categories on signup.

## [0.1.0] — 2026-05-22 — MVP foundation

- Next.js 15 + TypeScript + Tailwind + shadcn/ui scaffold.
- 7 pages with mock data: Dashboard, Pipeline (kanban), Clients, Projets, Factures, Dépenses, Budgets, Cashflow.
- Domain types, finance utilities (weighted deals, cashflow projection, budget usage).
- Premium sidebar / topbar layout, light + dark themes.
