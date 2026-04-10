'use strict';

/**
 * Store — API Layer + In-Memory Cache
 * Fusion ERP v1.0
 *
 * Provides:
 *  - Store.api(action, module, body, method) — POST/PUT/DELETE requests
 *  - Store.get(action, module, params)       — GET requests with caching
 *  - Store.invalidate(key)                   — Cache invalidation
 *  - Store.clearCache()                      — Full cache flush
 *
 * Also exports UI — Modal, Toast, Confirm, Loading overlay, Skeleton.
 *
 * SOURCE FILE — the minified production version is js/core/store.js
 */

const Store = (() => {
    // ─── Base URL Detection ──────────────────────────────────────────────────
    const _baseUrl = (() => {
        const scripts = document.getElementsByTagName('script');
        for (let s of scripts) {
            if (s.src && s.src.includes('js/core/store.js')) {
                return s.src.split('js/core/store.js')[0];
            }
        }
        return '';
    })();

    /**
     * Build the full API URL for a given module and action.
     * @param {string} module - Backend module name (e.g. 'auth', 'athletes')
     * @param {string} action - Controller method name (e.g. 'login', 'list')
     * @returns {string} Full API URL
     */
    const _buildUrl = (module, action) =>
        `${_baseUrl}api/router.php?module=${encodeURIComponent(module)}&action=${encodeURIComponent(action)}`;

    // ─── Cache ───────────────────────────────────────────────────────────────
    /** @type {Map<string, { data: any, expiresAt: number }>} */
    const _cache = new Map();

    /** Maximum number of entries in the cache (LRU eviction) */
    const MAX_CACHE_SIZE = 100;

    /** TTL overrides per action/module key (milliseconds) */
    const _ttlMap = {
        'list/athletes': 300000,       // 5 min
        'teams/athletes': 600000,      // 10 min
        'list/tasks': 120000,          // 2 min
        'list/transport': 120000,
        'squadSummary/payments': 120000,
        'dashboard/payments': 60000,   // 1 min
        'overdueList/payments': 60000,
        'dashboard/dashboard': 60000,
        'list/vehicles': 300000,
        'list/suppliers': 300000,
        'list/teams': 600000,
        'default': 60000               // 1 min default
    };

    /**
     * Build a cache key from action, module, and optional query params.
     */
    function _cacheKey(action, module, params) {
        const qs = Object.keys(params).length
            ? '?' + new URLSearchParams(params).toString()
            : '';
        return `${action}/${module}${qs}`;
    }

    /**
     * Read from cache if not expired.
     * @returns {any|null} Cached data or null
     */
    function _cacheRead(key) {
        const entry = _cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            _cache.delete(key);
            return null;
        }
        return entry.data;
    }

    /**
     * Write to cache with appropriate TTL. Evicts oldest entry if over limit.
     */
    function _cacheWrite(key, data, action, module) {
        const ttl = _ttlMap[`${action}/${module}`] ?? _ttlMap.default;
        _cache.set(key, { data, expiresAt: Date.now() + ttl });

        // LRU eviction: remove oldest entries when cache is full
        if (_cache.size > MAX_CACHE_SIZE) {
            const oldest = _cache.keys().next().value;
            _cache.delete(oldest);
        }
    }

    // ─── Response Handler ────────────────────────────────────────────────────
    /**
     * Parse and validate API response. Handles 401 (session expired) globally.
     * @param {Response} response - Fetch Response object
     * @returns {Promise<any>} Parsed response data
     * @throws {Error} On non-success responses
     */
    async function _handleResponse(response) {
        // Session expired — reload to re-authenticate
        if (response.status === 401) {
            // Don't reload if we're already on /me or /login (prevent infinite loop)
            if (response.url.includes('action=me') || response.url.includes('action=login')) {
                throw new Error('Non autorizzato');
            }

            // Debounce: prevent rapid consecutive reloads
            const lastReload = sessionStorage.getItem('fusion_last_401_time');
            const now = Date.now();
            if (lastReload && (now - parseInt(lastReload)) < 3000) {
                throw new Error('Loop 401');
            }
            sessionStorage.setItem('fusion_last_401_time', now.toString());

            _cache.clear();
            window.location.reload();
            throw new Error('Ripristino sessione...');
        }

        // Parse JSON body
        let body;
        try {
            body = await response.json();
        } catch (_parseError) {
            const err = new Error(`Errore di rete o server irraggiungibile (HTTP ${response.status})`);
            throw new Error(Utils.friendlyError(err));
        }

        // Application-level error
        if (!response.ok || !body.success) {
            const msg = body.error || 'Errore sconosciuto durante la richiesta API';
            const err = new Error(msg);
            if (response.status >= 500) {
                throw new Error(Utils.friendlyError(err));
            }
            throw err;
        }

        return body.data;
    }

    // ─── Public API ──────────────────────────────────────────────────────────
    return {
        /**
         * Make a state-changing API request (POST/PUT/DELETE).
         * @param {string} action  - Backend action name
         * @param {string} module  - Backend module name
         * @param {object|FormData} body - Request body (JSON object or FormData for file uploads)
         * @param {string} [method='POST'] - HTTP method
         * @returns {Promise<any>} Response data
         */
        api: async function (action, module, body = {}, method = 'POST') {
            const url = _buildUrl(module, action);
            const isFormData = body instanceof FormData;

            const opts = {
                method,
                headers: isFormData
                    ? { 'X-Requested-With': 'XMLHttpRequest' }
                    : { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
                body: isFormData
                    ? body
                    : (Object.keys(body).length > 0 ? JSON.stringify(body) : undefined)
            };

            try {
                const response = await fetch(url, opts);
                return await _handleResponse(response);
            } catch (err) {
                console.error(`Store.api Error [${module}/${action}]:`, err);
                throw err;
            }
        },

        /**
         * Make a GET request with automatic caching.
         * @param {string} action  - Backend action name
         * @param {string} module  - Backend module name
         * @param {object} [params={}] - Query parameters
         * @returns {Promise<any>} Response data (from cache or network)
         */
        get: async function (action, module, params = {}) {
            const key = _cacheKey(action, module, params);

            // Return cached data if available and not expired
            const cached = _cacheRead(key);
            if (cached !== null) return cached;

            // Build URL with query params
            let url = _buildUrl(module, action);
            if (Object.keys(params).length > 0) {
                for (const [k, v] of Object.entries(params)) {
                    url += `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
                }
            }
            // Cache-buster to prevent CDN/proxy caching
            url += `&_cb=${Date.now()}`;

            const opts = {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            };

            try {
                const response = await fetch(url, opts);
                const data = await _handleResponse(response);
                _cacheWrite(key, data, action, module);
                return data;
            } catch (err) {
                console.error(`Store.get Error [${module}/${action}]:`, err);
                throw err;
            }
        },

        /**
         * Invalidate cache entries matching a key prefix.
         * @param {string} key - Cache key or prefix to invalidate
         */
        invalidate: function (key) {
            for (const k of _cache.keys()) {
                if (k === key || k.startsWith(key + '/') || k.startsWith(key + '?') || k.includes('/' + key)) {
                    _cache.delete(k);
                }
            }
        },

        /**
         * Clear the entire cache.
         */
        clearCache: function () {
            _cache.clear();
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════════
// UI — Modal, Toast, Confirm, Loading Overlay, Skeleton
// ═══════════════════════════════════════════════════════════════════════════════

const UI = (() => {
    /** Active loading overlay counter (supports nested show/hide) */
    let _loadingCount = 0;

    /**
     * Create and display a modal dialog.
     * @param {{ title: string, body: string|Node, footer?: string|Node, onClose?: () => void }} options
     * @returns {{ close: () => void }} Modal control object
     */
    function modal({ title, body, footer = '', onClose }) {
        const container = document.getElementById('modal-container');
        if (!container) return null;

        // Save focus for restoration after close
        const previousFocus = document.activeElement;

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

        // Insert body content
        const bodyEl = container.querySelector('.modal-body');
        if (typeof body === 'string') {
            bodyEl.innerHTML = body;
        } else if (body instanceof Node) {
            bodyEl.appendChild(body);
        }

        // Insert footer if provided
        if (footer) {
            const footerEl = document.createElement('div');
            footerEl.className = 'modal-footer';
            if (typeof footer === 'string') {
                footerEl.innerHTML = footer;
            } else if (footer instanceof Node) {
                footerEl.appendChild(footer);
            }
            container.querySelector('.modal').appendChild(footerEl);
        }

        const overlay = document.getElementById('modal-overlay');
        const closeBtn = document.getElementById('modal-close-btn');

        // Accessibility: hide elements behind modal
        const hiddenEls = ['#sidebar', '#topbar']
            .map(s => document.querySelector(s))
            .filter(Boolean);
        hiddenEls.forEach(el => el.setAttribute('aria-hidden', 'true'));

        // Focus trap
        const getFocusable = () =>
            Array.from(overlay.querySelectorAll(
                'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
            ));

        const trapFocus = (e) => {
            if (e.key !== 'Tab') return;
            const focusable = getFocusable();
            if (!focusable.length) { e.preventDefault(); return; }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };

        const escHandler = (e) => { if (e.key === 'Escape') close(); };

        const close = () => {
            document.removeEventListener('keydown', trapFocus);
            document.removeEventListener('keydown', escHandler);
            container.innerHTML = '';
            hiddenEls.forEach(el => el.removeAttribute('aria-hidden'));
            if (previousFocus && typeof previousFocus.focus === 'function') {
                try { previousFocus.focus(); } catch (_e) { /* noop */ }
            }
            if (onClose) onClose();
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', trapFocus);
        document.addEventListener('keydown', escHandler);

        // Auto-focus first focusable element
        requestAnimationFrame(() => {
            const focusable = getFocusable();
            if (focusable.length) focusable[0].focus();
        });

        return { close };
    }

    return {
        /**
         * Show or hide the full-screen loading overlay.
         * Supports nested calls (show/hide must be balanced).
         * @param {boolean} show - true to show, false to hide
         */
        loading: function (show) {
            _loadingCount = Math.max(0, _loadingCount + (show ? 1 : -1));

            let overlay = document.getElementById('loader-overlay');

            if (_loadingCount > 0) {
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'loader-overlay';
                    overlay.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);z-index:9999;display:flex;align-items:center;justify-content:center;color:white;opacity:0;transition:opacity 0.3s ease;';
                    overlay.innerHTML = `<div class="loader-content" style="text-align:center;"><div class="loader-spinner" style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:var(--color-pink);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div><div style="font-family:var(--font-display);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.8;">Caricamento...</div></div>`;
                    document.body.appendChild(overlay);
                    requestAnimationFrame(() => overlay.style.opacity = '1');
                } else {
                    overlay.style.display = 'flex';
                    overlay.style.opacity = '1';
                }
            } else if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => { if (_loadingCount <= 0) overlay.style.display = 'none'; }, 300);
            }
        },

        /**
         * Display a toast notification.
         * @param {string} message - Message text
         * @param {'success'|'error'|'info'} [type='info'] - Toast type
         * @param {number} [duration=4000] - Auto-dismiss duration in ms
         */
        toast: function (message, type = 'info', duration = 4000) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const icons = {
                success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
                error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF00FF" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
                info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
            };

            const toast = document.createElement('div');
            toast.className = `toast toast-${Utils.escapeHtml(type)}`;
            toast.setAttribute('role', 'alert');
            toast.innerHTML = `${icons[type] || icons.info}<span>${Utils.escapeHtml(message)}</span>`;

            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 200ms ease';
                setTimeout(() => toast.remove(), 200);
            }, duration);
        },

        /**
         * Return skeleton loading HTML for a page placeholder.
         * @returns {string} HTML string
         */
        skeletonPage: function () {
            return `
              <div class="page-body" style="display:flex;flex-direction:column;gap:var(--sp-2);">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width:40%;"></div>
                <div style="margin-top:var(--sp-3);display:flex;flex-direction:column;gap:8px;">
                  ${Array.from({ length: 6 }, () =>
                      `<div class="skeleton skeleton-text" style="width:${50 + 45 * Math.random() | 0}%;"></div>`
                  ).join('')}
                </div>
              </div>`;
        },

        /** @see modal */
        modal,

        /**
         * Display a confirmation dialog with Cancel/Confirm buttons.
         * @param {string} message - Confirmation question
         * @param {() => void} onConfirm - Callback on confirm
         */
        confirm: function (message, onConfirm) {
            const body = document.createElement('p');
            body.textContent = message;

            const footer = document.createDocumentFragment();
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-ghost btn-sm';
            cancelBtn.id = 'confirm-cancel';
            cancelBtn.type = 'button';
            cancelBtn.textContent = 'Annulla';

            const okBtn = document.createElement('button');
            okBtn.className = 'btn btn-danger btn-sm';
            okBtn.id = 'confirm-ok';
            okBtn.type = 'button';
            okBtn.textContent = 'Conferma';

            footer.appendChild(cancelBtn);
            footer.appendChild(okBtn);

            const m = modal({ title: 'Conferma', body, footer });

            document.getElementById('confirm-cancel')?.addEventListener('click', () => m.close());
            document.getElementById('confirm-ok')?.addEventListener('click', () => {
                m.close();
                onConfirm();
            });
        }
    };
})();

window.Store = Store;
window.UI = UI;
