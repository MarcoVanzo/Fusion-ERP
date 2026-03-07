/**
 * Router — SPA Client-Side Navigation with Lazy Module Loading
 * Fusion ERP v1.0.1
 */

'use strict';

const Router = (() => {
    const _modules = {};
    // Cache-busting: read version from <meta name="app-version"> set by deploy.py
    const APP_VERSION = document.querySelector('meta[name="app-version"]')?.content || Date.now();
    let _currentRoute = null;
    let _queryParams = {};

    function _parseQuery(search) {
        const params = {};
        const q = new URLSearchParams(search);
        for (const [key, value] of q.entries()) params[key] = value;
        return params;
    }

    // Module map: route → file path
    const MODULE_MAP = {
        dashboard: 'js/modules/dashboard.js',
        athletes: 'js/modules/athletes.js',
        'athlete-profile': 'js/modules/athletes.js',
        'athlete-payments': 'js/modules/athletes.js',
        'athlete-metrics': 'js/modules/athletes.js',
        'athlete-documents': 'js/modules/athletes.js',
        transport: 'js/modules/transport.js',
        'transport-drivers': 'js/modules/transport.js',
        'transport-fleet': 'js/modules/vehicles.js',
        admin: 'js/modules/admin.js',
        'admin-backup': 'js/modules/admin.js',
        'admin-logs': 'js/modules/admin.js',
        users: 'js/modules/admin.js',
        utenti: 'js/modules/admin.js',
        outseason: 'js/modules/outseason.js',
        'outseason-camps': 'js/modules/outseason.js',
        'outseason-tournaments': 'js/modules/tournaments.js',
        social: 'js/modules/social.js',
        results: 'js/modules/results.js',
        'results-matches': 'js/modules/results.js',
        'results-standings': 'js/modules/results.js',
        tasks: 'js/modules/tasks.js',
        'team-chat': 'js/modules/chat.js',
        finance: 'js/modules/finance.js',
        'finance-invoices': 'js/modules/finance.js',
        'finance-74ter': 'js/modules/finance.js',
        tournaments: 'js/modules/tournaments.js',
    };

    // Route access control using the permission map stored in user.permissions.
    // The permission map is set at login: { 'athletes': 'write', 'social': 'none', ... }
    // Routes not listed here are accessible to all authenticated users (e.g. dashboard).
    // Value: 'read' = requires at least read access, 'write' = requires write access.
    const ROUTE_ACCESS = {
        athletes: 'read',
        'athlete-profile': 'read',
        'athlete-payments': 'read',
        'athlete-metrics': 'read',
        'athlete-documents': 'read',
        teams: 'read',
        results: 'read',
        'results-matches': 'read',
        'results-standings': 'read',
        transport: 'read',
        'transport-drivers': 'read',
        'transport-fleet': 'read',
        outseason: 'read',
        'outseason-camps': 'read',
        'outseason-tournaments': 'read',
        tournaments: 'read',
        social: 'read',
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
    };

    /**
     * Resolve the base module key from a route (e.g. 'results-matches' → 'results').
     */
    function _routeToModule(route) {
        if (route.startsWith('athlete')) return 'athletes';
        if (route.startsWith('results')) return 'results';
        if (route.startsWith('admin')) return 'admin';
        if (route === 'utenti' || route === 'users') return 'admin';
        if (route.startsWith('transport')) return 'transport';
        if (route === 'outseason-tournaments' || route === 'tournaments') return 'outseason-tournaments';
        if (route === 'outseason-camps') return 'outseason';
        if (route.startsWith('outseason')) return 'outseason';
        if (route.startsWith('social')) return 'social';
        if (route.startsWith('scouting')) return 'scouting';
        if (route.startsWith('ecommerce')) return 'ecommerce';
        if (route.startsWith('finance')) return 'finance';
        if (route === 'team-chat') return 'chat';
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

        // Admin users have access to everything
        if (user.role === 'admin') return true;

        const perms = user.permissions;
        // If permissions is empty/array/missing, allow access (no restrictions configured)
        if (!perms || Array.isArray(perms) || Object.keys(perms).length === 0) return true;

        const module = _routeToModule(route);
        const level = perms[module] || 'none';

        if (required === 'read') return level === 'read' || level === 'write';
        if (required === 'write') return level === 'write';
        return false;
    }

    /**
     * Navigate to a route, lazy-loading the module if needed.
     */
    async function navigate(route, params = {}) {
        _queryParams = params;
        if (_currentRoute === route && Object.keys(params).length === 0) return;

        // Extract route and search from string if provided as single arg
        let path = route;
        if (route.includes('?')) {
            const [base, query] = route.split('?');
            path = base;
            _queryParams = { ..._queryParams, ..._parseQuery('?' + query) };
        }

        // Gestione link a pagine esterne o sezioni HTML standalone
        if (path.includes('.html') || path.startsWith('http')) {
            window.location.href = route;
            return;
        }

        // Role-based route protection
        if (path !== 'dashboard' && !_hasRouteAccess(path)) {
            UI.toast('Permessi insufficienti per accedere a questa sezione', 'error', 3500);
            if (_currentRoute !== 'dashboard') {
                navigate('dashboard');
            }
            return;
        }

        const moduleNames = {
            dashboard: 'Dashboard',
            athletes: 'Athletes',
            'athlete-profile': 'Athletes',
            'athlete-payments': 'Athletes',
            'athlete-metrics': 'Athletes',
            'athlete-documents': 'Athletes',
            transport: 'Transport',
            'transport-drivers': 'Transport',
            'transport-fleet': 'Vehicles',
            admin: 'Admin',
            'admin-backup': 'Admin',
            'admin-logs': 'Admin',
            users: 'UsersModule',
            utenti: 'Admin',
            outseason: 'OutSeason',
            'outseason-camps': 'OutSeason',
            'outseason-tournaments': 'Tournaments',
            tournaments: 'Tournaments',
            social: 'Social',
            results: 'Results',
            'results-matches': 'Results',
            'results-standings': 'Results',
            tasks: 'Tasks',
            'team-chat': 'Chat',
            finance: 'Finance',
            'finance-invoices': 'Finance',
            'finance-74ter': 'Finance',
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

        _currentRoute = path;

        // Update URL hash for bookability
        const queryStr = Object.keys(_queryParams).length ? '?' + new URLSearchParams(_queryParams).toString() : '';
        window.location.hash = path + queryStr;

        // Update nav active state
        _updateNavActive(path);

        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = UI.skeletonPage();

        try {
            // Lazy-load the module script
            if (!_modules[path]) {
                if (!MODULE_MAP[path]) {
                    app.innerHTML = Utils.emptyState('Sezione in arrivo', 'Questa funzionalità è in fase di sviluppo.', 'Torna alla Dashboard', 'dashboard');
                    return;
                }
                await _loadScript(MODULE_MAP[path]);
                _modules[path] = true;
            }

            // Call module init — each module exposes itself as a global
            const moduleName = moduleNames[path];
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
        // Mark all nav items and submenu items
        Utils.qsa('[data-route]').forEach(item => {
            const isActive = item.dataset.route === route;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-current', isActive ? 'page' : 'false');
        });

        // Expand the parent nav-group if a child route is active
        Utils.qsa('.nav-group').forEach(group => {
            const activeChild = group.querySelector('.submenu-item.active');
            if (activeChild) {
                group.classList.add('expanded');
                const parentBtn = group.querySelector('.nav-item');
                if (parentBtn) {
                    parentBtn.setAttribute('aria-expanded', 'true');
                    parentBtn.classList.add('nav-item--parent-active');
                }
            } else {
                const parentBtn = group.querySelector('.nav-item');
                if (parentBtn) parentBtn.classList.remove('nav-item--parent-active');
            }
        });
    }

    function getCurrentRoute() { return _currentRoute; }
    function getParams() { return _queryParams; }

    /**
     * Update the URL hash without triggering navigation.
     * Used by modules that need to reflect state in the URL (e.g. athlete ID).
     */
    function updateHash(route, params = {}) {
        _queryParams = params;
        const queryStr = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
        window.location.hash = route + queryStr;
    }

    return { navigate, getCurrentRoute, getParams, updateHash, updateNavActive: _updateNavActive, _appVersion: APP_VERSION };
})();
