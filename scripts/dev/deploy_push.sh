#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# deploy_push.sh — Push to GitHub with token authentication
#
# Usage:
#   GITHUB_TOKEN=ghp_xxx ./scripts/dev/deploy_push.sh
#
# This script:
#   1. Temporarily sets the remote URL with the token embedded
#   2. Pushes all commits to origin/main
#   3. Resets the remote URL to the clean one (no token exposed)
# ─────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_DIR"

# Require token
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "❌ GITHUB_TOKEN non impostato."
    echo ""
    echo "1. Vai su: https://github.com/settings/tokens/new"
    echo "2. Crea un token con scope 'repo'"
    echo "3. Esegui:"
    echo "   GITHUB_TOKEN=ghp_xxxx ./scripts/dev/deploy_push.sh"
    exit 1
fi

OWNER="MarcoVanzo"
REPO="Fusion-ERP"
CLEAN_URL="https://github.com/${OWNER}/${REPO}.git"
AUTH_URL="https://${OWNER}:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git"

echo "🔐 Configurazione temporanea autenticazione..."
git remote set-url origin "$AUTH_URL"

echo "🚀 Push in corso..."
if git push origin main; then
    echo "✅ Push completato con successo!"
else
    echo "❌ Push fallito."
fi

# ALWAYS reset to clean URL — never leave token in .git/config
echo "🧹 Pulizia URL remote..."
git remote set-url origin "$CLEAN_URL"

echo "✅ Remote URL ripristinato."
