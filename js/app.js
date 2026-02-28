/**
 * App — Bootstrap & Auth Flow
 * Fusion ERP v1.0
 */

'use strict';

const App = (() => {
    let _currentUser = null;

    async function init() {
        // Try to resume existing session
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
        const userRoles = user.permissions || [user.role];
        const isAdmin = userRoles.includes('admin');
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(el => {
            if (isAdmin) el.classList.remove('hidden');
            else el.classList.add('hidden');
        });

        // User Dropdown toggle logic
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
            userDropdown.querySelectorAll('.dropdown-item').forEach(item => {
                if (item.id !== 'logout-btn') {
                    item.onclick = () => {
                        userDropdown.classList.add('hidden');
                        if (item.dataset.route) {
                            Router.navigate(item.dataset.route);
                        }
                    };
                }
            });
        }

        // Load and render navigation
        await _renderNavigation(user);

        // Wire up any remaining hardcoded nav items (like the Logo)
        Utils.qsa('[data-route]').forEach(item => {
            if (!item.hasAttribute('data-route-bound')) {
                item.addEventListener('click', () => Router.navigate(item.dataset.route));
                item.setAttribute('data-route-bound', 'true');
            }
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            try {
                await Store.api('logout', 'auth');
                UI.toast('Logout effettuato', 'info');
                setTimeout(() => window.location.reload(), 800);
            } catch {
                window.location.reload();
            }
        });

        // Start at dashboard
        Router.navigate('dashboard');
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

            const userRoles = user.permissions || [user.role]; // Support additive roles or fallback to single role

            navConfig.forEach(item => {
                // Roles Check
                if (item.roles && item.roles.length > 0) {
                    const hasAccess = item.roles.some(r => userRoles.includes(r));
                    if (!hasAccess) return;
                }

                // Desktop Nav Item
                if (desktopContainer) {
                    const btn = document.createElement('button');
                    btn.className = 'nav-item';
                    btn.type = 'button';
                    btn.dataset.route = item.path;
                    btn.textContent = item.title.toUpperCase();
                    // Setup children drop-down logic if needed here, but for now we just map the top level route
                    btn.addEventListener('click', () => Router.navigate(item.path));
                    desktopContainer.appendChild(btn);
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

    function getUser() { return _currentUser; }

    return { init, getUser };
})();

// ─── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
