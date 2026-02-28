/**
 * Utils — Shared Utility Functions
 * Fusion ERP v1.0
 */

'use strict';

const Utils = (() => {
    // ─── XSS Prevention ─────────────────────────────────────────────────────
    const _escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"'/]/g, ch => _escapeMap[ch]);
    }

    // ─── Formatting ──────────────────────────────────────────────────────────
    function formatCurrency(value, currency = 'EUR') {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(num);
    }

    function formatDate(dateStr, opts = {}) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            const defaultOpts = { day: '2-digit', month: '2-digit', year: 'numeric', ...opts };
            return d.toLocaleDateString('it-IT', defaultOpts);
        } catch { return dateStr; }
    }

    function formatDateTime(dateStr) {
        return formatDate(dateStr, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function formatNum(num, decimals = 0) {
        return new Intl.NumberFormat('it-IT', { maximumFractionDigits: decimals }).format(num ?? 0);
    }

    function daysUntil(dateStr) {
        if (!dateStr) return null;
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const d = new Date(dateStr);
        return Math.ceil((d - now) / 86400000);
    }

    // ─── ACWR Helpers ────────────────────────────────────────────────────────
    function acwrRiskColor(risk) {
        const map = { low: 'var(--color-text-muted)', moderate: '#00E676', high: '#FFD600', extreme: '#E6007E' };
        return map[risk] || 'var(--color-text-muted)';
    }

    function acwrRiskLabel(risk) {
        const map = { low: 'Basso', moderate: 'Ottimale', high: 'Attenzione', extreme: 'PERICOLO' };
        return map[risk] || '—';
    }

    // ─── DOM Helpers ─────────────────────────────────────────────────────────
    function qs(sel, ctx = document) { return ctx.querySelector(sel); }
    function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

    function el(tag, attrs = {}, children = []) {
        const elem = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (k === 'className') elem.className = v;
            else if (k === 'textContent') elem.textContent = v;
            else elem.setAttribute(k, v);
        }
        for (const child of children) {
            if (typeof child === 'string') elem.appendChild(document.createTextNode(child));
            else if (child instanceof Node) elem.appendChild(child);
        }
        return elem;
    }

    function emptyState(message = 'Nessun dato disponibile', detail = '') {
        return `
      <div class="empty-state" style="padding:0; margin:var(--sp-4) 0; overflow:hidden; border:1px solid var(--color-border); background:var(--color-black); position:relative;">
        <img src="assets/media/empty_state_bg.png" class="duotone-img" style="opacity:0.4; max-height:280px; object-position:center; width:100%; display:block;" alt="Empty State Background" />
        <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:var(--sp-4); text-align:center; background:linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
            <h3 style="font-family:var(--font-display); font-weight:700; font-size:24px; color:var(--color-white); letter-spacing:0.05em; margin-bottom:var(--sp-1); text-transform:uppercase;">${escapeHtml(message)}</h3>
            ${detail ? `<p style="font-family:var(--font-body); font-size:14px; color:var(--color-silver);">${escapeHtml(detail)}</p>` : ''}
        </div>
      </div>`;
    }

    function badge(text, variant = 'white') {
        return `<span class="badge badge-${escapeHtml(variant)}">${escapeHtml(text)}</span>`;
    }

    function riskBadge(risk) {
        const labels = { low: 'BASSO', moderate: 'OTTIMALE', high: 'ATTENZIONE', extreme: 'PERICOLO' };
        return `<span class="badge risk-${escapeHtml(risk)}">${labels[risk] || risk}</span>`;
    }

    function skeletonRows(n = 5, cols = 4) {
        return Array.from({ length: n }, () =>
            `<tr>${Array.from({ length: cols }, () =>
                `<td><div class="skeleton skeleton-text" style="width:${60 + Math.random() * 30 | 0}%;margin:0;"></div></td>`
            ).join('')}</tr>`
        ).join('');
    }

    // ─── Date Helpers ────────────────────────────────────────────────────────
    function isoDate(d = new Date()) {
        return d.toISOString().slice(0, 10);
    }

    // ─── String Helpers ──────────────────────────────────────────────────────
    function initials(name = '') {
        return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
    }

    return {
        escapeHtml, formatCurrency, formatDate, formatDateTime, formatNum,
        daysUntil, acwrRiskColor, acwrRiskLabel,
        qs, qsa, el, emptyState, badge, riskBadge, skeletonRows,
        isoDate, initials,
    };
})();
