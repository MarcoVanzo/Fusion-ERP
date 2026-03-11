/**
 * vald.js — VALD Performance Integration Module
 * Fusion ERP v1.0
 */

/* global Store, UI */

/**
 * Trigger a manual VALD sync via the backend API.
 * Shows a spinner on the button and a toast on completion.
 * @param {HTMLButtonElement} [btn] - The button element to show spinner on
 */
export async function syncVald(btn) {
  const buttonEl = btn || document.getElementById('vald-sync-btn');
  const originalHtml = buttonEl ? buttonEl.innerHTML : '';

  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.innerHTML = '<i class="ph ph-spinner" style="animation:spin 1s linear infinite;display:inline-block;"></i> Sincronizzando…';
  }

  try {
    const result = await Store.api('sync', 'vald', {});
    const {synced = 0, found = 0} = result || {};

    if (synced > 0) {
      UI.toast(`✅ Sincronizzazione completata: ${synced} nuovi test su ${found} trovati.`, 'success', 5000);
    } else if (found > 0) {
      UI.toast(`ℹ️ ${found} test trovati, nessun nuovo dato da importare.`, 'info', 4000);
    } else {
      UI.toast('ℹ️ Nessun test nuovo trovato su VALD.', 'info', 3000);
    }
  } catch (err) {
    UI.toast('❌ Errore sincronizzazione VALD: ' + (err.message || err), 'error', 5000);
  } finally {
    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.innerHTML = originalHtml;
    }
  }
}

/**
 * Render the HTML for the VALD sync button.
 * @returns {string}
 */
export function syncButtonHtml() {
  return `
    <button
      id="vald-sync-btn"
      type="button"
      class="btn btn-sm btn-default"
      style="display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:4px 12px;border-color:rgba(255,0,255,0.3);color:var(--color-pink);"
      title="Sincronizza dati VALD ForceDecks"
    >
      <i class="ph ph-arrows-clockwise" style="font-size:13px;"></i>
      Sincronizza VALD
    </button>
  `;
}

/**
 * Attach the click listener to the VALD sync button (if present in DOM).
 * Call after rendering the button HTML into the DOM.
 */
export function attachSyncButton() {
  const btn = document.getElementById('vald-sync-btn');
  if (btn) {
    btn.addEventListener('click', () => syncVald(btn));
  }
}
