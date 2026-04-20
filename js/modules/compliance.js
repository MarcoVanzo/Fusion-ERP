/**
 * Compliance Module — Riforma dello Sport
 * Fusion ERP v1.0
 *
 * Features:
 * - Traffic-light dashboard (contracts, medical, federation)
 * - Contract management (list, create, status tracking)
 * - Medical certificates overview
 * - Federation / Tesseramenti tab
 * - Expiration calendar
 */

'use strict';

const Compliance = (() => {
    let _ac = new AbortController();
    let _dashData = null;
    let _contractTypes = {};
    let _currentTab = 'dashboard';

    // ─── INIT ──────────────────────────────────────────────────────────────────

    async function init(route) {
        _ac = new AbortController();

        // Determine tab from route
        if (route === 'compliance-contracts') _currentTab = 'contracts';
        else if (route === 'compliance-calendar') _currentTab = 'calendar';
        else if (route === 'compliance-medical') _currentTab = 'medical';
        else if (route === 'compliance-federation') _currentTab = 'federation';
        else _currentTab = 'dashboard';

        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = UI.skeletonPage();

        try {
            if (_currentTab === 'dashboard') {
                const data = await Store.get('dashboard', 'compliance');
                _dashData = data;
                _renderDashboard(app);
            } else if (_currentTab === 'contracts') {
                await _loadContracts(app);
            } else if (_currentTab === 'medical') {
                await _loadMedical(app);
            } else if (_currentTab === 'federation') {
                await _loadFederation(app);
            } else if (_currentTab === 'calendar') {
                await _loadCalendar(app);
            }
        } catch (_err) {
            console.error('[Compliance] Init error:', err);
            app.innerHTML = Utils.emptyState('Errore nel caricamento', err.message, 'Riprova', null, () => init(route));
        }
    }

    // ─── DASHBOARD ─────────────────────────────────────────────────────────────

    function _renderDashboard(app) {
        const d = _dashData || {};
        const contracts = d.contracts || {};
        const medical = d.medical || {};
        const federation = d.federation || {};

        app.innerHTML = `
        <div class="compliance-page">
            <div class="compliance-header">
                <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                    <i class="ph ph-shield-check" style="color:var(--color-primary);"></i>
                    Compliance — Riforma dello Sport
                </h1>
                <p style="color:var(--text-muted);font-size:13px;margin-top:4px;">
                    Stato complessivo: ${_lightIcon(d.overall_light)}
                </p>
            </div>

            <!-- Traffic Light Cards -->
            <div class="compliance-cards-grid">
                ${_trafficCard('Contratti', contracts, 'file-text', 'compliance-contracts', [
            { label: 'Attivi', value: contracts.active || 0 },
            { label: 'Bozze', value: contracts.draft || 0 },
            { label: 'Scaduti', value: contracts.expired || 0 },
            { label: 'In scadenza', value: contracts.expiring_soon || 0 },
        ])}
                ${_trafficCard('Certificati Medici', medical, 'heartbeat', 'compliance-medical', [
            { label: 'Validi', value: medical.valid || 0 },
            { label: 'Scaduti', value: medical.expired || 0 },
            { label: 'In scadenza', value: medical.expiring_soon || 0 },
        ])}
                ${_trafficCard('Tesseramenti', federation, 'identification-card', 'compliance-federation', [
            { label: 'Attivi', value: federation.active || 0 },
            { label: 'In attesa', value: federation.pending || 0 },
            { label: 'Scaduti', value: federation.expired || 0 },
        ])}
            </div>

            <!-- Upcoming Expirations -->
            <div class="compliance-section">
                <h3 style="display:flex;align-items:center;gap:8px;margin-bottom:var(--sp-2);">
                    <i class="ph ph-warning-circle" style="color:#f59e0b;"></i>
                    Scadenze imminenti (60 giorni)
                </h3>
                <div class="compliance-expirations">
                    ${(d.expirations || []).length === 0
                ? `<div class="compliance-empty">
                            <i class="ph ph-check-circle" style="font-size:32px;color:#10b981;"></i>
                            <p>Nessuna scadenza nelle prossime settimane!</p>
                           </div>`
                : (d.expirations || []).map(e => _expirationRow(e)).join('')}
                </div>
            </div>
        </div>`;

        _bindDashEvents(app);
    }

    function _trafficCard(title, data, icon, route, stats) {
        const light = data.light || 'green';
        const lightColors = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' };
        const lightLabels = { green: 'Conforme', yellow: 'Attenzione', red: 'Non conforme' };
        const total = data.total || 0;

        return `
        <div class="compliance-traffic-card" data-route="${route}" role="button" tabindex="0">
            <div class="compliance-card-header">
                <div class="compliance-card-icon"><i class="ph ph-${icon}"></i></div>
                <div class="compliance-traffic-light" style="background:${lightColors[light]};" title="${lightLabels[light]}"></div>
            </div>
            <h4 class="compliance-card-title">${title}</h4>
            <span class="compliance-card-total">${total} totali</span>
            <div class="compliance-card-stats">
                ${stats.map(s => `<div class="compliance-stat">
                    <span class="compliance-stat-value">${s.value}</span>
                    <span class="compliance-stat-label">${s.label}</span>
                </div>`).join('')}
            </div>
        </div>`;
    }

    function _lightIcon(light) {
        const map = {
            green: '<span style="color:#10b981;"><i class="ph-fill ph-circle"></i> Tutto in regola</span>',
            yellow: '<span style="color:#f59e0b;"><i class="ph-fill ph-circle"></i> Attenzione richiesta</span>',
            red: '<span style="color:#ef4444;"><i class="ph-fill ph-circle"></i> Azione necessaria</span>',
        };
        return map[light] || map.green;
    }

    function _expirationRow(e) {
        const daysLeft = Math.ceil((new Date(e.expiry_date) - new Date()) / 86400000);
        const typeIcons = { contract: 'file-text', medical: 'heartbeat', federation: 'identification-card' };
        const typeLabels = { contract: 'Contratto', medical: 'Certificato medico', federation: 'Tessera' };
        const urgencyClass = daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'warning' : '';

        return `
        <div class="compliance-expiration-row ${urgencyClass}">
            <div class="compliance-exp-icon"><i class="ph ph-${typeIcons[e.item_type] || 'file'}"></i></div>
            <div class="compliance-exp-info">
                <span class="compliance-exp-name">${Utils.escapeHtml(e.person_name || '—')}</span>
                <span class="compliance-exp-type">${typeLabels[e.item_type] || e.item_type} · ${Utils.escapeHtml(e.type || e.sub_type || '')}</span>
            </div>
            <div class="compliance-exp-right">
                <span class="compliance-exp-date">${new Date(e.expiry_date).toLocaleDateString('it-IT')}</span>
                <span class="compliance-exp-days">${daysLeft <= 0 ? 'SCADUTO' : daysLeft + 'gg'}</span>
            </div>
        </div>`;
    }

    function _bindDashEvents(app) {
        app.querySelectorAll('[data-route]').forEach(card => {
            card.addEventListener('click', () => {
                const route = card.dataset.route;
                if (window.Router && Router.navigate) Router.navigate(route);
                else init(route);
            }, { signal: _ac.signal });
        });
    }

    // ─── CONTRACTS TAB ─────────────────────────────────────────────────────────

    async function _loadContracts(app) {
        const data = await Store.get('listContracts', 'compliance');
        const contracts = data?.contracts || [];

        // Load types for modal
        if (Object.keys(_contractTypes).length === 0) {
            try {
                const ct = await Store.get('contractTypes', 'compliance');
                _contractTypes = ct?.types || {};
            } catch { _contractTypes = {}; }
        }

        app.innerHTML = `
        <div class="compliance-page">
            <div class="compliance-header">
                <div class="finance-title-row">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-file-text" style="color:var(--color-primary);"></i> Contratti
                    </h1>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost btn-sm" id="btn-back-dash">
                            <i class="ph ph-arrow-left"></i> Dashboard
                        </button>
                        <button class="btn btn-primary" id="btn-new-contract">
                            <i class="ph ph-plus"></i> Nuovo
                        </button>
                    </div>
                </div>
            </div>
            <div class="compliance-list">
                ${contracts.length === 0
                ? '<div class="compliance-empty"><p>Nessun contratto registrato</p></div>'
                : contracts.map(c => _contractRow(c)).join('')}
            </div>
            ${data.pages > 1 ? `<p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:12px;">
                Pagina ${data.page} di ${data.pages}</p>` : ''}
        </div>`;

        app.querySelector('#btn-back-dash')?.addEventListener('click', () => init('compliance'), { signal: _ac.signal });
        app.querySelector('#btn-new-contract')?.addEventListener('click', () => _openContractModal(), { signal: _ac.signal });
    }

    function _contractRow(c) {
        const statusColors = { draft: '#f59e0b', signed: '#10b981', expired: '#ef4444', cancelled: '#6b7280' };
        const statusLabels = { draft: 'Bozza', signed: 'Firmato', expired: 'Scaduto', cancelled: 'Annullato' };
        const color = statusColors[c.status] || '#6b7280';
        const isExpired = c.valid_to && new Date(c.valid_to) < new Date();

        return `
        <div class="compliance-row">
            <div class="compliance-row-icon" style="color:${color};"><i class="ph ph-file-text"></i></div>
            <div class="compliance-row-info">
                <span class="compliance-row-name">${Utils.escapeHtml(c.user_name || '—')}</span>
                <span class="compliance-row-sub">${Utils.escapeHtml(_contractTypes[c.type] || c.type)} · ${c.monthly_fee_eur ? '€ ' + parseFloat(c.monthly_fee_eur).toFixed(2) + '/mese' : '—'}</span>
            </div>
            <div class="compliance-row-right">
                <span class="compliance-status-badge" style="background:${color}20;color:${color};">${statusLabels[c.status] || c.status}${isExpired && c.status === 'signed' ? ' (scaduto)' : ''}</span>
                <span class="compliance-row-date">${c.valid_from} → ${c.valid_to}</span>
            </div>
        </div>`;
    }

    async function _openContractModal() {
        const body = document.createElement('div');
        const typeOptions = Object.entries(_contractTypes).map(([k, v]) =>
            `<option value="${k}">${Utils.escapeHtml(v)}</option>`
        ).join('');

        body.innerHTML = `
        <form id="contract-form" style="display:flex;flex-direction:column;gap:var(--sp-2);">
            <div class="form-group" style="margin:0;">
                <label class="form-label">Collaboratore (ID utente) *</label>
                <input type="text" id="ctr-user" class="form-input" required placeholder="USR_xxx">
            </div>
            <div class="form-group" style="margin:0;">
                <label class="form-label">Tipo contratto *</label>
                <select id="ctr-type" class="form-input" required>${typeOptions}</select>
            </div>
            <div class="form-group" style="margin:0;">
                <label class="form-label">Ruolo / Mansione</label>
                <input type="text" id="ctr-role" class="form-input" placeholder="Es. Allenatore settore giovanile">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Dal *</label>
                    <input type="date" id="ctr-from" class="form-input" required>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Al *</label>
                    <input type="date" id="ctr-to" class="form-input" required>
                </div>
            </div>
            <div class="form-group" style="margin:0;">
                <label class="form-label">Compenso mensile (€)</label>
                <input type="number" id="ctr-fee" class="form-input" step="0.01" min="0" placeholder="0.00">
            </div>
            <div id="ctr-error" class="form-error hidden"></div>
            <button type="submit" class="btn btn-primary"><i class="ph ph-plus"></i> Crea Contratto</button>
        </form>`;

        const modal = UI.modal({ title: 'Nuovo Contratto', body });

        body.querySelector('#contract-form').addEventListener('submit', async e => {
            e.preventDefault();
            const errEl = body.querySelector('#ctr-error');
            try {
                await Store.api('createContract', 'compliance', {
                    user_id: body.querySelector('#ctr-user').value.trim(),
                    type: body.querySelector('#ctr-type').value,
                    role_description: body.querySelector('#ctr-role').value.trim() || null,
                    valid_from: body.querySelector('#ctr-from').value,
                    valid_to: body.querySelector('#ctr-to').value,
                    monthly_fee_eur: parseFloat(body.querySelector('#ctr-fee').value) || null,
                });
                UI.toast('Contratto creato!', 'success');
                modal.close();
                init('compliance-contracts');
            } catch (_err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
            }
        });
    }

    // ─── MEDICAL TAB ───────────────────────────────────────────────────────────

    async function _loadMedical(app) {
        const certs = await Store.get('listMedicalCerts', 'compliance');
        const list = Array.isArray(certs) ? certs : [];

        app.innerHTML = `
        <div class="compliance-page">
            <div class="compliance-header">
                <div class="finance-title-row">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-heartbeat" style="color:var(--color-primary);"></i> Certificati Medici
                    </h1>
                    <button class="btn btn-ghost btn-sm" id="btn-back-dash">
                        <i class="ph ph-arrow-left"></i> Dashboard
                    </button>
                </div>
            </div>
            <div class="compliance-list">
                ${list.length === 0
                ? '<div class="compliance-empty"><p>Nessun certificato medico registrato</p></div>'
                : list.map(c => _medicalRow(c)).join('')}
            </div>
        </div>`;

        app.querySelector('#btn-back-dash')?.addEventListener('click', () => init('compliance'), { signal: _ac.signal });
    }

    function _medicalRow(c) {
        const isExpired = c.is_expired;
        const color = isExpired ? '#ef4444' : (c.days_left <= 30 ? '#f59e0b' : '#10b981');
        const statusLabel = isExpired ? 'Scaduto' : (c.days_left <= 30 ? `Scade tra ${c.days_left}gg` : 'Valido');

        return `
        <div class="compliance-row">
            <div class="compliance-row-icon" style="color:${color};"><i class="ph ph-heartbeat"></i></div>
            <div class="compliance-row-info">
                <span class="compliance-row-name">${Utils.escapeHtml(c.athlete_name || '—')}</span>
                <span class="compliance-row-sub">${Utils.escapeHtml(c.type || 'agonistico')}</span>
            </div>
            <div class="compliance-row-right">
                <span class="compliance-status-badge" style="background:${color}20;color:${color};">${statusLabel}</span>
                <span class="compliance-row-date">Scadenza: ${new Date(c.expiry_date).toLocaleDateString('it-IT')}</span>
            </div>
        </div>`;
    }

    // ─── FEDERATION TAB ────────────────────────────────────────────────────────

    async function _loadFederation(app) {
        const data = await Store.get('dashboard', 'federation');

        app.innerHTML = `
        <div class="compliance-page">
            <div class="compliance-header">
                <div class="finance-title-row">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-identification-card" style="color:var(--color-primary);"></i> Tesseramenti
                    </h1>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost btn-sm" id="btn-back-dash">
                            <i class="ph ph-arrow-left"></i> Dashboard
                        </button>
                        <button class="btn btn-ghost btn-sm" id="btn-list-cards">
                            <i class="ph ph-list"></i> Lista
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats cards -->
            <div class="compliance-cards-grid" style="margin-bottom:var(--sp-3);">
                <div class="compliance-stat-card">
                    <span class="compliance-big-num">${data.total_cards || 0}</span>
                    <span>Tessere totali</span>
                </div>
                <div class="compliance-stat-card">
                    <span class="compliance-big-num" style="color:#10b981;">${data.status_counts?.active || 0}</span>
                    <span>Attive</span>
                </div>
                <div class="compliance-stat-card">
                    <span class="compliance-big-num" style="color:#f59e0b;">${data.status_counts?.pending || 0}</span>
                    <span>In attesa</span>
                </div>
                <div class="compliance-stat-card">
                    <span class="compliance-big-num" style="color:#ef4444;">${data.status_counts?.expired || 0}</span>
                    <span>Scadute</span>
                </div>
            </div>

            <!-- By federation -->
            ${(data.by_federation || []).length > 0 ? `
            <div class="compliance-section">
                <h3 style="margin-bottom:var(--sp-1);">Per Federazione</h3>
                ${data.by_federation.map(f => `
                <div class="compliance-row" style="padding:10px 16px;">
                    <span style="font-weight:600;">${Utils.escapeHtml(f.federation)}</span>
                    <span class="compliance-stat-value">${f.cnt} tessere</span>
                </div>`).join('')}
            </div>` : ''}

            <!-- Expiring -->
            ${(data.expiring_soon || []).length > 0 ? `
            <div class="compliance-section">
                <h3 style="margin-bottom:var(--sp-1);color:#f59e0b;">
                    <i class="ph ph-warning"></i> In scadenza (30gg)
                </h3>
                ${data.expiring_soon.map(e => `
                <div class="compliance-row">
                    <div class="compliance-row-info">
                        <span class="compliance-row-name">${Utils.escapeHtml(e.athlete_name)}</span>
                        <span class="compliance-row-sub">${Utils.escapeHtml(e.federation)} · ${Utils.escapeHtml(e.card_number || 'N/D')}</span>
                    </div>
                    <span class="compliance-row-date">${new Date(e.expires_at).toLocaleDateString('it-IT')}</span>
                </div>`).join('')}
            </div>` : ''}

            <!-- RASD -->
            ${data.rasd ? `
            <div class="compliance-section" style="margin-top:var(--sp-3);">
                <h3 style="margin-bottom:var(--sp-1);"><i class="ph ph-buildings"></i> Registro RASD</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-1);font-size:13px;">
                    <div><strong>Codice:</strong> ${Utils.escapeHtml(data.rasd.rasd_code || 'N/D')}</div>
                    <div><strong>Stato:</strong> ${Utils.escapeHtml(data.rasd.status)}</div>
                    <div><strong>Sport:</strong> ${Utils.escapeHtml(data.rasd.sport_type)}</div>
                    <div><strong>Forma giuridica:</strong> ${Utils.escapeHtml(data.rasd.legal_form)}</div>
                    <div><strong>Federazione:</strong> ${Utils.escapeHtml(data.rasd.affiliated_federation || '—')}</div>
                    <div><strong>Prossimo rinnovo:</strong> ${data.rasd.next_renewal ? new Date(data.rasd.next_renewal).toLocaleDateString('it-IT') : '—'}</div>
                </div>
            </div>` : ''}
        </div>`;

        app.querySelector('#btn-back-dash')?.addEventListener('click', () => init('compliance'), { signal: _ac.signal });
        app.querySelector('#btn-list-cards')?.addEventListener('click', () => _loadCardsList(app), { signal: _ac.signal });
    }

    async function _loadCardsList(app) {
        try {
            const cards = await Store.get('listCards', 'federation');
            const list = Array.isArray(cards) ? cards : [];

            const html = list.length === 0
                ? '<div class="compliance-empty"><p>Nessuna tessera registrata</p></div>'
                : list.map(c => `
                <div class="compliance-row">
                    <div class="compliance-row-icon" style="color:${c.status === 'active' ? '#10b981' : '#f59e0b'};"><i class="ph ph-identification-card"></i></div>
                    <div class="compliance-row-info">
                        <span class="compliance-row-name">${Utils.escapeHtml(c.athlete_name)}</span>
                        <span class="compliance-row-sub">${Utils.escapeHtml(c.federation)} · ${Utils.escapeHtml(c.season)} · ${Utils.escapeHtml(c.card_number || 'N/D')}</span>
                    </div>
                    <div class="compliance-row-right">
                        <span class="compliance-status-badge">${Utils.escapeHtml(c.status)}</span>
                    </div>
                </div>`).join('');

            // Replace main content
            const listEl = app.querySelector('.compliance-cards-grid');
            if (listEl) {
                listEl.parentElement.innerHTML = `<div class="compliance-list">${html}</div>`;
            }
        } catch (_err) {
            UI.toast(err.message, 'error');
        }
    }

    // ─── CALENDAR TAB ──────────────────────────────────────────────────────────

    async function _loadCalendar(app) {
        const expirations = await Store.get('listExpirations', 'compliance', { days: 90 });
        const list = Array.isArray(expirations) ? expirations : [];

        app.innerHTML = `
        <div class="compliance-page">
            <div class="compliance-header">
                <div class="finance-title-row">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-calendar" style="color:var(--color-primary);"></i> Scadenzario
                    </h1>
                    <button class="btn btn-ghost btn-sm" id="btn-back-dash">
                        <i class="ph ph-arrow-left"></i> Dashboard
                    </button>
                </div>
            </div>
            <div class="compliance-list">
                ${list.length === 0
                ? `<div class="compliance-empty">
                        <i class="ph ph-check-circle" style="font-size:40px;color:#10b981;"></i>
                        <p>Nessuna scadenza nei prossimi 90 giorni!</p>
                       </div>`
                : list.map(e => _expirationRow(e)).join('')}
            </div>
        </div>`;

        app.querySelector('#btn-back-dash')?.addEventListener('click', () => init('compliance'), { signal: _ac.signal });
    }

    // ─── CLEANUP ───────────────────────────────────────────────────────────────

    function destroy() {
        _ac.abort();
        _dashData = null;
    }

    return { init, destroy };
})();

window.Compliance = Compliance;
