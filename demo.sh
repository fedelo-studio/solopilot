#!/usr/bin/env bash
# SoloPilot — Démo en un clic
# Usage : ./demo.sh  (depuis le dossier /SoloPilot/)
#
# Lance l'app en mode mock data — aucun Supabase requis.
# Installe les dépendances au premier lancement.

set -e

cd "$(dirname "$0")/app"

# Détecte le package manager dispo, préférence pnpm > yarn > npm
if command -v pnpm > /dev/null 2>&1; then
  PM=pnpm
elif command -v yarn > /dev/null 2>&1; then
  PM=yarn
else
  PM=npm
fi

# Premier lancement : install des dépendances
if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦  Premier lancement — installation des dépendances avec $PM"
  echo "    (compte 30 à 60 secondes la première fois)"
  echo ""
  $PM install
  echo ""
fi

# Bannière
cat <<'BANNER'

   ┌──────────────────────────────────────────────────────┐
   │                                                      │
   │   SoloPilot — Cockpit business                       │
   │                                                      │
   │   Mode : démo (mock data, aucun Supabase requis)     │
   │   URL  : http://localhost:3000                       │
   │                                                      │
   │   Ctrl+C pour arrêter                                │
   │                                                      │
   └──────────────────────────────────────────────────────┘

BANNER

# Ouvre le navigateur sur macOS — mais seulement APRÈS que Next.js réponde,
# pour éviter une page d'erreur Chrome au premier démarrage (compilation 10-15s).
if [[ "$OSTYPE" == "darwin"* ]]; then
  (
    # Poll toutes les secondes pendant 90 secondes max
    for _ in $(seq 1 90); do
      if curl -fsS http://localhost:3000 > /dev/null 2>&1; then
        open http://localhost:3000
        exit 0
      fi
      sleep 1
    done
  ) &
fi

# Force le mode mock pour la démo, peu importe ce qu'il y a dans .env.local
NEXT_PUBLIC_DATA_MODE=mock $PM run dev
