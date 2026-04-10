'use strict';

/**
 * Utils — Shared UI Helpers
 * Fusion ERP v1.0
 *
 * Provides:
 *  - escapeHtml(str)          — XSS-safe HTML escaping
 *  - formatCurrency(n, cur)   — Locale-aware currency formatting
 *  - formatDate(d, opts)      — Italian date formatting
 *  - formatDateTime(d)        — Date + time formatting
 *  - formatNum(n, decimals)   — Locale-aware number formatting
 *  - daysUntil(dateStr)       — Days between now and target date
 *  - qs(selector, root)       — querySelector shorthand
 *  - qsa(selector, root)      — querySelectorAll → Array
 *  - el(tag, attrs, children) — DOM element builder
 *  - emptyState(title, desc)  — Empty state placeholder HTML
 *  - badge(text, color)       — Badge HTML snippet
 *  - riskBadge(level)         — Risk-level badge
 *  - skeletonRows(rows, cols) — Table skeleton placeholder
 *  - isoDate(date)            — YYYY-MM-DD string
 *  - initials(name)           — Extract initials from a name
 *  - friendlyError(err)       — Extract user-friendly error message
 *
 * SOURCE FILE — the minified production version is js/core/utils.js
 */

const Utils = (() => {
    // ─── XSS Prevention ──────────────────────────────────────────────────────
    /** HTML entity map for escaping */
    const _entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    /**
     * Escape a string for safe insertion into HTML.
     * @param {string|null|undefined} str - Input string
     * @returns {string} Escaped string
     */
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"'/]/g, (c) => _entityMap[c]);
    }

    // ─── Date Formatting ─────────────────────────────────────────────────────
    /**
     * Format a date string to Italian locale.
     * @param {string|null} dateStr - ISO date string
     * @param {Intl.DateTimeFormatOptions} options - Format options override
     * @returns {string} Formatted date or '—'
     */
    function formatDate(dateStr, options = {}) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            const opts = { day: '2-digit', month: '2-digit', year: 'numeric', ...options };
            return d.toLocaleDateString('it-IT', opts);
        } catch {
            return dateStr;
        }
    }

    // ─── Public API ──────────────────────────────────────────────────────────
    return {
        escapeHtml,

        /**
         * Format a number as currency (EUR by default).
         * @param {number|string} value
         * @param {string} [currency='EUR']
         * @returns {string}
         */
        formatCurrency: function (value, currency = 'EUR') {
            const n = parseFloat(value) || 0;
            return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(n);
        },

        formatDate,

        /**
         * Format a date string with date and time.
         * @param {string|null} dateStr
         * @returns {string}
         */
        formatDateTime: function (dateStr) {
            return formatDate(dateStr, {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        },

        /**
         * Format a number with Italian locale.
         * @param {number} value
         * @param {number} [decimals=0]
         * @returns {string}
         */
        formatNum: function (value, decimals = 0) {
            return new Intl.NumberFormat('it-IT', { maximumFractionDigits: decimals }).format(value ?? 0);
        },

        /**
         * Calculate days from today to a target date.
         * @param {string|null} dateStr - Target ISO date
         * @returns {number|null} Days until target, or null if invalid
         */
        daysUntil: function (dateStr) {
            if (!dateStr) return null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(dateStr);
            return Math.ceil((target - today) / 86400000);
        },

        // ─── ACWR Risk Helpers ───────────────────────────────────────────────
        acwrRiskColor: function (level) {
            return {
                low: 'var(--color-text-muted)',
                moderate: '#00E676',
                high: '#FFD600',
                extreme: '#FF00FF'
            }[level] || 'var(--color-text-muted)';
        },

        acwrRiskLabel: function (level) {
            return { low: 'Basso', moderate: 'Ottimale', high: 'Attenzione', extreme: 'PERICOLO' }[level] || '—';
        },

        // ─── DOM Helpers ─────────────────────────────────────────────────────
        /**
         * querySelector shorthand.
         * @param {string} selector
         * @param {Element} [root=document]
         * @returns {Element|null}
         */
        qs: function (selector, root = document) {
            return root.querySelector(selector);
        },

        /**
         * querySelectorAll → real Array.
         * @param {string} selector
         * @param {Element} [root=document]
         * @returns {Element[]}
         */
        qsa: function (selector, root = document) {
            return [...root.querySelectorAll(selector)];
        },

        /**
         * Create a DOM element with attributes and children.
         * @param {string} tag - HTML tag name
         * @param {Object<string, string>} attrs - Attributes
         * @param {(string|Node)[]} children - Child nodes or text
         * @returns {HTMLElement}
         */
        el: function (tag, attrs = {}, children = []) {
            const elem = document.createElement(tag);
            for (const [key, val] of Object.entries(attrs)) {
                if (key === 'className') elem.className = val;
                else if (key === 'textContent') elem.textContent = val;
                else elem.setAttribute(key, val);
            }
            for (const child of children) {
                if (typeof child === 'string') {
                    elem.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    elem.appendChild(child);
                }
            }
            return elem;
        },

        /**
         * Render an empty-state placeholder with optional CTA button.
         * @param {string} [title='Nessun dato disponibile']
         * @param {string} [description='']
         * @param {string} [buttonText='']
         * @param {string} [buttonRoute='']
         * @returns {string} HTML
         */
        emptyState: function (title = 'Nessun dato disponibile', description = '', buttonText = '', buttonRoute = '') {
            const btn = buttonText
                ? `\n<button class="btn btn-ghost" style="margin-top:var(--sp-2);" onclick="Router.navigate('${buttonRoute || 'dashboard'}')">${escapeHtml(buttonText)}</button>`
                : '';

            return `
              <div class="empty-state" style="padding:0; margin:var(--sp-4) 0; overflow:hidden; border:1px solid var(--color-border); background:var(--color-black); position:relative;">
                <img src="assets/media/empty_state_bg.png" class="duotone-img" style="opacity:0.4; max-height:280px; object-position:center; width:100%; display:block;" alt="Empty State Background" />
                <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:var(--sp-4); text-align:center; background:linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                    <h3 style="font-family:var(--font-display); font-weight:700; font-size:24px; color:var(--color-white); letter-spacing:0.05em; margin-bottom:var(--sp-1); text-transform:uppercase;">${escapeHtml(title)}</h3>
                    ${description ? `<p style="font-family:var(--font-body); font-size:14px; color:var(--color-silver);">${escapeHtml(description)}</p>` : ''}
                    ${btn}
                </div>
              </div>`;
        },

        /**
         * Render a colored badge.
         * @param {string} text
         * @param {string} [color='white']
         * @returns {string} HTML
         */
        badge: function (text, color = 'white') {
            return `<span class="badge badge-${escapeHtml(color)}">${escapeHtml(text)}</span>`;
        },

        /**
         * Render a risk-level badge.
         * @param {string} level - 'low'|'moderate'|'high'|'extreme'
         * @returns {string} HTML
         */
        riskBadge: function (level) {
            const labels = { low: 'BASSO', moderate: 'OTTIMALE', high: 'ATTENZIONE', extreme: 'PERICOLO' };
            return `<span class="badge risk-${escapeHtml(level)}">${labels[level] || level}</span>`;
        },

        /**
         * Generate skeleton table rows for loading states.
         * @param {number} [rows=5]
         * @param {number} [cols=4]
         * @returns {string} HTML
         */
        skeletonRows: function (rows = 5, cols = 4) {
            return Array.from({ length: rows }, () =>
                `<tr>${Array.from({ length: cols }, () =>
                    `<td><div class="skeleton skeleton-text" style="width:${60 + 30 * Math.random() | 0}%;margin:0;"></div></td>`
                ).join('')}</tr>`
            ).join('');
        },

        /**
         * Format a Date to ISO date string (YYYY-MM-DD).
         * @param {Date} [date=new Date()]
         * @returns {string}
         */
        isoDate: function (date = new Date()) {
            return date.toISOString().slice(0, 10);
        },

        /**
         * Extract initials from a full name (max 2 chars).
         * @param {string} [name='']
         * @returns {string}
         */
        initials: function (name = '') {
            return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
        },

        /**
         * Extract a user-friendly error message from an Error or string.
         * @param {Error|string} err
         * @returns {string}
         */
        friendlyError: function (err) {
            return err?.message || String(err);
        }
    };
})();

window.Utils = Utils;
