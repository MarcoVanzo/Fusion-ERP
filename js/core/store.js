/**
 * Store — API Fetch Wrapper + UI Feedback
 * Fusion ERP v1.0
 */

'use strict';

const Store = (() => {
    // ─── API Fetch (MOCKED FOR DEMO) ───────────────────────────────────────
    async function api(action, module, payload = {}, method = 'POST') {
        return new Promise(resolve => {
            setTimeout(() => {
                if (action === 'login') {
                    resolve({
                        id: 'USR_demo',
                        email: 'admin@fusionerp.it',
                        role: 'admin',
                        fullName: 'Amministratore (Demo Bypass)',
                        needsReset: false
                    });
                } else if (action === 'logout') {
                    resolve(true);
                } else {
                    resolve({});
                }
            }, 300);
        });
    }

    // Convenience GET wrapper (MOCKED FOR DEMO)
    async function get(action, module, params = {}) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (action === 'me') {
                    // Fail once to show login screen, or resolve to auto-login
                    // Let's resolve to let them auto-login if they refresh
                    resolve({
                        id: 'USR_demo',
                        email: 'admin@fusionerp.it',
                        role: 'admin',
                        fullName: 'Amministratore (Demo Bypass)'
                    });
                } else {
                    resolve([]); // Default to empty array for data lists
                }
            }, 300);
        });
    }

    return { api, get };
})();

// ─── UI Helpers ────────────────────────────────────────────────────────────
const UI = (() => {
    let _loadingCount = 0;

    // ─── Loading State ───────────────────────────────────────────────────────
    function loading(show) {
        _loadingCount = Math.max(0, _loadingCount + (show ? 1 : -1));
        // Optionally show a global loading bar here (future enhancement)
    }

    // ─── Toast Notifications ─────────────────────────────────────────────────
    function toast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E6007E" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
            info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        };

        const t = document.createElement('div');
        t.className = `toast toast-${Utils.escapeHtml(type)}`;
        t.setAttribute('role', 'alert');
        t.innerHTML = `${icons[type] || icons.info}<span>${Utils.escapeHtml(message)}</span>`;
        container.appendChild(t);

        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transition = 'opacity 200ms ease';
            setTimeout(() => t.remove(), 200);
        }, duration);
    }

    // ─── Loading Skeleton ─────────────────────────────────────────────────────
    function skeletonPage() {
        return `
      <div class="page-body" style="display:flex;flex-direction:column;gap:var(--sp-2);">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text" style="width:40%;"></div>
        <div style="margin-top:var(--sp-3);display:flex;flex-direction:column;gap:8px;">
          ${Array.from({ length: 6 }, () => `<div class="skeleton skeleton-text" style="width:${50 + Math.random() * 45 | 0}%;"></div>`).join('')}
        </div>
      </div>`;
    }

    // ─── Modal ────────────────────────────────────────────────────────────────
    function modal({ title, body, footer = '', onClose }) {
        const container = document.getElementById('modal-container');
        if (!container) return null;

        container.innerHTML = `
      <div class="modal-overlay" id="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-title">${Utils.escapeHtml(title)}</h2>
            <button class="btn btn-ghost btn-sm" id="modal-close-btn" aria-label="Chiudi finestra" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">${body}</div>
          ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        </div>
      </div>`;

        const overlay = document.getElementById('modal-overlay');
        const closeBtn = document.getElementById('modal-close-btn');

        const close = () => {
            container.innerHTML = '';
            if (onClose) onClose();
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
        });

        return { close };
    }

    // ─── Confirm Dialog ───────────────────────────────────────────────────────
    function confirm(message, onConfirm) {
        const m = modal({
            title: 'Conferma',
            body: `<p>${Utils.escapeHtml(message)}</p>`,
            footer: `
        <button class="btn btn-ghost btn-sm" id="confirm-cancel" type="button">Annulla</button>
        <button class="btn btn-danger btn-sm" id="confirm-ok" type="button">Conferma</button>`,
        });
        document.getElementById('confirm-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('confirm-ok')?.addEventListener('click', () => { m.close(); onConfirm(); });
    }

    return { loading, toast, skeletonPage, modal, confirm };
})();
