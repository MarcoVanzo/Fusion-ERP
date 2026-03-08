# Fusion ERP — Component Library

> Design system reference for developers. Follow these conventions for all new UI code.

---

## 1. Spacing Tokens

| Token | Value | Use |
|---|---|---|
| `--sp-1` | 4px | Tight spacing (icon gap, badge padding) |
| `--sp-2` | 8px | Default inline gap |
| `--sp-3` | 16px | Section gap between related elements |
| `--sp-4` | 24px | Block gap between sections |
| `--sp-5` | 32px | Page-level spacing |
| `--sp-6` | 48px | Hero/hero padding |

---

## 2. Color Tokens

### Text
| Token | Value | Use |
|---|---|---|
| `--text-primary` | `#fff` / high opacity | Headings, strong labels |
| `--text-secondary` | ~70% white | Body text, descriptions |
| `--text-muted` | ~55% white | Captions, hints, placeholders |
| `--color-text-dim` | alias → `--text-muted` | Legacy alias |

### Accent
| Token | Hex | Use |
|---|---|---|
| `--accent-primary` | `#E6007E` | CTA buttons, active states, focus rings |
| `--color-cyan` | `#00F2FE` | Highlights, search marks, VALD |
| `--color-success` | `#00E676` | Paid, healthy, success toasts |
| `--color-warning` | `#FFD600` | Pending, moderate ACWR |
| `--color-pink` | `#FF00FF` / `#E6007E` | Errors, overdue, critical |

### Backgrounds
| Token | Use |
|---|---|
| `--color-bg` | App root background |
| `--bg-surface` | Cards, panels |
| `--bg-surface-hover` | Card hover state |
| `--bg-glass` | Glassmorphism surface |
| `--color-bg-input` | Form inputs, search |

### Borders
| Token | Use |
|---|---|
| `--border-subtle` | `rgba(255,255,255,0.07)` — card borders |
| `--color-border` | Slightly stronger borders |

---

## 3. Typography

| Class / Tag | Font | Use |
|---|---|---|
| `h1`, `h2`, `h3` | Syne (display) | Page title, section heading |
| `body` default | Inter | Body text |
| `.font-mono` | JetBrains Mono | Codes, numbers |
| `.barlow` | Barlow Condensed | Athletic stats, large numbers |

---

## 4. Components

### Buttons

```html
<button class="btn btn-primary" type="button">Azione primaria</button>
<button class="btn btn-ghost" type="button">Secondario</button>
<button class="btn btn-danger" type="button">Elimina</button>
<button class="btn btn-primary btn-sm" type="button">Piccolo</button>
```

**Rules:**
- `btn-primary` → only for the single most-important CTA on a view
- `btn-ghost` → secondary and cancel actions
- `btn-danger` → destructive actions (delete, revoke) — always preceded by `UI.confirm()`
- Never use inline `style` on `.btn`; use modifier classes

---

### Badges

```html
<span class="badge badge-success">Pagato</span>
<span class="badge badge-warning">In attesa</span>
<span class="badge badge-danger">Scaduto</span>
<span class="badge badge-muted">N/A</span>
```

**Status mapping:**
| Status | Class |
|---|---|
| Paid / Active / OK | `badge-success` |
| Pending / Medium risk | `badge-warning` |
| Overdue / Error / High risk | `badge-danger` |
| Inactive / Unknown | `badge-muted` |

---

### Cards

```html
<div class="stat-card">
  <span class="stat-label">Atteso</span>
  <span class="stat-value">€ 1.200,00</span>
</div>
```

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Titolo sezione</h3>
  </div>
  <div class="card-body">...</div>
</div>
```

---

### Tables

```html
<div class="table-wrapper">
  <table class="table">
    <thead><tr><th>Nome</th><th>Importo</th><th>Stato</th></tr></thead>
    <tbody>
      <tr><td>Atleta</td><td>€ 150</td><td><span class="badge badge-success">Pagato</span></td></tr>
    </tbody>
  </table>
</div>
```

Always wrap in `.table-wrapper` for mobile horizontal scroll.

---

### Form Inputs

```html
<div class="form-group">
  <label class="form-label" for="my-input">Campo</label>
  <input id="my-input" class="form-input" type="text">
  <p class="form-error hidden" aria-live="polite">Messaggio di errore</p>
</div>

<select class="form-input form-select">
  <option value="">Seleziona...</option>
</select>
```

---

### Filter Chips

```html
<div class="filter-bar">
  <button class="filter-chip active" type="button">Tutti</button>
  <button class="filter-chip" type="button">Pagati</button>
  <button class="filter-chip" type="button">Scaduti</button>
</div>
```

---

### Empty State

```js
// Use the utility function — never write empty states manually
Utils.emptyState('Nessun dato', 'Nessun elemento trovato per questa selezione.');
```

---

### Skeleton Loaders

```js
// Show while loading, then replace with real content
container.innerHTML = Utils.skeletonRows(5);
```

---

### Modal

```js
// Always use UI.modal — never create modals manually
const m = UI.modal({
  title: 'Titolo modale',
  body: '<p>Contenuto</p>',
  footer: '<button class="btn btn-primary btn-sm" id="my-btn">Conferma</button>',
  onClose: () => console.log('chiuso'),
});
// UI.modal includes WCAG focus trap and focus restoration automatically
```

---

### Confirm Dialog

```js
// Always use for destructive actions — never use window.confirm()
UI.confirm(`Vuoi eliminare ${Utils.escapeHtml(nome)}?`, () => {
  // user confirmed
  doDelete();
});
```

---

### Toasts

```js
UI.toast('Operazione completata', 'success');
UI.toast('Elemento non trovato', 'error');
UI.toast('Dati aggiornati', 'info');
```

---

### Onboarding Help Tooltips

```js
// In a module template string:
`<h3>ACWR ${Onboarding.tooltipBtn('Acute:Chronic Workload Ratio. Valori <0.8 = sottocarico, 0.8–1.3 = zona ottimale, >1.5 = rischio infortunio')}</h3>`
```

---

## 5. Utility Classes

| Class | Equals |
|---|---|
| `.text-muted` | `color: var(--text-muted)` |
| `.text-secondary` | `color: var(--text-secondary)` |
| `.text-success` | `color: var(--color-success)` |
| `.text-danger` | `color: var(--color-pink)` |
| `.text-warning` | `color: var(--color-warning)` |
| `.flex-center` | `display:flex; align-items:center; gap: var(--sp-2)` |
| `.flex-between` | `display:flex; align-items:center; justify-content:space-between; gap: var(--sp-2)` |
| `.section-gap` | `margin-bottom: var(--sp-3)` |
| `.section-gap-sm` | `margin-bottom: var(--sp-2)` |
| `.w-full` | `width: 100%` |

---

## 6. API & Data Patterns

### Fetching data

```js
// GET (cached by Store TTL)
const athletes = await Store.get('list', 'athletes');

// POST mutation
await Store.api('save', 'athletes', { id, name, ... });

// After mutation: always invalidate the relevant cache prefix
Store.invalidate('list/athletes');
```

### Error handling

```js
try {
  const data = await Store.get('list', 'athletes');
} catch (err) {
  container.innerHTML = Utils.emptyState('Errore', Utils.friendlyError(err));
}
```

---

## 7. Forbidden Patterns

| ❌ Don't | ✅ Do instead |
|---|---|
| `window.confirm(...)` | `UI.confirm(...)` |
| `window.alert(...)` | `UI.toast(...)` |
| `style="color: rgba(255,255,255,0.4)"` | class `.text-muted` |
| `style="display:flex;align-items:center"` | class `.flex-center` |
| Hard-coded `rgba()` colors in JS templates | CSS variable |
| `innerHTML = '<h1>' + userInput + '</h1>'` | `Utils.escapeHtml(userInput)` |
| `throw err` in catch block of module | `Utils.friendlyError(err)` → UI message |
| Emoji in UI content | Phosphor icon (`<i class="ph ph-...">`) |
