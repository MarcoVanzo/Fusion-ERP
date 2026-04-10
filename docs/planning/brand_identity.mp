# 🎨 Brand Identity — Fusion ERP
> Guida visiva e di design per lo sviluppo dell'interfaccia dell'applicazione Fusion. Questo documento è la fonte unica di verità per stile, colori, tipografia e componenti UI.

---

## 1. DNA Visivo — The Look & Feel

L'app non deve sembrare un portale di statistiche, ma un'**estensione di un brand di moda sportiva**.

| Principio | Descrizione |
|---|---|
| **Stile** | Minimalismo aggressivo |
| **Contrasto** | Nero assoluto vs colori fluo |
| **Layout** | Ampio spazio negativo, testi grandi, immagini impattanti |
| **Tono** | Potenza, precisione, esclusività |

> **Regola principale**: ogni schermata deve comunicare immediatamente chi siamo. Nessun elemento superfluo, nessuna decorazione gratuita.

---

## 2. Palette Colori Definitiva

La combinazione cromatica è **audace e identitaria**. Usare esclusivamente questi colori in tutta l'applicazione.

| Nome | HEX | RGB | Utilizzo |
|---|---|---|---|
| **Deep Black** | `#000000` | `0, 0, 0` | Sfondi principali, dark mode default |
| **Fusion Pink** | `#E6007E` | `230, 0, 126` | CTA, icone attive, numeri maglia, notifiche |
| **Pure White** | `#FFFFFF` | `255, 255, 255` | Testi principali, bordi sottili |
| **Silver Gray** | `#E5E5E5` | `229, 229, 229` | Sfondi sezioni secondarie, testi disattivati |

### Regole d'uso dei colori

- **Non** introdurre colori non presenti in questa palette senza approvazione esplicita.
- Il **Fusion Pink** è riservato ad azioni primarie e highlight. Non usarlo come sfondo principale.
- Il **Silver Gray** è solo per elementi secondari o disattivati. Non usarlo per testo su sfondo nero (contrasto insufficiente).
- In caso di accenti per categoria (U13, U14, ecc.), usare variazioni di luminosità del Fusion Pink, **sempre su base nera**.

---

## 3. Tipografia

Fusion usa font **Bold e Condensed** (stretti e alti). Questo è fondamentale per trasmettere il senso di potenza e velocità.

### Font Stack

| Ruolo | Font consigliato | Alternativa | Caratteristiche |
|---|---|---|---|
| **Headers (H1–H3)** | [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) | Oswald | Bold, sempre MAIUSCOLO |
| **Body / UI** | [Inter](https://fonts.google.com/specimen/Inter) | Roboto | Regular/Medium, leggibile |
| **Numeri / Stats** | Barlow Condensed | — | Bold, monospaced se possibile |

### Regole tipografiche

- **Headers**: sempre in **TUTTO MAIUSCOLO** (`text-transform: uppercase`).
- **Letter-spacing**: leggermente ridotto per i titoli (`-0.02em`), aumentato per i sottotitoli (`+0.05em`).
- **Line-height**: compatto per i titoli (`1.0–1.1`), normale per il body (`1.5–1.6`).
- **Non** usare font serif o script. Non appartengono al DNA del brand.

---

## 4. Componenti UI

### A. Bottoni — The Fusion Button

Forma: **rettangolare perfetto**. Nessun arrotondamento (`border-radius: 0`).

```css
/* Stato normale */
.btn-fusion {
  background: #000000;
  border: 1px solid #FFFFFF;
  color: #FFFFFF;
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
}

/* Stato Hover / Active */
.btn-fusion:hover,
.btn-fusion:active {
  background: #E6007E;
  border-color: #E6007E;
  color: #000000;
}

/* CTA primario */
.btn-fusion--primary {
  background: #E6007E;
  border-color: #E6007E;
  color: #000000;
}
```

### B. Card — Risultati / News

- **No ombre** (`box-shadow: none`). Usare bordi sottili: `1px solid #E5E5E5` o `1px solid rgba(255,255,255,0.2)`.
- Le immagini devono avere un **filtro duotone** o essere molto sature.
- Testo sovrapposto alle immagini in stile **magazine**: titoli grandi che coprono parzialmente la foto.
- Rapporto immagine: preferire **16:9** o **4:3**. Mai immagini distorte.

### C. Iconografia

- Usare icone **minimaliste a tratto sottile** (Thin Stroke, 1–1.5px).
- Librerie consigliate: [Phosphor Icons](https://phosphoricons.com/), [Lucide](https://lucide.dev/).
- **Evitare** icone giocose, arrotondate o con fill solido. Devono essere taglienti e precise.
- Dimensioni standard: `20px` per UI inline, `24px` per navigazione, `32px` per highlight.

### D. Spacing & Layout

- Unità base: `8px`. Tutti gli spazi devono essere multipli di 8 (8, 16, 24, 32, 48, 64...).
- Molto spazio negativo: non affollare le schermate.
- Separatori: usare linee `1px` o spazio negativo. Mai elementi decorativi pesanti.

---

## 5. User Experience (UX)

Data la struttura del club (unione di più società), l'app deve gestire la complessità in modo semplice.

### Navigazione

- **Filtro per Categoria** immediato (U13, U14, U16, B1).
- Ogni categoria può avere un **accento di colore lievemente diverso**, ma sempre su base nera.
- Navigazione bottom tab (mobile) o sidebar collassabile (desktop).

### Player Profile

- Schermata **Hero**: foto dell'atleta a figura intera (senza sfondo) che svetta sopra i dati tecnici.
- Dati visualizzati: altezza, ruolo, numero maglia, punti/statistiche principali.
- Statistiche in font Barlow Condensed Bold, numeri grandi e impattanti.

### Live Match

- **Ticker orizzontale** in cima alla schermata (stile NBA) con punteggio in tempo reale.
- Colori ticker: testo rosa fluo (`#E6007E`) su fondo nero (`#000000`).
- Animazione dello score update: fade-in rapido (< 300ms), nessuna animazione complessa.

### Notifiche Push

- Icona notifica in **Fusion Pink** per massima visibilità nel centro notifiche.
- Tono del messaggio: diretto, breve, senza emoji eccessive.

---

## 6. Performance & Animazioni

L'app deve essere **più veloce e diretta** rispetto al sito web.

- **Meno animazioni superflue**: usare transizioni solo dove aggiungono valore (hover, tab switch, toast).
- Durata animazioni: max `200–300ms`. Nessuna animazione oltre `500ms`.
- `transition: all` è **vietato**. Animare solo la proprietà specifica (es. `background-color`, `opacity`).
- Dati immediatamente visibili: nessuna schermata di caricamento lunga. Usare skeleton loader.

---

## 7. Checklist Pre-Sviluppo UI

Prima di implementare qualsiasi componente, verificare:

- [ ] Il colore usato è nella palette ufficiale?
- [ ] Il font è Barlow Condensed (titoli) o Inter (body)?
- [ ] I bottoni hanno `border-radius: 0`?
- [ ] Le card non hanno ombre?
- [ ] Le icone sono a tratto sottile?
- [ ] Gli spacing sono multipli di 8px?
- [ ] I testi su sfondo nero hanno contrasto sufficiente?
- [ ] Le animazioni durano meno di 300ms?
- [ ] Il Fusion Pink è usato solo per CTA e highlight, non come sfondo?

---

## Changelog

| Versione | Data | Note |
|---|---|---|
| **1.1** | 2026-02-28 | Ristrutturazione completa in Markdown, aggiunta tabella colori con RGB, CSS bottoni, regole spacing, checklist e sezione performance |
| **1.0** | — | Versione iniziale (testo non formattato) |