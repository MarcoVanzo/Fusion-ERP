'use strict';

/**
 * App — Bootstrap & Orchestrator
 * Fusion ERP v1.0
 *
 * This file is the lightweight orchestrator that delegates to specialized modules:
 *  - AuthFlow       (js/core/auth.js)       — Login, reset, invitation flows
 *  - Navigation     (js/core/navigation.js)  — Sidebar, bottom nav, page transitions
 *  - GlobalSearch   (js/core/global-search.js) — Athlete & staff search
 *  - Enhancements   (js/core/enhancements.js)  — Shortcuts, OLED, notifications, etc.
 *  - Onboarding     (js/core/onboarding.js)     — First-run tour & tooltips
 *
 * Dependencies: Store, UI, Utils, Router (loaded before this file)
 */

const App = (() => {
    let _currentUser = null;
    let _abortApp = new AbortController();

    /**
     * Application entry point. Checks for special URL params (reset/invite tokens)
     * then either resumes session or shows login screen.
     */
    async function init() {
        // Forgot-password reset link check
        const _urlParams = new URLSearchParams(window.location.search);
        const _resetToken = _urlParams.get('reset');
        if (_resetToken && /^[a-f0-9]{64}$/i.test(_resetToken)) {
            AuthFlow.showConfirmResetScreen(_resetToken);
            return;
        }

        const _inviteToken = _urlParams.get('invite');
        if (_inviteToken && /^[a-f0-9]{64}$/i.test(_inviteToken)) {
            AuthFlow.showAcceptInvitationScreen(_inviteToken);
            return;
        }

        try {
            _currentUser = await Store.get('me', 'auth');
            _bootApp(_currentUser);
        } catch {
            AuthFlow.showLoginScreen((user) => {
                _currentUser = user;
                _bootApp(user);
            });
        }
    }

    /**
     * Boot the main application after successful authentication.
     * Sets up the app shell, sidebar, user dropdown, and all enhancements.
     * @param {object} user - Authenticated user data
     */
    async function _bootApp(user) {
        _abortApp.abort();
        _abortApp = new AbortController();
        _currentUser = user;

        try {
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('reset-screen').classList.add('hidden');
            document.getElementById('app-shell').classList.remove('hidden');

            // ─── User Info in Sidebar ───────────────────────────────────────
            const nameEl = document.getElementById('sidebar-username');
            const roleEl = document.getElementById('sidebar-role');
            const avatarEl = document.getElementById('sidebar-avatar');
            if (nameEl) nameEl.textContent = Utils.escapeHtml(user.fullName || user.email);
            if (roleEl) roleEl.textContent = Utils.escapeHtml(user.role);
            if (avatarEl) avatarEl.textContent = Utils.initials(user.fullName || user.email);

            // ─── Admin Visibility ───────────────────────────────────────────
            const _adminPerm = user.permissions && user.permissions['admin'];
            const isAdmin = user.role === 'admin'
                || _adminPerm === 'write'
                || _adminPerm === 'read';
            document.querySelectorAll('.admin-only').forEach(el => {
                if (isAdmin) el.classList.remove('hidden');
                else el.classList.add('hidden');
            });

            // ─── User Dropdown ──────────────────────────────────────────────
            _initUserDropdown(user);

            // ─── Sidebar Toggle ─────────────────────────────────────────────
            _initSidebarToggle();

            // ─── Initialize Sub-Modules (resilient — each in try/catch) ─────
            _tryInit('Notifications',    () => Enhancements.initNotifications());
            _tryInit('GlobalSearch',     () => GlobalSearch.init());
            _tryInit('Onboarding',       () => { if (typeof Onboarding !== 'undefined') { Onboarding.initTooltips(); Onboarding.startIfNew(); } });
            _tryInit('BottomNav',        () => Navigation.initBottomNav());

            // Load and render navigation (async)
            try {
                await Navigation.render(user);
            } catch (err) {
                console.error('[App] Failed to render navigation:', err);
            }

            // Wire up any remaining hardcoded nav items
            Utils.qsa('[data-route]').forEach(item => {
                if (!item.hasAttribute('data-route-bound')) {
                    item.addEventListener('click', () => Router.navigate(item.dataset.route));
                    item.setAttribute('data-route-bound', 'true');
                }
            });

            // ─── Enhancements ───────────────────────────────────────────────
            _tryInit('KeyboardShortcuts', () => Enhancements.initKeyboardShortcuts());
            _tryInit('PageTransitions',   () => Navigation.initPageTransitions());
            _tryInit('OledToggle',        () => Enhancements.initOledToggle());
            _tryInit('JerseyBackdrop',    () => Enhancements.initJerseyBackdrop());
            _tryInit('ExtendedSearch',    () => GlobalSearch.extendWithStaff());

            // ─── Start at Dashboard ─────────────────────────────────────────
            Router.navigate('dashboard');

            // ─── Delayed: Expiring Documents Alert ──────────────────────────
            setTimeout(() => {
                Enhancements.initExpiringDocsAlert().catch(e => console.warn('[App] Expiring docs:', e));
            }, 2000);

        } catch (err) {
            console.error('[App] Critical boot error:', err);
            UI.toast('Errore durante l\'avvio dell\'applicazione', 'error');
        }
    }

    /**
     * Wire up the user dropdown menu (profile, admin links, logout).
     * @param {object} user - Current user
     */
    function _initUserDropdown(user) {
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');

        if (!userMenuBtn || !userDropdown) return;

        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        }, { signal: _abortApp.signal });

        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        }, { signal: _abortApp.signal });

        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.add('hidden');
                AuthFlow.showUserProfileModal(user);
            }, { signal: _abortApp.signal });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                userDropdown.classList.add('hidden');
                try {
                    await Store.api('logout', 'auth');
                    Store.clearCache();
                    UI.toast('Logout effettuato', 'info');
                    setTimeout(() => window.location.reload(), 800);
                } catch {
                    Store.clearCache();
                    window.location.reload();
                }
            }, { signal: _abortApp.signal });
        }

        userDropdown.querySelectorAll('.dropdown-item[data-route]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.add('hidden');
                Router.navigate(item.dataset.route);
            }, { signal: _abortApp.signal });
        });
    }

    /**
     * Wire up the sidebar collapse/expand toggle.
     */
    function _initSidebarToggle() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebarToggle');
        if (!sidebar || !toggleBtn) return;

        const COLLAPSED_KEY = 'sidebar_collapsed';
        if (localStorage.getItem(COLLAPSED_KEY) === '1') {
            sidebar.classList.add('collapsed');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = sidebar.classList.toggle('collapsed');
            toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
            localStorage.setItem(COLLAPSED_KEY, isCollapsed ? '1' : '0');
        });

        // Keyboard shortcut: Ctrl+B
        const _kbSidebar = (e) => {
            if (e.ctrlKey && e.key === 'b') { e.preventDefault(); toggleBtn.click(); }
        };
        document.addEventListener('keydown', _kbSidebar);
        (window._appKbHandlers ??= []).push([_kbSidebar]);
    }

    /**
     * Try to initialize a sub-module, catching and logging any errors.
     * @param {string} name - Human-readable module name (for logging)
     * @param {function} fn - Initialization function
     */
    function _tryInit(name, fn) {
        try { fn(); } catch (err) { console.error(`[App] Failed to init ${name}:`, err); }
    }

    /**
     * Get the current authenticated user.
     * @returns {object|null}
     */
    function getUser() { return _currentUser; }

    /**
     * Render the forgot-password modal. Delegates to AuthFlow.
     * Exposed for backward compatibility with onclick in index.html.
     */
    function renderForgotPassword() { AuthFlow.renderForgotPassword(); }

    /**
     * Cleanup all global listeners and observers (called on logout).
     */
    function cleanup() { Enhancements.cleanup(); }

    return { init, getUser, renderForgotPassword, cleanup };
})();
window.App = App;


// ─── Global Error Handlers (Stability) ──────────────────────────────────────
window.onerror = function (message, source, lineno, colno, error) {
    console.error('[FusionERP] Uncaught error:', message, 'at', source, lineno, colno, error);
    return true;
};
window.addEventListener('unhandledrejection', function (event) {
    console.error('[FusionERP] Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// ─── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    App.init().catch((err) => {
        console.error('[FusionERP] Critical boot failure:', err);
    });
});
