'use strict';

/**
 * Navigation — Sidebar Rendering, Mobile Bottom Nav, Page Transitions
 * Fusion ERP v1.0
 *
 * Extracted from app.js for better separation of concerns.
 * Exposes: Navigation (global)
 *
 * Dependencies: Store, UI, Utils, Router
 */

const Navigation = (() => {
    /** @type {AbortController} Tracks event listeners for cleanup */
    let _abortNav = new AbortController();

    /** @type {Array|null} Stored navigation config for header title resolution */
    let _navConfig = null;

    /**
     * Load and render the sidebar + mobile navigation based on user role.
     * @param {object} user - Current authenticated user
     */
    async function render(user) {
        _abortNav.abort();
        _abortNav = new AbortController();

        try {
            // Find absolute base URL from script tags
            let base = '';
            const scripts = document.getElementsByTagName('script');
            for (let s of scripts) {
                if (s.src && s.src.includes('js/core/store.js')) {
                    base = s.src.split('js/core/store.js')[0];
                    break;
                }
            }

            const navVersion = (typeof Router !== 'undefined' && Router._appVersion)
                ? Router._appVersion
                : (document.querySelector('meta[name="app-version"]')?.content || Date.now());
            const fetchUrl = base + 'js/config/navigation.json?v=' + navVersion;
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                throw new Error(`Impossibile caricare navigation.json: HTTP ${response.status}`);
            }

            const textContent = await response.text();
            if (textContent.trim().startsWith('<')) {
                throw new Error('La risposta dal server non è un JSON valido');
            }

            const navConfig = JSON.parse(textContent);
            _navConfig = navConfig;

            const desktopContainer = document.getElementById('sidebar-nav-container');
            const mobileContainer = document.querySelector('#bottom-nav .bottom-nav-inner');

            if (desktopContainer) desktopContainer.innerHTML = '';
            if (mobileContainer) mobileContainer.innerHTML = '';

            const userRole = (user.role || '').toLowerCase();

            navConfig.forEach(item => {
                // Roles Check (case-insensitive)
                if (item.roles && item.roles.length > 0) {
                    const normalizedRoles = item.roles.map(r => r.toLowerCase());
                    if (!normalizedRoles.includes(userRole)) return;
                }

                const isComingSoon = item.implemented === false;

                // Desktop Nav Item
                if (desktopContainer) {
                    const visibleChildren = (item.children || []).filter(child =>
                        !child.roles || child.roles.length === 0 || child.roles.map(r => r.toLowerCase()).includes(userRole)
                    );

                    if (visibleChildren.length > 0) {
                        // ── Accordion Group ────────────────────────────────────
                        const group = document.createElement('div');
                        group.className = 'nav-group';
                        group.dataset.groupId = item.id || item.path;

                        const parentBtn = document.createElement('button');
                        parentBtn.type = 'button';
                        parentBtn.className = 'nav-item';
                        parentBtn.dataset.route = item.path;
                        parentBtn.setAttribute('aria-expanded', 'false');
                        if (isComingSoon) parentBtn.style.opacity = '0.4';

                        parentBtn.innerHTML = `
                            <span class="nav-icon"><i class="ph ph-${item.icon || 'circle'}" aria-hidden="true"></i></span>
                            <span class="nav-label">${Utils.escapeHtml(item.title)}</span>
                            <i class="ph ph-caret-down chevron" aria-hidden="true"></i>
                        `;

                        parentBtn.addEventListener('click', () => {
                            if (isComingSoon) { UI.toast(`${item.title}: sezione in arrivo`, 'info', 2500); return; }

                            const isExpanding = !group.classList.contains('expanded');

                            if (isExpanding) {
                                desktopContainer.querySelectorAll('.nav-group.expanded').forEach(otherGroup => {
                                    if (otherGroup !== group) {
                                        otherGroup.classList.remove('expanded');
                                        const otherBtn = otherGroup.querySelector('.nav-item');
                                        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                                    }
                                });
                            }

                            const expanded = group.classList.toggle('expanded');
                            parentBtn.setAttribute('aria-expanded', String(expanded));
                        }, { signal: _abortNav.signal });

                        group.appendChild(parentBtn);

                        const submenu = document.createElement('div');
                        submenu.className = 'submenu';

                        visibleChildren.forEach(child => {
                            const childIsComingSoon = child.implemented === false;
                            const childBtn = document.createElement('button');
                            childBtn.type = 'button';
                            childBtn.className = 'submenu-item';
                            childBtn.dataset.route = child.path;
                            childBtn.dataset.parentGroup = item.id || item.path;
                            if (childIsComingSoon) childBtn.style.opacity = '0.4';

                            childBtn.innerHTML = `<i class="ph ph-${child.icon || 'dot'}" aria-hidden="true"></i>${Utils.escapeHtml(child.title)}`;

                            childBtn.addEventListener('click', () => {
                                if (childIsComingSoon) { UI.toast(`${child.title}: in arrivo`, 'info', 2000); return; }
                                Router.navigate(child.path);
                            }, { signal: _abortNav.signal });

                            submenu.appendChild(childBtn);
                        });

                        group.appendChild(submenu);
                        desktopContainer.appendChild(group);

                    } else {
                        // ── Simple Nav Item ──────────────────────────────────
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'nav-item';
                        btn.dataset.route = item.path;
                        if (isComingSoon) {
                            btn.style.opacity = '0.4';
                            btn.setAttribute('title', 'In arrivo');
                            btn.addEventListener('click', () => UI.toast(`${item.title}: sezione in arrivo`, 'info', 2500), { signal: _abortNav.signal });
                        } else {
                            btn.addEventListener('click', () => Router.navigate(item.path), { signal: _abortNav.signal });
                        }

                        btn.innerHTML = `
                            <span class="nav-icon"><i class="ph ph-${item.icon || 'circle'}" aria-hidden="true"></i></span>
                            <span class="nav-label">${Utils.escapeHtml(item.title)}</span>
                        `;
                        desktopContainer.appendChild(btn);
                    }
                }

                // Mobile Nav Item
                if (mobileContainer && item.isMobileVisible) {
                    const btn = document.createElement('button');
                    btn.className = 'bottom-nav-item';
                    btn.type = 'button';
                    btn.dataset.route = item.path;
                    btn.setAttribute('aria-label', item.title);

                    const icon = document.createElement('i');
                    icon.className = `ph ph-${item.icon} bottom-nav-icon`;
                    icon.style.fontSize = '24px';
                    icon.setAttribute('aria-hidden', 'true');

                    const label = document.createElement('span');
                    label.className = 'bottom-nav-label';
                    label.textContent = item.title;

                    btn.appendChild(icon);
                    btn.appendChild(label);

                    btn.addEventListener('click', () => Router.navigate(item.path), { signal: _abortNav.signal });
                    mobileContainer.appendChild(btn);
                }
            });

            // Re-highlight current active route after building the DOM
            Router.updateNavActive(Router.getCurrentRoute() || 'dashboard');

        } catch (err) {
            console.error('Error rendering navigation:', err);

            let errorMsg = 'Errore nel caricamento del menu';
            if (err.message.includes('CORS') || err.message.includes('Failed to fetch') || window.location.protocol === 'file:') {
                errorMsg = 'Errore: impossibile caricare il menu in modalità file:// (serve un web server)';
            } else if (err.message.includes('JSON valido')) {
                errorMsg = 'Errore: configurazione routing non valida';
            }
            UI.toast(errorMsg, 'error', 6000);
        }
    }

    /**
     * Initialize the mobile bottom navigation bar (visible at <768px).
     */
    function initBottomNav() {
        const nav = document.getElementById('bottom-nav');
        if (!nav) return;

        const items = nav.querySelectorAll('[data-route]');

        function _setActive(route) {
            items.forEach(btn => {
                const matches = btn.dataset.route === route;
                btn.classList.toggle('active', matches);
                btn.setAttribute('aria-current', matches ? 'page' : 'false');
            });
        }

        // Wire click handlers
        items.forEach(btn => {
            btn.addEventListener('click', () => {
                const route = btn.dataset.route;
                if (route === 'profile') {
                    document.getElementById('user-menu-btn')?.click();
                    return;
                }
                Router.navigate(route);
                _setActive(route);
            });
        });

        // Observe route changes via MutationObserver on page title
        const titleEl = document.getElementById('page-title');
        if (titleEl) {
            const _routeObserver = new MutationObserver(() => {
                const current = (typeof Router.getCurrentRoute === 'function' ? Router.getCurrentRoute() : '') ?? '';
                _setActive(current);
            });
            _routeObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });
        }

        // Set initial active state
        const initialRoute = (typeof Router.getCurrentRoute === 'function' ? Router.getCurrentRoute() : 'dashboard') ?? 'dashboard';
        _setActive(initialRoute);
    }

    /**
     * Patch Router.navigate to add page transition CSS animations
     * and update the header title based on navigation config.
     */
    function initPageTransitions() {
        const _origNavigate = Router.navigate.bind(Router);
        Router.navigate = async function (route, params) {
            const appEl = document.getElementById('app');
            if (appEl) {
                appEl.classList.add('page-exit');
                await new Promise(r => setTimeout(r, 140));
                appEl.classList.remove('page-exit');
            }
            await _origNavigate(route, params);

            // ── Generic Header Title Update ──────────────────────────
            if (_navConfig) {
                let parentTitle = 'Dashboard';

                for (const item of _navConfig) {
                    if (item.path === route || item.id === route) {
                        parentTitle = item.title;
                        break;
                    }
                    if (item.children) {
                        const child = item.children.find(c => c.path === route || c.id === route);
                        if (child) {
                            parentTitle = item.title;
                            break;
                        }
                    }
                }

                const pageTitleEl = document.getElementById('page-title');
                const pageSubtitleEl = document.getElementById('page-subtitle');
                if (pageTitleEl) pageTitleEl.textContent = parentTitle;
                if (pageSubtitleEl) pageSubtitleEl.style.display = 'none';
            }

            if (appEl) {
                appEl.classList.remove('page-enter');
                void appEl.offsetWidth; // Force reflow
                appEl.classList.add('page-enter');
                setTimeout(() => appEl.classList.remove('page-enter'), 320);
            }
        };
    }

    /**
     * Get the stored navigation config (used by other modules for title resolution).
     * @returns {Array|null}
     */
    function getConfig() {
        return _navConfig;
    }

    return {
        render,
        initBottomNav,
        initPageTransitions,
        getConfig
    };
})();
window.Navigation = Navigation;
