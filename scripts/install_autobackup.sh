#!/usr/bin/env bash
# ============================================================
# install_autobackup.sh
# Installa il LaunchAgent per il backup automatico orario.
# Esegui UNA SOLA VOLTA: bash scripts/install_autobackup.sh
# ============================================================

set -euo pipefail

PLIST_SRC="/Users/marcovanzo/Fusion ERP/scripts/com.fusionerp.autobackup.plist"
PLIST_NAME="com.fusionerp.autobackup"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_DEST="$LAUNCH_AGENTS_DIR/$PLIST_NAME.plist"
SCRIPT_PATH="/Users/marcovanzo/Fusion ERP/scripts/git_auto_backup.sh"

echo "=== Installazione Auto Backup Fusion ERP ==="

# Rendi eseguibile lo script di backup
chmod +x "$SCRIPT_PATH"
echo "✅ Permessi script impostati."

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
echo "=== Backup automatico attivo! ==="
echo "   Frequenza : ogni ora"
echo "   Versioni  : 12 (con rotazione automatica)"
echo "   Branch    : auto-backup"
echo "   Log       : $( dirname "$SCRIPT_PATH" )/auto_backup.log"
echo ""
echo "Per verificare lo stato: launchctl list | grep fusionerp"
echo "Per disattivare: launchctl unload $PLIST_DEST"
echo "Per eseguire adesso: bash \"$SCRIPT_PATH\""
