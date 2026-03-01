/**
 * Router — SPA Client-Side Navigation with Lazy Module Loading
 * Fusion ERP v1.0
 */

'use strict';

const Router = (() => {
    const _modules = {};
    // Cache-busting: read version from <meta name="app-version"> set by deploy.py
    const APP_VERSION = document.querySelector('meta[name="app-version"]')?.content || Date.now();
    let _currentRoute = null;

    // Module map: route → file path
    const MODULE_MAP = {
        dashboard: 'js/modules/dashboard.js',
        athletes: 'js/modules/athletes.js',
        transport: 'js/modules/transport.js',
        admin: 'js/modules/admin.js',
        'admin-backup': 'js/modules/admin.js',
        'admin-logs': 'js/modules/admin.js',
        users: 'js/modules/users.js',
        outseason: 'js/modules/outseason.js',
        social: 'js/modules/social.js',
        results: 'js/modules/results.js',
        'results-matches': 'js/modules/results.js',
        'results-standings': 'js/modules/results.js',
    };

    /**
     * Navigate to a route, lazy-loading the module if needed.
     */
    async function navigate(route) {
        if (_currentRoute === route) return;

        // Gestione link a pagine esterne o sezioni HTML standalone
        if (route.includes('.html') || route.startsWith('http')) {
            window.location.href = route;
            return;
        }

        const moduleNames = {
            dashboard: 'Dashboard',
            athletes: 'Athletes',
            transport: 'Transport',
            admin: 'Admin',
            'admin-backup': 'Admin',
            'admin-logs': 'Admin',
            users: 'UsersModule',
            outseason: 'OutSeason',
            social: 'Social',
            results: 'Results',
            'results-matches': 'Results',
            'results-standings': 'Results',
        };

        // Call destroy on the previous module before switching to prevent memory leaks
        if (_currentRoute) {
            const prevModuleName = moduleNames[_currentRoute];
            if (prevModuleName && window[prevModuleName] && typeof window[prevModuleName].destroy === 'function') {
                try {
                    window[prevModuleName].destroy();
                } catch (e) {
                    console.error('[Router] Error during module destroy:', e);
                }
            }
        }

        _currentRoute = route;

        // Update nav active state
        _updateNavActive(route);

        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = UI.skeletonPage();

        try {
            // Lazy-load the module script
            if (!_modules[route]) {
                if (!MODULE_MAP[route]) {
                    app.innerHTML = Utils.emptyState('Sezione in arrivo', 'Questa funzionalità è in fase di sviluppo.', 'Torna alla Dashboard', 'dashboard');
                    return;
                }
                await _loadScript(MODULE_MAP[route]);
                _modules[route] = true;
            }

            // Call module init — each module exposes itself as a global
            const moduleNames = {
                dashboard: 'Dashboard',
                athletes: 'Athletes',
                transport: 'Transport',
                admin: 'Admin',
                'admin-backup': 'Admin',
                'admin-logs': 'Admin',
                users: 'UsersModule',
                outseason: 'OutSeason',
                social: 'Social',
                results: 'Results',
                'results-matches': 'Results',
                'results-standings': 'Results',
            };

            const moduleName = moduleNames[route];
            if (window[moduleName] && typeof window[moduleName].init === 'function') {
                await window[moduleName].init();
            }
        } catch (err) {
            console.error('[Router] Navigation error:', err);
            app.innerHTML = Utils.emptyState('Errore nel caricamento della sezione', err.message);
            UI.toast('Errore nel caricare la sezione', 'error');
        }
    }

    function _loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded (match by base src, ignoring ?v= query)
            if (document.querySelector(`script[src^="${src}"]`)) {
                resolve(); return;
            }
            const s = document.createElement('script');
            s.src = src + '?v=' + APP_VERSION;
            s.async = true;
            s.onload = resolve;
            s.onerror = () => reject(new Error(`Impossibile caricare il modulo: ${src}`));
            document.head.appendChild(s);
        });
    }

    function _updateNavActive(route) {
        // Sidebar items
        Utils.qsa('[data-route]').forEach(item => {
            const isActive = item.dataset.route === route;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    function getCurrentRoute() { return _currentRoute; }

    return { navigate, getCurrentRoute, updateNavActive: _updateNavActive };
})();
