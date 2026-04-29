export class OpenDayView {

    /* ═══════════════════════════════════════════════════════════════════
     *  Main Layout — header + content area + side panel shell
     * ═══════════════════════════════════════════════════════════════════ */
    static renderMainLayout(annata = new Date().getFullYear(), availableYears = []) {
        if (!availableYears.includes(annata)) { availableYears.push(annata); availableYears.sort((a, b) => b - a); }
        const yearOptions = availableYears.map(y => `<option value="${y}" ${y === annata ? 'selected' : ''}>Open Day ${y}</option>`).join('');

        return `
            <div class="transport-dashboard" style="min-height: 100vh;">
                <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">
                    <div>
                        <h1 class="dash-title"><i class="ph ph-calendar-plus" style="color:var(--color-pink);margin-right:8px"></i>Open <span style="color:var(--color-pink);">Day</span></h1>
                        <p class="dash-subtitle">Registrazioni Open Day — Gestione per annata</p>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <select id="od-annata-select" style="padding:10px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;font-size:14px;font-weight:600;cursor:pointer;min-width:170px;outline:none;transition:border-color .2s ease;">
                            ${yearOptions}
                        </select>
                    </div>
                </div>
                <div id="od-stats-area" style="margin-bottom: 24px;"></div>
                <div class="dash-card" style="padding:var(--sp-4)" id="od-content-area"></div>
            </div>

            <style>
                #od-side-panel {
                    position: fixed; top: 0; right: -520px; width: 500px; max-width: 100vw; height: 100vh; height: 100dvh;
                    background: var(--color-bg); z-index: 10000; box-shadow: -10px 0 30px rgba(0,0,0,0.8);
                    border-left: 1px solid var(--color-border); transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                #od-side-panel.open { right: 0; }
                .od-view-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border-radius: 12px; padding: 4px; border: 1px solid rgba(255,255,255,0.06); }
                .od-view-tab { padding: 8px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; color: var(--color-text-muted); cursor: pointer; transition: all .25s ease; border: none; background: transparent; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
                .od-view-tab:hover { color: #fff; background: rgba(255,255,255,0.06); }
                .od-view-tab.active { background: linear-gradient(135deg, var(--color-pink), var(--color-primary)); color: #fff; box-shadow: 0 2px 12px rgba(217,70,239,0.3); }
                #od-table th { position: sticky; top: 0; background: var(--bg-dark, #12161F); z-index: 2; }
                .od-sort-header { cursor: pointer; user-select: none; transition: color .2s ease; display: inline-flex; align-items: center; gap: 4px; }
                .od-sort-header:hover { color: #fff; }
                .od-sort-header .od-sort-icon { font-size: 12px; opacity: 0.35; transition: opacity .2s ease, transform .2s ease; }
                .od-sort-header.sort-active .od-sort-icon { opacity: 1; color: var(--color-pink); }
                .od-sort-header.sort-desc .od-sort-icon { transform: rotate(180deg); }
                .od-form-section { display: flex; align-items: center; gap: 8px; padding: 6px 0 8px; margin-top: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-pink); border-bottom: 1px solid rgba(255,255,255,0.06); }
            </style>

            <div id="od-side-panel" style="display:none;flex-direction:column;"></div>
        `;
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Stats Area — single total card (no tappa breakdown)
     * ═══════════════════════════════════════════════════════════════════ */
    static renderStatsSummary(entries, annata = new Date().getFullYear()) {
        if (!entries) entries = [];
        const total = entries.length;

        return `
            <div style="display: flex; gap: 12px; overflow: hidden; padding-bottom: 8px;">
                <div style="flex: 1; max-width: 280px; background: linear-gradient(135deg, rgba(217,70,239,0.15), rgba(99,102,241,0.15)); border: 1px solid rgba(217,70,239,0.3); border-radius: 12px; padding: 16px 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                    <div style="position: absolute; top: -10px; right: -10px; opacity: 0.1; transform: rotate(15deg);">
                        <i class="ph-fill ph-users" style="font-size: 80px; color: var(--color-pink);"></i>
                    </div>
                    <div style="font-size: 11px; color: var(--color-pink); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 600; z-index: 1;">Iscritti ${annata}</div>
                    <div style="font-size: 30px; font-weight: 800; color: #fff; z-index: 1; font-variant-numeric: tabular-nums; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">${total}</div>
                </div>
                <div style="flex: 1; max-width: 400px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px 20px; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Edizione</div>
                    <div style="font-size: 15px; font-weight: 600; color: #fff;">Open Day ${annata}</div>
                    <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 2px;">Annata selezionata</div>
                </div>
            </div>
        `;
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Table Area — toolbar + tabs + table (NO tappa filter)
     * ═══════════════════════════════════════════════════════════════════ */
    static renderTableArea(entries, activeView, canEdit, sortCol = '', sortDir = '') {
        return `
            <div style="width:100%;display:flex;flex-direction:column">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                    <div style="display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap">
                        <div class="input-wrapper" style="position:relative;min-width:220px">
                            <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                            <input type="text" id="od-search" class="form-input" placeholder="Cerca per nome, cognome, club…"
                                   style="padding-left:36px;height:42px;font-size:13px;background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);color:#fff;">
                        </div>
                        <span id="od-count" class="status-badge" style="background:var(--color-primary-light);color:var(--color-primary);font-weight:600">${entries.length} registrazioni</span>
                    </div>
                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                        <div class="od-view-tabs">
                            <button class="od-view-tab ${activeView === 'anagrafica' ? 'active' : ''}" data-view="anagrafica">
                                <i class="ph ph-identification-card"></i> Dati Anagrafici
                            </button>
                            <button class="od-view-tab ${activeView === 'fisici' ? 'active' : ''}" data-view="fisici">
                                <i class="ph ph-barbell"></i> Dati Fisici
                            </button>
                        </div>
                        ${canEdit ? `
                            <button class="btn-dash" id="od-add-btn" type="button" style="background:var(--color-pink);color:#fff;">
                                <i class="ph ph-plus-circle" style="font-size:18px;"></i> NUOVA REGISTRAZIONE
                            </button>
                            <button class="btn-dash" id="od-export-btn" type="button" style="background-color: #217346; color: white;">
                                <i class="ph ph-file-csv" style="font-size:18px;"></i> ESPORTA EXCEL
                            </button>
                        ` : ""}
                    </div>
                </div>
                <div class="table-wrapper" style="overflow-x:auto;max-height:calc(100vh - 280px);">
                    <table id="od-table" class="data-table" style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead>
                            <tr>${this._headers(activeView, canEdit, sortCol, sortDir)}</tr>
                        </thead>
                        <tbody id="od-tbody">
                            ${this.renderRows(entries, activeView, canEdit)}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Column definitions — NO tappa
     * ═══════════════════════════════════════════════════════════════════ */
    static _colDefs(view) {
        if (view === 'fisici') {
            return [
                ['Nome', 'nome'], ['Cognome', 'cognome'], ['Anno Nascita', 'data_nascita'],
                ['Altezza', 'altezza'], ['Reach', 'reach_cm'],
                ['Salto Rincorsa 1', 'salto_rincorsa_1'], ['Salto Rincorsa 2', 'salto_rincorsa_2'], ['Salto Rincorsa 3', 'salto_rincorsa_3']
            ];
        }
        return [
            ['Nome', 'nome'], ['Cognome', 'cognome'],
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
            return `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">
                <span class="od-sort-header${activeClass}" data-sort-key="${key}">
                    ${label}
                    <i class="ph ph-caret-up od-sort-icon"></i>
                </span>
            </th>`;
        }).join('');
        return ths + (canEdit ? `<th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);"></th>` : '');
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Table rows
     * ═══════════════════════════════════════════════════════════════════ */
    static renderRows(data, view, canEdit) {
        const colDefs = this._colDefs(view);
        const colCount = colDefs.length;
        if (!data || data.length === 0) {
            return `<tr><td colspan="${colCount + (canEdit ? 1 : 0)}" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">
                <i class="ph ph-clipboard-text" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.4"></i>
                Nessuna registrazione Open Day trovata.</td></tr>`;
        }

        const esc = (v) => window.Utils.escapeHtml(v || "");
        const cell = (val) => `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${esc(val) || "—"}</td>`;
        const cellMetric = (val, unit = '') => {
            const v = val != null && val !== '' ? parseFloat(val) : null;
            if (v === null) return cell('—');
            return `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-variant-numeric:tabular-nums">
                <span style="font-weight:600;color:var(--color-primary)">${v}</span>
                <span style="font-size:11px;color:var(--color-text-muted);margin-left:2px">${unit}</span>
            </td>`;
        };

        const metricKeys = { altezza: 'cm', reach_cm: 'cm' };
        const fmtDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; } };
        const fmtTime = (t) => t ? t.substring(0, 5) : '—';

        return data.map((e) => {
            let cols = colDefs.map(([, key]) => {
                const raw = e[key];
                if (key.startsWith('salto_rincorsa')) {
                    const v = raw != null && raw !== '' ? parseFloat(raw) : null;
                    if (v === null) return cell('—');
                    let color = 'var(--color-danger)';
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
                    try { return view === 'fisici' ? cell(new Date(raw).getFullYear()) : cell(fmtDate(raw)); } catch { return cell(raw); }
                }
                if (key === 'data_registrazione') return cell(fmtDate(raw));
                if (key === 'ora_registrazione') return cell(fmtTime(raw));
                return cell(raw);
            }).join('');

            if (canEdit) {
                cols += `
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right;white-space:nowrap">
                        <button class="btn btn-icon btn-ghost btn-sm od-edit-btn" data-id="${esc(e.id)}" title="Modifica">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn btn-icon btn-ghost btn-sm od-delete-btn" data-id="${esc(e.id)}" title="Elimina" style="color:var(--color-pink);">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>`;
            }
            return `<tr>${cols}</tr>`;
        }).join("");
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Side Panel — Form (NO tappa field)
     * ═══════════════════════════════════════════════════════════════════ */
    static renderSidePanelForm(entry = null) {
        const isEdit = entry !== null;
        const e = entry ? { ...entry } : {};
        const esc = (v) => window.Utils.escapeHtml(v || "");
        const today = new Date().toISOString().substring(0, 10);

        return `
            <div style="padding:var(--sp-3) var(--sp-4); border-bottom:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center; background:var(--color-bg);">
                <h3 style="margin:0; font-size:16px; font-weight:600;">
                    <i class="ph ph-${isEdit ? 'pencil-simple' : 'plus-circle'}" style="margin-right:6px;color:var(--color-pink)"></i>
                    ${isEdit ? "Modifica Registrazione" : "Nuova Registrazione"}
                </h3>
                <button class="btn btn-icon btn-ghost btn-sm" id="od-cancel-panel" title="Chiudi">
                    <i class="ph ph-x"></i>
                </button>
            </div>

            <div style="padding:var(--sp-4); flex-grow:1; overflow-y:auto;">
                <div class="od-form-section"><i class="ph ph-calendar"></i> Registrazione</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-data-reg">Data Registrazione</label>
                        <input id="od-data-reg" class="form-input" type="date" value="${e.data_registrazione ? e.data_registrazione.substring(0,10) : today}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="od-ora-reg">Ora Registrazione</label>
                        <input id="od-ora-reg" class="form-input" type="time" value="${esc(e.ora_registrazione) || ''}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-email">Email</label>
                        <input id="od-email" class="form-input" type="email" value="${esc(e.email)}">
                    </div>
                </div>
                <div class="form-group" style="margin-top:12px;background:rgba(255,255,255,0.03);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:10px;">
                    <input id="od-privacy-consent" type="checkbox" style="width:18px;height:18px;accent-color:var(--color-pink)" ${e.privacy_consent === 1 || e.privacy_consent === true || !isEdit ? 'checked' : ''}>
                    <label class="form-label" for="od-privacy-consent" style="margin:0;cursor:pointer;">Consenso Privacy Autorizzato (GDPR) <span style="color:var(--color-red)">*</span></label>
                </div>

                <div class="od-form-section"><i class="ph ph-identification-card"></i> Anagrafica</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-nome">Nome *</label>
                        <input id="od-nome" class="form-input" type="text" value="${esc(e.nome)}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="od-cognome">Cognome *</label>
                        <input id="od-cognome" class="form-input" type="text" value="${esc(e.cognome)}" required>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-indirizzo">Indirizzo</label>
                        <input id="od-indirizzo" class="form-input" type="text" value="${esc(e.indirizzo)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="od-citta-cap">Città / CAP</label>
                        <input id="od-citta-cap" class="form-input" type="text" value="${esc(e.citta_cap)}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-data-nascita">Data di Nascita</label>
                        <input id="od-data-nascita" class="form-input" type="date" value="${esc(e.data_nascita)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="od-cellulare">Cellulare</label>
                        <input id="od-cellulare" class="form-input" type="text" value="${esc(e.cellulare)}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-taglia">Taglia T-shirt</label>
                        <select id="od-taglia" class="form-input">
                            <option value="">—</option>
                            ${['XXS','XS','S','M','L','XL','XXL'].map(s => `<option value="${s}" ${e.taglia_tshirt === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="od-club">Club Tesseramento</label>
                        <input id="od-club" class="form-input" type="text" value="${esc(e.club_tesseramento)}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-ruolo">Ruolo</label>
                        <input id="od-ruolo" class="form-input" type="text" value="${esc(e.ruolo)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="od-campionati">Campionati</label>
                        <input id="od-campionati" class="form-input" type="text" value="${esc(e.campionati)}">
                    </div>
                </div>

                <div class="od-form-section"><i class="ph ph-users"></i> Genitore / Tutore</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-nome-gen">Nome Genitore</label>
                        <input id="od-nome-gen" class="form-input" type="text" value="${esc(e.nome_genitore)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="od-tel-gen">Telefono Genitore</label>
                        <input id="od-tel-gen" class="form-input" type="text" value="${esc(e.telefono_genitore)}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="od-email-gen">Email Genitore</label>
                    <input id="od-email-gen" class="form-input" type="email" value="${esc(e.email_genitore)}">
                </div>

                <div class="od-form-section"><i class="ph ph-barbell"></i> Dati Fisici</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-altezza">Altezza (cm)</label>
                        <input id="od-altezza" class="form-input" type="number" step="0.1" min="100" max="250" value="${e.altezza ?? ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="od-reach">Reach (cm)</label>
                        <input id="od-reach" class="form-input" type="number" step="0.1" min="100" max="400" value="${e.reach_cm ?? ''}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="od-salto-1">Salto con Rincorsa 1 (cm)</label>
                        <input id="od-salto-1" class="form-input" type="number" step="0.1" min="0" max="400" value="${e.salto_rincorsa_1 ?? ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="od-salto-2">Salto con Rincorsa 2 (cm)</label>
                        <input id="od-salto-2" class="form-input" type="number" step="0.1" min="0" max="400" value="${e.salto_rincorsa_2 ?? ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="od-salto-3">Salto con Rincorsa 3 (cm)</label>
                    <input id="od-salto-3" class="form-input" type="number" step="0.1" min="0" max="400" value="${e.salto_rincorsa_3 ?? ''}">
                </div>

                <div id="od-error" class="form-error hidden"></div>
            </div>

            <div style="padding:var(--sp-3) var(--sp-4); border-top:1px solid var(--color-border); background:var(--color-bg); display:flex; justify-content:flex-end; gap:var(--sp-2);">
                <button class="btn btn-ghost btn-sm" id="od-cancel-panel-btn" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="od-save-panel" type="button" data-id="${isEdit ? esc(e.id) : ''}">
                    <i class="ph ph-floppy-disk"></i> SALVA
                </button>
            </div>
        `;
    }
}
