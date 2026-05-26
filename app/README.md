# SoloPilot — app (Next.js)

Application Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase.

## Démarrage rapide

```bash
cd app
pnpm install            # ou npm install
cp .env.local.example .env.local
pnpm dev                # http://localhost:3000
```

Tant que `.env.local` est vide, l'app tourne avec les **données fictives** (Studio Lumen, Helvet & Cie, etc.). Tu peux explorer tous les écrans sans Supabase.

## Brancher Supabase (vague 2)

1. Crée un projet Supabase (https://supabase.com).
2. Copie l'URL et l'anon key dans `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. Applique la migration SQL : ouvre le SQL editor Supabase, colle `supabase/migrations/0001_init.sql`, lance.
4. Active le provider Email (magic link) dans Authentication → Providers.
5. Redémarre `pnpm dev` et ouvre `/login`.

À la première connexion, un trigger Supabase crée automatiquement :
- une ligne `company_settings` pour le user
- 6 catégories de dépenses par défaut

## Déploiement

L'application est déployée sur https://solopilot.fedelo.studio (mêmes credentials que fedelo.studio).

Pour pousser une nouvelle version :

```bash
git push origin main
```

(Le hosting reconstruit automatiquement depuis le repo https://github.com/fedelo-studio/solopilot.)

Configurer côté hosting les variables d'environnement :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Stack

- **Next.js 15** — App Router, Server Components par défaut
- **TypeScript** strict
- **Tailwind 3** + tokens HSL pour theming light/dark
- **shadcn/ui** — composants copiés localement dans `src/components/ui/`
- **Supabase** — Postgres + Auth (magic link) + RLS
- **Recharts** — graphiques cashflow
- **date-fns** — manipulation des dates en français
- **lucide-react** — icônes

## Organisation du code

```
src/
├── app/
│   ├── (auth)/login/            ← page d'authentification
│   ├── (app)/                   ← shell connecté (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── pipeline/
│   │   ├── clients/
│   │   ├── projets/
│   │   ├── factures/
│   │   ├── depenses/
│   │   ├── budgets/
│   │   └── cashflow/
│   ├── auth/callback/           ← Supabase OAuth callback
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                      ← shadcn primitives
│   ├── layout/                  ← sidebar, topbar, theme provider/toggle
│   ├── shared/                  ← Money, MetricCard, ConfidencePill, etc.
│   ├── pipeline/                ← DealCard
│   └── cashflow/                ← CashflowChart
├── lib/
│   ├── finance/                 ← calculs purs (testables, sans React)
│   │   ├── cashflow.ts
│   │   ├── deals.ts
│   │   ├── invoices.ts
│   │   ├── budget.ts
│   │   └── format.ts
│   ├── mock/                    ← données fictives (vague 1)
│   ├── supabase/                ← clients + middleware
│   └── utils.ts
├── types/
│   └── domain.ts                ← types métier (single source of truth)
└── middleware.ts                ← protection des routes
```

## Invariants produit

À ne jamais oublier :

1. **Confirmé · probable · hypothétique** — les trois tiers de confiance se retrouvent partout (cashflow, dashboard, alertes). Un montant n'est jamais juste un nombre, il a une catégorie de confiance.
2. **Deals pondérés** — la valeur affichée pour un deal ouvert est toujours `montant × probabilité / 100`.
3. **Dépenses pré-signature** — une dépense peut être liée à un *prospect* avant qu'il devienne client.
4. **CHF par défaut** — toutes les devises sont stockées, mais l'UI parle CHF.
5. **Pas de règles fiscales en dur** — TVA, AVS, impôts restent configurables et marqués comme hypothèses produit.

## Vérification

```bash
pnpm typecheck     # vérifie les types TS
pnpm lint          # vérifie le code (ESLint)
pnpm build         # build de production
```

## Scripts disponibles

| Script | Description |
|---|---|
| `pnpm dev` | Serveur de dev (hot reload) |
| `pnpm build` | Build de production |
| `pnpm start` | Lance le build de production |
| `pnpm typecheck` | Type-check TS |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier sur `src/**` |

## Vague 2 (livrée 2026-05-23)

- Couche d'abstraction de données dans `src/lib/data/` : les pages ne touchent plus jamais aux fixtures, elles appellent `getClients()`, `getDeals()`, etc. La couche route en interne vers les mocks ou Supabase selon `dataMode`.
- Server Actions Zod-validées : `createClient`, `createDeal`, `createExpense`, `createInvoice` (dans `src/app/actions/`).
- Dialogs de création : Client, Deal, Dépense — ouverts depuis le bouton "Nouveau X" de chaque page.
- Page complète `/factures/nouvelle` avec lignes dynamiques, calcul TVA, numéro auto.
- Pages détail `/clients/[id]` et `/projets/[id]` avec KPIs et listes liées.
- Script `pnpm seed <email>` qui peuple un compte test avec toutes les fixtures.

### Lancer le seed

```bash
# Prérequis : avoir un compte créé via /login (Supabase auth) ET .env.local rempli (incl. SUPABASE_SERVICE_ROLE_KEY)
pnpm seed studio@fedelo.io
```

## Vague 3 (livrée 2026-05-23)

- **Moteur d'alertes** dans `src/lib/finance/alerts.ts` (pur) + Server Action `recomputeAlerts` qui compare l'état actuel à la table `alerts` et insère/résout. Bouton de rafraîchissement sur le dashboard.
- **Scénarios cashflow** (pessimiste / réaliste / optimiste) — toggle sur `/cashflow`, recalcul client-side à partir des entries projetées côté serveur.
- **Paramètres entreprise** sur `/parametres` — nom, propriétaire, TVA par défaut, % de réserve, IBAN, pied de page facture. Upsert via Server Action.
- **PDF facture** sur `/factures/[id]/pdf` — HTML A4 imprimable, auto-lance `window.print()`. Aucune dépendance PDF lourde.
- **Import CSV transactions** sur `/comptes/import` — parser maison (séparateurs `,` / `;`, guillemets, BOM, dates dd.mm.yyyy / yyyy-MM-dd, montants au format suisse `1'250.50`).

## Vague 4 (livrée 2026-05-23)

- **Tests unitaires Vitest** sur `src/lib/finance/` — 5 fichiers `.test.ts`, ~60 assertions sur deals, invoices, budgets, cashflow + scénarios, CSV parser.
- **Tests e2e Playwright** — smoke sur les 10 pages + 3 flows critiques.
- **CI GitHub Actions** (`/.github/workflows/ci.yml`) — typecheck + lint + unit tests sur les PR, e2e après build.
- **Vercel config** dans `vercel.json` — région Frankfurt (`fra1`), headers de sécurité (X-Frame-Options, etc.).

## Tests

```bash
pnpm test          # vitest unit tests
pnpm test:watch    # mode watch
pnpm test:e2e      # playwright (lance le dev server automatiquement)
```

## Déploiement Vercel

1. Connecte le repo `fedelo-studio/solopilot` à Vercel.
2. Configure le **root directory** sur `app/`.
3. Variables d'environnement de production :
   - `NEXT_PUBLIC_SUPABASE_URL=https://einqhjrrxtjvrqpcmxkl.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=…` (anon JWT — voir `.env.local`)
   - `NEXT_PUBLIC_DATA_MODE=live`
4. Domaine `solopilot.fedelo.studio` dans Domains (avec mêmes credentials que fedelo.studio).
5. Côté Supabase, ajoute l'URL Vercel + ton domaine dans **Authentication → URL Configuration → Site URL & Redirect URLs**.

## Supabase

Projet `solopilot` (ref `einqhjrrxtjvrqpcmxkl`), région Frankfurt, Postgres 17.

- URL : https://einqhjrrxtjvrqpcmxkl.supabase.co
- Schéma : `supabase/migrations/0001_init.sql` + `0002_revoke_handle_new_user_execute.sql` — déjà appliqué.
- Types TS générés dans `src/types/database.types.ts` (regénérer avec `pnpm supabase:types`).

## Vague 5 (livrée 2026-05-23)

- **Migration `0003_invoice_payments_and_reminders`** appliquée : table `invoice_payments` (montant + date + méthode + notes par paiement), colonne `last_reminded_at` sur `invoices`, trigger `sync_invoice_payment_totals` qui met à jour `amount_paid` et `status` automatiquement.
- **Page détail facture** `/factures/[id]` — entête avec statut live, lignes, table des paiements, panneau d'actions latéral.
- **Paiements partiels** — dialog "Enregistrer un paiement" (montant, date, méthode parmi virement/cash/carte/TWINT/autre, notes). Le trigger SQL met à jour le solde et bascule en `paid` automatiquement quand le total est atteint.
- **Transitions de statut** — boutons "Marquer comme envoyée", "Forcer payé", "Annuler la facture", "Enregistrer une relance".
- **Onboarding wizard** `/bienvenue` — wizard 3 étapes (entreprise, premier compte, premier client). Détecté automatiquement au premier login (si `company_settings.company_name === 'Mon studio'`).
- **Edge function `invoice-reminders`** — code Deno prêt à déployer (`supabase functions deploy invoice-reminders --no-verify-jwt`), planifiable via `pg_cron` (instructions dans `supabase/functions/invoice-reminders/README.md`). Trouve les factures `sent` en retard non relancées depuis 7 jours, stamp la date, crée une alerte, et offre un point d'intégration email (Resend/Postmark).
- **Tests V5** — `payments.test.ts` couvrant paiements partiels, dépassements, transitions de statut.

## Prochaines pistes (vague 6+)

- Intégration Resend pour l'envoi réel des emails de relance
- Connexion bancaire automatique (Plaid / TrueLayer / Klarna Open Banking)
- Mode multi-utilisateur / équipe
- App mobile (React Native) — partage du modèle de domaine
- Génération automatique d'opportunités via IA depuis les emails
