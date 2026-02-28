/**
 * App — Bootstrap & Auth Flow
 * Fusion ERP v1.0
 */

'use strict';

const App = (() => {
    let _currentUser = null;

    async function init() {
        // Handle Splash Screen
        _initSplashScreen();

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
        const splash = document.getElementById('splash-screen');
        if (!splash) return;

        // Wait 2800ms for massive WOW animation
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 250); // Remove from DOM after fade

            // After splash, check onboarding
            _checkOnboarding();
        }, 2800);
    }

    function _checkOnboarding() {
        if (localStorage.getItem('fusion_onboarding_done')) return;

        const onboarding = document.getElementById('onboarding-screen');
        if (!onboarding) return;

        onboarding.classList.remove('hidden');

        let currentSlide = 0;
        const slides = document.querySelectorAll('.onboarding-slide');
        const dots = document.querySelectorAll('#onboarding-dots .dot');
        const btnNext = document.getElementById('onboarding-next');
        const btnSkip = document.getElementById('onboarding-skip');

        const updateSlides = () => {
            slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
            dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));

            if (currentSlide === slides.length - 1) {
                btnNext.innerHTML = 'INIZIA <i class="ph ph-check"></i>';
            } else {
                btnNext.innerHTML = 'AVANTI <i class="ph ph-arrow-right"></i>';
            }
        };

        const finishOnboarding = () => {
            localStorage.setItem('fusion_onboarding_done', 'true');
            onboarding.classList.add('hidden');
            setTimeout(() => onboarding.remove(), 300);
        };

        btnNext.addEventListener('click', () => {
            if (currentSlide < slides.length - 1) {
                currentSlide++;
                updateSlides();
            } else {
                finishOnboarding();
            }
        });

        btnSkip.addEventListener('click', finishOnboarding);
    }

    function _showAuthScreen() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-shell').classList.add('hidden');
        document.getElementById('reset-screen').classList.add('hidden');

        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('login-btn');
            const errEl = document.getElementById('login-error');
            const email = document.getElementById('login-email').value.trim();
            const pwd = document.getElementById('login-password').value;

            btn.disabled = true;
            btn.textContent = 'ACCESSO...';
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
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'ACCEDI';
            }
        }, { once: true });
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

    function _bootApp(user) {
        _currentUser = user;

        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('reset-screen').classList.add('hidden');
        document.getElementById('app-shell').classList.remove('hidden');

        // Update sidebar user info
        const nameEl = document.getElementById('sidebar-username');
        const roleEl = document.getElementById('sidebar-role');
        const avatarEl = document.getElementById('sidebar-avatar');
        if (nameEl) nameEl.textContent = Utils.escapeHtml(user.fullName || user.email);
        if (roleEl) roleEl.textContent = Utils.escapeHtml(user.role);
        if (avatarEl) avatarEl.textContent = Utils.initials(user.fullName || user.email);

        // Show admin-only nav items
        if (user.role === 'admin') {
            Utils.qsa('.nav-admin-only').forEach(el => el.classList.remove('hidden'));
        }

        // Wire up nav items
        Utils.qsa('[data-route]').forEach(item => {
            item.addEventListener('click', () => Router.navigate(item.dataset.route));
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

    function getUser() { return _currentUser; }

    return { init, getUser };
})();

// ─── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
