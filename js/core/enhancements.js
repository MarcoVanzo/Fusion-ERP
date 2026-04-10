'use strict';

/**
 * Enhancements — Keyboard Shortcuts, OLED Toggle, Notifications, Jersey Backdrop,
 *                Expiring Docs Alerts, FilterState, Avatar Gradients
 * Fusion ERP v1.0
 *
 * Extracted from app.js for better separation of concerns.
 * Exposes: Enhancements (global), FilterState (global)
 *
 * Dependencies: Store, UI, Utils, Router
 */

const Enhancements = (() => {

    // ── G#6: Generative Gradient Avatar ──────────────────────────────────────
    /**
     * Returns a gradient CSS class index (0-6) based on name hash.
     * @param {string} name
     * @returns {string} CSS class name
     */
    function getAvatarGradientClass(name) {
        if (!name) return 'avatar-g0';
        let h = 0;
        for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
        return `avatar-g${Math.abs(h) % 7}`;
    }
    window._getAvatarGradientClass = getAvatarGradientClass;

    // ── Notifications ────────────────────────────────────────────────────────
    /**
     * Wire the notifications bell dropdown.
     */
    function initNotifications() {
        const btn = document.getElementById('notifications-btn');
        const dropdown = document.getElementById('notifications-dropdown');
        const markReadBtn = document.getElementById('notifications-mark-read');

        if (!btn || !dropdown) return;

        btn.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        };

        if (markReadBtn) {
            markReadBtn.onclick = (e) => {
                e.stopPropagation();
                const badge = document.getElementById('notifications-badge');
                if (badge) badge.style.display = 'none';
                UI.toast('Notifiche segnate come lette', 'success');
                dropdown.classList.add('hidden');
            };
        }

        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // ── G#10: OLED Mode Toggle ───────────────────────────────────────────────
    /**
     * Add OLED pure-black theme toggle to sidebar footer.
     */
    function initOledToggle() {
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

    // ── UX#9: Additional Keyboard Shortcuts ─────────────────────────────────
    /**
     * Alt+A → Athletes, Alt+T → Transport, Alt+R → Results, Alt+N → "New" action, ESC → close modal
     */
    function initKeyboardShortcuts() {
        const _kbShortcuts = (e) => {
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
                        const newBtn = document.querySelector(
                            '[id$="-btn"][class*="btn-primary"], button.btn-primary, #new-athlete-btn, #new-staff-btn'
                        );
                        if (newBtn) newBtn.click();
                        else UI.toast('Nessuna azione "Nuovo" disponibile in questa schermata', 'info', 2000);
                        break;
                    }
                }
            }

            // ESC — close any open modal
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay:not(.hidden)');
                if (modal) {
                    const closeBtn = modal.querySelector('.modal-close, [data-modal-close]');
                    if (closeBtn) closeBtn.click();
                }
            }
        };
        document.addEventListener('keydown', _kbShortcuts);
        (window._appKbHandlers ??= []).push([_kbShortcuts]);
    }

    // ── G#3: Jersey Number Giant Backdrop ────────────────────────────────────
    /**
     * Add giant jersey number backdrop on athlete profile via MutationObserver.
     */
    function initJerseyBackdrop() {
        const appEl = document.getElementById('app');
        if (!appEl) return;

        const obs = new MutationObserver(() => {
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
        window.__jerseyObserver = obs;
    }

    // ── UX#7: Expiring Documents Alert ──────────────────────────────────────
    /**
     * Check for athletes with expiring medical certificates and show alerts.
     */
    async function initExpiringDocsAlert() {
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

            setTimeout(() => {
                const msg = expired.length > 0
                    ? `🔴 ${expired.length} cert. medici scaduti, ${soonExpiring.length} in scadenza nei prossimi 30 giorni`
                    : `⚠️ ${soonExpiring.length} certificati medici in scadenza nei prossimi 30 giorni`;
                UI.toast(msg, expired.length > 0 ? 'error' : 'warning', 7000);
            }, 1000);

            setTimeout(() => {
                const athleteNavBtns = document.querySelectorAll('[data-route="athletes"], [data-route^="athlete"]');
                athleteNavBtns.forEach(btn => {
                    if (btn.querySelector('.nav-badge-alert')) return;
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

    // ── Cleanup ─────────────────────────────────────────────────────────────
    /**
     * Release global listeners and observers.
     */
    function cleanup() {
        if (window.__cleanupUserMenu)   { window.__cleanupUserMenu();   delete window.__cleanupUserMenu; }
        if (window.__jerseyObserver)    { window.__jerseyObserver.disconnect(); delete window.__jerseyObserver; }
        if (window._appKbHandlers)      { window._appKbHandlers.forEach(([h]) => document.removeEventListener('keydown', h)); delete window._appKbHandlers; }
    }

    return {
        getAvatarGradientClass,
        initNotifications,
        initOledToggle,
        initKeyboardShortcuts,
        initJerseyBackdrop,
        initExpiringDocsAlert,
        cleanup
    };
})();
window.Enhancements = Enhancements;

// ── UX#4: Persist Active Filter State ───────────────────────────────────
/**
 * Shared API to save/restore filter state across navigations.
 * Used by individual modules to persist their active filters.
 */
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
