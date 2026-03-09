#!/usr/bin/env bash
# ============================================================
# install_dbbackup.sh
# Installa il LaunchAgent per il backup automatico del DB (mezzanotte).
# ============================================================

set -euo pipefail

PLIST_SRC="/Users/marcovanzo/Fusion ERP/scripts/com.fusionerp.dbbackup.plist"
PLIST_NAME="com.fusionerp.dbbackup"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_DEST="$LAUNCH_AGENTS_DIR/$PLIST_NAME.plist"
SCRIPT_PATH="/Users/marcovanzo/Fusion ERP/cron/backup_nightly.php"

echo "=== Installazione Database Auto Backup ==="

# Crea la directory LaunchAgents se non esiste
mkdir -p "$LAUNCH_AGENTS_DIR"

# Copia il plist
cp "$PLIST_SRC" "$PLIST_DEST"
echo "✅ Plist copiato in $PLIST_DEST"

# Scarica il vecchio agente se esiste
if launchctl list | grep -q "$PLIST_NAME"; then
  launchctl unload "$PLIST_DEST" 2>/dev/null || true
  echo "🔄 Vecchio agente rimosso."
fi

# Carica il nuovo agente
launchctl load "$PLIST_DEST"
echo "✅ LaunchAgent caricato."

echo ""
echo "=== Backup Database automatico attivo! ==="
echo "   Frequenza : ogni notte a mezzanotte"
echo "   Script    : $SCRIPT_PATH"
echo "   Log       : $( dirname "$SCRIPT_PATH" )/db_backup.log"
echo ""
echo "Per verificare lo stato: launchctl list | grep dbbackup"
echo "Per disattivare: launchctl unload \"$PLIST_DEST\""
echo "Per eseguire adesso: /opt/homebrew/bin/php \"$SCRIPT_PATH\""
