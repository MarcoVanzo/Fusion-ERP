export class TalentDayView {

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
                    background: var(--color-bg-alt);
                    z-index: 2;
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
     *  Table Area — toolbar + tabs + table
     * ═══════════════════════════════════════════════════════════════════ */
    static renderTableArea(entries, activeView, canEdit) {
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
                        ` : ""}
                    </div>
                </div>

                <!-- Table -->
                <div class="table-wrapper" style="overflow-x:auto;max-height:calc(100vh - 280px);">
                    <table id="td-table" class="data-table" style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead>
                            <tr>${this._headers(activeView, canEdit)}</tr>
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
    static _headers(view, canEdit) {
        const th = (label) =>
            `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">${label}</th>`;

        if (view === 'fisici') {
            return [
                'Nome', 'Cognome', 'Tappa', 'Data Nascita', 'Club',
                'Altezza', 'Peso', 'Reach', 'CMJ', 'Salto Rincorsa'
            ].map(th).join("")
                + (canEdit ? `<th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);"></th>` : "");
        }

        // anagrafica (default)
        return [
            'Data Reg.', 'Ora', 'Nome', 'Cognome', 'Email', 'Tappa',
            'Città/CAP', 'Cellulare', 'Taglia', 'Club', 'Ruolo', 'Campionati'
        ].map(th).join("")
            + (canEdit ? `<th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);"></th>` : "");
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  Table rows — adapts columns based on active view
     * ═══════════════════════════════════════════════════════════════════ */
    static renderRows(data, view, canEdit) {
        const colCount = view === 'fisici' ? 10 : 12;
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

        return data.map((e) => {
            let cols = '';

            if (view === 'fisici') {
                cols = cellBold(e.nome)
                     + cellBold(e.cognome)
                     + cell(e.tappa)
                     + cell(e.data_nascita)
                     + cell(e.club_tesseramento)
                     + cellMetric(e.altezza, 'cm')
                     + cellMetric(e.peso, 'kg')
                     + cellMetric(e.reach_cm, 'cm')
                     + cellMetric(e.cmj, 'cm')
                     + cellMetric(e.salto_rincorsa, 'cm');
            } else {
                const fmtDate = (d) => {
                    if (!d) return '—';
                    try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; }
                };
                const fmtTime = (t) => t ? t.substring(0, 5) : '—';

                cols = cell(fmtDate(e.data_registrazione))
                     + cell(fmtTime(e.ora_registrazione))
                     + cellBold(e.nome)
                     + cellBold(e.cognome)
                     + cell(e.email)
                     + cell(e.tappa)
                     + cell(e.citta_cap)
                     + cell(e.cellulare)
                     + cell(e.taglia_tshirt)
                     + cell(e.club_tesseramento)
                     + cell(e.ruolo)
                     + cell(e.campionati);
            }

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
        const e = entry || {};
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
                        <input id="td-tappa" class="form-input" type="text" placeholder="es. Milano, Roma..." value="${esc(e.tappa)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-email">Email</label>
                        <input id="td-email" class="form-input" type="email" value="${esc(e.email)}">
                    </div>
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
                        <label class="form-label" for="td-peso">Peso (kg)</label>
                        <input id="td-peso" class="form-input" type="number" step="0.1" min="30" max="200" value="${e.peso ?? ''}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="td-reach">Reach (cm)</label>
                        <input id="td-reach" class="form-input" type="number" step="0.1" min="100" max="400" value="${e.reach_cm ?? ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="td-cmj">CMJ (cm)</label>
                        <input id="td-cmj" class="form-input" type="number" step="0.1" min="0" max="100" value="${e.cmj ?? ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="td-salto">Salto con Rincorsa (cm)</label>
                    <input id="td-salto" class="form-input" type="number" step="0.1" min="0" max="400" value="${e.salto_rincorsa ?? ''}">
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
