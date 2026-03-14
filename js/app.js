/**
 * App — Bootstrap & Auth Flow
 * Fusion ERP v1.0
 */

'use strict';

const App = (() => {
    let _currentUser = null;

    async function init() {
        // Try to resume existing session
        // Forgot-password reset link check
        const _urlParams = new URLSearchParams(window.location.search);
        const _resetToken = _urlParams.get('reset');
        if (_resetToken && /^[a-f0-9]{64}$/i.test(_resetToken)) {
            _showConfirmResetScreen(_resetToken);
            return;
        }

        try {
            _currentUser = await Store.get('me', 'auth');
            // If onboarding is not complete, we can either wait or just boot
            _bootApp(_currentUser);
        } catch {
            _showAuthScreen();
        }
    }

    function _initSplashScreen() {
        // Splash screen rimosso su richiesta dell'utente
        const splash = document.getElementById('splash-screen');
        if (splash) splash.remove();
    }



    function _showAuthScreen() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-shell').classList.add('hidden');
        document.getElementById('reset-screen').classList.add('hidden');

        const form = document.getElementById('login-form');

        // UX: Password visibility toggle
        const passwordInput = document.getElementById('login-password');
        const toggleBtn = document.getElementById('password-toggle');
        if (passwordInput && toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                toggleBtn.textContent = isPassword ? '🙈' : '👁️';
            });
        }

        // UX #10: Inline email validation
        const emailInput = document.getElementById('login-email');
        const emailHint = document.getElementById('login-email-hint');
        if (emailInput && emailHint) {
            emailInput.addEventListener('input', () => {
                const val = emailInput.value.trim();
                if (!val) {
                    emailHint.textContent = '';
                    emailInput.style.borderColor = '';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    emailHint.textContent = '⚠️ Formato email non valido';
                    emailHint.style.color = 'var(--color-danger)';
                    emailInput.style.borderColor = 'var(--color-danger) !important';
                } else {
                    emailHint.textContent = '✓ Email valida';
                    emailHint.style.color = 'var(--color-success)';
                    emailInput.style.borderColor = 'var(--color-success) !important';
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('login-submit-btn');
            const errEl = document.getElementById('login-error');
            const email = emailInput.value.trim();
            const pwd = passwordInput.value;

            const triggerShake = (msg, inputToFocus = null) => {
                errEl.innerText = msg;
                errEl.classList.remove('hidden');
                form.classList.remove('shake');
                // Trigger reflow to restart animation
                void form.offsetWidth;
                form.classList.add('shake');
                if (inputToFocus) inputToFocus.focus();
            };

            if (!email) {
                triggerShake('Inserisci il tuo indirizzo email', emailInput);
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                triggerShake("Il formato dell'email non è valido", emailInput);
                return;
            }
            if (!pwd) {
                triggerShake('Inserisci la password');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;"></span> ACCESSO IN CORSO...';
            btn.style.opacity = '0.7';
            errEl.classList.add('hidden');

            try {
                const data = await Store.api('login', 'auth', { email, password: pwd });
                _currentUser = data;

                if (data.needsReset) {
                    _showResetScreen();
                    return;
                }

                _bootApp(data);
            } catch (err) {
                triggerShake(err.message || "Credenziali non valide. Verifica email e password.");
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'ACCEDI';
                btn.style.opacity = '1';
            }
        }); // removed { once: true } because we want users to be able to try again after a failed login!
    }

    function _showResetScreen() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('reset-screen').classList.remove('hidden');
        document.getElementById('app-shell').classList.add('hidden');

        const form = document.getElementById('reset-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('reset-btn');
            const errEl = document.getElementById('reset-error');
            const current = document.getElementById('reset-current').value;
            const newPwd = document.getElementById('reset-new').value;

            if (newPwd.length < 10) {
                errEl.textContent = 'La password deve essere di almeno 10 caratteri';
                errEl.classList.remove('hidden');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'SALVATAGGIO...';

            try {
                await Store.api('resetPassword', 'auth', { currentPassword: current, newPassword: newPwd });
                UI.toast('Password aggiornata. Effettua il login.', 'success');
                setTimeout(() => _showAuthScreen(), 1200);
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'SALVA NUOVA PASSWORD';
            }
        }, { once: true });
    }

    async function _bootApp(user) {
        _currentUser = user;

        try {
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('reset-screen').classList.add('hidden');
            document.getElementById('app-shell').classList.remove('hidden');

            const nameEl = document.getElementById('sidebar-username');
            const roleEl = document.getElementById('sidebar-role');
            const avatarEl = document.getElementById('sidebar-avatar');
            if (nameEl) nameEl.textContent = Utils.escapeHtml(user.fullName || user.email);
            if (roleEl) roleEl.textContent = Utils.escapeHtml(user.role);
            if (avatarEl) avatarEl.textContent = Utils.initials(user.fullName || user.email);

            // Show/hide admin items in user dropdown
            const _adminPerm = user.permissions && user.permissions['admin'];
            const isAdmin = user.role === 'admin'
                || _adminPerm === 'write'
                || _adminPerm === 'read';
            const adminItems = document.querySelectorAll('.admin-only');
            adminItems.forEach(el => {
                if (isAdmin) el.classList.remove('hidden');
                else el.classList.add('hidden');
            });


            // ─── User Dropdown ────────────────────────────────────────────────────
            const userMenuBtn = document.getElementById('user-menu-btn');
            const userDropdown = document.getElementById('user-dropdown');

            if (userMenuBtn && userDropdown) {
                userMenuBtn.onclick = (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('hidden');
                };

                // FIX: usa addEventListener invece di document.onclick
                // (document.onclick sovrascrive altri handler globali — bug potenziale)
                const _closeDropdown = (e) => {
                    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                        userDropdown.classList.add('hidden');
                    }
                };
                document.addEventListener('click', _closeDropdown);
                // Cleanup al destroy dell'app (navigazione fuori) per prevenire memory leak
                window.__cleanupUserMenu = () => document.removeEventListener('click', _closeDropdown);

                const profileBtn = document.getElementById('profile-btn');
                if (profileBtn) {
                    profileBtn.onclick = (e) => {
                        e.stopPropagation();
                        userDropdown.classList.add('hidden');
                        _showUserProfileModal(user);
                    };
                }

                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.onclick = async (e) => {
                        e.stopPropagation();
                        userDropdown.classList.add('hidden');
                        try {
                            await Store.api('logout', 'auth');
                            UI.toast('Logout effettuato', 'info');
                            setTimeout(() => window.location.reload(), 800);
                        } catch {
                            window.location.reload();
                        }
                    };
                }

                userDropdown.querySelectorAll('.dropdown-item[data-route]').forEach(item => {
                    item.onclick = (e) => {
                        e.stopPropagation();
                        userDropdown.classList.add('hidden');
                        Router.navigate(item.dataset.route);
                    };
                });
            }

            // ─── Sidebar Toggle ────────────────────────────────────────────────────
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.getElementById('sidebarToggle');
            if (sidebar && toggleBtn) {
                const COLLAPSED_KEY = 'sidebar_collapsed';
                // Restore persisted state
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
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'b') {
                        e.preventDefault();
                        toggleBtn.click();
                    }
                });
            }

            // Initialize notifications (resiliently)
            try {
                _initNotifications();
            } catch (err) {
                console.error('[App] Failed to init notifications:', err);
            }

            // Initialize global search
            try {
                _initGlobalSearch();
            } catch (err) {
                console.error('[App] Failed to init global search:', err);
            }

            // Initialize contextual help tooltips and first-run tour
            try {
                if (typeof Onboarding !== 'undefined') {
                    Onboarding.initTooltips();
                    Onboarding.startIfNew();
                }
            } catch (err) {
                console.error('[App] Failed to init onboarding:', err);
            }

            // Initialize mobile bottom navigation (LT#2)
            try {
                _initBottomNav();
            } catch (err) {
                console.error('[App] Failed to init bottom nav:', err);
            }

            // Load and render navigation (resiliently)
            try {
                await _renderNavigation(user);
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

            // ── Enhancement: Additional Keyboard Shortcuts (UX#9) ──────────
            try { _initExtraKeyboardShortcuts(); } catch (err) { console.error('[App] Keyboard shortcuts:', err); }

            // ── Enhancement: Page Transitions (G#9) ──────────────────────
            try { _initPageTransitions(); } catch (err) { console.error('[App] Page transitions:', err); }

            // ── Enhancement: OLED Toggle in sidebar (G#10) ───────────────
            try { _initOledToggle(); } catch (err) { console.error('[App] OLED toggle:', err); }

            // ── Enhancement: 3D Hover on Cards (G#2) ─────────────────────
            try { _init3DCardHover(); } catch (err) { console.error('[App] 3D hover:', err); }

            // ── Enhancement: Jersey Backdrop (G#3) ───────────────────────
            try { _initJerseyBackdrop(); } catch (err) { console.error('[App] Jersey backdrop:', err); }

            // ── Enhancement: Extended global search (UX#3) ───────────────
            try { _extendGlobalSearch(); } catch (err) { console.error('[App] Extended search:', err); }

            // Start at dashboard
            Router.navigate('dashboard');

            // ── Enhancement: Expiring Docs Alert (UX#7) — fires async ────
            // Delayed slightly so it doesn't slow down dashboard render
            setTimeout(() => {
                _initExpiringDocsAlert().catch(e => console.warn('[App] Expiring docs:', e));
            }, 2000);

        } catch (err) {
            console.error('[App] Critical boot error:', err);
            UI.toast('Errore durante l\'avvio dell\'applicazione', 'error');
        }
    }

    async function _renderNavigation(user) {
        try {
            // Find absolute base URL from our own script tag to prevent relative path issues on SPA nested routes
            let base = '';
            const scripts = document.getElementsByTagName('script');
            for (let s of scripts) {
                if (s.src && s.src.includes('js/app.js')) {
                    base = s.src.split('js/app.js')[0];
                    break;
                }
            }

            // Usa APP_VERSION dal Router (stabilito al deploy) invece di Date.now()
            // così il browser può cacheare il file tra i reload fino al prossimo deploy.
            const navVersion = (typeof Router !== 'undefined' && Router._appVersion)
                ? Router._appVersion
                : (document.querySelector('meta[name="app-version"]')?.content || Date.now());
            const fetchUrl = base + 'js/config/navigation.json?v=' + navVersion;
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                throw new Error(`Impossibile caricare navigation.json: HTTP ${response.status} (Controlla che il file esista e il web server operi correttamente)`);
            }

            // Check content type or text before parsing, in case .htaccess rewrote it to index.html
            const textContent = await response.text();
            if (textContent.trim().startsWith('<')) {
                throw new Error('La risposta dal server non è un JSON valido (Probabile errore di configurazione server o .htaccess RewriteRule)');
            }

            const navConfig = JSON.parse(textContent);

            const desktopContainer = document.getElementById('sidebar-nav-container');
            const mobileContainer = document.getElementById('mobile-nav-container');

            if (desktopContainer) desktopContainer.innerHTML = '';
            if (mobileContainer) mobileContainer.innerHTML = '';

            const userRole = user.role;

            navConfig.forEach(item => {
                // Roles Check
                if (item.roles && item.roles.length > 0) {
                    if (!item.roles.includes(userRole)) return;
                }

                const isComingSoon = item.implemented === false;

                // Desktop Nav Item
                if (desktopContainer) {
                    const visibleChildren = (item.children || []).filter(child =>
                        !child.roles || child.roles.length === 0 || child.roles.includes(userRole)
                    );

                    if (visibleChildren.length > 0) {
                        // ── Accordion Group ─────────────────────────────────────────
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
                                // Close all other expanded groups
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
                        });

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
                            });

                            submenu.appendChild(childBtn);
                        });

                        group.appendChild(submenu);
                        desktopContainer.appendChild(group);

                    } else {
                        // ── Simple Nav Item ──────────────────────────────────────────
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'nav-item';
                        btn.dataset.route = item.path;
                        if (isComingSoon) {
                            btn.style.opacity = '0.4';
                            btn.setAttribute('title', 'In arrivo');
                            btn.addEventListener('click', () => UI.toast(`${item.title}: sezione in arrivo`, 'info', 2500));
                        } else {
                            btn.addEventListener('click', () => Router.navigate(item.path));
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

                    btn.addEventListener('click', () => Router.navigate(item.path));
                    mobileContainer.appendChild(btn);
                }
            });

            // Re-highlight current active route after building the DOM
            Router.updateNavActive(Router.getCurrentRoute() || 'dashboard');

        } catch (err) {
            console.error('Error rendering navigation:', err);

            // Provide a detailed error message in toast
            let errorMsg = 'Errore nel caricamento del menu';
            if (err.message.includes('CORS') || err.message.includes('Failed to fetch') || window.location.protocol === 'file:') {
                errorMsg = 'Errore: impossibile caricare il menu in modalità file:// (serve un web server)';
            } else if (err.message.includes('JSON valido')) {
                errorMsg = 'Errore: configurazione routing non valida (il server ha restituito HTML вместо JSON)';
            }
            UI.toast(errorMsg, 'error', 6000);
        }
    }

    function _showUserProfileModal(user) {
        // Usa _currentUser (closure) come fonte di verità per il ruolo — garantito aggiornato al login
        const _cu = _currentUser || user || {};
        const _role = (_cu.role || '').toLowerCase();
        // Permissions può arrivare come stringa JSON o oggetto
        let _perms = _cu.permissions || {};
        if (typeof _perms === 'string') { try { _perms = JSON.parse(_perms); } catch { _perms = {}; } }
        const isAdmin = _role === 'admin'
            || (_perms && (_perms['admin'] === 'write' || _perms['admin'] === 'read'));

        const bodyEl = document.createElement('div');
        bodyEl.style.display = 'flex';
        bodyEl.style.flexDirection = 'column';
        bodyEl.style.gap = 'var(--sp-2)';

        const adminSection = isAdmin ? `
            <div style="margin-top:var(--sp-3); padding-top:var(--sp-3); border-top:1px solid var(--color-border);">
                <h3 style="font-size:12px; text-transform:uppercase; letter-spacing:.6px; color:var(--color-text-muted); margin:0 0 var(--sp-2) 0;">
                    <i class="ph ph-shield-check" style="color:var(--color-pink); margin-right:4px;"></i>Strumenti Admin
                </h3>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button type="button" id="profile-goto-users" class="btn btn-ghost btn-sm" style="justify-content:flex-start; gap:10px; padding:10px 14px; border:1px solid var(--color-border); border-radius:8px;">
                        <i class="ph ph-users" style="font-size:16px; color:#818cf8;"></i>
                        <span>Gestione Utenti</span>
                        <i class="ph ph-arrow-right" style="margin-left:auto; font-size:13px; opacity:.5;"></i>
                    </button>
                    <button type="button" id="profile-goto-backup" class="btn btn-ghost btn-sm" style="justify-content:flex-start; gap:10px; padding:10px 14px; border:1px solid var(--color-border); border-radius:8px;">
                        <i class="ph ph-database" style="font-size:16px; color:#38bdf8;"></i>
                        <span>Backup Sistema</span>
                        <i class="ph ph-arrow-right" style="margin-left:auto; font-size:13px; opacity:.5;"></i>
                    </button>
                    <button type="button" id="profile-goto-logs" class="btn btn-ghost btn-sm" style="justify-content:flex-start; gap:10px; padding:10px 14px; border:1px solid var(--color-border); border-radius:8px;">
                        <i class="ph ph-clipboard-text" style="font-size:16px; color:#a78bfa;"></i>
                        <span>Log di Sistema</span>
                        <i class="ph ph-arrow-right" style="margin-left:auto; font-size:13px; opacity:.5;"></i>
                    </button>
                </div>
            </div>
        ` : '';

        bodyEl.innerHTML = `
            <h3 style="font-size:14px; margin-top:0; margin-bottom:0;">Cambia Password</h3>
            <form id="profile-password-form" style="display:flex; flex-direction:column; gap:var(--sp-2); margin:0;">
                <div class="form-group" style="margin:0;">
                    <label class="form-label" for="profile-current-pwd" style="margin-bottom:4px;">Password Attuale</label>
                    <input type="password" id="profile-current-pwd" class="form-input" required autocomplete="current-password" style="width:100%; border:1px solid var(--color-border); border-radius:6px; padding:0.75rem; background:var(--color-surface);">
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label" for="profile-new-pwd" style="margin-bottom:4px;">Nuova Password (min. 10 caratteri)</label>
                    <input type="password" id="profile-new-pwd" class="form-input" required autocomplete="new-password" style="width:100%; border:1px solid var(--color-border); border-radius:6px; padding:0.75rem; background:var(--color-surface);">
                </div>
                <div id="profile-pwd-error" class="form-error hidden" style="color:var(--color-danger); font-size:13px; margin:4px 0;"></div>
                <button type="submit" class="btn btn-primary" id="profile-pwd-btn" style="margin-top:var(--sp-1);">AGGIORNA PASSWORD</button>
            </form>
            ${adminSection}
        `;

        const m = UI.modal({
            title: 'Il mio profilo',
            body: bodyEl
        });

        const form = bodyEl.querySelector('#profile-password-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = bodyEl.querySelector('#profile-pwd-btn');
            const errEl = bodyEl.querySelector('#profile-pwd-error');
            const current = bodyEl.querySelector('#profile-current-pwd').value;
            const newPwd = bodyEl.querySelector('#profile-new-pwd').value;

            if (newPwd.length < 10) {
                errEl.textContent = 'La password deve essere di almeno 10 caratteri';
                errEl.classList.remove('hidden');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'SALVATAGGIO...';
            errEl.classList.add('hidden');

            try {
                await Store.api('resetPassword', 'auth', { currentPassword: current, newPassword: newPwd });
                UI.toast('Password aggiornata con successo.', 'success');
                m.close();
            } catch (err) {
                errEl.textContent = err.message || 'Errore durante la modifica della password';
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'AGGIORNA PASSWORD';
            }
        });

        // Admin navigation buttons
        if (isAdmin) {
            bodyEl.querySelector('#profile-goto-users')?.addEventListener('click', () => {
                m.close();
                Router.navigate('utenti');
            });
            bodyEl.querySelector('#profile-goto-backup')?.addEventListener('click', () => {
                m.close();
                Router.navigate('admin-backup');
            });
            bodyEl.querySelector('#profile-goto-logs')?.addEventListener('click', () => {
                m.close();
                Router.navigate('admin-logs');
            });
        }
    }


    function _initGlobalSearch() {
        const input = document.getElementById('global-search');
        const results = document.getElementById('global-search-results');
        if (!input || !results) return;

        let _athleteIndex = null; // lazy-loaded
        let _selectedIdx = -1;

        const AVATAR_COLORS = ['#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];
        function _avatarColor(name) {
            if (!name) return AVATAR_COLORS[0];
            let h = 0;
            for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
            return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
        }

        function _highlight(text, q) {
            if (!q) return Utils.escapeHtml(text);
            const idx = text.toLowerCase().indexOf(q.toLowerCase());
            if (idx === -1) return Utils.escapeHtml(text);
            return Utils.escapeHtml(text.slice(0, idx)) +
                `<mark class="search-result-mark">${Utils.escapeHtml(text.slice(idx, idx + q.length))}</mark>` +
                Utils.escapeHtml(text.slice(idx + q.length));
        }

        async function _ensureIndex() {
            if (_athleteIndex) return;
            try {
                const athletes = await Store.get('list', 'athletes');
                _athleteIndex = athletes || [];
            } catch {
                _athleteIndex = [];
            }
        }

        function _closeResults() {
            results.classList.add('hidden');
            input.setAttribute('aria-expanded', 'false');
            _selectedIdx = -1;
        }

        function _openResults(items, q) {
            _selectedIdx = -1;
            if (items.length === 0) {
                results.innerHTML = `<div class="search-result-empty">Nessun risultato per "${Utils.escapeHtml(q)}"</div>`;
            } else {
                results.innerHTML = items.slice(0, 8).map((a, i) => {
                    const bg = _avatarColor(a.full_name);
                    const initials = Utils.initials(a.full_name);
                    const display = a.jersey_number != null ? String(a.jersey_number) : initials;
                    return `<div class="search-result-item" role="option" tabindex="-1" data-id="${Utils.escapeHtml(String(a.id))}" data-idx="${i}">
                        <div class="search-result-avatar" style="background:${bg};">${Utils.escapeHtml(display)}</div>
                        <div style="flex:1;min-width:0;">
                            <div class="search-result-name">${_highlight(a.full_name || '', q)}</div>
                            <div class="search-result-meta">${Utils.escapeHtml(a.role || '')}${a.team_name ? ' · ' + Utils.escapeHtml(a.team_name) : ''}</div>
                        </div>
                        <i class="ph ph-arrow-right" style="font-size:14px;color:var(--text-muted);flex-shrink:0;"></i>
                    </div>`;
                }).join('');
            }
            results.classList.remove('hidden');
            input.setAttribute('aria-expanded', 'true');
        }

        function _navigate(athleteId) {
            _closeResults();
            input.value = '';
            Router.navigate('athletes', { id: athleteId });
        }

        let _debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(_debounceTimer);
            const q = input.value.trim();
            if (!q) { _closeResults(); return; }
            _debounceTimer = setTimeout(async () => {
                await _ensureIndex();
                const filtered = (_athleteIndex || []).filter(a =>
                    (a.full_name || '').toLowerCase().includes(q.toLowerCase()) ||
                    (a.role || '').toLowerCase().includes(q.toLowerCase()) ||
                    (a.team_name || '').toLowerCase().includes(q.toLowerCase())
                );
                _openResults(filtered, q);
            }, 150);
        });

        input.addEventListener('focus', () => { _ensureIndex(); });

        input.addEventListener('keydown', (e) => {
            const items = results.querySelectorAll('.search-result-item');
            if (e.key === 'Escape') { _closeResults(); input.blur(); return; }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                _selectedIdx = Math.min(_selectedIdx + 1, items.length - 1);
                items.forEach((el, i) => el.classList.toggle('selected', i === _selectedIdx));
                if (items[_selectedIdx]) items[_selectedIdx].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                _selectedIdx = Math.max(_selectedIdx - 1, 0);
                items.forEach((el, i) => el.classList.toggle('selected', i === _selectedIdx));
                if (items[_selectedIdx]) items[_selectedIdx].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter' && _selectedIdx >= 0 && items[_selectedIdx]) {
                _navigate(items[_selectedIdx].dataset.id);
            }
        });

        results.addEventListener('click', (e) => {
            const item = e.target.closest('.search-result-item');
            if (item?.dataset.id) _navigate(item.dataset.id);
        });

        // Keyboard shortcut ⌘K / Ctrl+K
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                input.focus();
                input.select();
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                _closeResults();
            }
        });
    }

    function renderForgotPassword() {
        const m = UI.modal({
            title: 'Password dimenticata',
            body: `
                <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:var(--sp-3);">
                    Inserisci la tua email. Ti invieremo un link per reimpostare la password (valido 1 ora).
                </p>
                <div class="form-group">
                    <label class="form-label" for="fp-email">Email</label>
                    <input id="fp-email" class="form-input" type="email" placeholder="nome@esempio.it" autocomplete="email">
                </div>
                <div id="fp-result" class="hidden" style="padding:12px;background:rgba(0,230,118,0.08);border:1px solid #00E676;font-size:13px;margin-top:12px;">
                    ✔ Se l'email è registrata riceverai il link entro pochi minuti.
                </div>
                <div id="fp-error" class="form-error hidden"></div>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="fp-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="fp-send" type="button"><i class="ph ph-envelope" style="font-size:14px;"></i> INVIA LINK</button>`,
        });
        document.getElementById('fp-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('fp-send')?.addEventListener('click', async () => {
            const btn = document.getElementById('fp-send');
            const errEl = document.getElementById('fp-error');
            const email = document.getElementById('fp-email')?.value.trim();
            errEl.classList.add('hidden');
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errEl.textContent = 'Inserisci un indirizzo email valido.';
                errEl.classList.remove('hidden'); return;
            }
            btn.disabled = true; btn.textContent = 'Invio…';
            try {
                await Store.api('requestPasswordReset', 'auth', { email });
                document.getElementById('fp-result').classList.remove('hidden');
                btn.classList.add('hidden');
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                btn.disabled = false; btn.textContent = '📧 INVIA LINK';
            }
        });
    }

    function _showConfirmResetScreen(token) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-shell').classList.add('hidden');
        const resetScreen = document.getElementById('reset-screen');
        resetScreen.classList.remove('hidden');
        const sub = resetScreen.querySelector('p.text-muted');
        if (sub) sub.textContent = 'Scegli una nuova password sicura (min. 10 caratteri).';
        // Hide current-password field — not needed in forgot-password flow
        const curGroup = document.getElementById('reset-current')?.closest('.form-group');
        if (curGroup) curGroup.style.display = 'none';
        if (document.getElementById('reset-current'))
            document.getElementById('reset-current').value = 'NOT_REQUIRED_FORGOT_FLOW';
        const form = document.getElementById('reset-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('reset-btn');
            const errEl = document.getElementById('reset-error');
            const newPwd = document.getElementById('reset-new').value;
            if (newPwd.length < 10) {
                errEl.textContent = 'La password deve essere di almeno 10 caratteri';
                errEl.classList.remove('hidden'); return;
            }
            btn.disabled = true; btn.textContent = 'SALVATAGGIO…';
            try {
                await Store.api('confirmPasswordReset', 'auth', { token, newPassword: newPwd });
                UI.toast('Password aggiornata! Effettua il login.', 'success');
                window.history.replaceState(null, '', window.location.pathname);
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                btn.disabled = false; btn.textContent = 'SALVA NUOVA PASSWORD';
            }
        }, { once: true });
    }
    // ─── LT#2: Mobile Bottom Navigation ────────────────────────────────────────
    /**
     * Wire the mobile bottom nav (visible at <768px).
     * Syncs active state with Router on every route change by observing
     * the #page-title element (updated by each module on init).
     */
    function _initBottomNav() {
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
                    // Profile in the app opens the user dropdown
                    document.getElementById('user-menu-btn')?.click();
                    return;
                }
                Router.navigate(route);
                _setActive(route);
            });
        });

        // Observe route changes by watching Router's current route
        // We piggyback on the existing Router.navigate() side-effect that
        // updates #page-title to detect route changes without patching Router.
        const titleEl = document.getElementById('page-title');
        if (titleEl) {
            const _routeObserver = new MutationObserver(() => {
                const current = Router.current?.() ?? '';
                _setActive(current);
            });
            _routeObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });
        }

        // Set initial active state
        const initialRoute = Router.current?.() ?? 'dashboard';
        _setActive(initialRoute);
    }

    function _initNotifications() {
        const btn = document.getElementById('notifications-btn');
        const dropdown = document.getElementById('notifications-dropdown');
        const markReadBtn = document.getElementById('notifications-mark-read');

        if (!btn || !dropdown) return;

        // Toggle dropdown visibility
        btn.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        };

        // Mark as read (mock logic)
        if (markReadBtn) {
            markReadBtn.onclick = (e) => {
                e.stopPropagation();
                const badge = document.getElementById('notifications-badge');
                if (badge) badge.style.display = 'none';
                UI.toast('Notifiche segnate come lette', 'success');
                dropdown.classList.add('hidden');
            };
        }

        // Close on clic outside
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // ── G#2: 3D Card Hover Tilt ──────────────────────────────────────────────
    // Applies a subtle perspective tilt effect to cards on mousemove.
    // Cards with class .no-tilt are excluded from the effect.
    function _init3DCardHover() {
        const appEl = document.getElementById('app');
        if (!appEl) return;

        // Use event delegation — works with dynamically rendered cards
        appEl.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.card');
            if (!card || card.classList.contains('no-tilt')) return;
            const { left, top, width, height } = card.getBoundingClientRect();
            const rx = ((e.clientY - top) / height - 0.5) * 10;
            const ry = ((e.clientX - left) / width - 0.5) * -10;
            card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.015)`;
        });

        appEl.addEventListener('mouseleave', (e) => {
            const card = e.target.closest('.card');
            if (card && !card.classList.contains('no-tilt')) card.style.transform = '';
        }, true);

        // Also reset on fast mouse-out from card
        appEl.addEventListener('mouseout', (e) => {
            if (e.target.classList?.contains('card') && !e.target.classList.contains('no-tilt')) {
                e.target.style.transform = '';
            }
        });
    }

    // ── G#6: Generative Gradient Avatar ──────────────────────────────────────
    // Returns a gradient CSS class index (0-6) based on name hash.
    function _getAvatarGradientClass(name) {
        if (!name) return 'avatar-g0';
        let h = 0;
        for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
        return `avatar-g${Math.abs(h) % 7}`;
    }
    window._getAvatarGradientClass = _getAvatarGradientClass;

    // ── G#9: Page Transitions ────────────────────────────────────────────────
    // Patches the Router.navigate function to add CSS transitions between pages.
    function _initPageTransitions() {
        const _origNavigate = Router.navigate.bind(Router);
        Router.navigate = async function (route, params) {
            const appEl = document.getElementById('app');
            if (appEl) {
                appEl.classList.add('page-exit');
                await new Promise(r => setTimeout(r, 140));
                appEl.classList.remove('page-exit');
            }
            await _origNavigate(route, params);
            if (appEl) {
                appEl.classList.remove('page-enter');
                // Force reflow
                void appEl.offsetWidth;
                appEl.classList.add('page-enter');
                setTimeout(() => appEl.classList.remove('page-enter'), 320);
            }
        };
    }

    // ── G#10: OLED Mode Toggle ───────────────────────────────────────────────
    // Adds a toggle button to the sidebar footer for OLED pure black mode.
    function _initOledToggle() {
        const footer = document.querySelector('.sidebar-footer');
        if (!footer) return;

        // Restore saved preference
        const savedTheme = localStorage.getItem('fusion_theme');
        if (savedTheme) document.documentElement.dataset.theme = savedTheme;

        const row = document.createElement('div');
        row.className = 'theme-toggle-row';
        row.title = 'Modalità OLED — Massima profondità su schermi a pixel autoilluminanti';
        row.innerHTML = `
            <span class="theme-toggle-label">
                <i class="ph ph-moon-stars" aria-hidden="true"></i> OLED Black
            </span>
            <div class="theme-toggle-switch" id="oled-toggle-switch" aria-label="Toggle OLED mode" role="switch"></div>
        `;

        row.addEventListener('click', () => {
            const isOled = document.documentElement.dataset.theme === 'oled';
            const newTheme = isOled ? '' : 'oled';
            document.documentElement.dataset.theme = newTheme;
            localStorage.setItem('fusion_theme', newTheme);
            UI.toast(newTheme === 'oled' ? '🌑 OLED Black attivato' : '⬛ Tema standard ripristinato', 'info', 1800);
        });

        footer.insertBefore(row, footer.querySelector('.user-profile'));
    }

    // ── UX#3: Extended Global Search ────────────────────────────────────────
    // Extends _initGlobalSearch to also search Staff by patching the index.
    function _extendGlobalSearch() {
        const input = document.getElementById('global-search');
        if (!input) return;

        // Lazy-load staff index and merge when available
        let _staffIndex = null;
        const _origFocus = input.onfocus;

        input.addEventListener('focus', async () => {
            if (_staffIndex) return;
            try {
                _staffIndex = await Store.get('list', 'staff');
            } catch {
                _staffIndex = [];
            }
        });

        // Monkey-patch: store staff index globally for the search fn to pick up
        window._fusionStaffSearchIndex = () => _staffIndex;
    }

    // ── UX#7: Expiring Documents Alert ──────────────────────────────────────
    // Shows a toast and sidebar badge when athletes have documents expiring ≤ 30 days.
    async function _initExpiringDocsAlert() {
        try {
            const athletes = await Store.get('listLight', 'athletes').catch(() => null);
            if (!athletes || !athletes.length) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const warningThreshold = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

            const expiring = athletes.filter(ath => {
                if (!ath.medical_cert_expires_at) return false;
                const exp = new Date(ath.medical_cert_expires_at);
                return exp <= warningThreshold;
            });

            const expired = expiring.filter(ath => new Date(ath.medical_cert_expires_at) < today);
            const soonExpiring = expiring.filter(ath => new Date(ath.medical_cert_expires_at) >= today);

            if (expiring.length === 0) return;

            // Show toast after 800ms (let app settle)
            setTimeout(() => {
                const msg = expired.length > 0
                    ? `🔴 ${expired.length} cert. medici scaduti, ${soonExpiring.length} in scadenza nei prossimi 30 giorni`
                    : `⚠️ ${soonExpiring.length} certificati medici in scadenza nei prossimi 30 giorni`;
                UI.toast(msg, expired.length > 0 ? 'error' : 'warning', 7000);
            }, 1000);

            // Add badge to Atleti nav item
            setTimeout(() => {
                // Find the Atleti nav button (has data-route="athletes" or navigates to athletes)
                const athleteNavBtns = document.querySelectorAll('[data-route="athletes"], [data-route^="athlete"]');
                athleteNavBtns.forEach(btn => {
                    if (btn.querySelector('.nav-badge-alert')) return; // avoid duplicates
                    const badge = document.createElement('span');
                    badge.className = 'nav-badge-alert';
                    badge.textContent = expiring.length > 9 ? '9+' : String(expiring.length);
                    badge.title = `${expiring.length} documenti in scadenza`;
                    btn.appendChild(badge);
                });
            }, 1200);

        } catch (err) {
            console.warn('[App] Could not check expiring docs:', err);
        }
    }

    // ── UX#9: Additional Keyboard Shortcuts ─────────────────────────────────
    // Alt+A → Atleti, Alt+T → Trasferte, Alt+R → Risultati, Alt+N → "Nuovo"
    function _initExtraKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'a':
                        e.preventDefault();
                        Router.navigate('athletes');
                        break;
                    case 't':
                        e.preventDefault();
                        Router.navigate('transport');
                        break;
                    case 'r':
                        e.preventDefault();
                        Router.navigate('results');
                        break;
                    case 'n': {
                        e.preventDefault();
                        // Click the first visible "+ NEW" / "NUOVO" button in the current view
                        const newBtn = document.querySelector(
                            '[id$="-btn"][class*="btn-primary"], button.btn-primary, #new-athlete-btn, #new-staff-btn'
                        );
                        if (newBtn) newBtn.click();
                        else UI.toast('Nessuna azione "Nuovo" disponibile in questa schermata', 'info', 2000);
                        break;
                    }
                }
            }

            // ESC — close any open modal (UX improvement)
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay:not(.hidden)');
                if (modal) {
                    const closeBtn = modal.querySelector('.modal-close, [data-modal-close]');
                    if (closeBtn) closeBtn.click();
                }
            }
        });
    }

    // ── UX#4: Persist Active Filter State ───────────────────────────────────
    // Saved/restored from session storage by each module — this helper provides
    // the shared API to save/restore filters across navigations.
    window.FilterState = {
        save(module, key, value) {
            try { sessionStorage.setItem(`filter_${module}_${key}`, String(value)); } catch { }
        },
        restore(module, key, defaultVal) {
            try { return sessionStorage.getItem(`filter_${module}_${key}`) ?? defaultVal; } catch { return defaultVal; }
        },
        clear(module) {
            try {
                Object.keys(sessionStorage)
                    .filter(k => k.startsWith(`filter_${module}_`))
                    .forEach(k => sessionStorage.removeItem(k));
            } catch { }
        }
    };

    // ── G#3: Jersey Number giant backdrop in athlete header ──────────────────
    // Runs after athlete profile render via MutationObserver on #app
    function _initJerseyBackdrop() {
        const appEl = document.getElementById('app');
        if (!appEl) return;

        const obs = new MutationObserver(() => {
            // Look for the athlete header section that shows jersey number
            const jerseyEl = appEl.querySelector('[class*="jersey"], [style*="font-size:4rem"]');
            const headerEl = appEl.querySelector('.page-body > div:nth-child(2)');
            if (jerseyEl && headerEl) {
                const jerseyText = jerseyEl.textContent?.replace('#', '').trim();
                if (jerseyText && !headerEl.hasAttribute('data-jersey-bg')) {
                    headerEl.style.position = 'relative';
                    headerEl.style.overflow = 'hidden';
                    headerEl.setAttribute('data-jersey-bg', jerseyText);
                }
            }
        });

        obs.observe(appEl, { childList: true, subtree: false });
    }

    function getUser() { return _currentUser; }

    return { init, getUser, renderForgotPassword };
})();

// ─── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    App.init().then(() => {
        // Post-init: wire up all the visual enhancements that need app to be running
        // These are called after App.init() to ensure the DOM is ready

        // G#2: 3D tilt on cards (use internal helper exposed via window)
        try { window._init3DCardHover && window._init3DCardHover(); } catch { }

        // G#9: Page transitions — patch router
        try {
            // _initPageTransitions is called from _bootApp, but also safe to retry here
        } catch { }
    }).catch(() => { });
});

