# `invoice-reminders` — Edge function

Tourne tous les jours, parcourt les factures en retard, marque `last_reminded_at`,
crée une alerte `invoice_overdue`, et (à compléter) envoie un email de relance.

## Déploiement

```bash
# 1. Installer le CLI Supabase si pas déjà fait
brew install supabase/tap/supabase

# 2. Login + link au projet
supabase login
supabase link --project-ref einqhjrrxtjvrqpcmxkl

# 3. Déployer
supabase functions deploy invoice-reminders --no-verify-jwt
```

## Secrets

Set ces secrets via le dashboard Supabase (Edge Functions → invoice-reminders → Secrets) :

| Nom | Description |
|---|---|
| `CRON_TOKEN` | Bearer token requis pour invoquer la fonction (sinon 401). |
| `RESEND_API_KEY` | (Optionnel) Pour l'intégration email Resend. |

## Planification

### Option A — `pg_cron` (recommandée, tout dans Supabase)

```sql
-- À exécuter une seule fois dans le SQL editor du projet.
-- Active pg_cron + pg_net si pas déjà fait :
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Stocke le token dans une variable persistante.
alter database postgres set app.cron_token = 'TON_TOKEN_ICI';

-- Planifie tous les jours à 07h UTC (= 09h Europe/Zurich en heure d'hiver).
select cron.schedule(
  'invoice-reminders-daily',
  '0 7 * * *',
  $$
    select net.http_post(
      url := 'https://einqhjrrxtjvrqpcmxkl.supabase.co/functions/v1/invoice-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.cron_token')
      )
    );
  $$
);
```

### Option B — Vercel Cron

Ajouter dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Puis créer un endpoint `/api/cron/reminders` qui POST sur l'edge function avec le bearer token.

## Tester localement

```bash
supabase functions serve invoice-reminders --env-file ./supabase/.env.local
curl -X POST http://localhost:54321/functions/v1/invoice-reminders \
  -H "Authorization: Bearer TON_TOKEN"
```

## Intégration email

La fonction laisse un placeholder pour l'envoi d'email. Pour activer avec **Resend** :

1. Crée un compte sur resend.com + vérifie le domaine `fedelo.studio`.
2. Ajoute `RESEND_API_KEY` aux secrets de la fonction.
3. Décommente le bloc `fetch("https://api.resend.com/emails", ...)` dans `index.ts`.
4. Redéploie : `supabase functions deploy invoice-reminders --no-verify-jwt`.
