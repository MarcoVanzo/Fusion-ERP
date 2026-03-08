/**
 * Onboarding — First-run spotlight tour + contextual help tooltips
 * Fusion ERP v1.0 — MT#3
 *
 * No external dependencies. Uses localStorage to skip on repeat visits.
 * Tour steps highlight specific DOM elements with a glassmorphism spotlight.
 */

'use strict';

const Onboarding = (() => {
    const STORAGE_KEY = 'fusion_tour_done';
    const TOOLTIP_ATTR = 'data-help-tooltip';

    // ─── TOUR STEPS ───────────────────────────────────────────────────────────
    const STEPS = [
        {
            selector: '#sidebar',
            title: 'Navigazione',
            body: 'Usa la barra laterale per spostarti tra le sezioni del sistema. Puoi collassarla con <kbd>Ctrl+B</kbd> per avere più spazio.',
            position: 'right',
        },
        {
            selector: '#nav-link-athletes, [data-route="athletes"], [data-route="athlete-profile"]',
            title: 'Gestione Atleti',
            body: 'Nella sezione <strong>Atleti</strong> trovi anagrafica completa, pagamenti, metriche di carico (ACWR) e documenti. Clicca direttamente su una card per aprire il profilo.',
            position: 'right',
        },
        {
            selector: '#global-search',
            title: 'Ricerca Rapida',
            body: 'Usa la barra di ricerca per trovare subito un\'atleta per nome, ruolo o squadra. Shortcut: <kbd>⌘K</kbd> o <kbd>Ctrl+K</kbd>.',
            position: 'bottom',
        },
        {
            selector: '.topbar-actions, #notifications-btn, .notification-btn',
            title: 'Notifiche e Scadenze',
            body: 'Le notifiche critiche (certificati in scadenza, pagamenti scaduti) appaiono qui. Controlla la dashboard quotidianamente per rimanere aggiornato.',
            position: 'bottom',
        },
        {
            selector: '#app',
            title: 'Pronto! 🎉',
            body: 'Il sistema è pronto all\'uso. In caso di dubbi, usa il pulsante <strong>?</strong> vicino alle sezioni per informazioni contestuali. Buon lavoro!',
            position: 'center',
        },
    ];

    let _currentStep = 0;
    let _overlay = null;

    // ─── INTERNAL HELPERS ─────────────────────────────────────────────────────

    function _el(tag, attrs = {}, html = '') {
        const e = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => {
            if (k === 'className') e.className = v;
            else e.setAttribute(k, v);
        });
        e.innerHTML = html;
        return e;
    }

    function _findTarget(selector) {
        if (!selector) return null;
        // Try each comma-separated selector
        for (const sel of selector.split(',')) {
            const el = document.querySelector(sel.trim());
            if (el) return el;
        }
        return null;
    }

    function _getSpotlightRect(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const PAD = 8;
        return {
            top: r.top - PAD,
            left: r.left - PAD,
            width: r.width + PAD * 2,
            height: r.height + PAD * 2,
            bottom: r.bottom + PAD,
            right: r.right + PAD,
        };
    }

    function _buildCard(step, stepIdx, total) {
        const card = _el('div', { className: 'tour-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': step.title });
        card.innerHTML = `
            <div class="tour-card-header">
                <div class="tour-step-badge">${stepIdx + 1} / ${total}</div>
                <button class="tour-skip" id="tour-skip" type="button" aria-label="Salta tour">Salta</button>
            </div>
            <h3 class="tour-card-title">${step.title}</h3>
            <p class="tour-card-body">${step.body}</p>
            <div class="tour-dots">
                ${Array.from({ length: total }, (_, i) =>
            `<span class="tour-dot${i === stepIdx ? ' active' : ''}"></span>`
        ).join('')}
            </div>
            <div class="tour-card-footer">
                ${stepIdx > 0 ? `<button class="btn btn-ghost btn-sm" id="tour-prev" type="button"><i class="ph ph-arrow-left"></i> Indietro</button>` : '<span></span>'}
                ${stepIdx < total - 1
                ? `<button class="btn btn-primary btn-sm" id="tour-next" type="button" style="color:#000;">Avanti <i class="ph ph-arrow-right"></i></button>`
                : `<button class="btn btn-primary btn-sm" id="tour-finish" type="button" style="color:#000;"><i class="ph ph-check"></i> Inizia</button>`}
            </div>
        `;
        return card;
    }

    function _positionCard(card, step, targetEl) {
        const pos = step.position || 'bottom';
        card.style.position = 'fixed';
        card.style.zIndex = '10002';

        if (pos === 'center' || !targetEl) {
            card.style.top = '50%';
            card.style.left = '50%';
            card.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const r = targetEl.getBoundingClientRect();
        card.style.transform = '';

        if (pos === 'right') {
            card.style.top = Math.max(16, r.top) + 'px';
            card.style.left = (r.right + 24) + 'px';
        } else if (pos === 'bottom') {
            card.style.top = (r.bottom + 16) + 'px';
            card.style.left = Math.max(16, r.left) + 'px';
        } else if (pos === 'left') {
            card.style.top = Math.max(16, r.top) + 'px';
            card.style.right = (window.innerWidth - r.left + 16) + 'px';
        }

        // Clamp within viewport
        requestAnimationFrame(() => {
            const cr = card.getBoundingClientRect();
            if (cr.right > window.innerWidth - 16) card.style.left = (window.innerWidth - cr.width - 16) + 'px';
            if (cr.bottom > window.innerHeight - 16) card.style.top = (window.innerHeight - cr.height - 16) + 'px';
            if (cr.left < 16) card.style.left = '16px';
            if (cr.top < 16) card.style.top = '16px';
        });
    }

    function _updateSpotlight(targetEl) {
        const hole = document.getElementById('tour-spotlight-hole');
        if (!hole) return;
        if (!targetEl) {
            // Full overlay — center step
            hole.style.cssText = 'top:0;left:0;width:0;height:0;border-radius:0;box-shadow:0 0 0 9999px rgba(0,0,0,0.78);';
            return;
        }
        const r = _getSpotlightRect(targetEl);
        hole.style.cssText = `
            top:${r.top}px;left:${r.left}px;
            width:${r.width}px;height:${r.height}px;
            border-radius:12px;
            box-shadow:0 0 0 9999px rgba(0,0,0,0.72);
        `;
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function _renderStep(idx) {
        // Remove old card
        document.querySelectorAll('.tour-card').forEach(c => c.remove());

        const step = STEPS[idx];
        const targetEl = _findTarget(step.selector);
        _updateSpotlight(targetEl);

        const card = _buildCard(step, idx, STEPS.length);
        document.body.appendChild(card);
        _positionCard(card, step, targetEl);

        // Bind buttons
        document.getElementById('tour-skip')?.addEventListener('click', finish);
        document.getElementById('tour-prev')?.addEventListener('click', () => _renderStep(idx - 1));
        document.getElementById('tour-next')?.addEventListener('click', () => _renderStep(idx + 1));
        document.getElementById('tour-finish')?.addEventListener('click', finish);
    }

    // ─── PUBLIC API ───────────────────────────────────────────────────────────

    function start() {
        if (_overlay) return; // already running

        // Build overlay (the dim layer)
        _overlay = _el('div', { id: 'tour-overlay', role: 'presentation' });
        _overlay.innerHTML = `<div id="tour-spotlight-hole"></div>`;
        document.body.appendChild(_overlay);

        // Keyboard nav
        const _keyHandler = (e) => {
            if (e.key === 'Escape') { finish(); return; }
            if (e.key === 'ArrowRight') { if (_currentStep < STEPS.length - 1) _renderStep(++_currentStep); }
            if (e.key === 'ArrowLeft') { if (_currentStep > 0) _renderStep(--_currentStep); }
        };
        document.addEventListener('keydown', _keyHandler);
        _overlay._keyHandler = _keyHandler;

        _currentStep = 0;
        _renderStep(0);
    }

    function finish() {
        document.querySelectorAll('.tour-card').forEach(c => c.remove());
        if (_overlay) {
            if (_overlay._keyHandler) document.removeEventListener('keydown', _overlay._keyHandler);
            _overlay.remove();
            _overlay = null;
        }
        localStorage.setItem(STORAGE_KEY, '1');
    }

    /**
     * Start the tour only if the user hasn't seen it before.
     * Waits for the app shell to be rendered.
     */
    function startIfNew() {
        if (localStorage.getItem(STORAGE_KEY)) return;
        // Slight delay to let the app shell fully render
        setTimeout(start, 1200);
    }

    /**
     * Render a contextual help tooltip button inline.
     * Returns HTML string: <button class="help-tooltip-btn" data-help-tooltip="text">?</button>
     */
    function tooltipBtn(text) {
        const escaped = (text || '').replace(/"/g, '&quot;');
        return `<button class="help-tooltip-btn" type="button" aria-label="Informazioni" ${TOOLTIP_ATTR}="${escaped}">?</button>`;
    }

    /**
     * Initialize inline help tooltip popovers (call once after DOM is ready).
     * Delegates on document so it works with dynamic content.
     */
    function initTooltips() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest(`[${TOOLTIP_ATTR}]`);

            // Close any open tooltip first
            document.querySelectorAll('.help-tooltip-popup').forEach(p => p.remove());

            if (!btn) return;
            const text = btn.getAttribute(TOOLTIP_ATTR);
            if (!text) return;

            const popup = document.createElement('div');
            popup.className = 'help-tooltip-popup';
            popup.setAttribute('role', 'tooltip');
            popup.innerHTML = `<p>${text}</p>`;
            document.body.appendChild(popup);

            // Position below the button
            const r = btn.getBoundingClientRect();
            popup.style.top = (r.bottom + 8 + window.scrollY) + 'px';
            popup.style.left = Math.max(8, r.left + window.scrollX - 8) + 'px';

            // Close on outside click
            const close = (ev) => {
                if (!popup.contains(ev.target) && ev.target !== btn) {
                    popup.remove();
                    document.removeEventListener('click', close, true);
                }
            };
            setTimeout(() => document.addEventListener('click', close, true), 0);
            e.stopPropagation();
        });
    }

    return { start, finish, startIfNew, tooltipBtn, initTooltips };
})();

window.Onboarding = Onboarding;
