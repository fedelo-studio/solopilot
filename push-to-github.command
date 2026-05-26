#!/usr/bin/env bash
# push-to-github.command — déploie SoloPilot en ligne via GitHub + Vercel.
#
# Usage :
#   - Double-clic dans Finder (macOS reconnaît .command et ouvre un Terminal).
#   - Ou en ligne : ./push-to-github.command
#
# Ce que le script fait :
#   1. Initialise le repo git si ce n'est pas encore fait.
#   2. Configure le remote `origin` vers github.com/fedelo-studio/solopilot s'il manque.
#   3. Crée/utilise un .gitignore racine cohérent (au-delà de celui dans app/).
#   4. Stage toutes les modifs et commit avec un message daté.
#   5. Push sur `main`.
#
# Si Vercel est connecté au repo, le déploiement vers https://solopilot.fedelo.studio
# se déclenche automatiquement quelques secondes après le push.

set -euo pipefail

# ─── Naviguer dans le dossier du script, peu importe d'où il est lancé ────────
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

echo ""
echo "📦  SoloPilot — push vers GitHub"
echo "    Dossier : $REPO_DIR"
echo ""

# ─── Vérifier git ────────────────────────────────────────────────────────────
if ! command -v git >/dev/null 2>&1; then
  echo "❌  git n'est pas installé. Installe-le avec : brew install git"
  echo "    Puis relance ce script."
  read -n 1 -s -r -p "Appuie sur une touche pour fermer…"
  exit 1
fi

# ─── Initialiser git si nécessaire ───────────────────────────────────────────
if [ ! -d ".git" ]; then
  echo "🆕  Aucun repo git local — initialisation."
  git init -b main
  git config user.email "studio@fedelo.io"
  git config user.name "Felipe (Fedelo Studio)"
else
  # S'assurer qu'on est sur main (rename si on est sur master)
  CURRENT_BRANCH="$(git symbolic-ref --short -q HEAD || echo "")"
  if [ "$CURRENT_BRANCH" = "master" ]; then
    git branch -m master main
  fi
fi

# ─── .gitignore racine (au-delà de app/.gitignore) ───────────────────────────
if [ ! -f ".gitignore" ]; then
  cat > .gitignore <<'EOF'
# macOS metadata
.DS_Store
**/.DS_Store

# Editor / IDE caches
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*
yarn-error.log*

# Build artifacts may also live at the repo root in CI
.vercel/
.next/
node_modules/
EOF
  echo "📝  .gitignore créé à la racine."
fi

# ─── Configurer le remote ────────────────────────────────────────────────────
REMOTE_URL="https://github.com/fedelo-studio/solopilot.git"
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "🔗  Ajout du remote origin → $REMOTE_URL"
  git remote add origin "$REMOTE_URL"
else
  CURRENT_REMOTE="$(git remote get-url origin)"
  if [ "$CURRENT_REMOTE" != "$REMOTE_URL" ]; then
    echo "ℹ️   Remote origin déjà configuré sur : $CURRENT_REMOTE"
    echo "    (on garde celui-là)"
  fi
fi

# ─── Stage + commit ──────────────────────────────────────────────────────────
git add -A

if git diff --cached --quiet; then
  echo ""
  echo "✅  Aucun changement à committer — le repo est déjà à jour."
else
  DATE_TAG="$(date +%Y-%m-%d)"
  COMMIT_MSG="chore: design audit + functional fixes ($DATE_TAG)

- Mock layer mutable (CRUD complet hors ligne)
- Pipeline : quick stage menu sur DealCard + page détail
- Sidebar : pliable, sticky, sans baseline
- Lines editor : entête + aria-labels
- Design tokens : t-meta, shadow-card, .kbd
- 78 tests passent (dont 9 nouveaux pour mock store)
"
  git commit -m "$COMMIT_MSG"
  echo ""
  echo "✅  Commit créé."
fi

# ─── Push ────────────────────────────────────────────────────────────────────
echo ""
echo "🚀  Push vers origin/main…"
echo ""

if ! git push -u origin main; then
  echo ""
  echo "❌  Push échoué. Causes possibles :"
  echo "    1. Le repo github.com/fedelo-studio/solopilot n'existe pas encore."
  echo "       → Crée-le sur https://github.com/new (privé ou public), sans README."
  echo "       → Relance ce script."
  echo ""
  echo "    2. Tu n'es pas authentifié à GitHub depuis cette machine."
  echo "       → Lance : gh auth login        (si gh est installé)"
  echo "       → Ou configure un token : https://github.com/settings/tokens"
  echo ""
  echo "    3. La branche distante a divergé."
  echo "       → Lance : git pull --rebase origin main"
  echo "       → Puis relance ce script."
  echo ""
  read -n 1 -s -r -p "Appuie sur une touche pour fermer…"
  exit 1
fi

echo ""
echo "✅  Push terminé."
echo ""
echo "    GitHub  : https://github.com/fedelo-studio/solopilot"
echo "    Vercel  : https://vercel.com/dashboard  (déploiement auto en cours)"
echo "    Prod    : https://solopilot.fedelo.studio  (dans ~1 minute)"
echo ""
read -n 1 -s -r -p "Appuie sur une touche pour fermer…"
