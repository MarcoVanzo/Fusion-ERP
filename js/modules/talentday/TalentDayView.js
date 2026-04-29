export class TalentDayView {

    /** Predefined tappe for the Talent Day events */
    static TAPPE = [
        '19 MAG 2026, Firenze 2 - Savino Del Bene Volley',
        '26 MAG 2026, Firenze - Savino Del Bene Volley',
        '28 MAG 2026, Roma - Civitavecchia',
        '3 GIU 2026, Venezia - Fusion Team Volley',
        '4 GIU 2026, Trieste - Azzurra Volley',
        '5 GIU 2026, Udine - Rizzi Volley',
        '10 GIU 2026, Torino - Volavalley',
        '11 GIU 2026, Lecce - Melendugno Volley',
        '19 GIU 2026, Catania - Ciclope Volley Bronte',
        '29 GIU 2026, Cagliari - Audax Quartucciu',
    ];

    /* ═══════════════════════════════════════════════════════════════════
     *  Main Layout — header + content area + side panel shell
     * ═══════════════════════════════════════════════════════════════════ */
    static renderMainLayout() {
        return `
            <div class="transport-dashboard" style="min-height: 100vh;">
                <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">
                    <div>
                        <h1 class="dash-title"><i class="ph ph-star" style="color:var(--accent-pink);margin-right:8px"></i>Talent <span style="color:var(--accent-pink);">Day</span></h1>
                        <p class="dash-subtitle">Registrazioni e misurazioni fisiche dei Talent Day</p>
                    </div>
                </div>
                <div id="td-stats-area" style="margin-bottom: 24px;"></div>
                <div class="dash-card" style="padding:var(--sp-4)" id="td-content-area"></div>
            </div>

            <style>
                /* ── Side panel ──────────────────────────── */
                #td-side-panel {
                    position: fixed;
                    top: 0;
                    right: -520px;
                    width: 500px;
                    max-width: 100vw;
                    height: 100vh;
                    height: 100dvh;
                    background: var(--color-bg);
                    z-index: 10000;
                    box-shadow: -10px 0 30px rgba(0,0,0,0.8);
                    border-left: 1px solid var(--color-border);
                    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                #td-side-panel.open { right: 0; }

                /* ── View toggle tabs ────────────────────── */
                .td-view-tabs {
                    display: flex;
                    gap: 4px;
                    background: rgba(255,255,255,0.04);
                    border-radius: 12px;
                    padding: 4px;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .td-view-tab {
                    padding: 8px 18px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    transition: all .25s ease;
                    border: none;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                }
                .td-view-tab:hover { color: #fff; background: rgba(255,255,255,0.06); }
                .td-view-tab.active {
                    background: linear-gradient(135deg, var(--accent-pink), var(--color-primary));
                    color: #fff;
                    box-shadow: 0 2px 12px rgba(var(--accent-pink-rgb, 236,72,153), 0.3);
                }

                /* ── Table enhancements ──────────────────── */
                #td-table th {
                    position: sticky;
                    top: 0;
                    background: var(--bg-dark, #12161F);
                    z-index: 2;
                }

                /* ── Sortable headers ────────────────────── */
                .td-sort-header {
                    cursor: pointer;
                    user-select: none;
                    transition: color .2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .td-sort-header:hover { color: #fff; }
                .td-sort-header .td-sort-icon {
                    font-size: 12px;
                    opacity: 0.35;
                    transition: opacity .2s ease, transform .2s ease;
                }
                .td-sort-header.sort-active .td-sort-icon {
                    opacity: 1;
                    color: var(--accent-pink);
                }
                .td-sort-header.sort-desc .td-sort-icon {
                    transform: rotate(180deg);
                }

                /* ── Tappa filter select ─────────────────── */
                #td-tappa-filter {
                    height: 42px;
                    font-size: 13px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    color: #fff;
                    padding: 0 12px;
                    min-width: 160px;
                    cursor: pointer;
                }
                #td-tappa-filter:focus {
                    border-color: var(--accent-pink);
                    outline: none;
                }

                /* ── Form section headers inside side panel ── */
                .td-form-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 0 8px;
                    margin-top: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--accent-pink);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
            </style>

            <div id="td-side-panel" style="display:none;flex-direction:column;"></div>
        `;
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Stats Area
     * ═══════════════════════════════════════════════════════════════════ */
    static renderStatsSummary(entries) {
        if (!entries) entries = [];
        
        // Count total
        const total = entries.length;
        
        // Count per parsed location to avoid duplicates if tappa name was slightly changed
        const countsByLocation = {};
        const locationMap = {}; // Maps short location to full name for tooltip (optional)
        
        // Helper to extract location
        const getLocation = (tappaStr) => {
            let loc = tappaStr;
            if (tappaStr.includes(',')) {
                const parts = tappaStr.split(',');
                if (parts.length > 1) {
                    loc = parts[1].split('-')[0].trim();
                }
            }
            if (loc === 'Scandicci' || (typeof tappaStr === 'string' && (tappaStr.includes('Scandicci') || tappaStr.includes('19 MAG')))) {
                loc = 'Firenze 2';
            }
            return loc;
        };

        // Initialize with predefined locations
        this.TAPPE.forEach(t => {
            const loc = getLocation(t);
            countsByLocation[loc] = 0;
            locationMap[loc] = t;
        });
        
        entries.forEach(e => {
            if (e.tappa) {
                const loc = getLocation(e.tappa);
                countsByLocation[loc] = (countsByLocation[loc] || 0) + 1;
                // Update mapping to use the latest/most common full string, optional
                locationMap[loc] = locationMap[loc] || e.tappa;
            }
        });

        // Generate cards for each location
        const tappeCards = Object.entries(countsByLocation).map(([location, count]) => {
            const fullTappaName = locationMap[location] || location;
            return `
                <div style="flex: 1 1 0; min-width: 0; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 12px 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; transition: all 0.3s ease; cursor: default;" onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.transform='translateY(0)';">
                    <div style="font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;" title="${window.Utils.escapeHtml(fullTappaName)}">${window.Utils.escapeHtml(location)}</div>
                    <div style="font-size: 24px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums;">${count}</div>
                </div>
            `;
        }).join('');

        return `
            <div style="display: flex; flex-wrap: nowrap; gap: 8px; overflow: hidden; padding-bottom: 8px;">
                <!-- Total Card -->
                <div style="flex: 1.2 1 0; min-width: 0; background: linear-gradient(135deg, rgba(236,72,153,0.15), rgba(99,102,241,0.15)); border: 1px solid rgba(236,72,153,0.3); border-radius: 12px; padding: 12px 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                    <div style="position: absolute; top: -10px; right: -10px; opacity: 0.1; transform: rotate(15deg);">
                        <i class="ph-fill ph-users" style="font-size: 80px; color: var(--accent-pink);"></i>
                    </div>
                    <div style="font-size: 11px; color: var(--accent-pink); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 600; z-index: 1; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">Totale Iscritti</div>
                    <div style="font-size: 30px; font-weight: 800; color: #fff; z-index: 1; font-variant-numeric: tabular-nums; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">${total}</div>
                </div>
                
                <!-- Tappe Cards -->
                ${tappeCards}
            </div>
        `;
    }


    /* ═══════════════════════════════════════════════════════════════════
     *  Table Area — toolbar + tabs + table
     * ═══════════════════════════════════════════════════════════════════ */
    static renderTableArea(entries, activeView, canEdit, tappaList = [], activeTappa = '', sortCol = '', sortDir = '') {
        return `
            <div style="width:100%;display:flex;flex-direction:column">
                <!-- Toolbar -->
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                    <div style="display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap">
                        <div class="input-wrapper" style="position:relative;min-width:220px">
                            <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                            <input type="text" id="td-search" class="form-input" placeholder="Cerca per nome, cognome, tappa…"
                                   style="padding-left:36px;height:42px;font-size:13px;background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);color:#fff;">
                        </div>
                        <select id="td-tappa-filter">
                            <option value="">Tutte le tappe</option>
                            ${tappaList.map(t => `<option value="${window.Utils.escapeHtml(t)}" ${activeTappa === t ? 'selected' : ''}>${window.Utils.escapeHtml(t)}</option>`).join('')}
                        </select>
                        <span id="td-count" class="status-badge" style="background:var(--color-primary-light);color:var(--color-primary);font-weight:600">${entries.length} registrazioni</span>
                    </div>
                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                        <!-- View toggle -->
                        <div class="td-view-tabs">
                            <button class="td-view-tab ${activeView === 'anagrafica' ? 'active' : ''}" data-view="anagrafica">
                                <i class="ph ph-identification-card"></i> Dati Anagrafici
                            </button>
                            <button class="td-view-tab ${activeView === 'fisici' ? 'active' : ''}" data-view="fisici">
                                <i class="ph ph-barbell"></i> Dati Fisici
                            </button>
                        </div>
                        ${canEdit ? `
                            <button class="btn-dash pink" id="td-add-btn" type="button">
                                <i class="ph ph-plus-circle" style="font-size:18px;"></i> NUOVA REGISTRAZIONE
                            </button>
                            <button class="btn-dash" id="td-export-btn" type="button" style="background-color: #217346; color: white;">
                                <i class="ph ph-file-csv" style="font-size:18px;"></i> ESPORTA EXCEL
                            </button>
                        ` : ""}
                    </div>
                </div>

                <!-- Table -->
                <div class="table-wrapper" style="overflow-x:auto;max-height:calc(100vh - 280px);">
                    <table id="td-table" class="data-table" style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead>
                            <tr>${this._headers(activeView, canEdit, sortCol, sortDir)}</tr>
                        </thead>
                        <tbody id="td-tbody">
                            ${this.renderRows(entries, activeView, canEdit)}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Table headers per view
     * ═══════════════════════════════════════════════════════════════════ */
    /** Column definitions: [label, dataKey] */
    static _colDefs(view) {
        if (view === 'fisici') {
            return [
                ['Nome', 'nome'], ['Cognome', 'cognome'], ['Anno Nascita', 'data_nascita'], ['Tappa', 'tappa'],
                ['Altezza', 'altezza'], ['Reach', 'reach_cm'],
                ['Salto Rincorsa 1', 'salto_rincorsa_1'], ['Salto Rincorsa 2', 'salto_rincorsa_2'], ['Salto Rincorsa 3', 'salto_rincorsa_3']
            ];
        }
        // anagrafica — Nome/Cognome first, Tappa included
        return [
            ['Nome', 'nome'], ['Cognome', 'cognome'], ['Tappa', 'tappa'],
            ['Data Nascita', 'data_nascita'],
            ['Data Reg.', 'data_registrazione'], ['Ora', 'ora_registrazione'],
            ['Email', 'email'], ['Città/CAP', 'citta_cap'], ['Cellulare', 'cellulare'],
            ['Taglia', 'taglia_tshirt'], ['Club', 'club_tesseramento'],
            ['Ruolo', 'ruolo'], ['Campionati', 'campionati']
        ];
    }

    static _headers(view, canEdit, sortCol = '', sortDir = '') {
        const cols = this._colDefs(view);
        const ths = cols.map(([label, key]) => {
            const isActive = sortCol === key;
            const activeClass = isActive ? ` sort-active${sortDir === 'desc' ? ' sort-desc' : ''}` : '';
            const styleExtra = key === 'tappa' ? 'min-width:120px; white-space:nowrap;' : '';
            return `<th style="${styleExtra}text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">
                <span class="td-sort-header${activeClass}" data-sort-key="${key}">
                    ${label}
                    <i class="ph ph-caret-up td-sort-icon"></i>
                </span>
            </th>`;
        }).join('');

        return ths + (canEdit ? `<th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);"></th>` : '');
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Table rows — adapts columns based on active view
     * ═══════════════════════════════════════════════════════════════════ */
    static renderRows(data, view, canEdit) {
        const colDefs = this._colDefs(view);
        const colCount = colDefs.length;
        if (!data || data.length === 0) {
            return `<tr><td colspan="${colCount + (canEdit ? 1 : 0)}" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">
                <i class="ph ph-clipboard-text" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.4"></i>
                Nessuna registrazione Talent Day trovata.</td></tr>`;
        }

        const esc = (v) => window.Utils.escapeHtml(v || "");
        const cell = (val) =>
            `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${esc(val) || "—"}</td>`;
        const cellBold = (val) =>
            `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${esc(val) || "—"}</td>`;
        const cellMetric = (val, unit = '') => {
            const v = val != null && val !== '' ? parseFloat(val) : null;
            if (v === null) return cell('—');
            return `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-variant-numeric:tabular-nums">
                <span style="font-weight:600;color:var(--color-primary)">${v}</span>
                <span style="font-size:11px;color:var(--color-text-muted);margin-left:2px">${unit}</span>
            </td>`;
        };

        // Metric keys that should use cellMetric rendering
        const metricKeys = { altezza: 'cm', reach_cm: 'cm' };
        // Bold keys
        const boldKeys = new Set(['nome', 'cognome']);
        // Date formatting helper
        const fmtDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; } };
        const fmtTime = (t) => t ? t.substring(0, 5) : '—';

        return data.map((e) => {
            let cols = colDefs.map(([, key]) => {
                const raw = e[key];
                if (key === 'privacy_consent') {
                    // Boolean visual feedback
                    return `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:center;">
                        <i class="ph ph-${raw ? 'check-circle' : 'warning-circle'}" style="color:var(--color-${raw ? 'green' : 'red'});font-size:18px"></i>
                    </td>`;
                }
                if (key === 'tappa' && raw) {
                    let location = raw;
                    if (raw.includes(',')) {
                        const parts = raw.split(',');
                        if (parts.length > 1) {
                            location = parts[1].split('-')[0].trim();
                        }
                    }
                    if (location === 'Scandicci' || (typeof raw === 'string' && (raw.includes('Scandicci') || raw.includes('19 MAG')))) {
                        location = 'Firenze 2';
                    }
                    return `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap;">${window.Utils.escapeHtml(location)}</td>`;
                }
                if (key.startsWith('salto_rincorsa')) {
                    const v = raw != null && raw !== '' ? parseFloat(raw) : null;
                    if (v === null) return cell('—');
                    let color = 'var(--color-danger)'; // < 280
                    if (v > 300) color = 'var(--color-pink)';
                    else if (v >= 290) color = 'var(--color-success)';
                    else if (v >= 280) color = 'var(--color-warning)';
                    return `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-variant-numeric:tabular-nums">
                        <span style="font-weight:600;color:${color}">${v}</span>
                        <span style="font-size:11px;color:var(--color-text-muted);margin-left:2px">cm</span>
                    </td>`;
                }
                if (metricKeys[key]) return cellMetric(raw, metricKeys[key]);
                if (key === 'data_nascita') {
                    if (!raw) return cell('—');
                    try {
                        return view === 'fisici' ? cell(new Date(raw).getFullYear()) : cell(fmtDate(raw));
                    } catch {
                        return cell(raw);
                    }
                }
                if (key === 'data_registrazione') return cell(fmtDate(raw));
                if (key === 'ora_registrazione') return cell(fmtTime(raw));
                return cell(raw);
            }).join('');

            if (canEdit) {
                cols += `
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right;white-space:nowrap">
                        <button class="btn btn-icon btn-ghost btn-sm td-edit-btn" data-id="${esc(e.id)}" title="Modifica">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn btn-icon btn-ghost btn-sm td-delete-btn" data-id="${esc(e.id)}" title="Elimina" style="color:var(--color-pink);">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>`;
            }

            return `<tr>${cols}</tr>`;
        }).join("");
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Side Panel — Form with all fields in grouped sections
     * ═══════════════════════════════════════════════════════════════════ */
    static renderSidePanelForm(entry = null) {
        const isEdit = entry !== null;
        const e = entry ? { ...entry } : {};
        if (e.tappa && (e.tappa.includes('Scandicci') || e.tappa === '19 MAG 2026, Firenze - Savino Del Bene Volley')) {
            e.tappa = '19 MAG 2026, Firenze 2 - Savino Del Bene Volley';
        }
        const esc = (v) => window.Utils.escapeHtml(v || "");
        const today = new Date().toISOString().substring(0, 10);

        return `
            <!-- Panel Header -->
            <div style="padding:var(--sp-3) var(--sp-4); border-bottom:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center; background:var(--color-bg);">
                <h3 style="margin:0; font-size:16px; font-weight:600;">
                    <i class="ph ph-${isEdit ? 'pencil-simple' : 'plus-circle'}" style="margin-right:6px;color:var(--accent-pink)"></i>
                    ${isEdit ? "Modifica Registrazione" : "Nuova Registrazione"}
                </h3>
                <button class="btn btn-icon btn-ghost btn-sm" id="td-cancel-panel" title="Chiudi">
                    <i class="ph ph-x"></i>
                </button>
            </div>

            <!-- Panel Body -->
            <div style="padding:var(--sp-4); flex-grow:1; overflow-y:auto;">

                <!-- Section: Registrazione -->
                <div class="td-form-section"><i class="ph ph-calendar"></i> Registrazione</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-data-reg">Data Registrazione</label>
                        <input id="td-data-reg" class="form-input" type="date" value="${e.data_registrazione ? e.data_registrazione.substring(0,10) : today}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-ora-reg">Ora Registrazione</label>
                        <input id="td-ora-reg" class="form-input" type="time" value="${esc(e.ora_registrazione) || ''}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-tappa">Tappa</label>
                        <select id="td-tappa" class="form-input">
                            <option value="">— Seleziona tappa —</option>
                            ${TalentDayView.TAPPE.map(t => `<option value="${t}" ${e.tappa === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-email">Email</label>
                        <input id="td-email" class="form-input" type="email" value="${esc(e.email)}">
                    </div>
                </div>
                <!-- Consenso Privacy -->
                <div class="form-group" style="margin-top:12px;background:rgba(255,255,255,0.03);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:10px;">
                    <input id="td-privacy-consent" type="checkbox" style="width:18px;height:18px;accent-color:var(--accent-pink)" ${e.privacy_consent === 1 || e.privacy_consent === true || !isEdit ? 'checked' : ''}>
                    <label class="form-label" for="td-privacy-consent" style="margin:0;cursor:pointer;">Consenso Privacy Autorizzato (GDPR) <span style="color:var(--color-red)">*</span></label>
                </div>

                <!-- Section: Anagrafica -->
                <div class="td-form-section"><i class="ph ph-identification-card"></i> Anagrafica</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-nome">Nome *</label>
                        <input id="td-nome" class="form-input" type="text" value="${esc(e.nome)}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-cognome">Cognome *</label>
                        <input id="td-cognome" class="form-input" type="text" value="${esc(e.cognome)}" required>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-indirizzo">Indirizzo</label>
                        <input id="td-indirizzo" class="form-input" type="text" value="${esc(e.indirizzo)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-citta-cap">Città / CAP</label>
                        <input id="td-citta-cap" class="form-input" type="text" value="${esc(e.citta_cap)}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-data-nascita">Data di Nascita</label>
                        <input id="td-data-nascita" class="form-input" type="date" value="${esc(e.data_nascita)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-cellulare">Cellulare</label>
                        <input id="td-cellulare" class="form-input" type="text" value="${esc(e.cellulare)}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-taglia">Taglia T-shirt</label>
                        <select id="td-taglia" class="form-input">
                            <option value="">—</option>
                            ${['XXS','XS','S','M','L','XL','XXL'].map(s => `<option value="${s}" ${e.taglia_tshirt === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-club">Club Tesseramento</label>
                        <input id="td-club" class="form-input" type="text" value="${esc(e.club_tesseramento)}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-ruolo">Ruolo</label>
                        <input id="td-ruolo" class="form-input" type="text" value="${esc(e.ruolo)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-campionati">Campionati</label>
                        <input id="td-campionati" class="form-input" type="text" value="${esc(e.campionati)}">
                    </div>
                </div>

                <!-- Section: Genitore / Tutore -->
                <div class="td-form-section"><i class="ph ph-users"></i> Genitore / Tutore</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-nome-gen">Nome Genitore</label>
                        <input id="td-nome-gen" class="form-input" type="text" value="${esc(e.nome_genitore)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-tel-gen">Telefono Genitore</label>
                        <input id="td-tel-gen" class="form-input" type="text" value="${esc(e.telefono_genitore)}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="td-email-gen">Email Genitore</label>
                    <input id="td-email-gen" class="form-input" type="email" value="${esc(e.email_genitore)}">
                </div>

                <!-- Section: Dati Fisici -->
                <div class="td-form-section"><i class="ph ph-barbell"></i> Dati Fisici</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-altezza">Altezza (cm)</label>
                        <input id="td-altezza" class="form-input" type="number" step="0.1" min="100" max="250" value="${e.altezza ?? ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-reach">Reach (cm)</label>
                        <input id="td-reach" class="form-input" type="number" step="0.1" min="100" max="400" value="${e.reach_cm ?? ''}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-salto-1">Salto con Rincorsa 1 (cm)</label>
                        <input id="td-salto-1" class="form-input" type="number" step="0.1" min="0" max="400" value="${e.salto_rincorsa_1 ?? ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-salto-2">Salto con Rincorsa 2 (cm)</label>
                        <input id="td-salto-2" class="form-input" type="number" step="0.1" min="0" max="400" value="${e.salto_rincorsa_2 ?? ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="td-salto-3">Salto con Rincorsa 3 (cm)</label>
                    <input id="td-salto-3" class="form-input" type="number" step="0.1" min="0" max="400" value="${e.salto_rincorsa_3 ?? ''}">
                </div>

                <div id="td-error" class="form-error hidden"></div>
            </div>

            <!-- Panel Footer -->
            <div style="padding:var(--sp-3) var(--sp-4); border-top:1px solid var(--color-border); background:var(--color-bg); display:flex; justify-content:flex-end; gap:var(--sp-2);">
                <button class="btn btn-ghost btn-sm" id="td-cancel-panel-btn" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="td-save-panel" type="button" data-id="${isEdit ? esc(e.id) : ''}">
                    <i class="ph ph-floppy-disk"></i> SALVA
                </button>
            </div>
        `;
    }
}
