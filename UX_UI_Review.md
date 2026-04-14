# 🎨 UX/UI Review — Fusion ERP Redesign

## 1. 🔴 Friction Points e Problemi di Accessibilità
- **Contrasto Insufficiente:** I testi placeholder, le icone e in particolare i link di servizio ("Password dimenticata?") presentano un contrasto cromatico molto basso. Il link rosso scuro su uno sfondo scuro/bluastro è difficile da leggere (non a norma WCAG). Anche il testo all'interno dei campi di input risulta troppo buio.
- **Feedback di Errore Invasivo (Layout Shift):** L'errore di validazione (es. "Inserisci il tuo indirizzo email") appare spingendo i contenuti verso il basso in modo frammentario. Questo *Cumulative Layout Shift* (CLS) rompe l'equilibrio percettivo dell'interfaccia.
- **Collisioni di Elementi UI:** Il pulsante toggle per la password ("Mostra" / Icona Occhio) entra frequentemente in collisione con le icone dei password manager o i controlli nativi (`...`), generando un caos visivo sul lato destro del campo e impedendo un clic preciso.

## 2. 🎨 Errori di UI (Spaziature, Palette, Tipografia)
- **Palette Colori Disordinata:** Lo sfondo ad orbite (viola/blu/rosso), il bordo di focus ciano acceso su sfondo quasi nero e il bottone con gradiente magenta-viola creano una dissonanza cromatica. Manca un Design System rigoroso basato su tonalità di brand specifiche abbinate a una rigorosa scala di grigi/neutri.
- **Tipografia e Gerarchia:** Il titolo "*GET GAME READY*" in stile display obliquo color azzurro stride fortemente con la natura austera del form sottostante. Manca un peso grafico intermedio (font weight, letter-spacing) che guidi l'occhio dall'header ai campi da compilare, che appaiono schiacciati.
- **Gestione Spazi / Negative Space:** Il padding interno ai campi di testo e attorno alle etichette (label) è ridotto, trasmettendo una sensazione da "vecchio form HTML". Il pannello di Auth nel complesso non "respira" all'interno dello schermo. L'effetto "Glass" del pannello non è sostenuto da bordi luminosi o da una profondità (ombra) marcata, risultando piatto.

## 3. 🟢 Soluzioni Architetturali Proposte (Premium SaaS Style)
- **"Frosted Glass" & Modern Dark Mode:** Ripristinare un senso di pulizia utilizzando l'effetto Glassmorphism in modo premium. Il form risiederà in un layer semitrasparente (`backdrop-filter: blur(24px)`) con un leggerissimo bordo metallico (`border: 1px solid rgba(255,255,255,0.1)`) e luci indirette e sfumate.
- **Focus States & Micro-Animazioni Intelligenti:**
  - Il bordo di focus non sarà un semplice stroke durissimo da 1-2px, ma un leggero *glow ring* fluido (es. `box-shadow` e `border-color` soft-brand).
  - Le animazioni di validazione useranno curve `cubic-bezier(0.4, 0, 0.2, 1)`. I messaggi d'errore si "srotoleranno" dolcemente.
- **Componenti Input di Alta Gamma:** Spaziature interne (padding) generose (`1rem` / `1.5rem`), icone monocolore perfettamente allineate, e label chiare in grigio perla/argento tenue per risolvere i contrasti. Il selettore password sarà snellito in un'icona elegante, sistemando definitivamente lo spacing destro.
- **Typography Scale Systemotica:** Uso coerente della font family "Inter", valorizzando i pesi light/medium e rimuovendo i rossi d'emergenza dai link per optare su underline dinamici interattivi (es. colore primario opaco al passaggio del mouse).

---
Attendo approvazione per cominciare a modificare il codice frontend (CSS tokens, layers e HTML) per la fase di refactoring strutturale e di redesign.
