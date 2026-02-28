/**
 * Router — SPA Client-Side Navigation with Lazy Module Loading
 * Fusion ERP v1.0
 */

'use strict';

const Router = (() => {
    const _modules = {};
    let _currentRoute = null;

    // Module map: route → file path
    const MODULE_MAP = {
        dashboard: 'js/modules/dashboard.js',
        athletes: 'js/modules/athletes.js',
        transport: 'js/modules/transport.js',
        admin: 'js/modules/admin.js',
        users: 'js/modules/users.js',
    };

    /**
     * Navigate to a route, lazy-loading the module if needed.
     */
    async function navigate(route) {
        if (_currentRoute === route) return;
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
                    app.innerHTML = Utils.emptyState('Sezione non trovata');
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
                users: 'UsersModule',
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
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(); return;
            }
            const s = document.createElement('script');
            s.src = src + '?v=1.2.0';
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

    return { navigate, getCurrentRoute };
})();
