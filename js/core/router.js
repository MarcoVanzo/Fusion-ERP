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
        users: 'js/modules/admin.js',
        utenti: 'js/modules/admin.js',
        outseason: 'js/modules/outseason.js',
        social: 'js/modules/social.js',
        results: 'js/modules/results.js',
        'results-matches': 'js/modules/results.js',
        'results-standings': 'js/modules/results.js',
        tasks: 'js/modules/tasks.js',
        'team-chat': 'js/modules/chat.js',
        finance: 'js/modules/finance.js',
        'finance-invoices': 'js/modules/finance.js',
        'finance-74ter': 'js/modules/finance.js',
        compliance: 'js/modules/compliance.js',
        'compliance-contracts': 'js/modules/compliance.js',
        'compliance-calendar': 'js/modules/compliance.js',
        'compliance-medical': 'js/modules/compliance.js',
        'compliance-federation': 'js/modules/compliance.js',
    };

    // Route access control using the permission map stored in user.permissions.
    // The permission map is set at login: { 'athletes': 'write', 'social': 'none', ... }
    // Routes not listed here are accessible to all authenticated users (e.g. dashboard).
    // Value: 'read' = requires at least read access, 'write' = requires write access.
    const ROUTE_ACCESS = {
        athletes: 'read',
        teams: 'read',
        results: 'read',
        'results-matches': 'read',
        'results-standings': 'read',
        transport: 'read',
        outseason: 'read',
        social: 'read',
        scouting: 'read',
        ecommerce: 'read',
        finance: 'read',
        admin: 'read',
        'admin-backup': 'read',
        'admin-logs': 'read',
        users: 'read',
        utenti: 'read',
        tasks: 'read',
        'team-chat': 'read',
        finance: 'read',
        'finance-invoices': 'read',
        'finance-74ter': 'read',
        compliance: 'read',
        'compliance-contracts': 'read',
        'compliance-calendar': 'read',
        'compliance-medical': 'read',
        'compliance-federation': 'read',
    };

    /**
     * Resolve the base module key from a route (e.g. 'results-matches' → 'results').
     */
    function _routeToModule(route) {
        if (route.startsWith('results')) return 'results';
        if (route.startsWith('admin')) return 'admin';
        if (route === 'utenti' || route === 'users') return 'admin';
        if (route.startsWith('transport')) return 'transport';
        if (route.startsWith('outseason')) return 'outseason';
        if (route.startsWith('social')) return 'social';
        if (route.startsWith('scouting')) return 'scouting';
        if (route.startsWith('ecommerce')) return 'ecommerce';
        if (route.startsWith('finance')) return 'finance';
        if (route === 'team-chat') return 'chat';
        if (route.startsWith('finance')) return 'finance';
        if (route.startsWith('compliance')) return 'compliance';
        return route;
    }

    /**
     * Check if the current user has access to a route.
     * Uses the permissions map stored in user.permissions (set at login by Auth::setUser).
     * Map format: { 'athletes': 'write' | 'read' | 'none', ... }
     */
    function _hasRouteAccess(route) {
        const required = ROUTE_ACCESS[route];
        if (!required) return true; // No restriction defined → allow

        const user = App.getUser();
        if (!user) return false;

        const perms = user.permissions || {};
        const module = _routeToModule(route);
        const level = perms[module] || 'none';

        if (required === 'read') return level === 'read' || level === 'write';
        if (required === 'write') return level === 'write';
        return false;
    }

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

        // Role-based route protection
        if (route !== 'dashboard' && !_hasRouteAccess(route)) {
            UI.toast('Permessi insufficienti per accedere a questa sezione', 'error', 3500);
            if (_currentRoute !== 'dashboard') {
                navigate('dashboard');
            }
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
            utenti: 'Admin',
            outseason: 'OutSeason',
            social: 'Social',
            results: 'Results',
            'results-matches': 'Results',
            'results-standings': 'Results',
            tasks: 'Tasks',
            'team-chat': 'Chat',
            finance: 'Finance',
            'finance-invoices': 'Finance',
            'finance-74ter': 'Finance',
            compliance: 'Compliance',
            'compliance-contracts': 'Compliance',
            'compliance-calendar': 'Compliance',
            'compliance-medical': 'Compliance',
            'compliance-federation': 'Compliance',
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
