#!/usr/bin/env bash
# SoloPilot — Lanceur double-clic pour macOS
#
# Double-clique ce fichier dans le Finder pour démarrer l'app en mode démo.
# Ouvre Terminal, installe les dépendances au premier lancement,
# puis lance Next.js et ouvre le navigateur sur http://localhost:3000.

# Se place dans le dossier du script, peu importe d'où il est lancé
cd "$(dirname "$0")"

# Affiche le titre dans la barre Terminal
echo -ne "\033]0;SoloPilot — Démo\007"

# Lance la démo
exec ./demo.sh
