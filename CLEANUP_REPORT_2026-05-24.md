# Nettoyage & factorisation — SoloPilot

**Date :** 2026-05-24
**Type :** tâche planifiée automatisée (`clean-code-base`)
**Périmètre :** `app/src/` — refactors sûrs, sans changement de comportement.

---

## TL;DR

Quatre nouvelles primitives partagées (`BackLink`, `EditPageShell`, `FormActions`, `FormError`) absorbent les patterns répétés dans 8 pages d'édition et 5 formulaires. Suppression de deux exports morts. **TypeScript passe, 68/69 tests verts** (le test rouge `budgetUsage > handles planned=0` est un bug pré‑existant dans `lib/finance/budget.ts`, hors périmètre).

Note sur la tâche planifiée : la mention `/webgl` dans le SKILL.md n'a pas été appliquée. WebGL est la "signature visuelle" de Fedelo Studio mais explicitement exclue du contexte SaaS dashboard (voir mémoire `fedelo-design-system`). Aucun shader injecté dans SoloPilot.

---

## Ce qui a été modifié

### 1. Nouvelles primitives partagées

| Fichier | Rôle |
| --- | --- |
| `src/components/shared/back-link.tsx` | Lien retour avec chevron, typographie mute. Remplace 15 copies du même bloc. |
| `src/components/shared/edit-page-shell.tsx` | Shell des pages `*/[id]/edit` : back‑link + `PageHeader` + container `max-w-*`. |
| `src/components/shared/form-actions.tsx` | Ligne `Annuler / Enregistrer` standard, gère `pending` et `router.back()`. |
| `src/components/shared/form-error.tsx` | Message d'erreur inline avec rôle ARIA, retourne `null` si vide. |

### 2. Pages d'édition refactorisées (8 fichiers)

Toutes passent de ~25 lignes à ~15 lignes, plus aucune duplication d'imports `Link`/`ChevronLeft` ni de className mutée copiée‑collée.

- `app/(app)/clients/[id]/edit/page.tsx`
- `app/(app)/projets/[id]/edit/page.tsx`
- `app/(app)/depenses/[id]/edit/page.tsx`
- `app/(app)/budgets/[id]/edit/page.tsx`
- `app/(app)/comptes/[id]/edit/page.tsx`
- `app/(app)/pipeline/[id]/edit/page.tsx`
- `app/(app)/factures/[id]/edit/page.tsx` (utilise `maxWidth="max-w-5xl"`)
- `app/(app)/devis/[id]/edit/page.tsx` (utilise `maxWidth="max-w-5xl"`)

### 3. Formulaires refactorisés (5 fichiers)

Le bloc final `error + flex justify-end gap-2 + Annuler + Enregistrer` (~10 lignes) est remplacé par `<FormError /> + <FormActions />` (3 lignes).

- `components/budgets/budget-form.tsx`
- `components/accounts/account-form.tsx`
- `components/projects/project-form.tsx`
- `components/pipeline/deal-form.tsx`
- `components/expenses/expense-form.tsx`

Import `Button` retiré quand plus utilisé.

### 4. Code mort supprimé

- `src/lib/data/_mode.ts` — export `isMock` supprimé (0 consommateurs).
- `src/app/actions/_helpers.ts` — `requireUserId` passe en interne (plus de mot‑clé `export`, seul `getAuthedSession` l'utilise).

---

## Vérification

| Contrôle | Résultat |
| --- | --- |
| `tsc --noEmit` | ✅ pas d'erreur |
| `vitest run` (lib/finance/*.test.ts) | 68 passés / 1 échec **pré-existant** |

Le test rouge `src/lib/finance/budget.test.ts > budgetUsage > handles planned=0 gracefully` n'est pas une régression : `budget.ts:34-40` ne traite pas le cas `plannedAmount === 0` (il retourne `usagePercent: 0, status: "ok"` au lieu de `100, "exceeded"`). À corriger dans une passe dédiée.

---

## Ce qui a été volontairement laissé de côté

Refactors de plus haut levier mais à risque moyen ou nécessitant validation produit, à faire en présence du dev :

1. **Wrapper `withMockShortCircuit` + factory `crudDelete/crudCreate/crudUpdate`** dans `app/actions/_helpers.ts` — environ 80 LOC à effacer dans 13 fichiers d'actions. Touche chaque action serveur, à valider avec des tests E2E.
2. **Unification des deux styles de formulaire** (`FormData`/`action={}` dans `client-form` vs `useTransition`/`parseInput` ailleurs). Choisir le style `parseInput` partout.
3. **Helper `rowMapper<T>(spec)`** pour absorber les 10 copies de `rowToX` dans `lib/data/`. Refactor mécanique mais touche tous les chemins de lecture.
4. **Primitive `<Checkbox>` shadcn** — pour remplacer le `<input type="checkbox">` manuel dans `expense-form.tsx:160-168`. Demande d'ajouter `@radix-ui/react-checkbox` aux deps.
5. **Déplacer `mockCompany` inline (`lib/mock/index.ts`)** dans son propre fichier `lib/mock/company.ts` pour la cohérence avec les autres entités.
6. **`convertQuoteAndRedirect` et `createInvoiceAndRedirect`** — exportés mais aucun call site externe trouvé. À supprimer **après** confirmation qu'aucune page `/devis/.../page.tsx` ou `/factures/nouvelle/page.tsx` ne les utilisera prochainement.
7. **Refactor des formulaires lourds** (`invoice-edit-form`, `quote-edit-form`, `client-form` `edit-client-form`, formulaires `nouveau/`) — appliquer `FormActions`/`FormError` mais demande de lire chaque fichier individuellement à cause des variantes (lignes de devis, table éditable, etc.).
8. **Layout métriques** : `mb-6 grid gap-4 md:grid-cols-3` apparaît dans 5 pages dashboard. Extraire `<MetricRow>` qui wrap `<MetricCard>` enfants.

---

## Backlog priorisé (suite logique de ce nettoyage)

1. **[5 min, sans risque]** Bug `budgetUsage` quand `plannedAmount=0` — corriger pour rendre `vitest` 100 % vert.
2. **[30 min, sans risque]** Appliquer `FormActions`/`FormError` aux 4 formulaires restants (`invoice-edit-form`, `quote-edit-form`, `edit-client-form`, formulaires "nouveau").
3. **[15 min, sans risque]** Déplacer `mockCompany` dans `lib/mock/company.ts`.
4. **[1 h, sûr]** Extraire `withMockShortCircuit(paths, run)` dans `_helpers.ts`, l'appliquer aux 6 actions CRUD simples (clients, projects, deals, expenses, accounts, budgets).
5. **[1 h, risque moyen]** Helper `rowMapper<T>` + refactor des `rowToX`.
6. **[30 min, risque faible]** Ajouter `<Checkbox>` shadcn et migrer `expense-form.tsx`.

---

## Note sur la mention `/webgl` dans la tâche

La tâche planifiée fait référence à la skill WebGL. WebGL est l'élément signature de la marque Fedelo Studio (shader hero sur `fedelo.studio`) mais explicitement **non approprié pour un dashboard SaaS** d'après la direction UX/UI de SoloPilot (interface "calme, dense, table‑heavy"). Aucun shader n'a été ajouté ; la mention a été interprétée comme un rappel de skills disponibles plutôt qu'une instruction d'injection.

Si l'intention était d'ajouter une touche WebGL sur la landing `/` ou l'écran `/bienvenue`, c'est un travail de design à part qui mérite une vraie session, pas un nettoyage automatisé.
