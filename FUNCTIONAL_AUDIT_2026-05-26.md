# SoloPilot — Audit fonctionnel & remise en marche

Date : 2026-05-26
Mode : `NEXT_PUBLIC_DATA_MODE=mock` (la démo locale)
Constat de départ : « rien ne fonctionne, je ne peux pas qualifier un lead »

---

## Diagnostic (root cause)

Le data layer mock n'écrivait nulle part. Tous les fixtures dans `src/lib/mock/*.ts` étaient exportés en `const`, et chaque server action sous `src/app/actions/*.ts` traitait le mode mock par un simple `revalidatePath` no-op (33 occurrences confirmées au grep). Conséquence : chaque dialogue, chaque édition, chaque transition de statut retournait `ok` au client, le formulaire se fermait, mais aucune mutation n'arrivait jamais dans la fixture. La page se ré-affichait sur les mêmes données.

À cela s'ajoutaient deux blocages UX spécifiques au cas signalé :

1. **Pas de raccourci pour changer l'étape d'un deal.** Le kanban ne supportait pas le drag-and-drop, et la `DealCard` n'exposait que `Voir / Modifier / Supprimer` dans son menu. Pour qualifier un lead il fallait ouvrir la page d'édition.
2. **Pas de `router.refresh()` dans les dialogues.** Même si une action avait muté l'état, `revalidatePath` seul ne fait pas re-rendre la page courante — il faut un refresh côté client.

---

## Ce qui a été fait

### 1. Le data layer mock devient mutable — *bloqueur universel résolu*

Un nouveau module `src/lib/mock/_store.ts` expose une factory `makeMockStore<T>(seed)` qui retourne un store avec `items`, `add`, `update`, `remove`, `get`, `replaceAll`. Il y a aussi un registre `deleteFromMock(table, id)` qui permet à `deleteOwnedRow` (le helper générique de suppression) de router vers le bon store en mode mock.

Chaque fichier `mock/*.ts` a été refactoré pour exposer son store en plus de son array `mockX` (qui pointe maintenant sur `store.items` — même référence, contenu mutable) :

- `clients.ts` → `mockClientsStore` + `mockContactsStore`
- `deals.ts` → `mockDealsStore`
- `projects.ts` → `mockProjectsStore`
- `quotes.ts` → `mockQuotesStore`
- `invoices.ts` → `mockInvoicesStore`
- `payments.ts` → `mockInvoicePaymentsStore`
- `expenses.ts` → `mockExpenseCategoriesStore` + `mockExpensesStore`
- `budgets.ts` → `mockBudgetsStore`
- `accounts.ts` → `mockAccountsStore` + `mockTransactionsStore`
- `alerts.ts` → `mockAlertsStore`
- `company.ts` → `updateMockCompany(patch)` (objet singleton)

Couverture par tests unitaires : `_store.test.ts` (9 tests) verrouille le contrat (CRUD, identité de référence, registre).

### 2. Toutes les server actions ont une vraie branche mock

Pour chacune des 14 actions, le `if (mode === "mock") { revalidatePath; return ok; }` no-op a été remplacé par une vraie mutation du store + la revalidation des pages impactées. Liste exhaustive :

| Action | Mock branch | Notes |
|---|---|---|
| `createClient` | `mockClientsStore.add` | revalide `/clients`, `/pipeline`, `/dashboard` |
| `updateClient` | `mockClientsStore.update` | check existence |
| `deleteClient` | `deleteOwnedRow` (registry) | FK message si projets/factures liés |
| `createContact` / `updateContact` / `deleteContact` | `mockContactsStore` | |
| `createDeal` / `updateDeal` / `deleteDeal` | `mockDealsStore` | stamp `wonAt` à la transition vers won |
| **`setDealStage` (nouveau)** | `mockDealsStore.update` | la quick action du kanban |
| `createProject` / `updateProject` / `deleteProject` | `mockProjectsStore` | |
| `createQuote` / `updateQuote` / `setQuoteStatus` / `deleteQuote` | `mockQuotesStore` | stamp `acceptedAt`/`declinedAt` |
| `convertQuoteToInvoice` | `mockQuotesStore.update` + `mockInvoicesStore.add` | crée la facture, lie via `convertedInvoiceId` |
| `createInvoice` / `updateInvoice` / `setInvoiceStatus` / `deleteInvoice` | `mockInvoicesStore` | lignes & totaux maintenus ; cascade delete sur paiements liés |
| `recordPayment` | `mockInvoicePaymentsStore.add` + `mockInvoicesStore.update` | mirroir du trigger Supabase : bump `amountPaid`, flip à `paid` quand le total est couvert |
| `sendReminder` | `mockInvoicesStore.update` (`lastRemindedAt`) | |
| `createExpense` / `updateExpense` / `deleteExpense` | `mockExpensesStore` | construit `link` correctement |
| `createCategory` / `updateCategory` / `deleteCategory` | `mockExpenseCategoriesStore` | mock side-effect : `categoryId = null` sur les dépenses liées (mirroir `ON DELETE SET NULL`) |
| `createBudget` / `updateBudget` / `deleteBudget` | `mockBudgetsStore` | |
| `createAccount` / `updateAccount` / `deleteAccount` | `mockAccountsStore` | |
| `importTransactions` | `mockTransactionsStore.add` (bulk) | |
| `recomputeAlerts` | diff seeds vs stored, insère/résout | logique miroir de Supabase, plus juste un revalidate |
| `updateCompanySettings` | `updateMockCompany` | débloque le wizard `/bienvenue` |

L'helper `deleteOwnedRow` a aussi gagné un callback optionnel `mockSideEffect` pour les cascades particulières.

### 3. Qualifier un lead — UX dédiée

Nouveau composant `src/components/pipeline/deal-stage-menu.tsx` : un trigger badge + dropdown qui liste les 6 étapes (Lead / Qualifié / Proposition / Négociation / Gagné / Perdu) et appelle directement la nouvelle action `setDealStage` au clic. Disponible à deux endroits :

- **Sur chaque `DealCard` du kanban** — un clic, une commit, le deal change de colonne, la valeur pondérée se recalcule (la probabilité par défaut suit la table `DEFAULT_PROBABILITY_BY_STAGE`).
- **Sur la page détail `/pipeline/[id]`** — même menu mais en taille `md`, à côté du nom du client. L'ancien `DealStageBadge` statique a été remplacé.

L'utilisateur ne doit plus jamais ouvrir le formulaire d'édition juste pour changer une étape.

### 4. Refresh côté client — *toutes les soumissions sont visibles immédiatement*

Avant : la plupart des dialogues fermaient le modal sans appeler `router.refresh()`, donc la page restait sur l'ancien rendu cache.
Après : `router.refresh()` est appelé après chaque succès dans :

- `new-client-dialog`
- `new-deal-dialog`
- `new-expense-dialog`
- `record-payment-dialog`
- `quote-actions` (toutes les transitions de statut)
- `invoice-actions` (toutes les transitions de statut)
- `deal-stage-menu` (nouveau)
- `recompute-alerts-button`

(Les dialogues `contact-dialog` et les `row-actions` partagés appelaient déjà `router.refresh()`. Les inline edit forms appellent `router.push()` qui navigue et ré-affiche fraîchement.)

### 5. `getAlerts()` filtre les alertes résolues en mock aussi

L'action `recomputeAlerts` peut maintenant résoudre des alertes en mock — donc `getAlerts()` doit ignorer celles dont `resolvedAt` est posé, sinon les anciennes restent à l'écran. Aligné sur le comportement live.

---

## Checklist PM — tout le MVP, vérifié sur le code

Pour chaque ligne, je trace : « le bouton existe, son `onClick` appelle bien l'action, l'action mute bien le store, et `router.refresh` (ou `push`) déclenche bien le re-render ». ✓ = ça marche en mode mock après cette session.

### CRM

- [x] Créer un client (dialogue `Nouveau client` depuis `/clients`)
- [x] Modifier un client (`/clients/[id]/edit`)
- [x] Archiver / réactiver un client (champ `status` du formulaire)
- [x] Supprimer un client (avec FK message si projets/factures liés)
- [x] Créer un contact lié à un client (depuis `/clients/[id]`)
- [x] Modifier un contact
- [x] Supprimer un contact

### Pipeline

- [x] Créer un deal (`Nouveau deal` depuis `/pipeline`)
- [x] **Qualifier un deal** — un clic sur le badge stage de la `DealCard` (cas signalé)
- [x] Passer un deal en Proposition / Négociation / Gagné / Perdu via le même menu
- [x] Stamp automatique `wonAt` à la transition « Gagné »
- [x] Modifier un deal (formulaire complet `/pipeline/[id]/edit`)
- [x] Supprimer un deal
- [x] Pipeline pondéré recalculé à chaque transition (la probabilité par défaut suit la table de stage)

### Projets

- [x] Créer un projet (`/projets/nouveau`)
- [x] Modifier un projet (`/projets/[id]/edit`)
- [x] Changer le statut (Actif / En pause / Terminé / Archivé) via le formulaire
- [x] Supprimer un projet
- [x] La marge se recalcule depuis `vendu − interne − dépenses liées`

### Devis

- [x] Créer un devis (`/devis/nouveau`)
- [x] Modifier un devis (lignes + totaux)
- [x] Statut Brouillon → Envoyé → Accepté / Refusé / Expiré (boutons sur `/devis/[id]`)
- [x] Convertir un devis accepté en facture (lignes recopiées, lien `convertedInvoiceId`)
- [x] Supprimer un devis
- [x] Exports PDF (`/devis/[id]/pdf`) — pas touchés, déjà fonctionnels

### Factures

- [x] Créer une facture (`/factures/nouvelle`)
- [x] Modifier une facture (lignes + totaux)
- [x] Statut Brouillon → Envoyée → Annulée → Forcer payé (boutons sur `/factures/[id]`)
- [x] Enregistrer un paiement — le `amountPaid` se met à jour, le statut passe automatiquement à `paid` quand le total est couvert
- [x] Enregistrer une relance (stamp `lastRemindedAt`)
- [x] Supprimer une facture (cascade sur les paiements liés en mock)
- [x] Détection automatique « en retard » sur la base de la date d'échéance (logique pure dans `liveStatus`)
- [x] Export PDF (`/factures/[id]/pdf`)

### Dépenses

- [x] Créer une dépense (dialogue depuis `/depenses`)
- [x] Lier à un client / projet / **prospect (deal)** — la dépense réduit la marge potentielle
- [x] Modifier une dépense (`/depenses/[id]/edit`)
- [x] Marquer refacturable
- [x] Supprimer une dépense
- [x] Créer / modifier / supprimer une catégorie (`/parametres/categories`)
- [x] La suppression d'une catégorie met `categoryId = null` sur les dépenses liées (mirroir Supabase)

### Budgets

- [x] Créer un budget mensuel par catégorie (`/budgets/nouveau`)
- [x] Modifier un budget
- [x] Supprimer un budget
- [x] Le pourcentage consommé se calcule depuis les dépenses du mois

### Comptes & transactions

- [x] Créer un compte bancaire / caisse / épargne (`/comptes/nouveau`)
- [x] Modifier / supprimer un compte
- [x] Importer un CSV de transactions (`/comptes/import`) — toutes les lignes sont ajoutées au mock
- [x] Le cash actuel se recalcule sur le dashboard

### Cashflow & dashboard

- [x] Cash actuel calculé depuis `Σ comptes.initialBalance + Σ transactions in − Σ out`
- [x] Projection 30 / 60 / 90 jours sur le dashboard
- [x] Trois scénarios (`/cashflow`) — pas touché à la mécanique, déjà bon
- [x] Pipeline pondéré affiché et mis à jour à chaque stage change
- [x] Snapshots Confirmé / Probable / Hypothétique respectent la pondération

### Alertes

- [x] `recomputeAlerts` génère les alertes pour : factures en retard, dépenses non catégorisées, budgets proches/dépassés, deals dormants, cash bas
- [x] Réexécuter résout les alertes obsolètes (et n'en duplique pas)
- [x] Page `/alertes` affiche bien les unresolved en mock

### Paramètres & onboarding

- [x] Modifier le nom de l'entreprise / propriétaire / TVA défaut / réserve / IBAN / pied de facture (`/parametres`)
- [x] Le wizard `/bienvenue` enregistre vraiment chaque étape (avant : retournait ok sans rien sauver, donc `isOnboarded()` restait false et la redirection /bienvenue → /dashboard ne se faisait jamais)
- [x] Catégories de dépenses CRUD (`/parametres/categories`)

### Recherche & navigation

- [x] Command palette (⌘K) — déjà bon, indexait déjà les entités mock
- [x] Sidebar repliable persistant (de la session précédente)
- [x] Sidebar sticky (de la session précédente)

---

## Vérifications passées

```
tsc --noEmit                    EXIT 0
next lint                       EXIT 0
vitest run                      78 / 78 ✓  (dont 9 nouveaux pour le store mock)
next build (mock mode)          EXIT 0
```

Le test suite couvre maintenant :
- Toute la logique financière pure (deals, invoices, cashflow, lines, csv, payments, budget) — 60 tests
- Le contrat du mock store (CRUD + registry + id helper) — 9 tests
- Les utilitaires d'invoice/quote/budget — 9 tests

---

## Notes pour la démo

**Comportement du mock layer.** L'état des stores vit en mémoire dans le processus Node. Pendant `pnpm dev` (un seul process) tu peux créer, éditer, supprimer librement — tout persiste tant que tu ne redémarres pas le serveur. Un `pnpm dev` redémarré repart sur les fixtures d'origine. C'est exactement ce qu'on veut pour une démo / preview environment.

Pour la production, tu passes en `NEXT_PUBLIC_DATA_MODE=live` (ou tu enlèves la variable) et tout part sur Supabase — les server actions ont conservé leur branche live intacte.

**Le wizard onboarding.** Par défaut le mock `mockCompany.companyName = "Fedelo Studio"`, donc tu atterris directement sur `/dashboard`. Si tu veux tester le wizard, navigue manuellement vers `/bienvenue` — il fonctionne maintenant de bout en bout (chaque étape sauvegarde vraiment).

**Le pipeline.** Le DnD n'a pas été implémenté ; à la place, le bouton de stage sur chaque carte fait le job. C'est plus accessible (clavier, lecteur d'écran) que du drag-and-drop. Si tu veux le DnD en plus, c'est un sucre — pas un bloqueur.

---

## Ce qui reste honnêtement

Petites limitations connues, à régler quand l'envie viendra :

1. **`getProjectsByClient` filter en mock** — l'inline filter dans le dialog d'éditer dépense filtre côté client, ça marche. Mais si la liste de projets devient très longue, on voudra paginer.
2. **OCR de reçus** — explicitement hors MVP. Champ `receiptUrl` existe sur `Expense` mais aucun uploader UI.
3. **Email send réel** sur les relances — le bouton stamp `lastRemindedAt` mais n'envoie rien. La fonction edge Supabase existe pour ça en live ; en mock le stamp est purement décoratif.
4. **Réinitialiser le mock dataset** — pas d'écran « tout remettre comme au boot ». Redémarrer le serveur le fait. Si utile, j'ajouterai une action `/parametres/reset-mock`.
5. **Le flash sidebar collapsed** au premier paint (déjà documenté dans l'audit design) reste, à régler via cookie.

Tout le reste du brief MVP fonctionne maintenant en bout en bout.
