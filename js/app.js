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

                document.onclick = (e) => {
                    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                        userDropdown.classList.add('hidden');
                    }
                };

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

            // Initialize notifications (resiliently)
            try {
                _initNotifications();
            } catch (err) {
                console.error('[App] Failed to init notifications:', err);
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

            // Start at dashboard
            Router.navigate('dashboard');
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

            const fetchUrl = base + 'js/config/navigation.json?v=' + Date.now();
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

            const desktopContainer = document.getElementById('desktop-nav-container');
            const mobileContainer = document.getElementById('mobile-nav-container');

            if (desktopContainer) desktopContainer.innerHTML = '';
            if (mobileContainer) mobileContainer.innerHTML = '';

            const userRole = user.role; // e.g. 'atleta', 'allenatore', 'operatore', 'manager', 'admin'

            navConfig.forEach(item => {
                // Roles Check: item.roles lists which roles can see this tab
                if (item.roles && item.roles.length > 0) {
                    if (!item.roles.includes(userRole)) return; // hide tab for this role
                }

                // Desktop Nav Item
                if (desktopContainer) {
                    const hasChildren = item.children && item.children.length > 0;

                    if (hasChildren) {
                        // Create wrapper for dropdown
                        const wrapper = document.createElement('div');
                        wrapper.className = 'nav-dropdown-wrapper';

                        const btn = document.createElement('button');
                        btn.className = 'nav-item';
                        btn.type = 'button';
                        btn.dataset.route = item.path;
                        btn.innerHTML = item.title.toUpperCase() + ' <i class="ph ph-caret-down" style="font-size:10px;margin-left:4px;opacity:0.5;"></i>';

                        if (item.implemented === false) {
                            btn.style.opacity = '0.35';
                            btn.style.cursor = 'default';
                        } else {
                            btn.addEventListener('click', () => Router.navigate(item.path));
                        }
                        wrapper.appendChild(btn);

                        // Build dropdown
                        const dropdown = document.createElement('div');
                        dropdown.className = 'nav-dropdown';

                        item.children.forEach(child => {
                            if (child.roles && child.roles.length > 0 && !child.roles.includes(userRole)) return;
                            const link = document.createElement('button');
                            link.className = 'nav-dropdown-item';
                            link.type = 'button';
                            link.innerHTML = `<i class="ph ph-${child.icon || 'dot'}" style="font-size:16px;"></i> ${child.title}`;
                            if (child.implemented === false) {
                                link.style.opacity = '0.4';
                                link.addEventListener('click', () => UI.toast(`${child.title}: in arrivo`, 'info', 2000));
                            } else {
                                link.addEventListener('click', () => { Router.navigate(child.path); });
                            }
                            dropdown.appendChild(link);
                        });

                        wrapper.appendChild(dropdown);
                        desktopContainer.appendChild(wrapper);
                    } else {
                        const btn = document.createElement('button');
                        btn.className = 'nav-item';
                        btn.type = 'button';
                        btn.dataset.route = item.path;
                        btn.textContent = item.title.toUpperCase();

                        if (item.implemented === false) {
                            btn.classList.add('nav-item--coming-soon');
                            btn.title = 'In arrivo';
                            btn.style.opacity = '0.35';
                            btn.style.cursor = 'default';
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                UI.toast(`${item.title}: sezione in arrivo`, 'info', 2500);
                            });
                        } else {
                            btn.addEventListener('click', () => Router.navigate(item.path));
                        }
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
        const bodyEl = document.createElement('div');
        bodyEl.style.display = 'flex';
        bodyEl.style.flexDirection = 'column';
        bodyEl.style.gap = 'var(--sp-2)';

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
                <button class="btn btn-primary btn-sm" id="fp-send" type="button">📧 INVIA LINK</button>`,
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

    function getUser() { return _currentUser; }

    return { init, getUser, renderForgotPassword };
})();

// ─── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
