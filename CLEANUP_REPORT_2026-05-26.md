# Nettoyage & factorisation — SoloPilot

**Date :** 2026-05-26
**Type :** tâche planifiée automatisée (`clean-code-base`)
**Périmètre :** `app/src/` — refactors sûrs, sans changement de comportement.
**Mode :** autonome (utilisateur non présent)

---

## TL;DR

- **Bug `budgetUsage` corrigé.** Le test `handles planned=0 gracefully` était rouge depuis la passe du 24/05. Il est vert maintenant — **69/69 tests passent**, plus une seule régression historique.
- **Deux nouvelles primitives partagées** absorbent ce qui restait de duplication dans la couche UI :
  - `TotalsRow` — remplace 4 copies internes du composant `Row` dans les formulaires devis/facture.
  - `DialogFormFooter` — remplace le bloc `<DialogClose>…<Button submit>` dupliqué dans 6 dialogues.
- **6 formulaires supplémentaires** migrés sur `FormActions` + `FormError` (les 4 derniers du backlog 24/05 + 2 supplémentaires identifiés).
- **`mockCompany`** déplacé dans son propre fichier `lib/mock/company.ts` pour aligner sur les autres entités du dossier mock.
- **Deux exports morts supprimés** après 3 jours sans aucun consommateur (`convertQuoteAndRedirect`, `createInvoiceAndRedirect`).
- `tsc --noEmit` propre, `next lint` propre, `vitest run` 69/69.
- La mention `/webgl` reste **volontairement ignorée** — cohérent avec les passes précédentes et la direction UX/UI documentée.

---

## 1. Bug corrigé — `budgetUsage` quand `plannedAmount === 0`

Le test attendait `usagePercent: 100, status: "exceeded", overBy: 100` quand le plafond est à 0 et qu'une dépense survient. La logique précédente retournait `0/ok/0` parce que le ratio était court-circuité dès que `plannedAmount === 0`.

Fichier : `src/lib/finance/budget.ts`

```diff
- const ratio = budget.plannedAmount > 0 ? spent / budget.plannedAmount : 0;
- const usagePercent = Math.min(100, Math.round(ratio * 100));
+ const ratio =
+   budget.plannedAmount > 0
+     ? spent / budget.plannedAmount
+     : spent > 0
+       ? Infinity
+       : 0;
+ const usagePercent = Math.min(100, Math.round(ratio === Infinity ? 100 : ratio * 100));
```

Pourquoi `Infinity` plutôt qu'un cas spécial ? Le reste de la fonction (`ratio >= 1 → exceeded`, `>= 0.8 → near_limit`, …) lit le ratio en cascade — `Infinity` traverse correctement toutes les branches sans avoir à dupliquer la logique de statut. Et `usagePercent` est clampé à 100 explicitement.

**Comportement préservé :**
- `plannedAmount > 0` → exactement comme avant.
- `plannedAmount === 0` + aucune dépense → `usagePercent: 0, status: "ok"` (inchangé, sain).
- `plannedAmount === 0` + dépense > 0 → `usagePercent: 100, status: "exceeded"` (nouveau, attendu).

Test correspondant : `src/lib/finance/budget.test.ts:77` — désormais vert.

---

## 2. Nouvelles primitives partagées

### `TotalsRow` (`src/components/shared/totals-row.tsx`)

Remplace 4 copies du même composant interne `Row({ label, value, bold })` dans :
- `app/(app)/factures/nouvelle/new-invoice-form.tsx`
- `app/(app)/devis/nouveau/new-quote-form.tsx`
- `components/invoices/invoice-edit-form.tsx`
- `components/quotes/quote-edit-form.tsx`

Chaque copie faisait exactement la même chose : `flex justify-between` + label + `<Money>` avec une variante `bold` pour le total TTC. Le nouveau composant centralise le styling (foreground/muted) et la dépendance à `Money`.

### `DialogFormFooter` (`src/components/shared/dialog-form-footer.tsx`)

Couvre l'enchaînement `DialogFooter > DialogClose > Button(ghost) + Button(submit)` qui était dupliqué dans 6 dialogues :

| Dialogue | Variante absorbée |
| --- | --- |
| `new-client-dialog.tsx` | submit standard |
| `new-deal-dialog.tsx` | submit standard |
| `new-expense-dialog.tsx` | submit standard |
| `contact-dialog.tsx` | submit standard, label dynamique (create/edit) |
| `record-payment-dialog.tsx` | submit avec `disableSubmit={amount <= 0}` |
| `quotes/quote-actions.tsx` | `onSubmit={handleConvert}`, `submitVariant="hot"` |

L'API gère :
- `pending` + `submitLabel`/`pendingLabel` (obligatoires)
- `cancelLabel` (override de "Annuler")
- `disableSubmit` (condition supplémentaire au-delà de `pending`)
- `submitVariant: "default" | "destructive" | "hot"`
- `onSubmit` optionnel — quand fourni, le bouton devient `type="button"` (utilisé par la conversion devis → facture, qui n'a pas de `<form>` parent).

---

## 3. Formulaires migrés sur `FormActions` / `FormError`

Le backlog du 24/05 listait 4 formulaires restants. Tous sont faits, plus 2 que la passe précédente n'avait pas comptés :

| Fichier | Lignes avant | Lignes après | Notes |
| --- | --- | --- | --- |
| `app/(app)/projets/nouveau/new-project-form.tsx` | 183 | 177 | + retrait import `Button` orphelin |
| `app/(app)/clients/[id]/edit/edit-client-form.tsx` | 128 | 122 | + retrait import `Button` orphelin |
| `app/(app)/factures/nouvelle/new-invoice-form.tsx` | 303 | 290 | + `TotalsRow` (–10 lignes en plus du footer) |
| `app/(app)/devis/nouveau/new-quote-form.tsx` | 269 | 252 | + `TotalsRow` |
| `components/invoices/invoice-edit-form.tsx` | 275 | 258 | + `TotalsRow` |
| `components/quotes/quote-edit-form.tsx` | 250 | 233 | + `TotalsRow` |

**Comportement préservé :** mêmes `onSubmit`, mêmes labels, mêmes états de désactivation, mêmes redirections après succès.

---

## 4. Dialogues migrés sur `DialogFormFooter`

| Fichier | Lignes avant | Lignes après |
| --- | --- | --- |
| `components/clients/new-client-dialog.tsx` | 138 | 133 |
| `components/pipeline/new-deal-dialog.tsx` | 174 | 169 |
| `components/expenses/new-expense-dialog.tsx` | 188 | 183 |
| `components/contacts/contact-dialog.tsx` | 126 | 121 |
| `components/quotes/quote-actions.tsx` | 165 | 157 |
| `components/invoices/record-payment-dialog.tsx` | 155 | 151 |

En bonus, les 6 fichiers ont aussi adopté `<FormError message={…} size="xs" />` pour l'erreur globale, ce qui remplace le bloc :

```tsx
{globalError ? <p className="text-xs text-danger">{globalError}</p> : null}
```

— et donne un attribut `role="alert"` cohérent pour les lecteurs d'écran (porté par `FormError`).

---

## 5. Réorganisation mineure

### `mockCompany` déplacé

Le bloc inline dans `src/lib/mock/index.ts` (lignes 16–26 avant) part dans son propre fichier `src/lib/mock/company.ts` pour s'aligner sur les autres entités mock (`clients.ts`, `deals.ts`, etc.). `index.ts` ne fait plus que ré-exporter.

Pas de changement d'import pour les consommateurs : `import { mockCompany } from "@/lib/mock"` continue de fonctionner.

### Exports morts supprimés

Le rapport du 24/05 a flaggé deux exports comme suspects après un audit (`convertQuoteAndRedirect`, `createInvoiceAndRedirect`). Trois jours plus tard, toujours zéro consommateur dans `src/`. Retirés :

- `src/app/actions/invoices.ts` — `createInvoiceAndRedirect` (et l'import `redirect` devenu inutile)
- `src/app/actions/quotes.ts` — `convertQuoteAndRedirect` (idem)

Si une page `/devis/.../page.tsx` ou `/factures/nouvelle/page.tsx` veut rediriger après création, elle utilise déjà la version non-redirect via `router.push()` côté client — c'est le pattern actuel.

---

## Vérification

| Contrôle | Résultat |
| --- | --- |
| `tsc --noEmit` | ✅ propre |
| `next lint --no-cache` | ✅ propre |
| `vitest run` | ✅ **69 / 69 passent** (était 68/69) |
| `next build` | ⚠️ non vérifié dans cette session — la sandbox a manqué de mémoire (Bus error). Le typecheck + tests + lint donnent une confiance élevée mais à confirmer en local avec `pnpm build` avant push. |

---

## Ce qui a été identifié mais non touché

Refactors plus lourds qui méritent une vraie session interactive :

1. **Extraire `LineItemsCard`** — l'`interface LineDraft` + `newLine` + `updateLine` + `removeLine` + la grid de saisie sont dupliqués dans **4 fichiers** (new-invoice, new-quote, invoice-edit, quote-edit). C'est l'extraction à plus fort levier qui reste (~150 LOC absorbables). Pas faite ici parce qu'elle touche le cœur du flux facturation et mérite des tests E2E avant.

2. **`upsertOwnedRow` helper** pour les paires `createX` / `updateX` (ce que `deleteOwnedRow` fait déjà pour les suppressions). Bloqué par l'absence d'un mapper `camelCase → snake_case` typé — le faire correctement implique de générer le mapping depuis le schéma Zod.

3. **`StatusBadge` consolidation.** Plusieurs pages inline encore des `<Badge variant={…}>` avec des `STATUS_LABELS` ad hoc. Quand le vocabulaire status sera stabilisé, vaut une passe dédiée.

4. **Migration `<input type="checkbox">` → `<Checkbox>` shadcn.** Reste dans `expense-form.tsx:163`. Demande d'ajouter `@radix-ui/react-checkbox` aux deps.

5. **Unifier les deux styles de formulaire** (`<form action={fn}>` vs `useTransition` + `parseInput`). Pas urgent : les deux marchent, mais converger sur `parseInput` partout simplifierait les validations.

---

## Note sur la mention `/webgl` dans la tâche planifiée

Comme dans les passes du 24/05 et du 25/05 : **non appliquée**. La mémoire `fedelo-design-system` est explicite — _"WebGL hero shader is the brand's 'signature' visual — not appropriate for a SaaS dashboard."_ La tâche planifiée référence cette skill par habitude, pas par intention produit. Aucun shader injecté dans le cockpit.

Si l'objectif est un jour d'ajouter une touche WebGL à la landing `/` ou à l'écran `/bienvenue`, ça doit faire l'objet d'une vraie session de design, pas d'un passage de nettoyage automatique.

---

## Fichiers modifiés (récap)

**Créés :**
- `src/components/shared/totals-row.tsx`
- `src/components/shared/dialog-form-footer.tsx`
- `src/lib/mock/company.ts`

**Modifiés (refactors mécaniques, sans changement de comportement) :**
- `src/lib/finance/budget.ts` (bugfix)
- `src/lib/mock/index.ts` (réexport)
- `src/app/actions/invoices.ts` (export mort retiré)
- `src/app/actions/quotes.ts` (export mort retiré)
- `src/app/(app)/factures/nouvelle/new-invoice-form.tsx`
- `src/app/(app)/devis/nouveau/new-quote-form.tsx`
- `src/app/(app)/projets/nouveau/new-project-form.tsx`
- `src/app/(app)/clients/[id]/edit/edit-client-form.tsx`
- `src/components/invoices/invoice-edit-form.tsx`
- `src/components/quotes/quote-edit-form.tsx`
- `src/components/clients/new-client-dialog.tsx`
- `src/components/pipeline/new-deal-dialog.tsx`
- `src/components/expenses/new-expense-dialog.tsx`
- `src/components/contacts/contact-dialog.tsx`
- `src/components/quotes/quote-actions.tsx`
- `src/components/invoices/record-payment-dialog.tsx`
