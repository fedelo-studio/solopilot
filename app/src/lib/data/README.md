# Data layer

This folder is the **only** place that pages and server actions should import data from. It hides the difference between mock fixtures and Supabase queries.

```
Page (Server Component)
   ↓
src/lib/data/clients.ts   ← getClients(), getClientById(), ...
   ↓
if dataMode === 'mock'    → returns mock fixtures
if dataMode === 'live'    → queries Supabase via createServerSupabase()
```

## Why

- Page code stays clean and doesn't branch on env.
- Switching modes is a one-line env change.
- Supabase row-shape (`snake_case`) is mapped to domain types (`camelCase`) in **one** place per entity.
- Cashflow / dashboard calculations stay identical because they always receive domain-typed data.

## Adding a new query

1. Add the function in the right `lib/data/*.ts` module.
2. Write the mock branch first (filter the fixtures).
3. Write the Supabase branch using the server client.
4. Both branches must return the same domain type.

## Mapping conventions

Every Supabase row goes through a `rowToX` mapper (see e.g. `clients.ts`). Mappers are pure, no I/O, dead simple — the only thing that matters is that snake_case becomes camelCase and dates stay ISO strings.
