/**
 * OutSeason Module — FTV Out Season Camp Management
 * Fusion ERP v1.0
 *
 * Data loaded from DB (synced from Cognito Forms API).
 */

'use strict';

const OutSeason = (() => {
    let _ac = new AbortController();
    let _verifiedHighNames = new Set();
    let _entries = []; // loaded from DB

    const WEEKS = [
        { key: '29 Giugno - 3 Luglio', label: '29 Giu – 3 Lug', color: '#6366f1' },
        { key: '6 Luglio - 10 Luglio', label: '6 – 10 Luglio', color: '#f59e0b' },
        { key: '13 Luglio - 17 Luglio', label: '13 – 17 Luglio', color: '#10b981' },
    ];

    const ROLE_ORDER = ['Alzatrice', 'Schiacciatrice', 'Opposto', 'Centrale', 'Libero'];
    const ROLE_ICONS = { Alzatrice: '🟡', Schiacciatrice: '🔴', Opposto: '🟣', Centrale: '🔵', Libero: '🟢' };
    const SEASON_KEY = '2026';

    /* ── Helpers ────────────────────────────────────────────────────────── */
    function _isPaid(e) {
        const s = (e.order_summary || e.OrderSummary || '');
        return s.includes('Paid') && !s.includes('Unpaid');
    }
    function _isFullMaster(e) {
        return (e.formula_scelta || e.FormulaScelta || '').includes('Full');
    }
    function _caparra(e) { return _isFullMaster(e) ? '250 €' : '150 €'; }
    function _caparraNum(e) { return _isFullMaster(e) ? 250 : 150; }
    function _nome(e) { return e.nome_e_cognome || e.NomeECognome || ''; }
    function _week(e) { return e.settimana_scelta || e.SettimanaScelta || ''; }
    function _ruolo(e) { return e.ruolo || e.Ruolo || ''; }
    function _metodo(e) { return e.come_vuoi_pagare || e.ComeVuoiPagare || ''; }
    function _club(e) { return e.club_di_appartenenza || e.ClubDiAppartenenza || ''; }
    function _sconto(e) { return e.codice_sconto || e.CodiceSconto || null; }
    function _edate(e) {
        const d = new Date(e.entry_date || e.EntryDate || '');
        return isNaN(d) ? '—' : d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    function _formula(e) {
        return _isFullMaster(e) ? 'Full Master' : 'Daily Master';
    }

    /* ── Module lifecycle ───────────────────────────────────────────────── */
    async function init() {
        _ac.abort();
        _ac = new AbortController();
        _verifiedHighNames = new Set();
        _renderSkeleton();
        await _loadEntries();
    }

    function _renderSkeleton() {
        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = `
        ${_buildStyles()}
        <div class="os-page">
            <div class="os-header">
                <h1><i class="ph ph-sun" style="font-size:28px;-webkit-text-fill-color:#f59e0b;"></i> FTV Out Season 2026</h1>
                <span class="os-badge" id="os-badge-count">Caricamento…</span>
                <button class="os-sync-btn" id="os-export-btn" title="Esporta lista iscritti in formato CSV">
                    <i class="ph ph-download-simple" style="font-size:16px;"></i> Esporta CSV
                </button>
                <button class="os-sync-btn" id="os-sync-btn" title="Sincronizza dati da Cognito Forms">
                    <i class="ph ph-arrows-clockwise" style="font-size:16px;"></i> Sincronizza da Cognito
                </button>
            </div>
            <div id="os-sync-status" style="display:none;margin-bottom:16px;"></div>
            <div id="os-main-content" style="opacity:.4;pointer-events:none;">
                <div style="padding:40px;text-align:center;opacity:.5;">
                    <i class="ph ph-spinner" style="font-size:32px;"></i>
                    <p style="margin-top:12px;">Caricamento iscritte…</p>
                </div>
            </div>
        </div>`;
        document.getElementById('os-sync-btn')?.addEventListener('click', _onSyncClick, { signal: _ac.signal });
        document.getElementById('os-export-btn')?.addEventListener('click', _exportCsv, { signal: _ac.signal });
    }

    function _exportCsv() {
        if (!_entries || _entries.length === 0) {
            UI.toast('Nessun dato da esportare', 'warning');
            return;
        }

        const headers = ['Nome Cognome', 'Settimana', 'Formula', 'Club', 'Ruolo', 'Data Nascita', 'Cellulare / Emergenza', 'Note', 'Pagato'];
        const csvRows = [headers.join(',')];

        _entries.forEach(e => {
            const row = [
                _nome(e),
                _week(e),
                _formula(e),
                _club(e),
                _ruolo(e),
                e.data_di_nascita || e.DataDiNascita || '',
                e.cellulare_emergenze || e.CellulareEmergenze || e.cellulare || e.Cellulare || '',
                (e.note || e.Note || '').replace(/\r?\n|\r/g, ' '),
                _isPaid(e) || _verifiedHighNames.has(_nome(e)) ? 'Si' : 'No'
            ].map(v => `"${String(v).replace(/"/g, '""')}"`);

            csvRows.push(row.join(','));
        });

        // Add BOM for correct UTF-8 display in Excel
        const csvContent = "\\uFEFF" + csvRows.join('\\n');
        const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "outseason_iscritti.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function _loadEntries() {
        try {
            const resp = await fetch(
                `api/router.php?module=outseason&action=getEntries&season_key=${SEASON_KEY}`,
                { credentials: 'same-origin' }
            );
            const json = await resp.json();
            if (!json.success) throw new Error(json.error || 'Errore caricamento entries');

            _entries = json.data?.entries || [];
            const lastSync = json.data?.last_sync || null;

            _renderMain(lastSync);
            await _loadVerification();
        } catch (err) {
            console.error('[OutSeason] Load error:', err);
            const main = document.getElementById('os-main-content');
            if (main) {
                main.style.opacity = '1';
                main.style.pointerEvents = 'auto';
                main.innerHTML = `<div class="os-verify-error">⚠️ Errore caricamento dati: ${err.message}<br><br>
                    <button class="os-sync-btn" onclick="OutSeason.manualSync()">
                        <i class="ph ph-arrows-clockwise"></i> Sincronizza ora da Cognito
                    </button></div>`;
            }
        }
    }

    function _renderMain(lastSync) {
        const badge = document.getElementById('os-badge-count');
        if (badge) badge.textContent = `${_entries.length} Iscritte`;

        const syncStatus = document.getElementById('os-sync-status');
        if (syncStatus && lastSync) {
            const d = new Date(lastSync);
            syncStatus.style.display = 'block';
            syncStatus.innerHTML = `<span style="font-size:12px;opacity:.5;">
                <i class="ph ph-clock" style="font-size:12px;"></i>
                Ultimo aggiornamento da Cognito: ${d.toLocaleString('it-IT')}</span>`;
        }

        const paid = _entries.filter(_isPaid);
        const unpaid = _entries.filter(e => !_isPaid(e));
        const totalCap = _entries.reduce((s, e) => s + _caparraNum(e), 0);
        const paidCap = paid.reduce((s, e) => s + _caparraNum(e), 0);
        const unpCap = unpaid.reduce((s, e) => s + _caparraNum(e), 0);

        const main = document.getElementById('os-main-content');
        if (!main) return;
        main.style.opacity = '1';
        main.style.pointerEvents = 'auto';

        if (_entries.length === 0) {
            main.innerHTML = `<div class="os-table-wrap" style="padding:40px;text-align:center;opacity:.6;">
                <p style="font-size:1.1rem;margin-bottom:16px;">Nessun dato trovato nel database.</p>
                <p style="font-size:13px;margin-bottom:20px;">Clicca il pulsante per importare i dati da Cognito Forms.</p>
            </div>`;
            return;
        }

        main.innerHTML = `
        <!-- KPI Cards -->
        <div class="os-kpi-row">
            <div class="os-kpi"><div class="os-kpi-label">Totale Iscritte</div><div class="os-kpi-value total">${_entries.length}</div></div>
            <div class="os-kpi"><div class="os-kpi-label">Caparra Incassata</div><div class="os-kpi-value paid">${paidCap.toLocaleString('it-IT')} €</div></div>
            <div class="os-kpi"><div class="os-kpi-label">Caparra Da Riscuotere</div><div class="os-kpi-value unpaid">${unpCap.toLocaleString('it-IT')} €</div></div>
            <div class="os-kpi"><div class="os-kpi-label">Totale Caparre</div><div class="os-kpi-value" style="color:#818cf8;">${totalCap.toLocaleString('it-IT')} €</div></div>
        </div>

        <!-- Tabs -->
        <div class="os-tabs" id="os-tabs">
            <button class="os-tab active" data-panel="payments">💳 Verifica Pagamenti</button>
            <button class="os-tab" data-panel="weeks">📅 Per Settimana / Ruolo</button>
        </div>

        <!-- Panel: Payments -->
        <div id="os-panel-payments">
            <div id="os-payments-table-wrap">${_renderPaymentsTable()}</div>
            <!-- Bank Statement Verify Section -->
            <div class="os-verify-section">
                <input type="file" id="os-pdf-input" accept=".pdf,application/pdf" style="display:none;">
                <button class="os-verify-btn" id="os-verify-btn">
                    <i class="ph ph-bank" style="font-size:20px;"></i>
                    🏦 Verifica Estratto Conto
                </button>
                <p style="margin-top:10px;font-size:12px;opacity:0.5;">Carica il PDF dell'estratto conto bancario per verificare i bonifici delle iscritte</p>
                <div id="os-verify-results"></div>
            </div>
        </div>

        <!-- Panel: Weeks -->
        <div id="os-panel-weeks" class="os-panel-hidden">${_renderWeeksTables()}</div>`;

        _bindTabs();
        _bindVerifyBtn();
    }

    /* ── Sync button ────────────────────────────────────────────────────── */
    async function _onSyncClick() {
        await manualSync();
    }

    async function manualSync() {
        const btn = document.getElementById('os-sync-btn');
        const syncStatus = document.getElementById('os-sync-status');

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="os-spinner" style="width:14px;height:14px;border-width:2px;"></div> Sincronizzazione…';
        }
        if (syncStatus) {
            syncStatus.style.display = 'block';
            syncStatus.innerHTML = `<span style="font-size:12px;color:#f59e0b;">
                <i class="ph ph-arrows-clockwise" style="font-size:12px;"></i> Sincronizzazione in corso…</span>`;
        }

        try {
            const resp = await fetch('api/router.php?module=outseason&action=syncFromCognito', {
                method: 'POST',
                credentials: 'same-origin',
            });
            const json = await resp.json();

            if (!json.success) {
                _showSyncError(json.error || 'Errore durante la sincronizzazione.');
                return;
            }

            const upserted = json.data?.upserted ?? 0;
            const now = new Date().toLocaleString('it-IT');

            if (syncStatus) {
                syncStatus.innerHTML = `<span style="font-size:12px;color:#10b981;">
                    ✅ Sincronizzate ${upserted} iscritte — ${now}</span>`;
            }

            // Reload entries and re-render
            await _loadEntries();

        } catch (err) {
            _showSyncError('Errore di rete: ' + err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="ph ph-arrows-clockwise" style="font-size:16px;"></i> Sincronizza da Cognito';
            }
        }
    }

    function _showSyncError(msg) {
        const syncStatus = document.getElementById('os-sync-status');
        if (syncStatus) {
            syncStatus.style.display = 'block';
            syncStatus.innerHTML = `<span style="font-size:12px;color:#ef4444;">⚠️ ${msg}</span>`;
        }
    }

    /* ── Tab switching ──────────────────────────────────────────────────── */
    function _bindTabs() {
        const tabs = document.getElementById('os-tabs');
        if (!tabs) return;
        tabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.os-tab');
            if (!btn) return;
            const panel = btn.dataset.panel;
            tabs.querySelectorAll('.os-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('os-panel-payments').classList.toggle('os-panel-hidden', panel !== 'payments');
            document.getElementById('os-panel-weeks').classList.toggle('os-panel-hidden', panel !== 'weeks');
        }, { signal: _ac.signal });
    }

    /* ── Payments table ─────────────────────────────────────────────────── */
    function _renderPaymentsTable() {
        const sorted = [..._entries].sort((a, b) => {
            const ap = _isPaid(a) ? 1 : 0;
            const bp = _isPaid(b) ? 1 : 0;
            if (ap !== bp) return ap - bp;
            return new Date(a.entry_date || 0) - new Date(b.entry_date || 0);
        });

        const paid = sorted.filter(e => _isPaid(e) || _verifiedHighNames.has(_nome(e)));
        const unpaid = sorted.filter(e => !_isPaid(e) && !_verifiedHighNames.has(_nome(e)));

        const rows = sorted.map((e, i) => `
            <tr>
                <td style="opacity:.5;">${i + 1}</td>
                <td style="font-weight:600;">${_nome(e)}</td>
                <td>${_club(e)}</td>
                <td><span class="os-badge-formula ${_isFullMaster(e) ? 'os-badge-full' : 'os-badge-daily'}">${_formula(e)}</span></td>
                <td style="font-weight:600;">${_caparra(e)}</td>
                <td>${_metodo(e) === 'Bonifico Bancario' ? '🏦 Bonifico' : '💳 Carta/PayPal'}</td>
                <td>${(_isPaid(e) || _verifiedHighNames.has(_nome(e)))
                ? '<span class="os-badge-paid">● Pagato</span>'
                : '<span class="os-badge-unpaid">● Da pagare</span>'}</td>
                <td style="opacity:.7;">${_edate(e)}</td>
                <td style="opacity:.5;font-size:11px;">${_sconto(e) || '—'}</td>
            </tr>`).join('');

        const paidTotal = paid.reduce((s, e) => s + _caparraNum(e), 0);
        const unpaidTotal = unpaid.reduce((s, e) => s + _caparraNum(e), 0);

        return `
        <div class="os-table-wrap">
            <div class="os-table-title">
                <i class="ph ph-credit-card" style="font-size:18px;color:#f59e0b;"></i>
                Riepilogo Pagamenti Caparra
                <span class="os-count" style="background:rgba(16,185,129,0.15);color:#10b981;">${paid.length} Pagati</span>
                <span class="os-count" style="background:rgba(239,68,68,0.15);color:#ef4444;">${unpaid.length} Da Pagare</span>
            </div>
            <div style="overflow-x:auto;">
            <table class="os-table">
                <thead><tr>
                    <th>#</th><th>Nome</th><th>Club</th><th>Formula</th><th>Caparra</th><th>Metodo</th><th>Stato</th><th>Data Iscr.</th><th>Sconto</th>
                </tr></thead>
                <tbody>
                    ${rows}
                    <tr class="os-summary-row">
                        <td></td>
                        <td colspan="3">TOTALE: ${_entries.length} iscritte</td>
                        <td>${(paidTotal + unpaidTotal).toLocaleString('it-IT')} €</td>
                        <td></td>
                        <td><span class="os-badge-paid">${paidTotal.toLocaleString('it-IT')} €</span> <span class="os-badge-unpaid">${unpaidTotal.toLocaleString('it-IT')} €</span></td>
                        <td colspan="2"></td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>`;
    }

    /* ── Per-week / role tables ────────────────────────────────────────── */
    function _renderWeeksTables() {
        return WEEKS.map(week => {
            const weekEntries = _entries.filter(e => _week(e) === week.key);
            if (weekEntries.length === 0) {
                return `
                <div class="os-week-section">
                    <div class="os-week-header">
                        <div class="os-week-dot" style="background:${week.color};"></div>
                        <h3>${week.label}</h3>
                        <span class="os-count">0 iscritte</span>
                    </div>
                    <div class="os-table-wrap" style="padding:24px;text-align:center;opacity:.5;">Nessuna iscritta per questa settimana</div>
                </div>`;
            }

            const byRole = {};
            ROLE_ORDER.forEach(r => byRole[r] = []);
            weekEntries.forEach(e => {
                const r = _ruolo(e);
                if (!byRole[r]) byRole[r] = [];
                byRole[r].push(e);
            });

            let tableRows = '';
            ROLE_ORDER.forEach(role => {
                const athletes = byRole[role];
                if (!athletes || athletes.length === 0) return;
                tableRows += `<tr class="os-role-header"><td colspan="5"><span class="os-role-emoji">${ROLE_ICONS[role] || '⚪'}</span>${role} <span style="opacity:.5;font-weight:400;font-size:12px;margin-left:8px;">(${athletes.length})</span></td></tr>`;
                athletes.forEach(e => {
                    const dob = (e.data_di_nascita || e.DataDiNascita || '').substring(0, 4);
                    tableRows += `
                    <tr>
                        <td style="padding-left:28px;font-weight:600;">${_nome(e)}</td>
                        <td>${_club(e)}</td>
                        <td>${dob || '—'}</td>
                        <td><span class="os-badge-formula ${_isFullMaster(e) ? 'os-badge-full' : 'os-badge-daily'}">${_formula(e)}</span></td>
                        <td>${_isPaid(e) ? '<span class="os-badge-paid">✓</span>' : '<span class="os-badge-unpaid">✗</span>'}</td>
                    </tr>`;
                });
            });

            const roleSummary = ROLE_ORDER
                .filter(r => byRole[r] && byRole[r].length > 0)
                .map(r => `${ROLE_ICONS[r] || '⚪'} ${byRole[r].length} ${r}`)
                .join('&nbsp;&nbsp;·&nbsp;&nbsp;');

            return `
            <div class="os-week-section">
                <div class="os-week-header">
                    <div class="os-week-dot" style="background:${week.color};box-shadow:0 0 8px ${week.color}80;"></div>
                    <h3 style="color:${week.color};">${week.label}</h3>
                    <span class="os-count">${weekEntries.length} iscritte</span>
                </div>
                <div class="os-table-wrap">
                    <div style="padding:10px 20px;font-size:12px;opacity:.7;border-bottom:1px solid rgba(255,255,255,0.05);">${roleSummary}</div>
                    <div style="overflow-x:auto;">
                    <table class="os-table">
                        <thead><tr><th>Nome</th><th>Club</th><th>Anno Nascita</th><th>Formula</th><th>Pagato</th></tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    /* ── Bank statement verification ──────────────────────────────────── */
    function _bindVerifyBtn() {
        const btn = document.getElementById('os-verify-btn');
        const input = document.getElementById('os-pdf-input');
        if (!btn || !input) return;

        btn.addEventListener('click', () => input.click(), { signal: _ac.signal });

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.type !== 'application/pdf') {
                _showVerifyError('Seleziona un file PDF valido.');
                input.value = '';
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                _showVerifyError('Il file è troppo grande. Massimo 10 MB.');
                input.value = '';
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<div class="os-spinner"></div> Analisi AI in corso...';
            document.getElementById('os-verify-results').innerHTML = '';

            try {
                const formData = new FormData();
                formData.append('file', file);

                const resp = await fetch('api/router.php?module=outseason&action=verifyPayments', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin',
                });
                const json = await resp.json();

                if (!json.success) {
                    _showVerifyError(json.error || 'Errore durante la verifica.');
                    return;
                }

                if (!json.data.parsed) {
                    const rawMsg = json.data.raw_response
                        ? `<br><br><strong>Risposta AI (debug):</strong><pre style="margin-top:8px;padding:12px;background:rgba(0,0,0,0.3);border-radius:8px;font-size:11px;max-height:200px;overflow:auto;white-space:pre-wrap;">${json.data.raw_response}</pre>`
                        : '';
                    _showVerifyError((json.data.message || 'L\'AI non ha restituito un risultato strutturato.') + rawMsg);
                    return;
                }

                _renderVerifyResults(json.data);
            } catch (err) {
                console.error('[OutSeason] Verify error:', err);
                _showVerifyError('Errore di rete. Controllare la connessione e riprovare.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="ph ph-bank" style="font-size:20px;"></i> 🏦 Verifica Estratto Conto';
                input.value = '';
            }
        }, { signal: _ac.signal });
    }

    function _showVerifyError(msg) {
        const container = document.getElementById('os-verify-results');
        if (container) container.innerHTML = `<div class="os-verify-error">⚠️ ${msg}</div>`;
    }

    function _renderVerifyResults(data) {
        const container = document.getElementById('os-verify-results');
        if (!container) return;

        const results = data.results || [];
        const summary = data.summary || { total_checked: results.length, found: 0, not_found: 0 };
        const foundCount = summary.found || results.filter(r => r.found).length;
        const missCount = summary.not_found || results.filter(r => !r.found).length;

        const rows = results.map(r => {
            const confClass = r.confidence === 'high' ? 'os-confidence-high' :
                r.confidence === 'medium' ? 'os-confidence-medium' : 'os-confidence-low';
            const confLabel = r.confidence === 'high' ? 'Alta' :
                r.confidence === 'medium' ? 'Media' : 'Bassa';
            return `
            <tr>
                <td style="font-weight:600;">${r.name}</td>
                <td style="font-weight:600;">${r.expected_amount} €</td>
                <td>${r.found ? '<span class="os-match-found">✅ Trovato</span>' : '<span class="os-match-missing">❌ Non trovato</span>'}</td>
                <td>${r.found ? (r.transaction_date || '—') : '—'}</td>
                <td>${r.found ? ((r.transaction_amount || '') + ' €') : '—'}</td>
                <td>${r.found ? `<span class="os-confidence ${confClass}">${confLabel}</span>` : '—'}</td>
                <td style="font-size:11px;opacity:.6;">${r.notes || '—'}</td>
            </tr>`;
        }).join('');

        container.innerHTML = `
        <div class="os-verify-results">
            <div class="os-verify-summary">
                <div class="os-verify-card"><div class="os-verify-card-label">Verificati</div><div class="os-verify-card-value checked">${summary.total_checked}</div></div>
                <div class="os-verify-card"><div class="os-verify-card-label">Trovati</div><div class="os-verify-card-value found">${foundCount}</div></div>
                <div class="os-verify-card"><div class="os-verify-card-label">Non Trovati</div><div class="os-verify-card-value missing">${missCount}</div></div>
            </div>
            <div class="os-table-wrap">
                <div class="os-table-title">
                    <i class="ph ph-magnifying-glass" style="font-size:18px;color:#818cf8;"></i>
                    Risultati Verifica Bonifici
                    <span class="os-count" style="background:rgba(16,185,129,0.15);color:#10b981;">${foundCount} Trovati</span>
                    <span class="os-count" style="background:rgba(239,68,68,0.15);color:#ef4444;">${missCount} Non trovati</span>
                </div>
                <div style="overflow-x:auto;">
                <table class="os-table">
                    <thead><tr>
                        <th>Nome</th><th>Importo Atteso</th><th>Esito</th>
                        <th>Data Transaz.</th><th>Importo Transaz.</th>
                        <th>Confidenza</th><th>Note</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                </div>
            </div>
        </div>`;

        _verifiedHighNames = new Set(
            results.filter(r => r.found && r.confidence === 'high').map(r => r.name)
        );
        const paymentsWrap = document.getElementById('os-payments-table-wrap');
        if (paymentsWrap) paymentsWrap.innerHTML = _renderPaymentsTable();

        _saveVerification(results);
    }

    /* ── DB persistence ─────────────────────────────────────────────────── */
    async function _loadVerification() {
        try {
            const resp = await fetch(
                `api/router.php?module=outseason&action=getVerification&season_key=${SEASON_KEY}`,
                { credentials: 'same-origin' }
            );
            const json = await resp.json();
            if (!json.success || !Array.isArray(json.data?.results) || json.data.results.length === 0) return;

            _verifiedHighNames = new Set(
                json.data.results
                    .filter(r => r.found && r.confidence === 'high')
                    .map(r => r.entry_name)
            );
            if (_verifiedHighNames.size > 0) {
                const paymentsWrap = document.getElementById('os-payments-table-wrap');
                if (paymentsWrap) paymentsWrap.innerHTML = _renderPaymentsTable();
            }
        } catch (err) {
            console.warn('[OutSeason] Could not load saved verifications:', err);
        }
    }

    async function _saveVerification(results) {
        try {
            await fetch('api/router.php?module=outseason&action=saveVerification', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ season_key: SEASON_KEY, results }),
            });
        } catch (err) {
            console.warn('[OutSeason] Could not save verifications:', err);
        }
    }

    /* ── CSS ────────────────────────────────────────────────────────────── */
    function _buildStyles() {
        return `<style>
            .os-page { padding: 24px; max-width: 1400px; margin: 0 auto; animation: osFadeIn .4s ease; }
            @keyframes osFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

            .os-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
            .os-header h1 { font-size: 1.8rem; font-weight: 700; background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .os-header .os-badge { padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: rgba(245,158,11,0.15); color: #f59e0b; }

            /* Sync button */
            .os-sync-btn {
                display: inline-flex; align-items: center; gap: 8px;
                padding: 8px 18px; border: 1px solid rgba(99,102,241,0.4); border-radius: 10px;
                background: rgba(99,102,241,0.1); color: #818cf8; font-size: 13px; font-weight: 600;
                cursor: pointer; transition: all .2s ease; margin-left: auto;
            }
            .os-sync-btn:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.7); transform: translateY(-1px); }
            .os-sync-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

            /* KPI Cards */
            .os-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
            .os-kpi { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; backdrop-filter: blur(12px); transition: transform .2s, box-shadow .2s; }
            .os-kpi:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
            .os-kpi-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; margin-bottom: 6px; }
            .os-kpi-value { font-size: 1.8rem; font-weight: 700; }
            .os-kpi-value.paid { color: #10b981; }
            .os-kpi-value.unpaid { color: #ef4444; }
            .os-kpi-value.total { color: #f59e0b; }

            /* Tabs */
            .os-tabs { display: flex; gap: 4px; margin-bottom: 24px; background: rgba(255,255,255,0.04); border-radius: 12px; padding: 4px; border: 1px solid rgba(255,255,255,0.06); }
            .os-tab { flex: 1; padding: 10px 18px; border: none; background: none; color: inherit; font-size: 14px; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all .2s; opacity: 0.6; text-align: center; }
            .os-tab:hover { opacity: 0.9; background: rgba(255,255,255,0.05); }
            .os-tab.active { background: rgba(245,158,11,0.15); color: #f59e0b; opacity: 1; font-weight: 700; }

            /* Table */
            .os-table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; margin-bottom: 24px; }
            .os-table-title { padding: 16px 20px; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
            .os-table-title .os-count { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .os-table { width: 100%; border-collapse: collapse; font-size: 13px; }
            .os-table thead th { padding: 10px 14px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: .5px; opacity: 0.5; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }
            .os-table tbody td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
            .os-table tbody tr { transition: background .15s; }
            .os-table tbody tr:hover { background: rgba(255,255,255,0.04); }
            .os-table tbody tr:last-child td { border-bottom: none; }

            /* Badges */
            .os-badge-paid { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; background: rgba(16,185,129,0.12); color: #10b981; }
            .os-badge-unpaid { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; background: rgba(239,68,68,0.12); color: #ef4444; }
            .os-badge-formula { display: inline-block; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; }
            .os-badge-full { background: rgba(99,102,241,0.12); color: #818cf8; }
            .os-badge-daily { background: rgba(245,158,11,0.12); color: #f59e0b; }

            /* Summary row */
            .os-summary-row td { font-weight: 700 !important; border-top: 2px solid rgba(255,255,255,0.1) !important; background: rgba(255,255,255,0.02); padding-top: 14px !important; }

            /* Role group header */
            .os-role-header td { background: rgba(255,255,255,0.03); font-weight: 700; font-size: 14px; padding: 10px 14px !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
            .os-role-emoji { font-size: 16px; margin-right: 6px; }

            /* Week Section */
            .os-week-section { margin-bottom: 24px; animation: osFadeIn .4s ease; }
            .os-week-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
            .os-week-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
            .os-week-header h3 { font-size: 1.1rem; font-weight: 700; }
            .os-week-header .os-count { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.08); }

            /* Bank Verify Section */
            .os-verify-section { margin-top: 28px; animation: osFadeIn .4s ease; }
            .os-verify-btn {
                display: inline-flex; align-items: center; gap: 10px;
                padding: 14px 28px; border: none; border-radius: 14px;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: #fff; font-size: 15px; font-weight: 700;
                cursor: pointer; transition: all .25s ease;
                box-shadow: 0 4px 16px rgba(99,102,241,0.3);
                position: relative; overflow: hidden;
            }
            .os-verify-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent); opacity: 0; transition: opacity .25s; }
            .os-verify-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.45); }
            .os-verify-btn:hover::before { opacity: 1; }
            .os-verify-btn:active { transform: scale(0.97); }
            .os-verify-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
            .os-verify-btn .os-spinner, .os-sync-btn .os-spinner {
                width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3);
                border-top-color: currentColor; border-radius: 50%;
                animation: osSpin .7s linear infinite; display: inline-block;
            }
            @keyframes osSpin { to { transform: rotate(360deg); } }

            .os-verify-results { margin-top: 24px; animation: osFadeIn .5s ease; }
            .os-verify-summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
            .os-verify-card { flex: 1; min-width: 160px; padding: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; text-align: center; backdrop-filter: blur(12px); }
            .os-verify-card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 6px; }
            .os-verify-card-value { font-size: 1.6rem; font-weight: 700; }
            .os-verify-card-value.found { color: #10b981; }
            .os-verify-card-value.missing { color: #ef4444; }
            .os-verify-card-value.checked { color: #818cf8; }

            .os-match-found { color: #10b981; font-weight: 700; }
            .os-match-missing { color: #ef4444; font-weight: 700; }
            .os-confidence { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
            .os-confidence-high { background: rgba(16,185,129,0.15); color: #10b981; }
            .os-confidence-medium { background: rgba(245,158,11,0.15); color: #f59e0b; }
            .os-confidence-low { background: rgba(239,68,68,0.15); color: #ef4444; }

            .os-verify-error { margin-top: 16px; padding: 16px 20px; border-radius: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; font-size: 14px; font-weight: 500; }

            /* Responsive */
            @media (max-width: 768px) {
                .os-page { padding: 12px; }
                .os-table { font-size: 12px; }
                .os-table thead th, .os-table tbody td { padding: 8px 8px; }
                .os-kpi-row { grid-template-columns: repeat(2, 1fr); }
                .os-verify-summary { flex-direction: column; }
                .os-verify-btn { width: 100%; justify-content: center; }
                .os-sync-btn { margin-left: 0; }
            }
            .os-panel-hidden { display: none !important; }
        </style>`;
    }

    function destroy() {
        _ac.abort();
    }

    return { destroy, init, manualSync };
})();
window.OutSeason = OutSeason;
