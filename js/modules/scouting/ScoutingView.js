export class ScoutingView {
    /**
     * Renders the main skeleton layout for Scouting.
     */
    static renderMainLayout() {
        return `
            <div class="transport-dashboard" style="min-height: 100vh;">
                <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">
                    <div>
                        <h1 class="dash-title">Database <span style="color:var(--accent-pink);">Scouting</span></h1>
                        <p class="dash-subtitle">Contatti e atleti segnalati manualmente o via Cognito Forms</p>
                    </div>
                </div>
                <div class="dash-card" style="padding:var(--sp-4)" id="scouting-content-area"></div>
            </div>
            
            <style>
                #scouting-side-panel {
                    position: fixed;
                    top: 0;
                    right: -500px; /* Hidden initially but animated to 0 */
                    width: 450px;
                    max-width: 100vw;
                    height: 100vh;
                    background: var(--color-bg);
                    z-index: 10000;
                    box-shadow: -10px 0 30px rgba(0,0,0,0.8);
                    border-left: 1px solid var(--color-border);
                    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                #scouting-side-panel.open {
                    right: 0;
                }
                .td-view-tabs {
                    display: flex;
                    gap: 4px;
                    background: rgba(255,255,255,0.04);
                    border-radius: 12px;
                    padding: 4px;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .scouting-view-tab {
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
                .scouting-view-tab:hover { color: #fff; background: rgba(255,255,255,0.06); }
                .scouting-view-tab.active {
                    background: linear-gradient(135deg, var(--accent-pink), var(--color-primary));
                    color: #fff;
                    box-shadow: 0 2px 12px rgba(var(--accent-pink-rgb, 236,72,153), 0.3);
                }
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
            
            <div id="scouting-side-panel" style="display:none;flex-direction:column;"></div>
            `;
    }

    /**
     * Renders the dashboard/table area with syncing info and the rows inside.
     * @param {Array} athletes 
     * @param {string|null} lastSync 
     * @param {boolean} canEdit 
     * @param {string} activeView
     */
    static renderTableArea(athletes, lastSync, canEdit, activeView = 'anagrafica') {
        let headers = [];
        if (activeView === 'fisici') {
            headers = ["Nome", "Cognome", "Altezza", "Peso", "Reach", "Sit e Reach", "Reach 2", "CMJ", "Salto Rincorsa"];
        } else {
            headers = ["Nome", "Cognome", "Ruolo", "Società", "Email", "Cellulare", "Anno Nasc.", "Note", "Rilevatore", "Data", "Fonte"];
        }

        return `
            <div style="width: 100%; display: flex; flex-direction: column;">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                    <div style="display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap">
                        <div class="input-wrapper" style="position:relative;min-width:220px">
                            <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                            <input type="text" id="scouting-search" class="form-input" placeholder="Cerca per nome, cognome..." style="padding-left:36px;height:42px;font-size:13px;background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);color:#fff;">
                        </div>
                        <span id="scouting-count" class="status-badge" style="background:var(--color-primary-light);color:var(--color-primary);font-weight:600">${athletes.length} atleti</span>
                    </div>
                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                        <div class="td-view-tabs">
                            <button class="scouting-view-tab ${activeView === 'anagrafica' ? 'active' : ''}" data-view="anagrafica">
                                <i class="ph ph-identification-card"></i> Dati Anagrafici
                            </button>
                            <button class="scouting-view-tab ${activeView === 'fisici' ? 'active' : ''}" data-view="fisici">
                                <i class="ph ph-barbell"></i> Dati Fisici
                            </button>
                        </div>
                        ${canEdit ? `
                            <button class="btn-dash" id="scouting-sync-btn" type="button" title="Sincronizza da Cognito Forms">
                                <i class="ph ph-arrows-clockwise" style="font-size:18px;"></i> Sincronizza
                            </button>
                            <button class="btn-dash pink" id="scouting-add-btn" type="button">
                                <i class="ph ph-plus-circle" style="font-size:18px;"></i> NUOVO INSERIMENTO
                            </button>
                        ` : ""}
                    </div>
                </div>
                <div id="scouting-sync-status" style="margin-bottom:var(--sp-2);display:${lastSync ? "block" : "none"}">
                    ${lastSync ? `<span style="font-size:12px;color:var(--color-text-muted)">
                        <i class="ph ph-clock" style="font-size:12px"></i> Ultimo sync Cognito: ${new Date(lastSync).toLocaleString("it-IT")}
                    </span>` : ""}
                </div>
                <div class="table-wrapper" style="overflow-x:auto">
                    <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px">
                        <thead>
                            <tr>
                                ${headers.map((h) => `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">${h}</th>`).join("")}
                                ${canEdit ? `<th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);"></th>` : ""}
                            </tr>
                        </thead>
                        <tbody id="scouting-tbody">
                            ${this.renderRows(athletes, canEdit, activeView)}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    /**
     * Renders rows exclusively for dynamic search table replacement
     * @param {Array} data The list of athletes
     * @param {boolean} canEdit Determine row actions
     * @param {string} activeView The current view (anagrafica or fisici)
     */
    static renderRows(data, canEdit, activeView = 'anagrafica') {
        const colCount = activeView === 'fisici' ? 9 : 11;
        if (data.length === 0) {
            return `<tr><td colspan="${canEdit ? colCount + 1 : colCount}" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun atleta trovato nel database scouting.</td></tr>`;
        }

        const sourceMap = {
            manual: { bg: "var(--color-bg-alt)", color: "var(--color-text-muted)", label: "Manuale" },
            cognito_fusion: { bg: "rgba(99,102,241,0.12)", color: "#818cf8", label: "Fusion" },
            cognito_network: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Network" },
        };

        const cellMetric = (val, unit = '') => {
            const v = val != null && val !== '' ? parseFloat(val) : null;
            if (v === null) return `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">—</td>`;
            return `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-variant-numeric:tabular-nums">
                <span style="font-weight:600;color:var(--color-primary)">${v}</span>
                <span style="font-size:11px;color:var(--color-text-muted);margin-left:2px">${unit}</span>
            </td>`;
        };

        return data.map((athlete) => {
            const src = sourceMap[athlete.source] || {
                bg: "var(--color-bg-alt)", color: "var(--color-text-muted)", label: athlete.source || "—"
            };

            let cols = '';
            if (activeView === 'fisici') {
                let saltoColor = 'var(--color-danger)';
                const saltoVal = parseFloat(athlete.salto_rincorsa);
                if (!isNaN(saltoVal)) {
                    if (saltoVal > 300) saltoColor = 'var(--color-pink)';
                    else if (saltoVal >= 290) saltoColor = 'var(--color-success)';
                    else if (saltoVal >= 280) saltoColor = 'var(--color-warning)';
                }
                const cellSalto = athlete.salto_rincorsa != null && athlete.salto_rincorsa !== '' 
                    ? `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-variant-numeric:tabular-nums">
                        <span style="font-weight:600;color:${saltoColor}">${saltoVal}</span>
                        <span style="font-size:11px;color:var(--color-text-muted);margin-left:2px">cm</span>
                       </td>`
                    : `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">—</td>`;

                cols = `
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${window.Utils.escapeHtml(athlete.nome || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${window.Utils.escapeHtml(athlete.cognome || "—")}</td>
                    ${cellMetric(athlete.altezza, 'cm')}
                    ${cellMetric(athlete.peso, 'kg')}
                    ${cellMetric(athlete.reach_cm, 'cm')}
                    ${cellMetric(athlete.sit_and_reach, 'cm')}
                    ${cellMetric(athlete.reach_2, 'cm')}
                    ${cellMetric(athlete.cmj, 'cm')}
                    ${cellSalto}
                `;
            } else {
                cols = `
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${window.Utils.escapeHtml(athlete.nome || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${window.Utils.escapeHtml(athlete.cognome || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${window.Utils.escapeHtml(athlete.ruolo || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${window.Utils.escapeHtml(athlete.societa_appartenenza || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${window.Utils.escapeHtml(athlete.email || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${window.Utils.escapeHtml(athlete.cellulare || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${athlete.anno_nascita || "—"}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${window.Utils.escapeHtml(athlete.note || "")}">${window.Utils.escapeHtml(athlete.note || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${window.Utils.escapeHtml(athlete.rilevatore || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:12px">${athlete.data_rilevazione || "—"}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">
                        <span class="status-badge" style="background:${src.bg};color:${src.color}">${window.Utils.escapeHtml(src.label)} ${athlete.is_locked_edit == 1 ? '<i class="ph ph-lock-key" title="Modificato manualmente" style="margin-left:4px"></i>' : ""}</span>
                    </td>
                `;
            }

            return `
                <tr>
                    ${cols}
                    ${canEdit ? `
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right">
                        <button class="btn btn-icon btn-ghost btn-sm edit-athlete-btn" data-id="${window.Utils.escapeHtml(athlete.id)}" title="Modifica">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn btn-icon btn-ghost btn-sm delete-athlete-btn" data-id="${window.Utils.escapeHtml(athlete.id)}" title="Elimina" style="color: var(--color-pink);">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>` : ""}
                </tr>
            `;
        }).join("");
    }

    /**
     * Renders the HTML structure for the side panel form
     * @param {Object|null} athlete 
     * @returns {string} 
     */
    static renderSidePanelForm(athlete = null) {
        const isEdit = athlete !== null;
        return `
            <div style="padding:var(--sp-3) var(--sp-4); border-bottom:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center; background:var(--color-bg);">
                <h3 style="margin:0; font-size:16px; font-weight:600;">${isEdit ? "Modifica Atleta" : "Nuovo Atleta"}</h3>
                <button class="btn btn-icon btn-ghost btn-sm" id="sc-cancel-panel" title="Chiudi">
                    <i class="ph ph-x"></i>
                </button>
            </div>
            <div style="padding:var(--sp-4); flex-grow:1; overflow-y:auto;">
                ${isEdit ? '<div class="banner banner-warning" style="margin-bottom:var(--sp-4);font-size:12px;display:flex;align-items:center;gap:8px"><i class="ph ph-warning-circle" style="font-size:16px"></i> Salvando le modifiche questo record verrà bloccato e non sarà più sovrascritto dalla sync di Cognito.</div>' : ""}
                
                <div class="td-form-section"><i class="ph ph-identification-card"></i> Anagrafica</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-nome">Nome *</label>
                        <input id="sc-nome" class="form-input" type="text" value="${isEdit ? window.Utils.escapeHtml(athlete.nome || "") : ""}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-cognome">Cognome *</label>
                        <input id="sc-cognome" class="form-input" type="text" value="${isEdit ? window.Utils.escapeHtml(athlete.cognome || "") : ""}" required>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-ruolo">Ruolo</label>
                        <input id="sc-ruolo" class="form-input" type="text" value="${isEdit ? window.Utils.escapeHtml(athlete.ruolo || "") : ""}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-societa">Società</label>
                        <input id="sc-societa" class="form-input" type="text" value="${isEdit ? window.Utils.escapeHtml(athlete.societa_appartenenza || "") : ""}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-email">Email</label>
                        <input id="sc-email" class="form-input" type="email" value="${isEdit ? window.Utils.escapeHtml(athlete.email || "") : ""}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-cellulare">Cellulare</label>
                        <input id="sc-cellulare" class="form-input" type="text" value="${isEdit ? window.Utils.escapeHtml(athlete.cellulare || "") : ""}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-anno">Nascita (Anno)</label>
                        <input id="sc-anno" class="form-input" type="number" min="1990" max="2025" value="${isEdit ? athlete.anno_nascita || "" : ""}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-rilevatore">Rilevatore</label>
                        <input id="sc-rilevatore" class="form-input" type="text" placeholder="Nome cognome" value="${isEdit ? window.Utils.escapeHtml(athlete.rilevatore || "") : ""}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="sc-data">Data Rilevazione</label>
                    <input id="sc-data" class="form-input" type="date" value="${isEdit && athlete.data_rilevazione ? athlete.data_rilevazione : new Date().toISOString().substring(0, 10)}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="sc-note">Note</label>
                    <textarea id="sc-note" class="form-input" rows="3">${isEdit ? window.Utils.escapeHtml(athlete.note || "") : ""}</textarea>
                </div>

                <div class="td-form-section"><i class="ph ph-barbell"></i> Dati Fisici</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-altezza">Altezza (cm)</label>
                        <input id="sc-altezza" class="form-input" type="number" step="0.1" min="100" max="250" value="${athlete?.altezza ?? ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-peso">Peso (kg)</label>
                        <input id="sc-peso" class="form-input" type="number" step="0.1" min="30" max="200" value="${athlete?.peso ?? ''}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-reach">Reach (cm)</label>
                        <input id="sc-reach" class="form-input" type="number" step="0.1" min="100" max="400" value="${athlete?.reach_cm ?? ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-sit-reach">Sit e Reach (cm)</label>
                        <input id="sc-sit-reach" class="form-input" type="number" step="0.1" value="${athlete?.sit_and_reach ?? ''}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-reach-2">Reach 2 (cm)</label>
                        <input id="sc-reach-2" class="form-input" type="number" step="0.1" min="100" max="400" value="${athlete?.reach_2 ?? ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-cmj">CMJ (cm)</label>
                        <input id="sc-cmj" class="form-input" type="number" step="0.1" min="0" max="100" value="${athlete?.cmj ?? ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="sc-salto">Salto con Rincorsa (cm)</label>
                    <input id="sc-salto" class="form-input" type="number" step="0.1" min="0" max="400" value="${athlete?.salto_rincorsa ?? ''}">
                </div>

                <div id="sc-error" class="form-error hidden"></div>
            </div>
            <div style="padding:var(--sp-3) var(--sp-4); border-top:1px solid var(--color-border); background:var(--color-bg); display:flex; justify-content:flex-end; gap:var(--sp-2);">
                <button class="btn btn-ghost btn-sm" id="sc-cancel-panel-btn" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="sc-save-panel" type="button" data-id="${isEdit ? window.Utils.escapeHtml(athlete.id) : ""}"><i class="ph ph-floppy-disk"></i> SALVA</button>
            </div>
        `;
    }
}
