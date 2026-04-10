'use strict';

/**
 * GlobalSearch — Athlete & Staff Search with Keyboard Navigation
 * Fusion ERP v1.0
 *
 * Extracted from app.js for better separation of concerns.
 * Exposes: GlobalSearch (global)
 *
 * Dependencies: Store, UI, Utils, Router
 */

const GlobalSearch = (() => {
    const AVATAR_COLORS = ['#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

    /**
     * Generate a consistent avatar background color from a name.
     * @param {string} name
     * @returns {string} CSS color
     */
    function _avatarColor(name) {
        if (!name) return AVATAR_COLORS[0];
        let h = 0;
        for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
        return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
    }

    /**
     * Highlight a search term within text.
     * @param {string} text - Original text
     * @param {string} q - Search query
     * @returns {string} HTML with <mark> highlight
     */
    function _highlight(text, q) {
        if (!q) return Utils.escapeHtml(text);
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return Utils.escapeHtml(text);
        return Utils.escapeHtml(text.slice(0, idx)) +
            `<mark class="search-result-mark">${Utils.escapeHtml(text.slice(idx, idx + q.length))}</mark>` +
            Utils.escapeHtml(text.slice(idx + q.length));
    }

    /**
     * Initialize the global search bar and result dropdown.
     */
    function init() {
        const input = document.getElementById('global-search');
        const results = document.getElementById('global-search-results');
        if (!input || !results) return;

        let _athleteIndex = null;
        let _selectedIdx = -1;

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
        const _kbSearch = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                input.focus();
                input.select();
            }
        };
        document.addEventListener('keydown', _kbSearch);
        (window._appKbHandlers ??= []).push([_kbSearch]);

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                _closeResults();
            }
        });
    }

    /**
     * Extend the global search to also include staff members.
     * Lazy-loads staff index on first focus.
     */
    function extendWithStaff() {
        const input = document.getElementById('global-search');
        if (!input) return;

        let _staffIndex = null;

        input.addEventListener('focus', async () => {
            if (_staffIndex) return;
            try {
                _staffIndex = await Store.get('list', 'staff');
            } catch {
                _staffIndex = [];
            }
        });

        // Expose staff index for the search function to pick up
        window._fusionStaffSearchIndex = () => _staffIndex;
    }

    return { init, extendWithStaff };
})();
window.GlobalSearch = GlobalSearch;
