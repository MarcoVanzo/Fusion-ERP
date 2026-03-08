/**
 * Store — API Fetch Wrapper + UI Feedback
 * Fusion ERP v1.0
 */

'use strict';

const Store = (() => {
    // Determina la base URL UNA SOLA VOLTA al caricamento del modulo
    // evitando di iterare tutti i <script> tag ad ogni chiamata API.
    const _baseUrl = (() => {
        const scripts = document.getElementsByTagName('script');
        for (let s of scripts) {
            if (s.src && s.src.includes('js/core/store.js')) {
                return s.src.split('js/core/store.js')[0];
            }
        }
        return '';
    })();

    const getApiUrl = (module, action) =>
        `${_baseUrl}api/router.php?module=${encodeURIComponent(module)}&action=${encodeURIComponent(action)}`;

    // ─── CLIENT-SIDE TTL CACHE (LT#4) ────────────────────────────────────────
    // Session-scoped (not persisted) — avoids stale data across logins.
    // Keys are `action/module?param=value` strings.
    const _cache = new Map();

    /** TTL in milliseconds per action/module key. Falls back to _TTL.default. */
    const _TTL = {
        'list/athletes': 5 * 60_000,   // 5 min
        'teams/athletes': 10 * 60_000,  // 10 min
        'list/tasks': 2 * 60_000,   // 2 min
        'list/transport': 2 * 60_000,
        'squadSummary/payments': 2 * 60_000,
        'dashboard/payments': 1 * 60_000,
        'overdueList/payments': 1 * 60_000,
        'dashboard/dashboard': 1 * 60_000,
        'list/vehicles': 5 * 60_000,
        'list/suppliers': 5 * 60_000,
        'list/teams': 10 * 60_000,
        default: 60_000,                      // 1 min fallback
    };

    function _cacheKey(action, module, params) {
        const qs = Object.keys(params).length
            ? '?' + new URLSearchParams(params).toString()
            : '';
        return `${action}/${module}${qs}`;
    }

    function _cacheGet(key) {
        const entry = _cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) { _cache.delete(key); return null; }
        return entry.data;
    }

    function _cacheSet(key, data, action, module) {
        const ttl = _TTL[`${action}/${module}`] ?? _TTL.default;
        _cache.set(key, { data, expiresAt: Date.now() + ttl });
    }

    /**
     * Bust all cache entries whose key starts with the given prefix.
     * Call this with `action/module` from mutation handlers after writes.
     * Example: Store.invalidate('list/athletes') after saving an athlete.
     */
    function invalidate(prefix) {
        for (const key of _cache.keys()) {
            if (key.startsWith(prefix)) _cache.delete(key);
        }
    }

    /** Clear the entire cache — call on logout. */
    function clearCache() { _cache.clear(); }

    /**
     * Helper per gestire la risposta fetch.
     * Gestisce i 401 (Unauthorized) in modo globale ricaricando la pagina.
     */
    async function _handleResponse(response) {
        if (response.status === 401) {
            // Evita loop infiniti ricaricando la pagina durante il check iniziale e il login
            if (response.url.includes('action=me') || response.url.includes('action=login')) {
                throw new Error('Non autorizzato');
            }
            // Se riceviamo 401 su altre chiamate, la sessione è scaduta o non valida, puliamo e forziamo il ricaricamento
            window.location.reload();
            throw new Error('Non autorizzato');
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            // Network / parse error — use friendly message
            const raw = new Error(`Errore di rete o server irraggiungibile (HTTP ${response.status})`);
            throw new Error(Utils.friendlyError(raw));
        }

        if (!response.ok || !data.success) {
            // Domain errors (validation, business logic) are already human-readable — pass through.
            // Infrastructure errors (5xx) get mapped to friendly messages.
            const rawMsg = data.error || 'Errore sconosciuto durante la richiesta API';
            const err = new Error(rawMsg);
            throw response.status >= 500
                ? new Error(Utils.friendlyError(err))
                : err;
        }

        return data.data;
    }

    // ─── API Fetch ─────────────────────────────────────────────────────────────
    async function api(action, module, payload = {}, method = 'POST') {
        const url = getApiUrl(module, action);

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin', // Include session cookies!
            body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined
        };

        try {
            const response = await fetch(url, options);
            return await _handleResponse(response);
        } catch (error) {
            console.error(`Store.api Error [${module}/${action}]:`, error);
            throw error;
        }
    }

    // Convenience GET wrapper — reads from TTL cache before hitting the network.
    async function get(action, module, params = {}) {
        const cacheKey = _cacheKey(action, module, params);
        const cached = _cacheGet(cacheKey);
        if (cached !== null) {
            return cached;
        }

        let url = getApiUrl(module, action);

        // Append optional params to URL string
        if (Object.keys(params).length > 0) {
            for (const [key, value] of Object.entries(params)) {
                url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            }
        }

        const options = {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'same-origin' // Include session cookies!
        };

        try {
            const response = await fetch(url, options);
            const data = await _handleResponse(response);
            _cacheSet(cacheKey, data, action, module);
            return data;
        } catch (error) {
            console.error(`Store.get Error [${module}/${action}]:`, error);
            throw error;
        }
    }

    return { api, get, invalidate, clearCache };
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
            error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF00FF" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
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
    /**
     * @param {Object} props
     * @param {string} props.title - Il titolo della modale. Verrà eseguito in escape sicuro.
     * @param {string|Element} props.body - [ATTENZIONE XSS] Il corpo in HTML o Elemento DOM.
     * @param {string|Element} [props.footer=''] - [ATTENZIONE XSS] Il footer in HTML o Elemento DOM.
     * @param {Function} [props.onClose] - Callback chiamato alla chiusura.
     */
    function modal({ title, body, footer = '', onClose }) {
        const container = document.getElementById('modal-container');
        if (!container) return null;

        // LT#3: remember the element that triggered the modal to restore focus on close
        const _trigger = document.activeElement;

        container.innerHTML = `
      <div class="modal-overlay" id="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-title">${Utils.escapeHtml(title)}</h2>
            <button class="btn btn-ghost btn-sm" id="modal-close-btn" aria-label="Chiudi finestra" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body"></div>
        </div>
      </div>`;

        const modalBody = container.querySelector('.modal-body');
        if (typeof body === 'string') {
            modalBody.innerHTML = body;
        } else if (body instanceof Node) {
            modalBody.appendChild(body);
        }

        if (footer) {
            const footerContainer = document.createElement('div');
            footerContainer.className = 'modal-footer';
            if (typeof footer === 'string') {
                footerContainer.innerHTML = footer;
            } else if (footer instanceof Node) {
                footerContainer.appendChild(footer);
            }
            container.querySelector('.modal').appendChild(footerContainer);
        }

        const overlay = document.getElementById('modal-overlay');
        const closeBtn = document.getElementById('modal-close-btn');

        // LT#3: hide sidebar and topbar from screen readers while modal is open
        const _ariaHideTargets = ['#sidebar', '#topbar'].map(s => document.querySelector(s)).filter(Boolean);
        _ariaHideTargets.forEach(el => el.setAttribute('aria-hidden', 'true'));

        // LT#3: Focus Trap — collect all focusable elements inside the modal
        const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
        const _getFocusable = () => Array.from(overlay.querySelectorAll(FOCUSABLE));

        const _trapFocus = (e) => {
            if (e.key !== 'Tab') return;
            const focusable = _getFocusable();
            if (!focusable.length) { e.preventDefault(); return; }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };

        const _escHandler = (e) => { if (e.key === 'Escape') close(); };

        const close = () => {
            document.removeEventListener('keydown', _trapFocus);
            document.removeEventListener('keydown', _escHandler);
            container.innerHTML = '';
            // Restore aria-hidden and focus
            _ariaHideTargets.forEach(el => el.removeAttribute('aria-hidden'));
            if (_trigger && typeof _trigger.focus === 'function') {
                try { _trigger.focus(); } catch (_) { }
            }
            if (onClose) onClose();
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', _trapFocus);
        document.addEventListener('keydown', _escHandler);

        // LT#3: focus first focusable element in modal on open
        requestAnimationFrame(() => {
            const focusable = _getFocusable();
            if (focusable.length) focusable[0].focus();
        });

        return { close };
    }

    // ─── Confirm Dialog ───────────────────────────────────────────────────────
    function confirm(message, onConfirm) {
        const bodyEl = document.createElement('p');
        bodyEl.textContent = message;

        const footerFrag = document.createDocumentFragment();

        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn btn-ghost btn-sm';
        btnCancel.id = 'confirm-cancel';
        btnCancel.type = 'button';
        btnCancel.textContent = 'Annulla';

        const btnOk = document.createElement('button');
        btnOk.className = 'btn btn-danger btn-sm';
        btnOk.id = 'confirm-ok';
        btnOk.type = 'button';
        btnOk.textContent = 'Conferma';

        footerFrag.appendChild(btnCancel);
        footerFrag.appendChild(btnOk);

        const m = modal({
            title: 'Conferma',
            body: bodyEl,
            footer: footerFrag,
        });
        document.getElementById('confirm-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('confirm-ok')?.addEventListener('click', () => { m.close(); onConfirm(); });
    }

    return { loading, toast, skeletonPage, modal, confirm };
})();
