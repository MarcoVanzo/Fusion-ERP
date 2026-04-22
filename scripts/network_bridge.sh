#!/bin/bash
# =============================================
# NETWORK PROXY BRIDGE per Antigravity
# 
# Questo script crea un servizio di sistema che
# esegue comandi di rete per conto di Antigravity.
#
# Eseguire da Terminal.app:
#   bash ~/Fusion\ ERP/scripts/network_bridge.sh
# =============================================

BRIDGE_DIR="$HOME/.antigravity_bridge"
FIFO_IN="$BRIDGE_DIR/cmd_in"
FIFO_OUT="$BRIDGE_DIR/cmd_out"
PID_FILE="$BRIDGE_DIR/bridge.pid"
LOG_FILE="$BRIDGE_DIR/bridge.log"

# Funzione per fermare il bridge
stop_bridge() {
    if [ -f "$PID_FILE" ]; then
        kill $(cat "$PID_FILE") 2>/dev/null
        rm -f "$PID_FILE"
        echo "🛑 Bridge fermato"
    fi
    rm -f "$FIFO_IN" "$FIFO_OUT"
}

# Funzione per avviare il bridge
start_bridge() {
    mkdir -p "$BRIDGE_DIR"
    stop_bridge
    
    # Crea le named pipes
    mkfifo "$FIFO_IN" 2>/dev/null
    mkfifo "$FIFO_OUT" 2>/dev/null
    
    echo "🚀 Avvio Network Bridge..."
    
    # Avvia il bridge in background
    (
        while true; do
            if read -r cmd < "$FIFO_IN"; then
                if [ "$cmd" = "QUIT" ]; then
                    echo "Bridge terminato" > "$FIFO_OUT"
                    break
                fi
                # Esegui il comando e scrivi l'output
                eval "$cmd" > "$FIFO_OUT" 2>&1
            fi
        done
    ) &
    
    echo $! > "$PID_FILE"
    echo "✅ Network Bridge attivo (PID: $(cat $PID_FILE))"
    echo "   I comandi di rete verranno eseguiti fuori dalla sandbox"
    echo ""
    echo "   Per fermarlo: bash ~/Fusion\ ERP/scripts/network_bridge.sh stop"
}

# Crea anche un LaunchAgent per avvio automatico
install_agent() {
    PLIST="$HOME/Library/LaunchAgents/com.antigravity.networkbridge.plist"
    cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.antigravity.networkbridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$HOME/Fusion ERP/scripts/network_bridge.sh</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF
    launchctl load "$PLIST" 2>/dev/null
    echo "✅ LaunchAgent installato (avvio automatico)"
}

case "${1:-start}" in
    start)
        start_bridge
        install_agent
        ;;
    stop)
        stop_bridge
        launchctl unload "$HOME/Library/LaunchAgents/com.antigravity.networkbridge.plist" 2>/dev/null
        ;;
    *)
        echo "Uso: $0 {start|stop}"
        ;;
esac
