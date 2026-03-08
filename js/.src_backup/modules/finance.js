/**
 * Finance Module — ASD Accounting Dashboard
 * Fusion ERP v1.0
 *
 * Features:
 * - KPI cards (income, expenses, balance)
 * - Monthly trend chart
 * - Journal entry list with filters
 * - New entry wizard (simplified double-entry)
 * - Chart of accounts management
 * - Rendiconto ETS export
 */

'use strict';

const Finance = (() => {
    let _ac = new AbortController();
    let _data = null;
    let _entries = [];
    let _accounts = [];
    let _invoices = [];
    let _categories = {};
    let _view = 'dashboard'; // dashboard, entries, accounts, rendiconto, 74ter

    const PAYMENT_METHODS = ['Bonifico', 'Contanti', 'Carta', 'Assegno', 'PayPal', 'Altro'];

    // ─── INIT ──────────────────────────────────────────────────────────────────

    async function init() {
        _ac = new AbortController();
        _view = 'dashboard';

        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = UI.skeletonPage();

        try {
            const hash = window.location.hash;

            // Sub-routing logic based on hash
            if (hash === '#finance-invoices') {
                return _loadInvoices(app);
            } else if (hash === '#finance-74ter') {
                return _load74ter(app);
            }

            const [dashData, catData] = await Promise.all([
                Store.get('dashboard', 'finance'),
                Store.get('categories', 'finance').catch(() => ({ categories: {} }))
            ]);
            _data = dashData;
            _categories = catData?.categories || {};
            _renderDashboard(app);
        } catch (err) {
            console.error('[Finance] Init error:', err);
            app.innerHTML = Utils.emptyState('Errore nel caricamento', err.message, 'Riprova', null, () => init());
        }
    }

    // ─── DASHBOARD ─────────────────────────────────────────────────────────────

    function _renderDashboard(app) {
        const d = _data || {};
        const income = d.total_income || 0;
        const expenses = d.total_expenses || 0;
        const balance = d.balance || 0;
        const fy = d.fiscal_year || {};

        app.innerHTML = `
        <div class="finance-page">
            <div class="finance-header">
                <div class="finance-title-row">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-calculator" style="color:var(--color-primary);"></i>
                        Contabilità
                    </h1>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost btn-sm" id="btn-view-entries" type="button">
                            <i class="ph ph-list"></i> Prima Nota
                        </button>
                        <button class="btn btn-ghost btn-sm" id="btn-view-invoices" type="button">
                            <i class="ph ph-file-invoice"></i> Fatture Elettroniche
                        </button>
                        <button class="btn btn-ghost btn-sm" id="btn-view-accounts" type="button">
                            <i class="ph ph-tree-structure"></i> Piano dei Conti
                        </button>
                        <button class="btn btn-ghost btn-sm" id="btn-rendiconto" type="button">
                            <i class="ph ph-file-text"></i> Rendiconto
                        </button>
                        <button class="btn btn-ghost btn-sm" id="btn-74ter" type="button">
                            <i class="ph ph-intersect"></i> 74-ter
                        </button>
                        <button class="btn btn-primary" id="btn-new-entry" type="button">
                            <i class="ph ph-plus"></i> Nuova Registrazione
                        </button>
                    </div>
                </div>
                ${fy.label ? `<p style="color:var(--text-muted);font-size:13px;margin-top:4px;">
                    <i class="ph ph-calendar"></i> Anno fiscale: <strong>${Utils.escapeHtml(fy.label)}</strong>
                    (${fy.start_date} — ${fy.end_date})
                </p>` : ''}
            </div>

            <!-- KPI Cards -->
            <div class="finance-kpi-grid">
                <div class="finance-kpi-card kpi-income">
                    <div class="finance-kpi-icon"><i class="ph ph-arrow-circle-down"></i></div>
                    <div class="finance-kpi-content">
                        <span class="finance-kpi-value">€ ${_fmt(income)}</span>
                        <span class="finance-kpi-label">Entrate</span>
                    </div>
                </div>
                <div class="finance-kpi-card kpi-expenses">
                    <div class="finance-kpi-icon"><i class="ph ph-arrow-circle-up"></i></div>
                    <div class="finance-kpi-content">
                        <span class="finance-kpi-value">€ ${_fmt(expenses)}</span>
                        <span class="finance-kpi-label">Uscite</span>
                    </div>
                </div>
                <div class="finance-kpi-card kpi-balance">
                    <div class="finance-kpi-icon"><i class="ph ph-scales"></i></div>
                    <div class="finance-kpi-content">
                        <span class="finance-kpi-value ${balance >= 0 ? 'positive' : 'negative'}">€ ${_fmt(balance)}</span>
                        <span class="finance-kpi-label">${balance >= 0 ? 'Avanzo' : 'Disavanzo'}</span>
                    </div>
                </div>
                <div class="finance-kpi-card kpi-count">
                    <div class="finance-kpi-icon"><i class="ph ph-note-pencil"></i></div>
                    <div class="finance-kpi-content">
                        <span class="finance-kpi-value">${d.entry_count || 0}</span>
                        <span class="finance-kpi-label">Registrazioni</span>
                    </div>
                </div>
            </div>

            <!-- Monthly Trend -->
            ${_renderTrend(d.monthly_trend || [])}

            <!-- Recent Entries -->
            <div class="finance-section">
                <h3 style="margin-bottom:var(--sp-2);display:flex;align-items:center;gap:8px;">
                    <i class="ph ph-clock-clockwise" style="color:var(--color-primary);"></i>
                    Ultime registrazioni
                </h3>
                <div class="finance-entries-list">
                    ${(d.recent_entries || []).length === 0
                ? `<div class="finance-empty"><i class="ph ph-note-pencil" style="font-size:40px;opacity:0.2;"></i>
                           <p>Nessuna registrazione. Inizia inserendo la prima nota.</p></div>`
                : (d.recent_entries || []).map(e => _renderEntryRow(e)).join('')}
                </div>
            </div>
        </div>`;

        _bindDashboardEvents(app);
    }

    function _renderTrend(trend) {
        if (!trend || trend.length === 0) return '';

        const maxVal = Math.max(...trend.map(t => Math.max(parseFloat(t.income) || 0, parseFloat(t.expenses) || 0)), 1);

        return `
        <div class="finance-section finance-trend">
            <h3 style="margin-bottom:var(--sp-2);display:flex;align-items:center;gap:8px;">
                <i class="ph ph-chart-bar" style="color:var(--color-primary);"></i>
                Andamento Mensile
            </h3>
            <div class="finance-chart">
                ${trend.map(t => {
            const inc = parseFloat(t.income) || 0;
            const exp = parseFloat(t.expenses) || 0;
            const incH = Math.max(2, (inc / maxVal) * 100);
            const expH = Math.max(2, (exp / maxVal) * 100);
            const month = t.month ? t.month.split('-')[1] : '';
            const monthNames = ['', 'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
            const label = monthNames[parseInt(month)] || month;
            return `
                    <div class="finance-chart-col">
                        <div class="finance-chart-bars">
                            <div class="finance-bar bar-income" style="height:${incH}%;" title="Entrate: € ${_fmt(inc)}"></div>
                            <div class="finance-bar bar-expense" style="height:${expH}%;" title="Uscite: € ${_fmt(exp)}"></div>
                        </div>
                        <span class="finance-chart-label">${label}</span>
                    </div>`;
        }).join('')}
            </div>
            <div class="finance-chart-legend">
                <span><span class="legend-dot" style="background:#10b981;"></span> Entrate</span>
                <span><span class="legend-dot" style="background:#ef4444;"></span> Uscite</span>
            </div>
        </div>`;
    }

    function _renderEntryRow(e) {
        const isIncome = (e.category || '').match(/quote|iscrizi|sponsor|contribut|donaz|event|5.*mille/i);
        const icon = isIncome ? 'arrow-circle-down' : 'arrow-circle-up';
        const color = isIncome ? '#10b981' : '#ef4444';
        const catLabel = _categories[e.category] || e.category || '—';
        const date = e.entry_date ? new Date(e.entry_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '';

        return `
        <div class="finance-entry-row" data-id="${Utils.escapeHtml(e.id)}" role="button" tabindex="0">
            <div class="finance-entry-icon" style="color:${color};"><i class="ph ph-${icon}"></i></div>
            <div class="finance-entry-info">
                <span class="finance-entry-desc">${Utils.escapeHtml(e.description)}</span>
                <span class="finance-entry-meta">${Utils.escapeHtml(catLabel)} · ${e.payment_method || ''}</span>
            </div>
            <div class="finance-entry-right">
                <span class="finance-entry-amount" style="color:${color};">€ ${_fmt(parseFloat(e.total_amount) || 0)}</span>
                <span class="finance-entry-date">${date}</span>
            </div>
        </div>`;
    }

    // ─── EVENTS ────────────────────────────────────────────────────────────────

    function _bindDashboardEvents(app) {
        app.querySelector('#btn-new-entry')?.addEventListener('click', () => _openEntryModal(), { signal: _ac.signal });
        app.querySelector('#btn-view-entries')?.addEventListener('click', () => _loadEntries(app), { signal: _ac.signal });
        app.querySelector('#btn-view-invoices')?.addEventListener('click', () => _loadInvoices(app), { signal: _ac.signal });
        app.querySelector('#btn-view-accounts')?.addEventListener('click', () => _loadAccounts(app), { signal: _ac.signal });
        app.querySelector('#btn-rendiconto')?.addEventListener('click', () => _loadRendiconto(app), { signal: _ac.signal });
        app.querySelector('#btn-74ter')?.addEventListener('click', () => _load74ter(app), { signal: _ac.signal });

        app.querySelector('.finance-entries-list')?.addEventListener('click', e => {
            const row = e.target.closest('[data-id]');
            if (row) _openEntryDetail(row.dataset.id);
        }, { signal: _ac.signal });
    }

    // ─── NEW ENTRY MODAL ───────────────────────────────────────────────────────

    async function _openEntryModal() {
        // Load accounts for dropdown
        if (_accounts.length === 0) {
            try {
                const res = await Store.get('chartOfAccounts', 'finance');
                _accounts = res || [];
            } catch { _accounts = []; }
        }

        const body = document.createElement('div');
        body.style.cssText = 'display:flex;flex-direction:column;gap:var(--sp-2);';

        const catOptions = Object.entries(_categories).map(([k, v]) =>
            `<option value="${k}">${Utils.escapeHtml(v)}</option>`
        ).join('');

        const accountOptions = _accounts.map(a =>
            `<option value="${Utils.escapeHtml(a.id)}">[${Utils.escapeHtml(a.code)}] ${Utils.escapeHtml(a.name)} (${a.type})</option>`
        ).join('');

        body.innerHTML = `
        <form id="entry-form">
            <div class="form-group" style="margin:0 0 var(--sp-2) 0;">
                <label class="form-label">Descrizione *</label>
                <input type="text" id="entry-desc" class="form-input" required placeholder="Es. Quota socio Rossi Mario">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Data *</label>
                    <input type="date" id="entry-date" class="form-input" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Categoria</label>
                    <select id="entry-cat" class="form-input"><option value="">— Seleziona —</option>${catOptions}</select>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Importo (€) *</label>
                    <input type="number" id="entry-amount" class="form-input" step="0.01" min="0" required placeholder="0.00">
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Metodo pagamento</label>
                    <select id="entry-payment" class="form-input">
                        <option value="">—</option>
                        ${PAYMENT_METHODS.map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Conto DARE</label>
                    <select id="entry-debit-account" class="form-input">${accountOptions}</select>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Conto AVERE</label>
                    <select id="entry-credit-account" class="form-input">${accountOptions}</select>
                </div>
            </div>
            <div class="form-group" style="margin:0;">
                <label class="form-label">Riferimento / N° documento</label>
                <input type="text" id="entry-ref" class="form-input" placeholder="Es. Ric. 001/2026">
            </div>
            <div id="entry-error" class="form-error hidden"></div>
            <button type="submit" class="btn btn-primary" id="entry-save-btn">
                <i class="ph ph-plus"></i> Registra
            </button>
        </form>`;

        const modal = UI.modal({ title: 'Nuova Registrazione', body, size: 'lg' });

        body.querySelector('#entry-form').addEventListener('submit', async e => {
            e.preventDefault();
            const btn = body.querySelector('#entry-save-btn');
            const errEl = body.querySelector('#entry-error');
            const desc = body.querySelector('#entry-desc').value.trim();
            const amount = parseFloat(body.querySelector('#entry-amount').value) || 0;

            if (!desc || amount <= 0) {
                errEl.textContent = 'Descrizione e importo sono obbligatori';
                errEl.classList.remove('hidden');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Salvataggio...';
            errEl.classList.add('hidden');

            try {
                await Store.api('createEntry', 'finance', {
                    description: desc,
                    entry_date: body.querySelector('#entry-date').value,
                    category: body.querySelector('#entry-cat').value || null,
                    payment_method: body.querySelector('#entry-payment').value || null,
                    reference: body.querySelector('#entry-ref').value.trim() || null,
                    lines: [
                        { account_id: body.querySelector('#entry-debit-account').value, debit: amount, credit: 0 },
                        { account_id: body.querySelector('#entry-credit-account').value, debit: 0, credit: amount },
                    ]
                });

                UI.toast('Registrazione creata!', 'success');
                modal.close();
                init(); // Reload dashboard
            } catch (err) {
                errEl.textContent = err.message || 'Errore';
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = '<i class="ph ph-plus"></i> Registra';
            }
        });
    }

    // ─── ENTRIES LIST VIEW ─────────────────────────────────────────────────────

    async function _loadEntries(app) {
        app.innerHTML = UI.skeletonPage();
        try {
            const data = await Store.get('listEntries', 'finance');
            _entries = data?.entries || [];
            _renderEntriesList(app, data);
        } catch (err) {
            app.innerHTML = Utils.emptyState('Errore', err.message, 'Riprova', null, () => _loadEntries(app));
        }
    }

    function _renderEntriesList(app, data) {
        app.innerHTML = `
        <div class="finance-page">
            <div class="finance-header">
                <div class="finance-title-row">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-list" style="color:var(--color-primary);"></i> Prima Nota
                    </h1>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost btn-sm" id="btn-back-dash">
                            <i class="ph ph-arrow-left"></i> Dashboard
                        </button>
                        <button class="btn btn-primary" id="btn-new-entry">
                            <i class="ph ph-plus"></i> Nuova
                        </button>
                    </div>
                </div>
            </div>
            <div class="finance-entries-list">
                ${_entries.length === 0
                ? '<div class="finance-empty"><p>Nessuna registrazione trovata</p></div>'
                : _entries.map(e => _renderEntryRow(e)).join('')}
            </div>
            ${data.pages > 1 ? `<p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:12px;">
                Pagina ${data.page} di ${data.pages} (${data.total} totali)</p>` : ''}
        </div>`;

        app.querySelector('#btn-back-dash')?.addEventListener('click', () => init(), { signal: _ac.signal });
        app.querySelector('#btn-new-entry')?.addEventListener('click', () => _openEntryModal(), { signal: _ac.signal });
    }

    // ─── ENTRY DETAIL ──────────────────────────────────────────────────────────

    async function _openEntryDetail(id) {
        try {
            const entry = await Store.get('getEntry', 'finance', { id });
            const body = document.createElement('div');
            body.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:var(--sp-2);">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
                    <div><strong>N°</strong>: ${entry.entry_number}</div>
                    <div><strong>Data</strong>: ${new Date(entry.entry_date).toLocaleDateString('it-IT')}</div>
                    <div><strong>Categoria</strong>: ${Utils.escapeHtml(_categories[entry.category] || entry.category || '—')}</div>
                    <div><strong>Metodo</strong>: ${Utils.escapeHtml(entry.payment_method || '—')}</div>
                    <div><strong>Importo</strong>: <strong>€ ${_fmt(parseFloat(entry.total_amount))}</strong></div>
                    <div><strong>Rif.</strong>: ${Utils.escapeHtml(entry.reference || '—')}</div>
                </div>
                ${(entry.lines || []).length > 0 ? `
                <h4 style="margin:var(--sp-2) 0 0;">Righe contabili</h4>
                <table style="width:100%;font-size:13px;border-collapse:collapse;">
                    <thead><tr style="border-bottom:1px solid var(--color-border);">
                        <th style="text-align:left;padding:6px;">Conto</th>
                        <th style="text-align:right;padding:6px;">Dare</th>
                        <th style="text-align:right;padding:6px;">Avere</th>
                    </tr></thead>
                    <tbody>${(entry.lines || []).map(l => `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                            <td style="padding:6px;">[${Utils.escapeHtml(l.account_code)}] ${Utils.escapeHtml(l.account_name)}</td>
                            <td style="text-align:right;padding:6px;color:#ef4444;">${parseFloat(l.debit) > 0 ? '€ ' + _fmt(parseFloat(l.debit)) : ''}</td>
                            <td style="text-align:right;padding:6px;color:#10b981;">${parseFloat(l.credit) > 0 ? '€ ' + _fmt(parseFloat(l.credit)) : ''}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>` : ''}
                <p style="font-size:11px;color:var(--text-muted);margin-top:var(--sp-1);">
                    Creato da ${Utils.escapeHtml(entry.created_by_name || '—')} il ${new Date(entry.created_at).toLocaleString('it-IT')}
                </p>
            </div>`;
            UI.modal({ title: `Registrazione #${entry.entry_number}`, body });
        } catch (err) {
            UI.toast(err.message || 'Errore', 'error');
        }
    }

    // ─── INVOICES LIST VIEW ────────────────────────────────────────────────────

    async function _loadInvoices(app) {
        app.innerHTML = UI.skeletonPage();
        try {
            const data = await Store.get('listInvoices', 'finance');
            _invoices = data?.invoices || [];
            _renderInvoicesList(app, data);
        } catch (err) {
            app.innerHTML = Utils.emptyState('Errore', err.message, 'Riprova', null, () => _loadInvoices(app));
        }
    }

    function _renderInvoicesList(app, data) {
        const rows = _invoices.map(inv => {
            const isOut = inv.direction === 'out';
            const icon = isOut ? 'arrow-circle-right' : 'arrow-circle-left';
            const color = isOut ? 'var(--color-primary)' : 'var(--color-warning)';
            let statusColor = 'muted';
            if (inv.status === 'sent') statusColor = 'blue';
            else if (inv.status === 'delivered') statusColor = 'green';
            else if (inv.status === 'rejected') statusColor = 'red';
            else if (inv.status === 'draft') statusColor = 'yellow';

            return `
            <tr class="finance-invoice-row" data-id="${Utils.escapeHtml(inv.id)}" style="cursor:pointer;" title="Vedi dettaglio SDI">
                <td style="color:${color};"><i class="ph ph-${icon}"></i></td>
                <td><strong>${Utils.escapeHtml(inv.invoice_number)}</strong><br><span style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;">${Utils.escapeHtml(inv.type)}</span></td>
                <td>${new Date(inv.created_at).toLocaleDateString('it-IT')}</td>
                <td>${Utils.escapeHtml(inv.recipient_name)}</td>
                <td style="font-family:monospace;font-size:12px;">${inv.sdi_code || inv.pec || '<span style="color:var(--text-muted);">—</span>'}</td>
                <td style="font-weight:600;text-align:right;">€ ${_fmt(parseFloat(inv.total_amount))}</td>
                <td style="text-align:center;">${Utils.badge(inv.status.toUpperCase(), statusColor)}</td>
            </tr>`;
        }).join('');

        app.innerHTML = `
        <div class="finance-page">
            <div class="finance-header">
                <div class="finance-title-row">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-file-invoice" style="color:var(--color-primary);"></i> Fatture e Ricevute (SDI)
                    </h1>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost btn-sm" id="btn-back-dash"><i class="ph ph-arrow-left"></i> Dashboard</button>
                    </div>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="table table-hover">
                    <thead><tr>
                        <th style="width:40px;"></th>
                        <th>Numero</th>
                        <th>Data</th>
                        <th>Intestatario</th>
                        <th>Codice SDI / PEC</th>
                        <th style="text-align:right;">Totale</th>
                        <th style="text-align:center;">Stato SDI</th>
                    </tr></thead>
                    <tbody>
                        ${rows || '<tr><td colspan="7" style="text-align:center;padding:var(--sp-4);color:var(--text-muted);">Nessuna fattura/ricevuta</td></tr>'}
                    </tbody>
                </table>
            </div>
            ${data.pages > 1 ? `<p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:12px;">
                Pagina ${data.page} di ${data.pages} (${data.total} totali)</p>` : ''}
        </div>`;

        app.querySelector('#btn-back-dash')?.addEventListener('click', () => init(), { signal: _ac.signal });
        app.querySelectorAll('.finance-invoice-row').forEach(tr => {
            tr.addEventListener('click', () => _openInvoiceDetail(tr.dataset.id), { signal: _ac.signal });
        });
    }

    // ─── INVOICE DETAIL (SDI PREVIEW) ──────────────────────────────────────────

    async function _openInvoiceDetail(id) {
        try {
            const inv = await Store.get('getInvoice', 'finance', { id });

            const isDraft = inv.status === 'draft';

            const body = document.createElement('div');
            body.innerHTML = `
            <div style="background:#fff;color:#000;padding:40px;border-radius:8px;font-family:monospace;font-size:13px;line-height:1.5;">
                <div style="display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;">
                    <div>
                        <h2 style="margin:0;font-size:24px;">${inv.type.toUpperCase()}</h2>
                        <strong style="font-size:16px;">N. ${Utils.escapeHtml(inv.invoice_number)}</strong>
                        <div style="margin-top:5px;">Data: ${new Date(inv.created_at).toLocaleDateString('it-IT')}</div>
                    </div>
                    <div style="text-align:right;">
                        <strong>SDI PREVIEW LAYOUT</strong><br>
                        Stato Attuale: ${inv.status.toUpperCase()}<br>
                        ${inv.sdi_id ? `SDI ID: ${Utils.escapeHtml(inv.sdi_id)}` : ''}
                    </div>
                </div>

                <div style="display:flex;justify-content:space-between;margin-bottom:30px;">
                    <div style="width:45%;">
                        <strong>MITTENTE:</strong><br>
                        ${Utils.escapeHtml(Store.getState().user?.club_name || 'ASD Fusion')}<br>
                        ASD/SSD a R.L.<br>
                        <!-- Other tenant data would go here -->
                    </div>
                    <div style="width:45%;">
                        <strong>DESTINATARIO:</strong><br>
                        ${Utils.escapeHtml(inv.recipient_name)}<br>
                        ${inv.recipient_address ? Utils.escapeHtml(inv.recipient_address) + '<br>' : ''}
                        ${inv.recipient_cf ? 'C.F. ' + Utils.escapeHtml(inv.recipient_cf) + '<br>' : ''}
                        ${inv.recipient_piva ? 'P.IVA ' + Utils.escapeHtml(inv.recipient_piva) + '<br>' : ''}
                        <br>
                        <strong>Codice Destinatario (SDI):</strong> ${Utils.escapeHtml(inv.sdi_code || '0000000')}<br>
                        ${inv.pec ? `<strong>PEC:</strong> ${Utils.escapeHtml(inv.pec)}` : ''}
                    </div>
                </div>

                <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
                    <thead style="border-bottom:1px solid #000;">
                        <tr>
                            <th style="text-align:left;padding:8px 0;">Descrizione</th>
                            <th style="text-align:center;padding:8px 0;width:60px;">Q.tà</th>
                            <th style="text-align:right;padding:8px 0;width:100px;">Prezzo Unit.</th>
                            <th style="text-align:right;padding:8px 0;width:100px;">Importo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(inv.line_items || []).map(item => `
                        <tr>
                            <td style="padding:8px 0;">${Utils.escapeHtml(item.description)}</td>
                            <td style="text-align:center;padding:8px 0;">${item.qty || 1}</td>
                            <td style="text-align:right;padding:8px 0;">€ ${_fmt(parseFloat(item.unit_price || 0))}</td>
                            <td style="text-align:right;padding:8px 0;">€ ${_fmt(parseFloat(item.amount || 0))}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="display:flex;justify-content:flex-end;">
                    <div style="width:300px;">
                        <div style="display:flex;justify-content:space-between;padding:4px 0;">
                            <span>Imponibile:</span>
                            <span>€ ${_fmt(parseFloat(inv.subtotal))}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:4px 0;">
                            <span>Imposta (${parseFloat(inv.tax_rate)}%):</span>
                            <span>€ ${_fmt(parseFloat(inv.tax_amount))}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #000;font-weight:bold;font-size:16px;">
                            <span>TOTALE DOCUMENTO:</span>
                            <span>€ ${_fmt(parseFloat(inv.total_amount))}</span>
                        </div>
                    </div>
                </div>
                
                ${inv.notes ? `<div style="margin-top:30px;padding:10px;border:1px solid #eee;"><strong>Note:</strong><br>${Utils.escapeHtml(inv.notes)}</div>` : ''}
            </div>`;

            const footer = `
                <button class="btn btn-ghost" onclick="UI.closeAllModals()">Chiudi</button>
                ${isDraft ? `<button class="btn btn-primary" id="btn-send-sdi" onclick="UI.toast('Integrazione SDI non configurata: funzione disabilitata in demo', 'info', 4000)"><i class="ph ph-paper-plane-tilt"></i> INVIA ALLO SDI</button>` : ''}
                <button class="btn btn-ghost" onclick="window.print()"><i class="ph ph-printer"></i> Stampa Cortesia</button>
            `;

            UI.modal({ title: `Dettaglio ${inv.type} #${inv.invoice_number}`, body, footer, size: 'lg' });
        } catch (err) {
            UI.toast(err.message || 'Errore recupero fattura', 'error');
        }
    }

    // ─── ACCOUNTS VIEW ─────────────────────────────────────────────────────────

    async function _loadAccounts(app) {
        app.innerHTML = UI.skeletonPage();
        try {
            const data = await Store.get('chartOfAccounts', 'finance');
            _accounts = data || [];
            _renderAccountsList(app);
        } catch (err) {
            app.innerHTML = Utils.emptyState('Errore', err.message);
        }
    }

    function _renderAccountsList(app) {
        const grouped = { entrata: [], uscita: [], patrimoniale_attivo: [], patrimoniale_passivo: [] };
        _accounts.forEach(a => { if (grouped[a.type]) grouped[a.type].push(a); });

        const typeLabels = {
            entrata: 'Entrate', uscita: 'Uscite',
            patrimoniale_attivo: 'Attività', patrimoniale_passivo: 'Passività'
        };
        const typeColors = {
            entrata: '#10b981', uscita: '#ef4444',
            patrimoniale_attivo: '#3b82f6', patrimoniale_passivo: '#f59e0b'
        };

        app.innerHTML = `
                < div class="finance-page" >
                    <div class="finance-header">
                        <div class="finance-title-row">
                            <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                                <i class="ph ph-tree-structure" style="color:var(--color-primary);"></i> Piano dei Conti
                            </h1>
                            <button class="btn btn-ghost btn-sm" id="btn-back-dash">
                                <i class="ph ph-arrow-left"></i> Dashboard
                            </button>
                        </div>
                    </div>
            ${Object.entries(grouped).map(([type, accs]) => `
            <div class="finance-section" style="margin-bottom:var(--sp-3);">
                <h3 style="color:${typeColors[type]};margin-bottom:var(--sp-1);font-size:14px;text-transform:uppercase;letter-spacing:0.06em;">
                    ${typeLabels[type]} (${accs.length})
                </h3>
                ${accs.map(a => `
                <div class="finance-account-row">
                    <span class="finance-account-code">${Utils.escapeHtml(a.code)}</span>
                    <span class="finance-account-name">${Utils.escapeHtml(a.name)}</span>
                    ${a.is_system ? '<span class="finance-account-badge">Sistema</span>' : ''}
                </div>`).join('')}
            </div>`).join('')
            }
        </div > `;

        app.querySelector('#btn-back-dash')?.addEventListener('click', () => init(), { signal: _ac.signal });
    }

    // ─── RENDICONTO ETS ────────────────────────────────────────────────────────

    async function _loadRendiconto(app) {
        app.innerHTML = UI.skeletonPage();
        try {
            const data = await Store.get('rendiconto', 'finance');
            _renderRendiconto(app, data);
        } catch (err) {
            app.innerHTML = Utils.emptyState('Errore', err.message);
        }
    }

    function _renderRendiconto(app, data) {
        const fy = data.fiscal_year || {};
        const sections = data.sections || {};

        app.innerHTML = `
    < div class="finance-page" >
        <div class="finance-header">
            <div class="finance-title-row">
                <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                    <i class="ph ph-file-text" style="color:var(--color-primary);"></i>
                    Rendiconto Gestionale ETS
                </h1>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-ghost btn-sm" id="btn-rendiconto-pdf">
                        <i class="ph ph-file-pdf" style="color:#ef4444;"></i> Esporta PDF
                    </button>
                    <button class="btn btn-ghost btn-sm" id="btn-back-dash">
                        <i class="ph ph-arrow-left"></i> Dashboard
                    </button>
                </div>
            </div>
            <p style="color:var(--text-muted);font-size:13px;">
                Esercizio: ${Utils.escapeHtml(fy.label || '—')} (${fy.start_date || ''} — ${fy.end_date || ''})
            </p>
        </div>

            ${Object.values(sections).map(sec => `
            <div class="finance-rendiconto-section">
                <h3 class="finance-rendiconto-title">${Utils.escapeHtml(sec.label)}</h3>
                ${(sec.accounts || []).filter(a => a.balance !== 0).map(a => `
                <div class="finance-rendiconto-row">
                    <span>${Utils.escapeHtml(a.code)} — ${Utils.escapeHtml(a.name)}</span>
                    <span style="font-weight:600;">€ ${_fmt(a.balance)}</span>
                </div>`).join('') || '<p style="color:var(--text-muted);font-size:13px;padding:8px 0;">Nessun movimento</p>'}
                <div class="finance-rendiconto-total">
                    <span>Totale ${Utils.escapeHtml(sec.label)}</span>
                    <span>€ ${_fmt(sec.total)}</span>
                </div>
            </div>`).join('')}

            <div class="finance-rendiconto-result ${data.avanzo_disavanzo >= 0 ? 'positive' : 'negative'}">
                <span>${Utils.escapeHtml(data.avanzo_label || 'Risultato')}</span>
                <span>€ ${_fmt(data.avanzo_disavanzo || 0)}</span>
            </div>
        </div>`;

        app.querySelector('#btn-back-dash')?.addEventListener('click', () => init(), { signal: _ac.signal });
    }

    // ─── HELPERS ───────────────────────────────────────────────────────────────

    function _fmt(n) {
        return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    }

    // ─── 74-TER FISCAL VIEW ───────────────────────────────────────────────────

    async function _load74ter(app) {
        app.innerHTML = UI.skeletonPage();
        try {
            // Mocking the call for now as the backend endpoint might be missing
            const data = await Store.get('getFiscal74ter', 'finance').catch(() => ({
                margin_74ter: 92800.50,
                vat_due: 41750.00,
                total_billed: 495200.00,
                monthly_trend: [
                    { month: '2023-10', sales: 495200, acquisitions: 92800, margin: 185500 },
                    { month: '2023-11', sales: 95200, acquisitions: 2800, margin: 15500 },
                    { month: '2023-12', sales: 495200, acquisitions: 92800, margin: 185500 }
                ]
            }));
            _render74ter(app, data);
        } catch (err) {
            app.innerHTML = Utils.emptyState('Errore', err.message);
        }
    }

    function _render74ter(app, data) {
        app.innerHTML = `
        <div class="finance-page">
            <div class="finance-header">
                <div class="finance-title-row">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-intersect" style="color:var(--color-pink);"></i>
                        Regime 74-ter
                    </h1>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost btn-sm" id="btn-back-dash">
                            <i class="ph ph-arrow-left"></i> Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <!-- 74-ter KPI -->
            <div class="finance-kpi-grid">
                <div class="finance-kpi-card" style="border-left: 4px solid var(--color-pink);">
                    <div class="finance-kpi-content">
                        <span class="finance-kpi-value">€ ${_fmt(data.total_billed)}</span>
                        <span class="finance-kpi-label">Totale Fatturato (Lordo)</span>
                    </div>
                </div>
                <div class="finance-kpi-card" style="border-left: 4px solid #3b82f6;">
                    <div class="finance-kpi-content">
                        <span class="finance-kpi-value">€ ${_fmt(data.margin_74ter)}</span>
                        <span class="finance-kpi-label">Margine 74-ter</span>
                    </div>
                </div>
                <div class="finance-kpi-card" style="border-left: 4px solid var(--color-danger);">
                    <div class="finance-kpi-content">
                        <span class="finance-kpi-value">€ ${_fmt(data.vat_due)}</span>
                        <span class="finance-kpi-label">IVA Dovuta (Netta)</span>
                    </div>
                </div>
            </div>

            <div class="finance-section">
                <h3 style="margin-bottom:var(--sp-2);">Registri 74-ter Summary</h3>
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Mese</th>
                                <th style="text-align:right;">Vendite</th>
                                <th style="text-align:right;">Acquisti (Misto)</th>
                                <th style="text-align:right;">Margine Lordo</th>
                                <th style="text-align:right;">IVA Debito</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(data.monthly_trend || []).map(m => `
                                <tr>
                                    <td>${m.month}</td>
                                    <td style="text-align:right;">€ ${_fmt(m.sales)}</td>
                                    <td style="text-align:right;">€ ${_fmt(m.acquisitions)}</td>
                                    <td style="text-align:right;">€ ${_fmt(m.margin)}</td>
                                    <td style="text-align:right;">€ ${_fmt(m.margin * 0.22)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        app.querySelector('#btn-back-dash')?.addEventListener('click', () => init(), { signal: _ac.signal });
    }

    function destroy() {
        _ac.abort();
        _data = null;
        _entries = [];
        _accounts = [];
    }

    return { init, destroy };
})();

window.Finance = Finance;
