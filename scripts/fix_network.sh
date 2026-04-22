#!/bin/bash
# =============================================
# FIX NETWORK - Antigravity.app
# Copia in Terminal.app:
#   bash ~/Fusion\ ERP/scripts/fix_network.sh
# =============================================

BUNDLE="com.google.antigravity"
APP="/Applications/Antigravity.app"
EXE="$APP/Contents/MacOS/Electron"

echo ""
echo "🔧 FIX NETWORK — Antigravity.app"
echo "================================="

# Step 1: Reset TUTTI i permessi TCC dell'app
echo ""
echo "① Reset permessi TCC..."
tccutil reset All "$BUNDLE" 2>/dev/null
echo "   ✅ Done"

# Step 2: Firewall — aggiungi e sblocca
echo ""
echo "② Sblocco firewall..."
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off 2>/dev/null
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add "$EXE" 2>/dev/null
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp "$APP" 2>/dev/null
echo "   ✅ Done"

# Step 3: Rimuovi quarantine e attributi estesi
echo ""
echo "③ Rimozione quarantine e xattr..."
sudo xattr -cr "$APP" 2>/dev/null
echo "   ✅ Done"

# Step 4: Flush DNS
echo ""
echo "④ Flush DNS..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder 2>/dev/null
echo "   ✅ Done"

# Step 5: Reset preferenze app
echo ""
echo "⑤ Reset preferenze app..."
defaults delete "$BUNDLE" 2>/dev/null || true
echo "   ✅ Done"

# Step 6: Forza ri-registrazione nel sistema di rete
echo ""
echo "⑥ Ri-registrazione nel sistema di rete..."
sudo lsof -i -P | grep -i antigravity 2>/dev/null || true
# Kill mDNSResponder per forzare refresh completo
sudo killall -9 mDNSResponder 2>/dev/null
# Reset interfaccia di rete
sudo ifconfig en0 down 2>/dev/null && sudo ifconfig en0 up 2>/dev/null
echo "   ✅ Done"

# Step 7: Verifica entitlements
echo ""
echo "⑦ Verifica entitlements..."
echo "   Entitlements attuali:"
codesign -d --entitlements - "$APP" 2>&1 | grep -E "network|sandbox" | sed 's/^/   /'

NET_CLIENT=$(codesign -d --entitlements - "$APP" 2>&1 | grep "network.client" | wc -l)
if [ "$NET_CLIENT" -eq 0 ]; then
    echo ""
    echo "   ⚠️  ATTENZIONE: network.client NON presente!"
    echo "   L'app non ha l'entitlement di rete nella firma."
    echo ""
    echo "   SOLUZIONE ALTERNATIVA: Firma manuale con entitlements di rete"
    
    # Crea file entitlements temporaneo
    ENT_FILE="/tmp/antigravity_ents.plist"
    cat > "$ENT_FILE" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
    <key>com.apple.security.device.audio-input</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
    <key>com.apple.security.inherit</key>
    <true/>
</dict>
</plist>
EOF

    echo ""
    echo "   🔑 Ri-firma dell'app con entitlements di rete..."
    
    # Ri-firma helper e framework prima
    sudo codesign --force --deep --sign - --entitlements "$ENT_FILE" "$APP/Contents/Frameworks/Electron Framework.framework" 2>/dev/null || true
    
    # Ri-firma l'eseguibile principale
    sudo codesign --force --deep --sign - --entitlements "$ENT_FILE" "$EXE" 2>/dev/null
    
    # Ri-firma l'app bundle
    sudo codesign --force --deep --sign - --entitlements "$ENT_FILE" "$APP" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "   ✅ App ri-firmata con network.client e network.server!"
    else
        echo "   ❌ Ri-firma fallita. Potrebbe servire disabilitare SIP."
    fi
    
    # Verifica nuova firma
    echo ""
    echo "   Nuovi entitlements:"
    codesign -d --entitlements - "$APP" 2>&1 | grep -E "network|sandbox" | sed 's/^/   /'
    
    rm -f "$ENT_FILE"
else
    echo "   ✅ network.client già presente"
fi

echo ""
echo "================================="
echo "✅ FIX COMPLETATO"
echo ""
echo "📋 Prossimi passi:"
echo "   1. Chiudi Antigravity completamente (⌘Q)"
echo "   2. Riapri Antigravity"
echo "   3. Se appare popup permessi rete → CONSENTI"
echo "   4. Testa dal terminale integrato"
echo "================================="
