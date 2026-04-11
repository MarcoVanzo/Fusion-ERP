#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Fusion ERP — Pre-Deploy Audit Script
# Verifica automatica coerenza mobile ↔ backend ↔ config
# Eseguire PRIMA di ogni deploy: ./scripts/audit-mobile.sh
# ─────────────────────────────────────────────────────────────────────────────

set -uo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

PASS=0
FAIL=0
WARN=0

pass()  { PASS=$((PASS+1)); echo -e "  ${GREEN}✓${NC} $1"; }
fail()  { FAIL=$((FAIL+1)); echo -e "  ${RED}✗${NC} $1"; }
warn()  { WARN=$((WARN+1)); echo -e "  ${YELLOW}⚠${NC} $1"; }
header(){ echo -e "\n${CYAN}${BOLD}── $1 ──${NC}"; }

# ── Paths ──
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"
API="$ROOT/api"
APP_JS="$MOBILE/js/app.js"
STYLE_CSS="$MOBILE/css/style.css"
SW_JS="$MOBILE/sw.js"
INDEX_HTML="$MOBILE/index.html"
AUTH_PHP="$API/Shared/Auth.php"
ROUTER_PHP="$API/router.php"
ENV_DEV="$ROOT/.env"
ENV_PROD="$ROOT/.env.prod"
MANIFEST="$MOBILE/manifest.json"

echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     FUSION ERP — PRE-DEPLOY AUDIT (Mobile)       ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo -e "  Root:   $ROOT"
echo -e "  Data:   $(date '+%Y-%m-%d %H:%M:%S')"

# ═════════════════════════════════════════════════════════════════════════════
# 1. CSRF HEADER CHECK
# ═════════════════════════════════════════════════════════════════════════════
header "1. CSRF — Header X-Requested-With su tutte le POST"

if [ -f "$APP_JS" ]; then
  post_lines=$(grep -n "method: 'POST'" "$APP_JS" | cut -d: -f1)
  post_count=0
  csrf_missing=0

  for line in $post_lines; do
    post_count=$((post_count+1))
    start=$((line - 5))
    [ "$start" -lt 1 ] && start=1
    end=$((line + 3))
    block=$(sed -n "${start},${end}p" "$APP_JS")

    if ! echo "$block" | grep -q "X-Requested-With"; then
      csrf_missing=$((csrf_missing+1))
      context=$(sed -n "${line}p" "$APP_JS" | sed 's/^[[:space:]]*//')
      fail "Riga $line: POST senza X-Requested-With → $context"
    fi
  done

  if [ "$csrf_missing" -eq 0 ]; then
    pass "Tutte le $post_count fetch POST hanno l'header CSRF"
  fi
else
  fail "$APP_JS non trovato"
fi

# ═════════════════════════════════════════════════════════════════════════════
# 2. ROLE CONSISTENCY
# ═════════════════════════════════════════════════════════════════════════════
header "2. RBAC — Ruoli mobile ↔ backend"

if [ -f "$AUTH_PHP" ] && [ -f "$APP_JS" ]; then
  tmpdir_rbac=$(mktemp -d)

  # Extract valid roles from Auth.php — look for 'rolename' => N pattern in ROLE_LEVELS
  grep "=>" "$AUTH_PHP" | grep -oE "'[a-z ]+'" | tr -d "'" | sort -u > "$tmpdir_rbac/backend.txt"

  # Extract roles used in app.js — look for role === 'xxx' or role !== 'xxx'  
  # Handles multi-word roles like 'social media manager'
  grep -oE "role [!=]+= '[^']+'" "$APP_JS" | grep -oE "'[^']+'" | tr -d "'" | sort -u > "$tmpdir_rbac/mobile.txt"

  while IFS= read -r role; do
    if grep -Fqx -- "$role" "$tmpdir_rbac/backend.txt"; then
      pass "Ruolo '$role' esiste nel backend"
    else
      fail "Ruolo '$role' usato nel mobile ma NON esiste in Auth.php ROLE_LEVELS"
    fi
  done < "$tmpdir_rbac/mobile.txt"
  
  rm -rf "$tmpdir_rbac"
else
  warn "Impossibile verificare ruoli (file mancanti)"
fi

# ═════════════════════════════════════════════════════════════════════════════
# 3. SERVICE WORKER VERSION SYNC
# ═════════════════════════════════════════════════════════════════════════════
header "3. Service Worker — Versione cache ↔ index.html"

if [ -f "$SW_JS" ] && [ -f "$INDEX_HTML" ]; then
  sw_version=$(grep -oE "v[0-9]+" "$SW_JS" | head -1)
  sw_num=$(echo "$sw_version" | grep -oE "[0-9]+")

  html_versions=$(grep -oE "\?v=[0-9]+" "$INDEX_HTML" | sort -u)
  
  all_match=true
  for hv in $html_versions; do
    hv_num=$(echo "$hv" | grep -oE "[0-9]+")
    if [ "$hv_num" != "$sw_num" ]; then
      fail "index.html usa $hv ma sw.js usa $sw_version"
      all_match=false
    fi
  done

  if $all_match; then
    pass "Versione cache SW ($sw_version) allineata con index.html"
  fi
else
  warn "sw.js o index.html mancante"
fi

# ═════════════════════════════════════════════════════════════════════════════
# 4. CSS VARIABLES DEFINED
# ═════════════════════════════════════════════════════════════════════════════
header "4. CSS — Variabili usate vs definite"

if [ -f "$STYLE_CSS" ]; then
  # Write used and defined vars to temp files to avoid -- grep issues
  tmpdir=$(mktemp -d)
  trap "rm -rf $tmpdir" EXIT
  
  # Find all var(--xxx) usages
  grep -oE 'var\(--[a-zA-Z0-9_-]+' "$STYLE_CSS" | sed 's/var(//' | sort -u > "$tmpdir/used.txt"
  # Find all --xxx: definitions
  grep -oE '\-\-[a-zA-Z0-9_-]+[[:space:]]*:' "$STYLE_CSS" | sed 's/[[:space:]]*:$//' | sort -u > "$tmpdir/defined.txt"

  missing_count=0
  total=0
  while IFS= read -r v; do
    total=$((total+1))
    if ! grep -Fqx -- "$v" "$tmpdir/defined.txt"; then
      fail "var($v) usata ma mai definita nel CSS"
      missing_count=$((missing_count+1))
    fi
  done < "$tmpdir/used.txt"

  if [ "$missing_count" -eq 0 ]; then
    pass "Tutte le $total CSS variables sono definite"
  fi
else
  fail "$STYLE_CSS non trovato"
fi

# ═════════════════════════════════════════════════════════════════════════════
# 5. PWA MANIFEST ASSETS
# ═════════════════════════════════════════════════════════════════════════════
header "5. PWA — Manifest e assets"

if [ -f "$MANIFEST" ]; then
  icon_paths=$(grep -oE '"src"[[:space:]]*:[[:space:]]*"[^"]+"' "$MANIFEST" | grep -oE '"[^"]*"$' | tr -d '"')

  for icon in $icon_paths; do
    full_path="$MOBILE/$icon"
    if [ -f "$full_path" ]; then
      pass "Asset $icon esiste"
    else
      fail "Asset $icon referenziato in manifest.json ma FILE MANCANTE"
    fi
  done
else
  fail "manifest.json non trovato"
fi

# ═════════════════════════════════════════════════════════════════════════════
# 6. DEAD ROUTES
# ═════════════════════════════════════════════════════════════════════════════
header "6. Router — Hash routes usate vs definite"

if [ -f "$APP_JS" ]; then
  navigated_routes=$(grep -oE "hash[[:space:]]*=[[:space:]]*'#[a-zA-Z0-9_-]+'" "$APP_JS" | grep -oE "'#[a-zA-Z0-9_-]+'" | tr -d "'" | sort -u)
  defined_routes=$(grep -oE "case[[:space:]]*'#[a-zA-Z0-9_-]+'" "$APP_JS" | grep -oE "'#[a-zA-Z0-9_-]+'" | tr -d "'" | sort -u)
  defined_routes2=$(grep -oE "startsWith\('#[a-zA-Z0-9_-]+'\)" "$APP_JS" | grep -oE "'#[a-zA-Z0-9_-]+'" | tr -d "'" | sort -u)
  all_defined=$(printf '%s\n%s\n' "$defined_routes" "$defined_routes2" | sort -u)

  for route in $navigated_routes; do
    found=false
    for def in $all_defined; do
      if [ "$route" = "$def" ]; then
        found=true
        break
      fi
    done

    if $found; then
      pass "Route $route ha un handler"
    else
      warn "Route $route usata in onclick ma nessun handler trovato (possibile dead link)"
    fi
  done
fi

# ═════════════════════════════════════════════════════════════════════════════
# 7. ENV PARITY
# ═════════════════════════════════════════════════════════════════════════════
header "7. Config — Chiavi .env vs .env.prod"

if [ -f "$ENV_DEV" ] && [ -f "$ENV_PROD" ]; then
  dev_keys=$(grep -oE '^[A-Z_][A-Z_0-9]*' "$ENV_DEV" | sort -u)
  prod_keys=$(grep -oE '^[A-Z_][A-Z_0-9]*' "$ENV_PROD" | sort -u)

  only_dev=$(comm -23 <(echo "$dev_keys") <(echo "$prod_keys"))
  only_prod=$(comm -13 <(echo "$dev_keys") <(echo "$prod_keys"))

  if [ -z "$only_dev" ]; then
    pass "Tutte le chiavi .env sono presenti in .env.prod"
  else
    for k in $only_dev; do
      warn "Chiave $k presente in .env ma MANCANTE in .env.prod"
    done
  fi

  if [ -z "$only_prod" ]; then
    pass "Tutte le chiavi .env.prod sono presenti in .env"
  else
    for k in $only_prod; do
      warn "Chiave $k presente in .env.prod ma MANCANTE in .env"
    done
  fi

  # Check critical config differences
  for key in APP_ENV APP_DEBUG TRUSTED_PROXY; do
    dev_val=$(grep "^${key}=" "$ENV_DEV" 2>/dev/null | head -1 | cut -d= -f2-)
    prod_val=$(grep "^${key}=" "$ENV_PROD" 2>/dev/null | head -1 | cut -d= -f2-)
    if [ "$dev_val" = "$prod_val" ] && [ -n "$dev_val" ]; then
      warn "$key ha lo stesso valore in dev e prod ($dev_val) — potrebbe essere un errore"
    else
      pass "$key differenziato: dev=$dev_val | prod=$prod_val"
    fi
  done
else
  warn "File .env o .env.prod mancante"
fi

# ═════════════════════════════════════════════════════════════════════════════
# 8. MOCK/PLACEHOLDER CHECK
# ═════════════════════════════════════════════════════════════════════════════
header "8. Code Quality — Mock e placeholder residui"

if [ -f "$APP_JS" ]; then
  for pattern in "TODO:" "FIXME:" "HACK:" "fase di sincronizzazione"; do
    count=$(grep -ci "$pattern" "$APP_JS" 2>/dev/null | tail -1 || true)
    count=$(echo "$count" | tr -d '[:space:]')
    if [ -z "$count" ]; then count=0; fi
    if [ "$count" -gt 0 ] 2>/dev/null; then
      warn "$count occorrenze di '$pattern' trovate in app.js"
      grep -ni "$pattern" "$APP_JS" 2>/dev/null | head -3 | while read -r match; do
        echo -e "       ${YELLOW}→${NC} $match"
      done
    else
      pass "Nessun '$pattern' trovato in app.js"
    fi
  done
fi

# ═════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  RISULTATI AUDIT${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}✓ Passati:  $PASS${NC}"
echo -e "  ${YELLOW}⚠ Warning:  $WARN${NC}"
echo -e "  ${RED}✗ Falliti:  $FAIL${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}${BOLD}⛔ DEPLOY BLOCCATO — Correggere i $FAIL errori prima di procedere.${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "  ${YELLOW}${BOLD}⚠  Deploy consentito ma con $WARN avvisi. Verifica manualmente.${NC}"
  exit 0
else
  echo -e "  ${GREEN}${BOLD}🚀 AUDIT SUPERATO — Deploy sicuro.${NC}"
  exit 0
fi
