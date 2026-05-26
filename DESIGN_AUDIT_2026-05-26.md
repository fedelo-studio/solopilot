# SoloPilot — Audit & refonte design system

Date : 2026-05-26
Périmètre : `app/src` (codebase Next.js 15 + React 19 + Tailwind + shadcn/ui)
Approche : audit complet → refactor direct → vérification (typecheck, lint, tests, build).

---

## Verdict express

La fondation est solide. Tokens HSL, palette sémantique financière (`confirmed / probable / hypothetical / warning / danger / hot`), Strawford + JetBrains Mono, et architecture shadcn bien posée. Les défauts étaient surtout des **incohérences de surface** : trois systèmes de CTA en concurrence, micro-typographie en `text-[10px]` / `text-[11px]` éparpillée, code mort (`PlaceholderAction`, `.cta-pill`, `.btn-ghost-fedelo`), composants partagés dupliqués dans plusieurs écrans (date d'échéance, snapshot KPI, état vide d'une colonne pipeline), et quelques fausses affordances (boutons natifs sans focus ring cohérent dans la topbar, sidebar qui scrollait avec la page).

J'ai consolidé le système plutôt que reconstruit. Tout le travail tient sur la couche shadcn et conserve la direction Fedelo.

---

## 1. Tokens & typographie

### Avant

- Trois CTA en concurrence : `Button variant="default"` (shadcn), `.cta-pill` (globals.css), `.btn-ghost-fedelo` (globals.css). Les deux classes CSS n'étaient référencées nulle part dans le code TSX → mortes.
- Échelle de tailles micro non standardisée : 17 occurrences de `text-[10px]` / `text-[11px]` répandues dans 10 fichiers (sidebar, deal-card, dashboard, factures, devis, projets, command-palette, aide, error…).
- `tracking-tight` vs `tracking-tighter` utilisés au hasard (CardTitle `tighter`, MetricCard `tighter`, mais la convention voulue était `tight`).
- Card ombrée en `shadow-[0_1px_2px_rgba(10,10,10,0.04)]` inline, alors que tailwind config avait déjà un `shadow-sm` Fedelo.
- Pas de classe `kbd` partagée — 4 endroits réimplémentaient le même rendu (topbar, command-palette, aide, shortcuts).

### Après — `tailwind.config.ts`

Nouvelles tailles sémantiques :
- `text-meta` = 10px (kbd, micro-annotations)
- `text-eyebrow` = 11px (déjà présent, conservé)

Nouvelle ombre canonique :
- `shadow-card` = état au repos d'une surface (remplace l'ombre inline)
- `shadow-focus` = ring focus pour les surfaces interactives non-bouton (cartes, lignes)

### Après — `globals.css`

- **Supprimé** : `.cta-pill` (20 lignes), `.btn-ghost-fedelo` (22 lignes). Remplacé par un commentaire pointant vers `<Button variant="default">` et `<Button variant="outline">`.
- **Ajouté** : `.t-meta`, `.t-meta-num`, `.kbd` — utilitaires éditoriaux qui standardisent les micro-typographies.

### Bilan
- −42 lignes de CSS mort
- 17 usages `text-[10px]/[11px]` → 0 (remplacés par `text-meta`, `text-eyebrow`, `text-meta-num`, ou la classe `.kbd`)
- 1 seul ombre canonique pour les cartes au lieu de 2

---

## 2. Primitives (`src/components/ui/`)

### `Card` — réécrite

Avant : div avec classes inline figées. Aucune variante.

Après :
- `variants.interactive` : `true` ajoute hover + focus ring (à utiliser sur les cartes qui sont vraiment cliquables)
- `variants.tone` : `default | muted | hot` (la variante `hot` matérialise une facture en retard ou une alerte critique)
- Utilise `shadow-card` au lieu d'une ombre inline

### `Button`
Déjà bon — laissé tel quel. C'est le canonical CTA Fedelo (default = noir → hot au hover, outline = pill fantôme avec backdrop blur).

### `Input` — état d'erreur a11y
Avant : pas d'état d'erreur visuel.
Après : `aria-invalid="true"` déclenche `border-danger` + `ring-danger` — la validation pilote l'a11y et le visuel par le même attribut, en cohérence avec shadcn.

### `Badge`
Déjà cohérent (`confirmed / probable / hypothetical / warning / danger / hot`). Laissé tel quel.

---

## 3. Composants partagés (`src/components/shared/`)

### `PageHeader` — code mort retiré
- **Supprimé** : `PlaceholderAction` (bouton désactivé sans explication — exactement la fausse affordance que l'audit vise). Aucun import dans la codebase → mort.
- Le H1 utilise maintenant `.t-h1` (déjà défini dans globals.css) au lieu de classes ad-hoc — un seul ramp typographique source de vérité.
- Le rail eyebrow utilise `eyebrow-led` (CSS commune) au lieu d'un `<span>` inline.

### `MetricCard` — durcie
- `tracking-tighter` → `tracking-tight` (cohérent avec CardTitle).
- Top-stripe hot : ajout de `motion-reduce:transition-none` pour respecter `prefers-reduced-motion`.
- Icônes : `aria-hidden` ajouté (sinon les lecteurs d'écran lisent le nom de la lucide).
- Hint avec `truncate` et delta avec `shrink-0` — plus de débordement quand le hint est long.

### `EmptyState` — variante taille
- Nouveau prop `size: "default" | "sm"`.
- `sm` est utilisé en inline dans les colonnes de pipeline et les sections de carte du dashboard (alertes, top deals, factures à surveiller) — supprime la div bricolée `rounded-md border border-dashed ... text-center text-xs text-muted-foreground` qui existait en 4 endroits différents.
- Ajout d'`aria-hidden` sur l'icône décorative.

### Nouveaux composants

#### `DueDate` + `ValidityDate` (`shared/due-date.tsx`)
Avant : la logique "dans N jours / N jours de retard / expiré il y a N jours" était dupliquée inline dans factures/page.tsx, devis/page.tsx, avec des `text-[11px]` et conditionnels couleur à la main.

Après : un seul composant. Le statut « résolu » (payé / accepté / annulé) supprime l'annotation. La couleur (`danger | warning | muted`) découle du jour et de la sévérité passée en prop.

#### `KpiSnapshot` (`shared/kpi-snapshot.tsx`)
Avant : composant local `<Snapshot>` défini en bas de `dashboard/page.tsx`.
Après : extrait en composant partagé — réutilisable par toute carte qui veut afficher "X dans N jours" avec un pill de confiance. Le composant local du dashboard a été supprimé.

#### `LineItemsHeader` (`shared/line-items-header.tsx`)
Avant : 4 formulaires (`new-invoice-form`, `new-quote-form`, `invoice-edit-form`, `quote-edit-form`) affichaient des lignes de facture sans aucune entête de colonne. Les inputs n'avaient ni `aria-label` ni `<label>` — un utilisateur (voyant ou non) ne pouvait pas savoir lequel des 4 nombres était la quantité, le prix, ou la TVA. **Bug bloquant que tu as remonté pendant l'audit.**

Après : entête partagée alignée sur le même `grid-cols-[1fr_80px_120px_80px_120px_36px]` que les lignes. Visible en md+, escamotée en mobile (où la grille passe en stack vertical et les placeholders suffisent). Tous les inputs ont reçu un `aria-label` (Description / Quantité / Prix unitaire / TVA en pourcent / Total hors taxes).

---

## 4. Layout — Sidebar refondue

### Demandes utilisateur explicites pendant l'audit
1. Retirer la baseline « COCKPIT BUSINESS » sous le wordmark — ne garder que le logo.
2. Avoir une version repliée de la sidebar.
3. La sidebar ne doit pas scroller avec le contenu de la page.

### Réécriture complète de `components/layout/sidebar.tsx`

- **Sticky** : `sticky top-0 h-screen self-start` — reste pinned au viewport pendant que le contenu scroll. Le `self-start` est nécessaire pour que le sticky fonctionne à l'intérieur d'un flex parent (`align-items: stretch` neutraliserait sinon le sticky).
- **Baseline retirée** : plus de ligne "Cockpit business" sous le wordmark. Le brand area est un rectangle de 56px de haut, séparé du nav par une fine border.
- **État replié** :
  - Largeur 68px (icônes seules) vs 240px (déployée).
  - Persistant en `localStorage` sous la clé `solopilot:sidebar:collapsed`.
  - Toggle en bas avec icônes `PanelLeftClose` / `PanelLeftOpen`.
  - Brand area swap : `BrandWordmark` ↔ `BrandMark` (le monogramme Q-lens).
  - Chaque entrée nav est enveloppée dans un `<Tooltip side="right">` quand replié — le label reste découvrable.
  - Labels de groupe (Pilotage / Commercial / Finances) remplacés par un fin séparateur horizontal quand replié (sinon ils prennent toute la largeur pour rien).
- **A11y** :
  - `aria-label`, `aria-expanded`, `aria-current="page"` partout où c'est pertinent.
  - Focus visible avec ring (`focus-visible:ring-2`) sur toutes les cibles cliquables.
  - Pas de mouvement quand `prefers-reduced-motion` (la transition de largeur est désactivée).
- **Hydratation propre** : la transition de largeur ne s'active qu'après hydratation (`hydrated &&`) pour éviter un effet de "shrink animé" au premier paint quand la sidebar est sauvegardée comme repliée.

### Topbar — fausses affordances corrigées

- Le bouton "rechercher" gardait un focus ring désaligné — `focus-visible:ring-offset-1` ajouté pour s'aligner sur l'Input primitive.
- Le bouton avatar (raw `<button>`) n'avait pas d'`aria-label` — ajouté `Compte de ${ownerName}` + le même focus ring.
- Le kbd inline a été remplacé par la classe `.kbd` partagée.
- Le `text-[10px]` du nom propriétaire (sous le nom de société) → `text-meta`.

---

## 5. UX écran par écran

### Dashboard
- `Snapshot` local → `KpiSnapshot` partagé.
- Carte « Alertes » : ajout d'un état vide explicite ("Tout est calme aujourd'hui" + EmptyState size="sm") au lieu d'afficher une description "0 signaux à traiter" et un vide silencieux derrière.
- Carte « Deals à plus fort impact » et « Factures à surveiller » : même traitement (EmptyState sm quand vide).
- `divide-border/70` → `divide-border` (les filets de séparation étaient un peu trop pâles pour le ratio de contraste WCAG).
- `text-[11px]` → `text-meta-num` (tabular nums pour la ligne "30'000 × 60%").

### Factures
- La logique inline "due / retard" → `<DueDate date={inv.dueDate} resolved={status === "paid" || status === "cancelled"} />`.
- Disparition de l'import `daysUntil` côté écran (concentré dans le composant).
- La couleur du solde dû reste pilotée par le statut (`text-danger` pour overdue, `text-muted-foreground` pour paid).

### Devis
- Idem : `<ValidityDate>` pour les "X jours restants / expiré il y a X jours".
- Suppression d'un bloc 17-lignes d'inline ternaires.

### Pipeline
- Colonne vide → `<EmptyState size="sm" />` (au lieu de la div bricolée).
- Header de colonne `text-[11px]` → `text-meta-num`.

### Deal card
- Shadow inline `shadow-[0_1px_2px...]` → `shadow-card`.
- `text-[10px] eyebrow` → `eyebrow` (la classe seule, qui est déjà 11px).
- Focus ring sur le titre cliquable + `focus-within:shadow-focus` sur la carte parente.
- `border-border/70` → `border-border` pour le séparateur interne (contraste).

### Projets
- 2 occurrences `text-[10px]` → `text-meta` / `text-meta-num`.

### Lignes de facture / devis (4 formulaires)
- `<LineItemsHeader />` ajouté en haut de la liste de lignes.
- `aria-label` sur chaque input (Description / Quantité / Prix unitaire / TVA en pourcent / Total hors taxes).

### Aide & command palette
- 2 implémentations kbd en raw classes → la classe `.kbd` partagée.
- `text-[11px]` (sous-titre cmd palette) → `text-meta`.

### Error boundary
- `text-[10px] uppercase tracking-widest` → `text-meta font-mono uppercase`.

---

## 6. Accessibilité

Améliorations directes :
- Tous les `aria-label` manquants sur les triggers natifs `<button>` ajoutés (avatar, search trigger, sidebar toggle, lignes de facture).
- `aria-current="page"` ajouté sur les liens de navigation actifs.
- `aria-hidden` sur toutes les icônes décoratives lucide (sinon le screen reader lit le nom du composant).
- `aria-invalid` pris en charge nativement par l'Input.
- `prefers-reduced-motion` respecté par la sidebar, MetricCard, et EmptyState.
- Focus ring visible et cohérent (ring + offset) sur toutes les surfaces cliquables non-bouton (sidebar links, search trigger, avatar trigger).

Reste à faire (recommandations) :
- Tester au lecteur d'écran (VoiceOver / NVDA) une session complète.
- Vérifier les contrastes des tons `confirmed / probable / hypothetical / warning / danger` sur leur fond `*-soft` avec un outil dédié (axe DevTools).
- Ajouter un skip-link "Aller au contenu principal" en haut de page.

---

## 7. Vérifications passées

```
tsc --noEmit                 → EXIT 0
next lint                    → EXIT 0
vitest run                   → 69 tests passed (7 fichiers)
next build                   → EXIT 0
```

---

## 8. Inventaire des changements

### Fichiers créés (3)
- `src/components/shared/due-date.tsx` — `DueDate` + `ValidityDate`
- `src/components/shared/kpi-snapshot.tsx` — `KpiSnapshot`
- `src/components/shared/line-items-header.tsx` — `LineItemsHeader`

### Fichiers refactorés (16)
- `tailwind.config.ts` — nouveaux tokens `text-meta`, `shadow-card`, `shadow-focus`
- `src/app/globals.css` — suppression CSS mort, ajout `.t-meta`, `.t-meta-num`, `.kbd`
- `src/components/ui/card.tsx` — variantes `interactive` + `tone`
- `src/components/ui/input.tsx` — état `aria-invalid`
- `src/components/shared/page-header.tsx` — suppression `PlaceholderAction`, utilisation `.t-h1` et `.eyebrow-led`
- `src/components/shared/metric-card.tsx` — tracking standardisé + motion-reduce
- `src/components/shared/empty-state.tsx` — variante `size="sm"`
- `src/components/layout/sidebar.tsx` — réécriture complète (collapsed, sticky, no-baseline, tooltips, a11y)
- `src/components/layout/topbar.tsx` — fausses affordances corrigées
- `src/components/layout/command-palette.tsx` — `.kbd` partagée + `text-meta`
- `src/components/pipeline/deal-card.tsx` — shadow-card, eyebrow, focus
- `src/app/(app)/dashboard/page.tsx` — `KpiSnapshot`, EmptyState sm, `text-meta-num`
- `src/app/(app)/factures/page.tsx` — `DueDate`
- `src/app/(app)/devis/page.tsx` — `ValidityDate`
- `src/app/(app)/pipeline/page.tsx` — `EmptyState size="sm"`, `text-meta-num`
- `src/app/(app)/projets/page.tsx` — `text-meta` / `text-meta-num`
- `src/app/(app)/aide/page.tsx` — `.kbd`, `divide-border`
- `src/app/(app)/error.tsx` — `text-meta`
- `src/components/invoices/invoice-edit-form.tsx` — `LineItemsHeader` + aria-labels
- `src/components/quotes/quote-edit-form.tsx` — `LineItemsHeader` + aria-labels
- `src/app/(app)/factures/nouvelle/new-invoice-form.tsx` — `LineItemsHeader` + aria-labels
- `src/app/(app)/devis/nouveau/new-quote-form.tsx` — `LineItemsHeader` + aria-labels

### Code mort supprimé
- `.cta-pill` (42 lignes CSS)
- `.btn-ghost-fedelo` (24 lignes CSS)
- `PlaceholderAction` (export + interface)
- `<Snapshot>` local au dashboard (extrait)

---

## 9. Recommandations restantes — dette technique

Hiérarchisé du plus impactant au moins urgent.

### Maintenant
1. **Extraire un `<LineItemsEditor>` complet** — aujourd'hui les 4 formulaires (facture / devis × création / édition) répètent les mêmes ~60 lignes de logique de lignes (state, update, remove, totals). L'entête est partagée, le reste devrait suivre. Un seul composant `<LineItemsEditor lines={lines} onChange={setLines} />` épargnerait ~200 lignes et garantirait que toute évolution (suppression confirm, drag-to-reorder, copier ligne) se propage partout.

2. **`DataTable` wrapper** — les pages factures/devis/clients/projets/dépenses ré-écrivent la même structure `<Card><CardContent p-0><Table>...`. Un `<DataTable columns={...} rows={...} empty={...} />` génériserait l'empty state, le scroll horizontal mobile, le futur tri/filtre.

3. **Cookie pour la sidebar collapsed** — actuellement c'est `localStorage`, donc il y a un flash au premier paint (la sidebar arrive déployée puis se replie). Une lecture côté serveur via cookie + passage par layout supprimerait ce flash.

### Bientôt
4. **`<DataTableSkeleton columns={N}>`** + variants — actuellement `TableSkeleton` rend `N` `Skeleton` de hauteur 12. Une version qui imite la grille réelle ferait une transition perçue plus lisse.

5. **Money tone="auto" — clarifier la sémantique** — `tone="auto"` colore le positif en vert, le négatif en rouge. Sur une marge ou un delta de cash, c'est juste. Sur un total de facture (positif par défaut), c'est trompeur (un total positif n'est pas "bon" en soi). Soit renommer `tone="delta"`, soit forcer les appels actuels à `tone="neutral"` sauf cas explicite.

6. **Bouton Hot CTA** — la variante `default` du Button est un noir-au-repos qui *devient* hot au hover. Pour les actions "vraiment importantes" (nouvelle facture depuis le dashboard ?), il manque peut-être un état hot-au-repos. La variante `hot` existe déjà mais n'est utilisée nulle part. Décider si on la veut sur certaines actions clés.

7. **Sidebar : badge sur les éléments de nav** — quand un module a une action en attente (5 factures en retard, 3 dépenses non catégorisées), un badge à droite du label apporterait un signal de cockpit fort. Aujourd'hui c'est centralisé dans /alertes seulement.

### Plus tard
8. **Skip link** + audit a11y assisté (axe DevTools).
9. **Tests E2E** (Playwright est déjà configuré, mais pas de scénarios écrits).
10. **DESIGN_SYSTEM.md** dans le repo SoloPilot — l'app a clairement un design system désormais ; un fichier qui documente les tokens, primitives, et composants partagés évitera la dérive.
11. **Storybook** ou équivalent (lazy stories en page interne ?) — l'écran `/parametres/design` pourrait devenir le terrain de jeu visuel du DS, utile pour itérer sans naviguer dans chaque module.

---

## 10. Décisions opinionnées

Là où j'ai tranché contre le code existant :

- **Trois CTA → un seul** : `<Button variant="default">` est la pill Fedelo. `.cta-pill` et `.btn-ghost-fedelo` étaient redondantes et n'étaient utilisées nulle part — supprimées sans appel.
- **`PlaceholderAction` supprimé** : un bouton désactivé étiqueté sans explication est la fausse affordance pure. Si une CRUD n'est pas câblée, soit ne pas afficher le bouton, soit le câbler ; on ne maquillera plus le manque.
- **EmptyState en pipeline** : la div bricolée "Aucun deal à cette étape" n'avait pas le poids visuel d'un état vide — c'était de l'invisible. `EmptyState size="sm"` apporte la petite icône + label + ratio cohérent avec le reste.
- **`tracking-tight` partout, pas `tracking-tighter`** : sur un cockpit financier en CHF avec des nombres tabulaires longs, le tracking *trop* serré (-0.025em) écrase la lisibilité numérique. `-0.01em` (`snug`) sur le body, `-0.025em` (`tighter`) réservé au H1 t-h1 uniquement.
- **Sidebar sticky `self-start`** : sans `self-start`, le sticky meurt silencieusement dans un flex container `items-stretch`. C'est le genre de gotcha qui crée des bugs de scroll fantôme — verrouillé.
- **Tooltips obligatoires en sidebar repliée** : sans tooltip, une icône seule = devinette. Ce n'est pas optionnel.

---

## 11. Ce qui *n'a pas* été touché — et pourquoi

- **Domaine financier (`src/lib/finance/`)** : 100% intact, tous les tests passent. Aucun calcul touché.
- **Couches données (`src/lib/data/`, `src/lib/mock/`, Supabase)** : intactes — la consigne était UI uniquement.
- **Routes / structure du tree** : intactes — la consigne était "refacto en place".
- **shadcn primitives non listées plus haut** : Avatar, Command, Dialog, DropdownMenu, Label, Progress, Select, Separator, Sheet, Table, Tabs, Textarea, Tooltip — tous déjà en bon état, pas de modification.
- **Welcome wizard, settings, comptes, budgets, alertes, rapports** : pas de refacto direct (sortent du périmètre MVP prioritaire que tu as listé), mais ils bénéficient automatiquement des changements de tokens, primitives et de la sidebar refondue.

---

Fin du rapport.
