'use strict';

/**
 * Auth — Login, Reset Password, and Invitation Flows
 * Fusion ERP v1.0
 *
 * Extracted from app.js for better separation of concerns.
 * Exposes: AuthFlow (global)
 *
 * Dependencies: Store, UI, Utils, Router
 */

const AuthFlow = (() => {
    /** @type {AbortController} Tracks auth-screen event listeners for cleanup */
    let _abortAuth = new AbortController();

    /**
     * Show the login screen and wire up the form.
     * @param {function(object): void} onLoginSuccess - Callback with user data on successful login
     */
    function showLoginScreen(onLoginSuccess) {
        _abortAuth.abort();
        _abortAuth = new AbortController();

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
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'ph ph-eye' : 'ph ph-eye-slash';
                }
            }, { signal: _abortAuth.signal });
        }

        // UX: Inline email validation
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
            }, { signal: _abortAuth.signal });
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

                if (data.needsReset) {
                    _showResetScreen(onLoginSuccess);
                    return;
                }

                onLoginSuccess(data);
            } catch (err) {
                triggerShake(err.message || "Credenziali non valide. Verifica email e password.");
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'ACCEDI';
                btn.style.opacity = '1';
            }
        }, { signal: _abortAuth.signal });
    }

    /**
     * Show the mandatory password reset screen (password expired).
     * @param {function(object): void} onLoginSuccess - Callback after successful reset
     */
    function _showResetScreen(onLoginSuccess) {
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

            if (newPwd.length < 12) {
                errEl.textContent = 'La password deve essere di almeno 12 caratteri';
                errEl.classList.remove('hidden');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'SALVATAGGIO...';

            try {
                await Store.api('resetPassword', 'auth', { currentPassword: current, newPassword: newPwd });
                UI.toast('Password aggiornata. Effettua il login.', 'success');
                setTimeout(() => showLoginScreen(onLoginSuccess), 1200);
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'SALVA NUOVA PASSWORD';
            }
        }, { once: true });
    }

    /**
     * Show the sub-user invitation acceptance screen.
     * @param {string} token - Invitation token (64-char hex)
     */
    function showAcceptInvitationScreen(token) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-shell').classList.add('hidden');
        const resetScreen = document.getElementById('reset-screen');
        resetScreen.classList.remove('hidden');

        const title = resetScreen.querySelector('h1');
        if (title) title.textContent = 'Attivazione Account';

        const sub = resetScreen.querySelector('p.text-muted');
        if (sub) sub.textContent = 'Benvenuto! Imposta la tua password per accedere al portale.';

        const curGroup = document.getElementById('reset-current')?.closest('.form-group');
        if (curGroup) curGroup.style.display = 'none';

        const form = document.getElementById('reset-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('reset-btn');
            const errEl = document.getElementById('reset-error');
            const newPwd = document.getElementById('reset-new').value;

            if (newPwd.length < 12) {
                errEl.textContent = 'La password deve essere di almeno 12 caratteri';
                errEl.classList.remove('hidden');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'ATTIVAZIONE...';

            try {
                await Store.api('acceptSubUserInvitation', 'auth', { token, password: newPwd });
                UI.toast('Account attivato con successo! Ora puoi accedere.', 'success');
                setTimeout(() => window.location.href = './', 1500);
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'ATTIVA ACCOUNT';
            }
        }, { once: true });
    }

    /**
     * Show the forgot-password confirmation screen (from email link).
     * @param {string} token - Password reset token (64-char hex)
     */
    function showConfirmResetScreen(token) {
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
            if (newPwd.length < 12) {
                errEl.textContent = 'La password deve essere di almeno 12 caratteri';
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

    /**
     * Show the forgot-password modal (triggered from login screen).
     */
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

    /**
     * Show the user profile modal with password change form.
     * @param {object} user - Current user object
     */
    function showUserProfileModal(user) {
        const _cu = user || {};
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

            if (newPwd.length < 12) {
                errEl.textContent = 'La password deve essere di almeno 12 caratteri';
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

    return {
        showLoginScreen,
        showAcceptInvitationScreen,
        showConfirmResetScreen,
        renderForgotPassword,
        showUserProfileModal
    };
})();
window.AuthFlow = AuthFlow;
