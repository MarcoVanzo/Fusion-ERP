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

window.Store = Store;
// UI has been separated into js/core/ui.js for single-responsibility.

