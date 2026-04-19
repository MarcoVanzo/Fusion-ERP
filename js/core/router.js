'use strict';

/**
 * Router — SPA Client-Side Navigation
 * Fusion ERP v1.0
 *
 * Route registry: single source of truth.
 * Each entry defines path, JS file to lazy-load, required permission, global module class name, and optionally type (e.g. 'module').
 * Adding a new route requires ONE change here only.
 *
 * @typedef {{ path: string, file: string, permission: string|null, module: string|null, type?: string }} RouteConfig
 */

const Router = (() => {
    /** @type {Record<string, boolean>} Tracks which module scripts have already been injected */
    const _loaded = {};

    /** @type {Record<string, object>} Caches imported/loaded module objects by file path */
    const _moduleCache = {};

    /** App version for cache-busting lazy-loaded modules */
    const _appVersion = document.querySelector('meta[name="app-version"]')?.content || Date.now();

    /** @type {string|null} Currently active route */
    let _currentRoute = null;

    /** @type {Record<string, string>} Current route params */
    let _params = {};

    // ─── Single Route Registry ──────────────────────────────────────────────────
    // permission: null = public route (no check), 'read'/'write' = auth required
    /** @type {RouteConfig[]} */
    const ROUTES = [
        // Core
        { path: 'dashboard',            file: 'js/modules/dashboard.js',           permission: null,   module: 'Dashboard'         },
        // Athletes
        { path: 'athletes',             file: 'js/modules/athletes.js',            permission: 'read', module: 'Athletes', type: 'module' },
        { path: 'athlete-profile',      file: 'js/modules/athletes.js',            permission: 'read', module: 'Athletes', type: 'module' },
        { path: 'athlete-payments',     file: 'js/modules/athletes.js',            permission: 'read', module: 'Athletes', type: 'module' },
        { path: 'athlete-metrics',      file: 'js/modules/athletes.js',            permission: 'read', module: 'Athletes', type: 'module' },
        { path: 'athlete-documents',    file: 'js/modules/athletes.js',            permission: 'read', module: 'Athletes', type: 'module' },
        { path: 'athlete-injuries',     file: 'js/modules/athletes.js',            permission: 'read', module: 'Athletes', type: 'module' },
        { path: 'athlete-attendances',  file: 'js/modules/athletes.js',            permission: 'read', module: 'Athletes', type: 'module' },
        // Transport & Vehicles
        { path: 'transport',            file: 'js/modules/transport.js',           permission: 'read', module: 'Transport', type: 'module' },
        { path: 'transport-drivers',    file: 'js/modules/transport.js',           permission: 'read', module: 'Transport', type: 'module' },
        { path: 'transport-refunds',    file: 'js/modules/transport.js',           permission: 'read', module: 'Transport', type: 'module' },
        { path: 'transport-fleet',      file: 'js/modules/vehicles/Vehicles.js',            permission: 'read', module: 'Vehicles', type: 'module' },
        // Admin
        { path: 'admin',                file: 'js/modules/admin/AdminDashboard.js', permission: 'read', module: 'AdminDashboard'   },
        { path: 'admin-backup',         file: 'js/modules/admin/AdminBackup.js',   permission: 'read', module: 'AdminBackup'       },
        { path: 'admin-logs',           file: 'js/modules/admin/AdminLogs.js',     permission: 'read', module: 'AdminLogs'         },
        { path: 'admin-settings',       file: 'js/modules/admin/AdminSettings.js', permission: 'read', module: 'AdminSettings'    },
        { path: 'admin-certs',          file: 'js/modules/admin/AdminCertificates.js', permission: 'read', module: 'AdminCertificates' },
        { path: 'admin-contracts',      file: 'js/modules/admin/AdminContracts.js', permission: 'read', module: 'AdminContracts'  },
        { path: 'admin-tasks',          file: 'js/modules/admin/AdminTasks.js',    permission: 'read', module: 'AdminTasks'        },
        { path: 'users',                file: 'js/modules/admin/AdminUsers.js',    permission: 'read', module: 'AdminUsers'        },
        { path: 'utenti',               file: 'js/modules/admin/AdminUsers.js',    permission: 'read', module: 'AdminUsers'        }, // legacy alias — keep until nav migrates fully
        // Out-of-Season & Tournaments
        { path: 'outseason',            file: 'js/modules/outseason.js',           permission: 'read', module: 'OutSeason'         },
        { path: 'outseason-camps',      file: 'js/modules/outseason.js',           permission: 'read', module: 'OutSeason'         },
        { path: 'outseason-tournaments', file: 'js/modules/tournaments.js',        permission: 'read', module: 'Tournaments', type: 'module' },
        { path: 'tournaments',          file: 'js/modules/tournaments.js',         permission: 'read', module: 'Tournaments', type: 'module' },
        // Social
        { path: 'social',               file: 'js/modules/social.js',              permission: 'read', module: 'Social'            },
        { path: 'social-analytics',     file: 'js/modules/social.js',              permission: 'read', module: 'Social'            },
        { path: 'social-gallery',       file: 'js/modules/social.js',              permission: 'read', module: 'Social'            },
        // Results
        { path: 'results',              file: 'js/modules/results.js',             permission: 'read', module: 'Results', type: 'module' },
        { path: 'results-matches',      file: 'js/modules/results.js',             permission: 'read', module: 'Results', type: 'module' },
        { path: 'results-standings',    file: 'js/modules/results.js',             permission: 'read', module: 'Results', type: 'module' },
        // Tasks & Staff
        { path: 'tasks',                file: 'js/modules/tasks.js',               permission: 'read', module: 'Tasks'             },
        { path: 'staff',                file: 'js/modules/staff.js',               permission: 'read', module: 'Staff', type: 'module' },
        { path: 'staff-documents',      file: 'js/modules/staff.js',               permission: 'read', module: 'Staff', type: 'module' },
        // Ecommerce
        { path: 'ecommerce',            file: 'js/modules/ecommerce.js',           permission: 'read', module: 'Ecommerce', type: 'module' },
        { path: 'ecommerce-articles',   file: 'js/modules/ecommerce.js',           permission: 'read', module: 'Ecommerce', type: 'module' },
        { path: 'ecommerce-orders',     file: 'js/modules/ecommerce.js',           permission: 'read', module: 'Ecommerce', type: 'module' },
        // Finance
        { path: 'finance',              file: 'js/modules/finance.js',             permission: 'admin', module: 'Finance', type: 'module' },
        { path: 'finance-invoices',     file: 'js/modules/finance.js',             permission: 'admin', module: 'Finance', type: 'module' },
        { path: 'finance-bank',         file: 'js/modules/finance.js',             permission: 'admin', module: 'Finance', type: 'module' },
        { path: 'finance-foresteria',   file: 'js/modules/finance.js',             permission: 'read', module: 'Finance', type: 'module' },
        // WhatsApp
        { path: 'whatsapp-inbox',       file: 'js/modules/whatsapp.js',            permission: 'read', module: 'WhatsApp'          },
        { path: 'whatsapp-contacts',    file: 'js/modules/whatsapp.js',            permission: 'read', module: 'WhatsApp'          },
        // Website & Newsletter
        { path: 'website',              file: 'js/modules/website.js',             permission: 'read', module: 'Website'           },
        { path: 'website-analytics',    file: 'js/modules/site_stats.js',          permission: 'read', module: 'WebAnalytics'      },
        { path: 'newsletter',           file: 'js/modules/newsletter.js',          permission: 'read', module: 'Newsletter', type: 'module' },
        // Societa
        { path: 'societa',              file: 'js/modules/societa.js',             permission: 'read', module: 'Societa', type: 'module' },
        { path: 'societa-identita',     file: 'js/modules/societa.js',             permission: 'read', module: 'Societa', type: 'module' },
        { path: 'societa-organigramma', file: 'js/modules/societa.js',             permission: 'read', module: 'Societa', type: 'module' },
        { path: 'societa-membri',       file: 'js/modules/societa.js',             permission: 'read', module: 'Societa', type: 'module' },
        { path: 'societa-documenti',    file: 'js/modules/societa.js',             permission: 'read', module: 'Societa', type: 'module' },
        { path: 'societa-scadenze',     file: 'js/modules/societa.js',             permission: 'read', module: 'Societa', type: 'module' },
        { path: 'societa-sponsor',      file: 'js/modules/societa.js',             permission: 'read', module: 'Societa', type: 'module' },
        { path: 'societa-titoli',       file: 'js/modules/societa.js',             permission: 'read', module: 'Societa', type: 'module' },
        { path: 'societa-foresteria',   file: 'js/modules/societa.js',             permission: 'read', module: 'Societa', type: 'module' },
        // Network
        { path: 'network',              file: 'js/modules/network/Network.js',             permission: 'read', module: 'Network', type: 'module' },
        { path: 'network-collaborazioni', file: 'js/modules/network/Network.js',           permission: 'read', module: 'Network', type: 'module' },
        { path: 'network-prove',        file: 'js/modules/network/Network.js',             permission: 'read', module: 'Network', type: 'module' },
        { path: 'network-attivita',     file: 'js/modules/network/Network.js',             permission: 'read', module: 'Network', type: 'module' },
        // Squadre & Scouting
        { path: 'squadre',              file: 'js/modules/squadre.js',             permission: 'read', module: 'Squadre', type: 'module' },
        { path: 'squadre-stagioni',     file: 'js/modules/squadre.js',             permission: 'read', module: 'Squadre', type: 'module' },
        { path: 'squadre-presenze',     file: 'js/modules/squadre.js',             permission: 'read', module: 'Squadre', type: 'module' },

        { path: 'scouting-database',    file: 'js/modules/scouting/Scouting.js',            permission: 'read', module: 'Scouting', type: 'module' },
        { path: 'scouting-talentday',   file: 'js/modules/talentday/TalentDay.js',          permission: 'read', module: 'TalentDay', type: 'module' },
    ];

    // Build lookup maps from the single registry (computed once at startup)
    const _fileMap       = Object.fromEntries(ROUTES.map(r => [r.path, r.file]));
    const _permissionMap = Object.fromEntries(ROUTES.filter(r => r.permission).map(r => [r.path, r.permission]));
    const _moduleMap     = Object.fromEntries(ROUTES.filter(r => r.module).map(r => [r.path, r.module]));
    const _typeMap       = Object.fromEntries(ROUTES.filter(r => r.type).map(r => [r.path, r.type]));

    // ─── URL Params Parser ──────────────────────────────────────────────────────
    function _parseQueryString(qs) {
        const out = {};
        for (const [k, v] of new URLSearchParams(qs).entries()) out[k] = v;
        return out;
    }

    // ─── Permission Check ───────────────────────────────────────────────────────
    /**
     * Returns true if the current user is allowed to access the given route.
     * Falls back to parent-route permission for sub-routes (e.g. athlete-profile → athletes).
     */
    function _canAccess(route) {
        const required = _permissionMap[route];
        if (!required) return true; // public route

        const user = App.getUser();
        if (!user) return false;
        if (user.role === 'admin') return true;

        const perms = user.permissions;
        if (!perms || Array.isArray(perms) || Object.keys(perms).length === 0) return true;

        // Direct permission check
        const directPerm = perms[route];
        if (directPerm) {
            return required === 'read'
                ? directPerm === 'read' || directPerm === 'write'
                : directPerm === 'write';
        }

        // Fallback to parent permission
        const _parentOf = (r) => {
            if (r.startsWith('athlete'))      return 'athletes';
            if (r.startsWith('results'))      return 'results';
            if (r.startsWith('admin') || r === 'utenti' || r === 'users') return 'admin';
            if (r.startsWith('transport'))    return 'transport';
            if (r === 'outseason-tournaments' || r === 'tournaments') return 'outseason-tournaments';
            if (r === 'outseason-camps' || r.startsWith('outseason')) return 'outseason';
            if (r.startsWith('social'))       return 'social';
            if (r.startsWith('website'))      return 'website';
            if (r.startsWith('scouting'))     return 'scouting';
            if (r.startsWith('ecommerce'))    return 'ecommerce';
            if (r.startsWith('finance'))      return 'finance';
            if (r.startsWith('whatsapp'))     return 'whatsapp';
            if (r.startsWith('staff'))        return 'staff';
            if (r.startsWith('newsletter'))   return 'newsletter';
            if (r.startsWith('societa'))      return 'societa';
            if (r.startsWith('network'))      return 'network';
            if (r === 'squadre' || r === 'squadre-stagioni' || r === 'squadre-presenze') return 'teams';
            return r;
        };

        const parentPerm = perms[_parentOf(route)] || 'none';
        return required === 'read'
            ? parentPerm === 'read' || parentPerm === 'write'
            : parentPerm === 'write';
    }

    // ─── Nav Active State ───────────────────────────────────────────────────────
    function _updateNavActive(route) {
        Utils.qsa('[data-route]').forEach(el => {
            const isActive = el.dataset.route === route;
            el.classList.toggle('active', isActive);
            el.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
        Utils.qsa('.nav-group').forEach(group => {
            if (group.querySelector('.submenu-item.active')) {
                group.classList.add('expanded');
                const btn = group.querySelector('.nav-item');
                if (btn) {
                    btn.setAttribute('aria-expanded', 'true');
                    btn.classList.add('nav-item--parent-active');
                }
            } else {
                const btn = group.querySelector('.nav-item');
                if (btn) btn.classList.remove('nav-item--parent-active');
            }
        });
    }

    // ─── Lazy-load a module script ──────────────────────────────────────────────
    function _loadScript(filePath, isModule = false) {
        return new Promise((resolve, reject) => {
            // Skip if already injected into the DOM
            if (document.querySelector(`script[src^="${filePath}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            if (isModule) {
                script.type = 'module';
            }
            script.src = filePath + '?v=' + _appVersion;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Impossibile caricare il modulo: ${filePath}`));
            document.head.appendChild(script);
        });
    }

    // ─── Public API ─────────────────────────────────────────────────────────────
    return {
        /**
         * Navigate to a route, lazy-loading its module if needed.
         * @param {string} route
         * @param {Record<string, string>} [params]
         */
        navigate: async function _navigate(route, params = {}) {
            _params = params;

            // Prevent re-navigating to the same route with no params change
            if (_currentRoute === route && Object.keys(params).length === 0) return;

            let path = route;

            // Support ?query in route string
            if (route.includes('?')) {
                const [base, qs] = route.split('?');
                path = base;
                _params = { ..._params, ..._parseQueryString('?' + qs) };
            }

            // External or static HTML redirect
            if (path.includes('.html') || path.startsWith('http')) {
                window.location.href = route;
                return;
            }

            // Permission gate
            if (path !== 'dashboard' && !_canAccess(path)) {
                UI.toast('Permessi insufficienti per accedere a questa sezione', 'error', 3500);
                if (_currentRoute !== 'dashboard') _navigate('dashboard');
                return;
            }

            // Destroy the previous module (memory cleanup)
            if (_currentRoute) {
                const prevFilePath = _fileMap[_currentRoute];
                const prevMod = _moduleCache[prevFilePath];
                if (prevMod && typeof prevMod.destroy === 'function') {
                    try { prevMod.destroy(); } catch (e) { console.error('[Router] Error during module destroy:', e); }
                }
            }

            _currentRoute = path;

            // Update URL hash and nav highlights
            const qs = Object.keys(_params).length ? '?' + new URLSearchParams(_params).toString() : '';
            window.location.hash = path + qs;
            _updateNavActive(path);

            const appEl = document.getElementById('app');
            if (!appEl) return;

            appEl.innerHTML = UI.skeletonPage();

            try {
                // Lazy-load the module (once per session per file)
                const filePath = _fileMap[path];
                if (!filePath) {
                    appEl.innerHTML = Utils.emptyState(
                        'Sezione in arrivo',
                        'Questa funzionalità è in fase di sviluppo.',
                        'Torna alla Dashboard',
                        'dashboard'
                    );
                    return;
                }

                if (!_moduleCache[filePath]) {
                    if (_typeMap[path] === 'module') {
                        // ES Module → native dynamic import() (no script injection needed)
                        // Use document.baseURI to resolve relative to the main page, not the router script
                        const moduleUrl = new URL(filePath + '?v=' + _appVersion, document.baseURI).href;
                        const mod = await import(moduleUrl);
                        _moduleCache[filePath] = mod.default || mod;
                    } else {
                        // Legacy script → inject <script> tag, read from window global
                        await _loadScript(filePath);
                        const moduleName = _moduleMap[path];
                        _moduleCache[filePath] = moduleName ? window[moduleName] : null;
                    }
                }
                _loaded[path] = true;

                // Initialize the module
                const mod = _moduleCache[filePath];
                if (mod && typeof mod.init === 'function') {
                    await mod.init();
                }
            } catch (err) {
                console.error('[Router] Navigation error:', err);
                appEl.innerHTML = Utils.emptyState('Errore nel caricamento della sezione', err.message);
                UI.toast('Errore nel caricare la sezione', 'error');
            }
        },

        getCurrentRoute: () => _currentRoute,
        getParams:       () => _params,

        updateHash(route, params = {}) {
            _params = params;
            const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
            window.location.hash = route + qs;
        },

        updateNavActive: _updateNavActive,
        _appVersion,
    };
})();
window.Router = Router;

// ─── Global Event Delegation for Navigation ────────────────────────────────
document.addEventListener('click', (e) => {
    const routeEl = e.target.closest('[data-route]');
    if (routeEl) {
        e.preventDefault();
        const route = routeEl.dataset.route;
        
        // Extract params if any via data-route-params (assuming valid JSON or query string format)
        let params = {};
        if (routeEl.dataset.routeParams) {
            try { params = JSON.parse(routeEl.dataset.routeParams); } catch (_e) { /* ignore */ }
        }
        
        Router.navigate(route, params);
    }
});
