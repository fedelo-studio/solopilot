# SoloPilot

> **Le cockpit financier des indépendants qui vendent des projets.**
> De la prospection à la trésorerie, sans perdre le fil.

SoloPilot est une application SaaS qui réunit CRM, devis, facturation, dépenses, budgets et projection de trésorerie dans un seul cockpit. Conçu pour les freelances suisses, studios créatifs et petites agences qui pilotent leur activité au cash et non à la compta.

- **Repo** — https://github.com/fedelo-studio/solopilot
- **Production** — https://solopilot.fedelo.studio
- **Stack** — Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase · Recharts · cmdk
- **Identité visuelle** — Fedelo Studio design system, palette adaptée (vert `#00EB89` + anthracite `#121619`)

## Lancer la démo en local

```bash
cd /Users/Felipe/Documents/Claude/Projects/SoloPilot
./demo.sh
```

Le script installe les dépendances au premier run, force le mode mock (aucun Supabase requis), et ouvre `http://localhost:3000` dans ton navigateur. 6 clients, 12 deals, 5 devis, 10 factures, 25 dépenses fictives sont disponibles immédiatement.

## Structure du dépôt

```
SoloPilot/
├── README.md                 (ce fichier)
├── CHANGELOG.md
├── demo.sh                   (démo en un clic — détecte pnpm/npm)
├── .github/workflows/ci.yml  (typecheck + lint + tests + e2e)
└── app/                      (le projet Next.js)
    ├── src/
    │   ├── app/                  (routes — voir ci-dessous)
    │   ├── components/           (ui, layout, shared, reports, …)
    │   ├── lib/
    │   │   ├── finance/          (calculs purs — testés)
    │   │   ├── data/             (couche mock|supabase)
    │   │   ├── mock/             (fixtures)
    │   │   └── supabase/         (clients SSR)
    │   ├── types/                (domain + database.types.ts)
    │   └── middleware.ts
    ├── supabase/
    │   ├── migrations/           (0001 → 0004 — appliquées)
    │   └── functions/
    │       └── invoice-reminders/   (edge function Deno)
    ├── scripts/seed.ts           (peuple un compte Supabase)
    ├── tests/e2e/                (Playwright)
    └── vercel.json
```

## Modules livrés

| Surface | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | 4 KPIs · projection 90 j · alertes · top deals · factures à surveiller |
| Cashflow | `/cashflow` | Scénarios pessimiste/réaliste/optimiste avec graph 90 j |
| Rapports | `/rapports` | CA par mois, top 5 clients, dépenses par catégorie, marges projet |
| Pipeline | `/pipeline` | Kanban par stage avec totaux pondérés |
| Devis | `/devis`, `/devis/[id]`, `/devis/nouveau`, `/devis/[id]/pdf` | Liste, détail, création, conversion → facture, PDF |
| Clients | `/clients`, `/clients/[id]`, `/clients/[id]/edit` | Liste, fiche détail (CA, deals, projets), édition |
| Projets | `/projets`, `/projets/[id]`, `/projets/nouveau` | Liste + détail (budget vendu / interne / dépenses liées / marge) |
| Factures | `/factures`, `/factures/[id]`, `/factures/nouvelle`, `/factures/[id]/pdf` | Liste, détail avec timeline paiements, création, PDF |
| Dépenses | `/depenses` | Liste avec catégorie, lien polymorphe (deal/client/projet), refacturable |
| Budgets | `/budgets` | Suivi mensuel avec seuils 60/80/100% |
| Comptes | `/comptes`, `/comptes/import` | Comptes bancaires + import CSV |
| Alertes | `/alertes` | Toutes les alertes par sévérité + règles |
| Paramètres | `/parametres` | Entreprise, TVA, IBAN, footer facture |
| Aide | `/aide` | FAQ + raccourcis clavier |
| Onboarding | `/bienvenue` | Wizard 3 étapes au premier login |
| Auth | `/login` | Magic link Supabase |

## Raccourcis clavier

- `⌘ K` / `Ctrl K` — Recherche globale (fuzzy : clients, deals, projets, factures, devis)
- `?` — Page d'aide & raccourcis
- `G D` — Dashboard · `G C` — Cashflow · `G P` — Pipeline · `G F` — Factures · `G R` — Rapports · `G A` — Alertes · `G S` — Paramètres

## Invariants produit

Ne jamais oublier :

1. **Confirmé · probable · hypothétique** se distinguent partout. Un montant a toujours une catégorie de confiance.
2. **Valeur pondérée** d'un deal = `montant × probabilité / 100`. Les "gagné" comptent à 100%, les "perdu" à 0%.
3. **Dépense pré-signature** — une dépense peut être liée à un *prospect* avant qu'il devienne client. Impacte la marge potentielle du deal.
4. **CHF par défaut**. Les autres devises sont stockées mais l'UI parle CHF.
5. **Pas de règle fiscale en dur.** TVA, AVS, impôts restent configurables et marqués comme hypothèses produit — à valider avec un comptable.

## Supabase — projet connecté

- Projet : `solopilot` (ref `einqhjrrxtjvrqpcmxkl`), région Frankfurt, Postgres 17
- URL : https://einqhjrrxtjvrqpcmxkl.supabase.co
- Migrations 0001 → 0004 appliquées : 16 tables, RLS partout, triggers `handle_new_user` + `sync_invoice_payment_totals`
- Types TypeScript dans `app/src/types/database.types.ts` — regénérer avec `pnpm supabase:types`

Pour peupler ton compte avec les fixtures :

```bash
cd app
# Récupère ta service_role key dans Supabase Dashboard → API → service_role
# Ajoute-la à .env.local : SUPABASE_SERVICE_ROLE_KEY=…
pnpm seed studio@fedelo.io
```

## Edge function — relances automatiques

Le code Deno est dans `app/supabase/functions/invoice-reminders/`. Déploiement :

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref einqhjrrxtjvrqpcmxkl
supabase functions deploy invoice-reminders --no-verify-jwt
```

Planification via `pg_cron` (voir `app/supabase/functions/invoice-reminders/README.md`). Intégration email (Resend / Postmark) prévue mais non activée — commentaires prêts à décommenter dans `index.ts`.

## Tests

```bash
cd app
pnpm test          # vitest — couvre tout lib/finance/
pnpm test:e2e      # playwright — flows critiques sur les 10 pages
pnpm typecheck
pnpm lint
```

## Déploiement Vercel

1. Connecte `fedelo-studio/solopilot` à Vercel
2. **Root Directory** → `app`
3. Variables d'env de prod :
   - `NEXT_PUBLIC_SUPABASE_URL=https://einqhjrrxtjvrqpcmxkl.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=…`
   - `NEXT_PUBLIC_DATA_MODE=live`
4. Domaine `solopilot.fedelo.studio` dans Domains (mêmes credentials Vercel que fedelo.studio)
5. Côté Supabase, **Authentication → URL Configuration** → ajouter ton domaine Vercel + `solopilot.fedelo.studio` aux Redirect URLs

CI (`.github/workflows/ci.yml`) lance typecheck + lint + unit tests + e2e sur chaque PR.

## Roadmap

Voir [CHANGELOG.md](CHANGELOG.md) pour les versions livrées. Prochaines pistes :

- Détail dépense + édition
- Intégration Resend / Postmark pour les emails de relance
- Connexion bancaire automatique (Plaid / Klarna Open Banking / TrueLayer)
- Mode équipe (multi-utilisateur)
- App mobile React Native — partage du modèle de domaine
- Assistant IA — questions cashflow en langage naturel

## Licence

© 2026 Fedelo Studio. Tous droits réservés.
