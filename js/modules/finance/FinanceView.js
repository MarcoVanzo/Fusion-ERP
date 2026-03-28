/**
 * Finance View Module
 * Fusion ERP v1.1
 */

const FinanceView = {
    skeleton: () => UI.skeletonPage(),

    dashboard: (data, categories) => {
        const income = data.total_income || 0;
        const expenses = data.total_expenses || 0;
        const balance = data.balance || 0;
        const year = data.fiscal_year || {};

        return `
            <div class="transport-dashboard" style="min-height:100vh; padding: 24px;">
                <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">
                    <div style="display:flex;justify-content:space-between;width:100%;align-items:center;flex-wrap:wrap;gap:12px;">
                        <div>
                            <h1 class="dash-title" style="display:flex;align-items:center;gap:10px;">
                                <i class="ph ph-calculator" style="color:var(--accent-pink);"></i>
                                Contabilità
                            </h1>
                            ${year.label ? `<p style="color:var(--text-muted);font-size:13px;margin-top:4px;">Anno fiscale: <strong>${Utils.escapeHtml(year.label)}</strong></p>` : ''}
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button class="btn-dash" id="btn-view-entries"><i class="ph ph-list"></i> Prima Nota</button>
                            <button class="btn-dash" id="btn-view-accounts"><i class="ph ph-tree-structure"></i> Piano dei Conti</button>
                            <button class="btn-dash" id="btn-rendiconto"><i class="ph ph-file-text"></i> Rendiconto</button>
                            <button class="btn-dash pink" id="btn-new-entry"><i class="ph ph-plus"></i> Nuova</button>
                        </div>
                    </div>
                </div>

                <div class="dash-stat-grid" style="margin-bottom:24px;">
                    ${FinanceView._kpiCard('Entrate', income, 'arrow-circle-down', 'positive')}
                    ${FinanceView._kpiCard('Uscite', expenses, 'arrow-circle-up', 'negative')}
                    ${FinanceView._kpiCard('Saldo', balance, 'scales', balance >= 0 ? 'positive' : 'negative')}
                    ${FinanceView._kpiCard('Movimenti', data.entry_count, 'note-pencil', 'neutral')}
                </div>

                <div class="grid-2" style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
                    <div class="dash-card" style="padding:20px;">
                        <h3 style="margin-bottom:16px;"><i class="ph ph-chart-bar"></i> Andamento Mensile</h3>
                        ${FinanceView._monthlyChart(data.monthly_trend || [])}
                    </div>
                    <div class="dash-card" style="padding:20px;">
                        <h3 style="margin-bottom:16px;"><i class="ph ph-clock-clockwise"></i> Ultime Registrazioni</h3>
                        <div class="finance-entries-list">
                            ${(data.recent_entries || []).map(e => FinanceView.entryRow(e, categories)).join('') || '<p>Nessuna registrazione</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    entryRow: (entry, categories) => {
        const isIncome = (entry.category || '').match(/quote|iscrizi|sponsor|contribut|donaz|event/i);
        const icon = isIncome ? 'arrow-circle-down' : 'arrow-circle-up';
        const color = isIncome ? '#10b981' : '#ef4444';
        const catLabel = categories[entry.category] || entry.category || '—';
        const amount = FinanceView._formatCurrency(entry.total_amount);
        const date = entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '';

        return `
            <div class="finance-entry-row" data-id="${entry.id}" style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;">
                <div class="finance-entry-icon" style="color:${color};"><i class="ph ph-${icon}"></i></div>
                <div class="finance-entry-info" style="flex:1;">
                    <div style="font-weight:600; font-size:14px;">${Utils.escapeHtml(entry.description)}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${Utils.escapeHtml(catLabel)} · ${entry.payment_method || ''}</div>
                </div>
                <div class="finance-entry-right" style="text-align:right;">
                    <div style="font-weight:700; color:${color};">€ ${amount}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${date}</div>
                </div>
            </div>
        `;
    },

    accountsList: (accounts) => {
        const groups = { entrata: [], uscita: [], patrimoniale_attivo: [], patrimoniale_passivo: [] };
        accounts.forEach(a => { if(groups[a.type]) groups[a.type].push(a); });

        const labels = { entrata: 'Entrate', uscita: 'Uscite', patrimoniale_attivo: 'Attivo', patrimoniale_passivo: 'Passivo' };
        
        return `
            <div class="transport-dashboard" style="padding:24px;">
                <div class="dash-top-bar" style="margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h1 class="dash-title">Piano dei Conti</h1>
                        <button class="btn-dash" id="btn-back-dash"><i class="ph ph-arrow-left"></i> Dashboard</button>
                    </div>
                </div>
                <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    ${Object.entries(groups).map(([type, list]) => `
                        <div class="dash-card" style="padding:16px;">
                            <h4 style="text-transform:uppercase; margin-bottom:12px; font-size:12px; color:var(--color-pink);">${labels[type]}</h4>
                            ${list.map(a => `
                                <div class="finance-account-row" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                                    <span style="font-family:monospace; width:60px;">${Utils.escapeHtml(a.code)}</span>
                                    <span style="flex:1;">${Utils.escapeHtml(a.name)}</span>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    entryModal: (categories, accounts) => {
        const catOptions = Object.entries(categories).map(([k,v]) => `<option value="${k}">${Utils.escapeHtml(v)}</option>`).join('');
        const accountOptions = accounts.map(a => `<option value="${a.id}">[${a.code}] ${Utils.escapeHtml(a.name)}</option>`).join('');

        return `
            <form id="entry-form" style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group">
                    <label class="form-label">Descrizione *</label>
                    <input type="text" id="entry-desc" class="form-input" required>
                </div>
                <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group">
                        <label class="form-label">Data *</label>
                        <input type="date" id="entry-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoria</label>
                        <select id="entry-cat" class="form-select"><option value="">— Seleziona —</option>${catOptions}</select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Importo € *</label>
                        <input type="number" id="entry-amount" class="form-input" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Metodo di Pagamento</label>
                        <select id="entry-payment" class="form-select">
                            <option value="Bonifico">Bonifico</option>
                            <option value="Contanti">Contanti</option>
                            <option value="Carta">Carta</option>
                        </select>
                    </div>
                </div>
                <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group">
                        <label class="form-label">Conto DARE (Uscita/Costi)</label>
                        <select id="entry-debit" class="form-select">${accountOptions}</select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Conto AVERE (Entrata/Ricavi)</label>
                        <select id="entry-credit" class="form-select">${accountOptions}</select>
                    </div>
                </div>
                <div id="entry-error" class="form-error hidden"></div>
            </form>
        `;
    },

    entryDetailModal: (entry, categories) => {
        const catLabel = categories[entry.category] || entry.category || 'Nessuna Categoria';
        const date = new Date(entry.entry_date).toLocaleDateString('it-IT');
        
        return `
            <div class="finance-detail-section" style="padding-bottom:16px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom: 24px;">
                    <div class="dash-card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Data</div>
                        <div style="font-size:16px; font-weight:600;">${date}</div>
                    </div>
                    <div class="dash-card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Metodo di Pagamento</div>
                        <div style="font-size:16px; font-weight:600;">${Utils.escapeHtml(entry.payment_method || '—')}</div>
                    </div>
                </div>
                <div style="margin-bottom:24px;">
                    <div style="font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Categoria</div>
                    <div style="font-size:15px; color:var(--color-pink); font-weight:600;">${Utils.escapeHtml(catLabel)}</div>
                </div>
                
                <h4 style="margin-bottom:12px; font-size:13px; opacity:0.8; text-transform:uppercase;">Dettaglio Conti</h4>
                <div style="background:rgba(0,0,0,0.2); border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:grid; grid-template-columns:1fr 100px 100px; gap:8px; padding:12px 16px; background:rgba(255,255,255,0.03); font-size:11px; font-weight:700; opacity:0.6;">
                        <div>CONTO</div>
                        <div style="text-align:right;">DARE</div>
                        <div style="text-align:right;">AVERE</div>
                    </div>
                    ${(entry.lines || []).map(l => {
                        const debit = parseFloat(l.debit) || 0;
                        const credit = parseFloat(l.credit) || 0;
                        return `
                        <div style="display:grid; grid-template-columns:1fr 100px 100px; gap:8px; padding:12px 16px; border-top:1px solid rgba(255,255,255,0.02); font-size:13px;">
                            <div>
                                <span style="font-family:monospace; opacity:0.6; margin-right:8px;">${Utils.escapeHtml(l.code)}</span>
                                ${Utils.escapeHtml(l.account_name)}
                            </div>
                            <div style="text-align:right;">${debit > 0 ? "€ " + FinanceView._formatCurrency(debit) : ""}</div>
                            <div style="text-align:right;">${credit > 0 ? "€ " + FinanceView._formatCurrency(credit) : ""}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    _kpiCard: (label, value, icon, type) => {
        const isNum = typeof value === 'number';
        const color = type === 'positive' ? '#10b981' : (type === 'negative' ? '#ef4444' : 'inherit');
        return `
            <div class="dash-stat-card" style="padding:20px;">
                <div class="finance-kpi-icon"><i class="ph ph-${icon}"></i></div>
                <div class="finance-kpi-content">
                    <span class="finance-kpi-value" style="color:${color}">${isNum ? '€ ' + FinanceView._formatCurrency(value) : value}</span>
                    <span class="finance-kpi-label">${label}</span>
                </div>
            </div>
        `;
    },

    _monthlyChart: (trend) => {
        if (!trend || trend.length === 0) return '<p>Dati insufficienti</p>';
        const maxVal = Math.max(...trend.map(t => Math.max(parseFloat(t.income), parseFloat(t.expenses))), 1);
        
        return `
            <div class="finance-chart" style="display:flex; align-items:flex-end; gap:8px; height:150px; padding-top:20px;">
                ${trend.map(t => {
                    const h1 = (parseFloat(t.income) / maxVal) * 100;
                    const h2 = (parseFloat(t.expenses) / maxVal) * 100;
                    return `
                        <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
                            <div style="display:flex; gap:2px; height:100px; align-items:flex-end;">
                                <div style="width:6px; height:${h1}%; background:#10b981; border-radius:2px;"></div>
                                <div style="width:6px; height:${h2}%; background:#ef4444; border-radius:2px;"></div>
                            </div>
                            <span style="font-size:9px; color:var(--text-muted);">${t.month.split('-')[1]}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    _formatCurrency: (val) => {
        return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2 }).format(val);
    }
};

export default FinanceView;
