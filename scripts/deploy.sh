#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Fusion ERP — One-Shot Deploy Script
# Esegue tutto: manifest → pre-flight → build → commit → push → deploy → verifica
#
# Ispirato a MV ERP deploy.sh, con le feature avanzate di Fusion:
#   - Pre-flight checks (PHPStan, Stress Test)
#   - Smart React Build
#   - HTTP Pull (deploy_update.php) con fallback FTP-TLS
#   - Migrazioni automatiche
#   - Health check post-deploy
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colori ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Configurazione ──
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="${NODE_BIN:-$(which node 2>/dev/null || echo '/usr/local/bin/node')}"
PYTHON_BIN="${PYTHON_BIN:-$(which python3 2>/dev/null || echo 'python3')}"
DEPLOY_URL="https://www.fusionteamvolley.it/ERP/deploy_update.php"
MIGRATE_URL="https://www.fusionteamvolley.it/ERP/api/router.php?module=admin&action=migrate"
APP_URL="https://www.fusionteamvolley.it/ERP"
ENV_FILE="$PROJECT_DIR/.env"

# ── Parse argomenti ──
DO_MIGRATE=false
SKIP_CHECKS=false
SKIP_BUILD=false
FORCE_BUILD=false
DRY_RUN=false
USE_FTP=false
COMMIT_MSG=""

for arg in "$@"; do
    case "$arg" in
        --migrate)     DO_MIGRATE=true ;;
        --skip-checks) SKIP_CHECKS=true ;;
        --no-build)    SKIP_BUILD=true ;;
        --force-build) FORCE_BUILD=true ;;
        --dry-run)     DRY_RUN=true ;;
        --ftp)         USE_FTP=true ;;
        *)             COMMIT_MSG="$arg" ;;
    esac
done

if [[ -z "$COMMIT_MSG" ]]; then
    COMMIT_MSG="deploy: $(date '+%Y-%m-%d %H:%M')"
fi

# ── Leggi DEPLOY_KEY dal .env locale ──
DEPLOY_KEY=""
if [[ -f "$ENV_FILE" ]]; then
    DEPLOY_KEY=$(grep -E '^DEPLOY_KEY=' "$ENV_FILE" | cut -d'=' -f2- | tr -d "\"' " || true)
fi
if [[ -z "$DEPLOY_KEY" ]] && [[ "$USE_FTP" == false ]]; then
    echo -e "${RED}❌ DEPLOY_KEY non trovata in $ENV_FILE${NC}"
    echo -e "${YELLOW}   Aggiungila al file .env: DEPLOY_KEY=your_secret_key${NC}"
    echo -e "${YELLOW}   Oppure usa --ftp per il deploy diretto via FTP-TLS${NC}"
    exit 1
fi

# ── Step counting ──
TOTAL_STEPS=7
CURRENT_STEP=0

step() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo ""
    echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS]${NC} $1"
}

echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}  🚀 Fusion ERP — Deploy in Produzione${NC}"
if $DRY_RUN; then
    echo -e "${BOLD}${YELLOW}  ⚠️  MODALITÀ DRY RUN — nessuna modifica${NC}"
fi
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"

# ── Step 1: Genera il manifest ──
step "Generazione manifest..."
cd "$PROJECT_DIR"
if [[ -x "$NODE_BIN" ]] || command -v node &>/dev/null; then
    ${NODE_BIN:-node} scripts/generate_manifest.js
    echo -e "  ${GREEN}✅ Manifest generato.${NC}"
else
    echo -e "  ${YELLOW}⚠️  Node.js non trovato, skip manifest.${NC}"
fi

# ── Step 2: Pre-flight checks ──
step "Pre-flight checks..."
if $SKIP_CHECKS || $DRY_RUN; then
    echo -e "  ${CYAN}→ Skippati ($(if $DRY_RUN; then echo 'dry-run'; else echo '--skip-checks'; fi))${NC}"
else
    # PHPStan
    if command -v composer &>/dev/null; then
        echo -e "  ${CYAN}→ PHPStan...${NC}"
        if composer phpstan 2>/dev/null; then
            echo -e "  ${GREEN}✅ PHPStan passed.${NC}"
        else
            echo -e "  ${RED}❌ PHPStan fallito! Correggi gli errori prima di deployare.${NC}"
            exit 1
        fi
    else
        echo -e "  ${YELLOW}⚠️  Composer non trovato, skip PHPStan.${NC}"
    fi

    # Stress Test
    if [[ -f "scripts/stress_checker.py" ]]; then
        echo -e "  ${CYAN}→ Stress Test...${NC}"
        if $PYTHON_BIN scripts/stress_checker.py 2>/dev/null; then
            echo -e "  ${GREEN}✅ Stress Test passed.${NC}"
        else
            echo -e "  ${RED}❌ Stress Test fallito!${NC}"
            exit 1
        fi
    fi
fi

# ── Step 3: Build React apps ──
step "Build React apps..."
if $SKIP_BUILD; then
    echo -e "  ${CYAN}→ Skippato (--no-build)${NC}"
else
    BUILD_ARGS=""
    if $FORCE_BUILD; then BUILD_ARGS="--force-build"; fi
    # Delegate to deploy.py's build logic
    $PYTHON_BIN -c "
import sys; sys.path.insert(0, '.')
from deploy import load_cache, build_react_apps, save_cache
cache = load_cache()
build_react_apps(force=$($FORCE_BUILD && echo 'True' || echo 'False'), skip=False, cache=cache)
save_cache(cache)
" 2>/dev/null || echo -e "  ${YELLOW}⚠️  Build React delegata a deploy.py${NC}"
fi

# ── Step 4: Cache busting ──
step "Cache busting index.html..."
if ! $DRY_RUN; then
    $PYTHON_BIN -c "
import sys; sys.path.insert(0, '.')
from deploy import update_index_version
update_index_version()
" 2>/dev/null || echo -e "  ${YELLOW}⚠️  Cache busting delegato a deploy.py${NC}"
else
    echo -e "  ${CYAN}→ Skippato (dry-run)${NC}"
fi

# ── Step 5: Git commit + push ──
step "Git commit + push..."
cd "$PROJECT_DIR"

if $DRY_RUN; then
    echo -e "  ${CYAN}→ Skippato (dry-run)${NC}"
else
    git add -A

    if git diff --cached --quiet 2>/dev/null; then
        echo -e "  ${CYAN}→ Nessuna modifica da committare, skip.${NC}"
    else
        git commit -m "$COMMIT_MSG"
        echo -e "  ${GREEN}✅ Commit creato: $COMMIT_MSG${NC}"
    fi

    echo -e "  ${CYAN}→ Push su GitHub...${NC}"
    if git push origin main 2>&1 | tail -5; then
        echo -e "  ${GREEN}✅ Push completato.${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Push fallito — provo con GITHUB_TOKEN...${NC}"
        GITHUB_TOKEN=$(grep -E '^GITHUB_TOKEN=' "$ENV_FILE" | cut -d'=' -f2- | tr -d "\"' " || true)
        if [[ -n "$GITHUB_TOKEN" ]]; then
            CLEAN_URL=$(git remote get-url origin)
            AUTH_URL=$(echo "$CLEAN_URL" | sed "s|https://|https://MarcoVanzo:${GITHUB_TOKEN}@|")
            git remote set-url origin "$AUTH_URL"
            git push origin main 2>&1 | tail -5 && echo -e "  ${GREEN}✅ Push completato (via token).${NC}" || echo -e "  ${YELLOW}⚠️  Push fallito (non bloccante).${NC}"
            git remote set-url origin "$CLEAN_URL"
        else
            echo -e "  ${YELLOW}⚠️  Nessun GITHUB_TOKEN disponibile. Continuo senza push.${NC}"
        fi
    fi
fi

# ── Step 6: Deploy su Aruba ──
step "Deploy sul server di produzione..."

if $DRY_RUN; then
    echo -e "  ${CYAN}→ Skippato (dry-run)${NC}"
elif $USE_FTP; then
    echo -e "  ${CYAN}→ Modalità FTP-TLS...${NC}"
    $PYTHON_BIN deploy.py --skip-checks --no-git --no-build
else
    echo -e "  ${CYAN}→ Modalità HTTP Pull (come MV ERP)...${NC}"
    echo ""

    DEPLOY_OUTPUT=$(curl -s --max-time 180 -H "X-Deploy-Key: $DEPLOY_KEY" "$DEPLOY_URL" 2>&1)

    # Mostra le righe importanti (strip HTML con sed)
    CLEAN_OUTPUT=$(echo "$DEPLOY_OUTPUT" | sed 's/<[^>]*>//g')
    echo "$CLEAN_OUTPUT" | grep -E '(✅|❌|⚠️|📊|Riepilogo|commit)' | head -30 || true
    echo ""

    # Controlla esito
    if echo "$CLEAN_OUTPUT" | grep -q "0 falliti"; then
        echo -e "  ${GREEN}✅ Deploy riuscito senza errori!${NC}"
    elif echo "$CLEAN_OUTPUT" | grep -q "falliti"; then
        FAIL_LINE=$(echo "$CLEAN_OUTPUT" | grep "falliti" || true)
        echo -e "  ${RED}⚠️  $FAIL_LINE${NC}"
        echo -e "  ${YELLOW}File falliti:${NC}"
        echo "$CLEAN_OUTPUT" | grep "❌" || true
    else
        echo -e "  ${YELLOW}⚠️  Impossibile determinare l'esito. Controlla manualmente.${NC}"
        echo "$CLEAN_OUTPUT" | tail -10
    fi
fi

# ── Step 7: Migrazioni + Health Check ──
step "Post-deploy (Migrazioni + Health Check)..."

if $DRY_RUN; then
    echo -e "  ${CYAN}→ Skippato (dry-run)${NC}"
else
    # Migrazioni
    if $DO_MIGRATE; then
        echo -e "  ${CYAN}→ Migrazione database...${NC}"
        MIGRATION_TOKEN=$(grep -E '^MIGRATION_TOKEN=' "$ENV_FILE" | cut -d'=' -f2- | tr -d "\"' " || true)
        if [[ -n "$MIGRATION_TOKEN" ]]; then
            MIGRATE_OUTPUT=$(curl -s --max-time 30 \
                -H "X-Migration-Token: $MIGRATION_TOKEN" \
                -H "Content-Type: application/json" \
                -X POST "$MIGRATE_URL" 2>&1)
            echo "$MIGRATE_OUTPUT" | head -10
        else
            echo -e "  ${YELLOW}⚠️  MIGRATION_TOKEN non trovato in .env${NC}"
        fi
    else
        echo -e "  ${CYAN}→ Migrazione DB skippata (usa --migrate per eseguirla)${NC}"
    fi

    # Health Check
    echo -e "  ${CYAN}→ Health check...${NC}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL" 2>/dev/null || echo "000")
    if [[ "$HTTP_CODE" == "200" ]]; then
        echo -e "  ${GREEN}✅ Health check superato! ($APP_URL → $HTTP_CODE)${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Health check: $APP_URL → HTTP $HTTP_CODE${NC}"
    fi
fi

echo ""
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════${NC}"
if $DRY_RUN; then
    echo -e "${BOLD}${YELLOW}  🏁 Dry run completato — nessuna modifica effettuata${NC}"
else
    echo -e "${BOLD}${GREEN}  ✅ Deploy completato!${NC}"
    echo -e "${BOLD}${GREEN}  🌐 $APP_URL${NC}"
fi
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
