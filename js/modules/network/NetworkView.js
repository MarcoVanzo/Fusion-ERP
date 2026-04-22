export class NetworkView {
    static PARTNER_TYPES = ["club", "agenzia", "istituzione", "sponsor", "altro"];
    static COL_STATUSES = ["attivo", "scaduto", "in_rinnovo"];
    static TRIAL_STATUSES = ["in_valutazione", "approvato", "non_idoneo", "da_ricontattare"];

    static TRIAL_STATUS_MAP = {
        in_valutazione: "In Valutazione",
        approvato: "Approvato",
        non_idoneo: "Non Idoneo",
        da_ricontattare: "Da Ricontattare",
    };
    static COL_STATUS_MAP = { attivo: "Attivo", scaduto: "Scaduto", in_rinnovo: "In Rinnovo" };

    static renderStatusBadge(status, context = "trial") {
        const safeStatus = window.CSS?.escape ? window.CSS.escape(status) : status;
        const label = (context === "col" ? this.COL_STATUS_MAP : this.TRIAL_STATUS_MAP)[status] || status;
        return `<span class="status-badge status-badge-${safeStatus}">${window.Utils.escapeHtml(label)}</span>`;
    }

    static renderMainLayout(currentTab) {
        return `
            <div class="transport-dashboard" style="min-height:100vh; padding:24px;">
                <div class="dash-top-bar" style="border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:24px; margin-bottom:24px;">
                    <div style="display:flex;justify-content:space-between;width:100%;align-items:center;flex-wrap:wrap;gap:12px;">
                        <div>
                            <h1 class="dash-title" style="display:flex;align-items:center;gap:10px;">
                                <i class="ph ph-share-network" style="color:var(--accent-pink);"></i>
                                Network
                            </h1>
                            <p style="color:var(--text-muted);font-size:13px;margin-top:4px;">Collaborazioni, atleti in prova e attività di rete</p>
                        </div>
                        <div class="dash-filters" style="margin-top: 0;">
                            <button class="dash-filter net-main-tab ${currentTab === 'collaborazioni' ? 'active' : ''}" data-net-main-tab="collaborazioni" type="button">Collaborazioni</button>
                            <button class="dash-filter net-main-tab ${currentTab === 'prove' ? 'active' : ''}" data-net-main-tab="prove" type="button">Prove</button>
                            <button class="dash-filter net-main-tab ${currentTab === 'attivita' ? 'active' : ''}" data-net-main-tab="attivita" type="button">Attività</button>
                        </div>
                    </div>
                </div>
                <main id="net-tab-content"></main>
            </div>`;
    }

    // --- COLLABORATIONS TAB ---
    static renderCollaborations(collaborations, hubConfig, colFilterStatus, canEdit) {
        const filteredCols = colFilterStatus
            ? collaborations.filter(c => c.status === colFilterStatus)
            : collaborations;

        const hubBanner = `
            <div style="background:var(--color-bg-alt);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--sp-4);margin-bottom:var(--sp-3);">
                <div style="display:flex;align-items:flex-start;gap:var(--sp-4)">
                    ${hubConfig.logo_path
                ? `<img src="${window.Utils.escapeHtml(hubConfig.logo_path)}" style="height:100px;width:100px;object-fit:contain;border-radius:var(--radius-sm);background:#fff;padding:8px;flex-shrink:0;box-shadow:0 2px 4px rgba(0,0,0,0.05);">`
                : `<div style="height:100px;width:100px;border-radius:var(--radius-sm);background:var(--color-border);display:flex;align-items:center;justify-content:center;color:var(--color-text-muted)"><i class="ph ph-image" style="font-size:32px;"></i></div>`}
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
                            <h3 style="margin:0;font-size:20px;font-weight:600;">Savino Del Bene volley HUB</h3>
                            ${canEdit ? `<button class="btn-dash" id="net-edit-hub" type="button"><i class="ph ph-pencil-simple"></i> Modifica</button>` : ""}
                        </div>
                        <div style="margin:0;font-size:14px;color:var(--color-text-muted);line-height:1.6;">${hubConfig.text ? window.Utils.escapeHtml(hubConfig.text).replace(/\\n/g, "<br>") : "Nessun testo inserito."}</div>
                    </div>
                </div>
            </div>`;

        return `
            <div>
                ${hubBanner}
                <div class="net-filter-bar" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                    <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">
                        <button class="dash-filter ${!colFilterStatus ? "active" : ""}" data-col-status="" type="button">Tutte</button>
                        ${this.COL_STATUSES.map(s => `
                            <button class="dash-filter ${colFilterStatus === s ? "active" : ""}" data-col-status="${window.Utils.escapeHtml(s)}" type="button">
                                ${window.Utils.escapeHtml(this.COL_STATUS_MAP[s] || s)}
                            </button>`).join("")}
                    </div>
                    ${canEdit ? '<button class="btn-dash pink" id="net-add-col" type="button"><i class="ph ph-plus"></i> NUOVA COLLABORAZIONE</button>' : ""}
                </div>
                <div class="net-card-grid">
                    ${filteredCols.length === 0
                ? window.Utils.emptyState("Nessuna collaborazione", "Aggiungi la prima collaborazione con il pulsante in alto.")
                : filteredCols.map(c => this._getColCardStr(c, canEdit)).join("")}
                </div>
            </div>`;
    }

    static _getColCardStr(c, canEdit) {
        return `
            <div class="dash-card collab-card" data-open-col="${window.Utils.escapeHtml(c.id)}" style="cursor:pointer">
                <div class="net-card-header">
                    <div style="display:flex; align-items:center; gap:12px;">
                        ${c.logo_path
                ? `<img src="${window.Utils.escapeHtml(c.logo_path)}" style="height:40px; width:40px; object-fit:contain; border-radius:var(--radius-sm); background:#fff; padding:2px; flex-shrink:0;">`
                : ""}
                        <div class="net-card-title" style="margin:0;">${window.Utils.escapeHtml(c.partner_name)}</div>
                    </div>
                    ${this.renderStatusBadge(c.status, "col")}
                </div>
                <div class="net-card-meta">
                    <i class="ph ph-tag" style="margin-right:4px"></i>${window.Utils.escapeHtml(c.partner_type || "—")}
                    ${c.agreement_type ? ` · <em>${window.Utils.escapeHtml(c.agreement_type)}</em>` : ""}
                </div>
                ${c.referent_name ? `<div class="net-card-meta"><i class="ph ph-user" style="margin-right:4px"></i>${window.Utils.escapeHtml(c.referent_name)}</div>` : ""}
                ${c.start_date || c.end_date ? `
                    <div class="net-card-meta">
                        <i class="ph ph-calendar" style="margin-right:4px"></i>
                        ${c.start_date || ""} → ${c.end_date || "∞"}
                    </div>` : ""}
                ${canEdit ? `
                    <div style="display:flex;gap:4px;margin-top:var(--sp-1)">
                        <button class="btn-dash btn-edit-col" data-id="${window.Utils.escapeHtml(c.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn-dash btn-del-col" data-id="${window.Utils.escapeHtml(c.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                    </div>` : ""}
            </div>`;
    }

    // --- TRIALS TAB ---
    static renderTrials(trials, trialFilterStatus, canEdit) {
        const filteredTrials = trialFilterStatus
            ? trials.filter(t => t.status === trialFilterStatus)
            : trials;

        return `
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                    <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">
                        <button class="dash-filter ${!trialFilterStatus ? "active" : ""}" data-tr-status="" type="button">Tutti</button>
                        ${this.TRIAL_STATUSES.map(s => `
                            <button class="dash-filter ${trialFilterStatus === s ? "active" : ""}" data-tr-status="${window.Utils.escapeHtml(s)}" type="button">
                                ${window.Utils.escapeHtml(this.TRIAL_STATUS_MAP[s] || s)}
                            </button>`).join("")}
                    </div>
                    ${canEdit ? '<button class="btn-dash pink" id="net-add-trial" type="button"><i class="ph ph-plus"></i> NUOVO ATLETA</button>' : ""}
                </div>
                <div class="table-wrapper" style="overflow-x:auto">
                    <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px">
                        <thead>
                            <tr>
                                ${["Nome", "Provenienza", "Posizione", "Prova", "Stato", "Score", ""].map(h => `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">${h}</th>`).join("")}
                            </tr>
                        </thead>
                        <tbody id="trial-tbody">
                            ${filteredTrials.length === 0
                ? '<tr><td colspan="7" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun atleta in prova</td></tr>'
                : filteredTrials.map(t => this._getTrialTableRowStr(t, canEdit)).join("")}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    static _getTrialTableRowStr(t, canEdit) {
        const score = t.avg_score ? parseFloat(t.avg_score).toFixed(1) : null;
        return `
            <tr>
                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${window.Utils.escapeHtml(t.full_name || (t.athlete_first_name + " " + t.athlete_last_name))}</td>
                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${window.Utils.escapeHtml(t.origin_club || "—")}</td>
                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${window.Utils.escapeHtml(t.position || "—")}</td>
                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:12px">${t.trial_start || "—"} → ${t.trial_end || "∞"}</td>
                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${this.renderStatusBadge(t.status)}</td>
                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">
                    ${score ? `<div class="score-circle" style="--pct:${(score / 10 * 100).toFixed(1)}" title="Media valutazioni">${score}</div>` : '<span style="color:var(--color-text-muted);font-size:12px">—</span>'}
                </td>
                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap;text-align:right">
                    ${canEdit ? `
                        <button class="btn-dash btn-eval-trial" data-id="${window.Utils.escapeHtml(t.id)}" type="button" title="Valuta"><i class="ph ph-star"></i></button>
                        <button class="btn-dash btn-edit-trial" data-id="${window.Utils.escapeHtml(t.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                        ${t.scouting_profile_id
                    ? `<span title="Profilo scouting: ${window.Utils.escapeHtml(t.scouting_profile_id)}" style="font-size:12px;color:var(--color-success);display:inline-block;margin:0 8px;"><i class="ph ph-check-circle"></i></span>`
                    : `<button class="btn btn-ghost btn-sm btn-convert-trial" data-id="${window.Utils.escapeHtml(t.id)}" type="button" title="Converti in Scouting"><i class="ph ph-arrow-right"></i></button>`}
                        <button class="btn-dash btn-del-trial" data-id="${window.Utils.escapeHtml(t.id)}" type="button" style="color:var(--color-pink)" title="Elimina"><i class="ph ph-trash"></i></button>` : ""}
                </td>
            </tr>`;
    }

    // --- ACTIVITIES TAB ---
    static renderActivities(activities, canEdit) {
        return `
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
                    <div class="input-wrapper" style="position:relative;min-width:220px">
                        <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                        <input type="text" id="net-act-search" class="form-input" placeholder="Cerca attività..." style="padding-left:36px;height:40px;font-size:13px">
                    </div>
                    ${canEdit ? '<button class="btn-dash pink" id="net-add-act" type="button"><i class="ph ph-plus"></i> NUOVA ATTIVITÀ</button>' : ""}
                </div>
                <div class="net-timeline" id="net-timeline">
                    ${activities.length === 0
                ? window.Utils.emptyState("Nessuna attività", "Registra la prima attività di network.")
                : activities.map(a => this._getActivityStr(a, canEdit)).join("")}
                </div>
            </div>`;
    }

    static _getActivityStr(a, canEdit) {
        return `
            <div class="net-timeline-item" data-act-title="${window.Utils.escapeHtml((a.title || "").toLowerCase())}">
                <div class="net-timeline-dot"></div>
                <div style="min-width:90px;padding-top:2px">
                    <span class="net-timeline-date">${a.date || ""}</span>
                </div>
                <div class="net-timeline-content">
                    <div class="net-timeline-title">${window.Utils.escapeHtml(a.title)}</div>
                    <div class="net-timeline-meta">
                        ${a.activity_type ? window.Utils.escapeHtml(a.activity_type) + (a.location ? " · " : "") : ""}
                        ${a.location ? window.Utils.escapeHtml(a.location) : ""}
                    </div>
                    ${a.outcome ? `<div style="font-size:12px;margin-top:4px;color:var(--color-text-muted)">${window.Utils.escapeHtml(a.outcome)}</div>` : ""}
                </div>
                ${canEdit ? `
                    <div style="display:flex;gap:4px;align-self:flex-start;padding-top:2px">
                        <button class="btn-dash btn-edit-act" data-id="${window.Utils.escapeHtml(a.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn-dash btn-del-act" data-id="${window.Utils.escapeHtml(a.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                    </div>` : ""}
            </div>`;
    }

    // --- MODALS ---
    static getHubEditModalBody(hubConfig) {
        return `
            <div class="form-group">
                <label class="form-label" for="hub-text">Testo HUB</label>
                <textarea id="hub-text" class="form-input" rows="5">${window.Utils.escapeHtml(hubConfig.text || "")}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Nuovo Logo</label>
                <input type="file" id="hub-logo-input" class="form-input" accept="image/*">
            </div>
            <div id="hub-error" class="form-error hidden"></div>`;
    }
    static getHubEditModalFooter() {
        return `
            <button class="btn-dash" id="hub-cancel" type="button">Annulla</button>
            <button class="btn-dash pink" id="hub-save" type="button">SALVA</button>`;
    }

    static getCollaborationModalBody(col) {
        const typeOpts = this.PARTNER_TYPES.map(t => `<option value="${t}" ${col?.partner_type === t ? "selected" : ""}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("");
        const statusOpts = this.COL_STATUSES.map(s => `<option value="${s}" ${col?.status === s ? "selected" : ""}>${this.COL_STATUS_MAP[s] || s}</option>`).join("");

        return `
            <div class="form-group">
                <label class="form-label" for="cl-name">Partner *</label>
                <input id="cl-name" class="form-input" type="text" value="${window.Utils.escapeHtml(col?.partner_name || "")}" placeholder="Nome club/agenzia...">
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="cl-type">Tipo</label>
                    <select id="cl-type" class="form-select">${typeOpts}</select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="cl-status">Stato</label>
                    <select id="cl-status" class="form-select">${statusOpts}</select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="cl-agreement">Tipo accordo</label>
                <input id="cl-agreement" class="form-input" type="text" value="${window.Utils.escapeHtml(col?.agreement_type || "")}" placeholder="es. Prestito, Affiliazione…">
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="cl-start">Data Inizio</label>
                    <input id="cl-start" class="form-input" type="date" value="${col?.start_date?.substring(0, 10) || ""}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="cl-end">Data Fine</label>
                    <input id="cl-end" class="form-input" type="date" value="${col?.end_date?.substring(0, 10) || ""}">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="cl-ref-name">Referente</label>
                    <input id="cl-ref-name" class="form-input" type="text" value="${window.Utils.escapeHtml(col?.referent_name || "")}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="cl-ref-contact">Contatto</label>
                    <input id="cl-ref-contact" class="form-input" type="text" value="${window.Utils.escapeHtml(col?.referent_contact || "")}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Media & Documenti</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2)">
                    <div>
                        <label class="form-label" style="font-size:11px;color:var(--color-text-muted)">Logo Aziendale</label>
                        <input id="cl-logo-file" class="form-input" type="file" accept="image/*">
                    </div>
                    <div>
                        <label class="form-label" style="font-size:11px;color:var(--color-text-muted)">Allegato Contratto (PDF)</label>
                        <input id="cl-contract-file" class="form-input" type="file" accept=".pdf">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Social & Web</label>
                <div class="form-grid">
                    <div class="input-wrapper" style="position:relative">
                        <i class="ph ph-globe" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--color-text-muted)"></i>
                        <input id="cl-website" class="form-input" style="padding-left:32px" type="text" value="${window.Utils.escapeHtml(col?.website || "")}" placeholder="Sito Web">
                    </div>
                    <div class="input-wrapper" style="position:relative">
                        <i class="ph ph-instagram-logo" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--color-pink)"></i>
                        <input id="cl-instagram" class="form-input" style="padding-left:32px" type="text" value="${window.Utils.escapeHtml(col?.instagram || "")}" placeholder="Instagram URL o @handle">
                    </div>
                    <div class="input-wrapper" style="position:relative">
                        <i class="ph ph-facebook-logo" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#1877F2"></i>
                        <input id="cl-facebook" class="form-input" style="padding-left:32px" type="text" value="${window.Utils.escapeHtml(col?.facebook || "")}" placeholder="Facebook URL">
                    </div>
                    <div class="input-wrapper" style="position:relative">
                        <i class="ph ph-youtube-logo" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#FF0000"></i>
                        <input id="cl-youtube" class="form-input" style="padding-left:32px" type="text" value="${window.Utils.escapeHtml(col?.youtube || "")}" placeholder="YouTube URL">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="cl-description">Descrizione Attività</label>
                <textarea id="cl-description" class="form-input" rows="4" placeholder="Descrivi il partner e le attività svolte...">${window.Utils.escapeHtml(col?.description || "")}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label" for="cl-notes">Note Interne</label>
                <textarea id="cl-notes" class="form-input" rows="2">${window.Utils.escapeHtml(col?.notes || "")}</textarea>
            </div>
            <div id="cl-error" class="form-error hidden"></div>`;
    }
    static getCollaborationModalFooter(isEdit) {
        return `
            <button class="btn-dash" id="cl-cancel" type="button">Annulla</button>
            <button class="btn-dash pink" id="cl-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`;
    }

    static getTrialModalBody(trial) {
        const statusOpts = this.TRIAL_STATUSES.map(s => `<option value="${s}" ${trial?.status === s ? "selected" : ""}>${this.TRIAL_STATUS_MAP[s] || s}</option>`).join("");

        return `
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="tr-first">Nome *</label>
                    <input id="tr-first" class="form-input" type="text" value="${window.Utils.escapeHtml(trial?.athlete_first_name || "")}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="tr-last">Cognome *</label>
                    <input id="tr-last" class="form-input" type="text" value="${window.Utils.escapeHtml(trial?.athlete_last_name || "")}">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="tr-dob">Data di nascita</label>
                    <input id="tr-dob" class="form-input" type="date" value="${trial?.birth_date?.substring(0, 10) || ""}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="tr-nat">Nazionalità</label>
                    <input id="tr-nat" class="form-input" type="text" value="${window.Utils.escapeHtml(trial?.nationality || "")}">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="tr-pos">Posizione</label>
                    <input id="tr-pos" class="form-input" type="text" value="${window.Utils.escapeHtml(trial?.position || "")}" placeholder="es. Alzatore">
                </div>
                <div class="form-group">
                    <label class="form-label" for="tr-club">Club di provenienza</label>
                    <input id="tr-club" class="form-input" type="text" value="${window.Utils.escapeHtml(trial?.origin_club || "")}">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="tr-start">Inizio prova</label>
                    <input id="tr-start" class="form-input" type="date" value="${trial?.trial_start?.substring(0, 10) || ""}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="tr-end">Fine prova</label>
                    <input id="tr-end" class="form-input" type="date" value="${trial?.trial_end?.substring(0, 10) || ""}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="tr-status">Stato</label>
                <select id="tr-status" class="form-select">${statusOpts}</select>
            </div>
            <div class="form-group">
                <label class="form-label" for="tr-notes">Note</label>
                <textarea id="tr-notes" class="form-input" rows="2">${window.Utils.escapeHtml(trial?.notes || "")}</textarea>
            </div>
            <div id="tr-error" class="form-error hidden"></div>`;
    }
    static getTrialModalFooter(isEdit) {
        return `
            <button class="btn-dash" id="tr-cancel" type="button">Annulla</button>
            <button class="btn-dash pink" id="tr-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`;
    }

    static getEvaluationModalBody(dimensions) {
        return `
            <div class="form-group">
                <label class="form-label" for="ev-date">Data Valutazione *</label>
                <input id="ev-date" class="form-input" type="date" value="${new Date().toISOString().substring(0, 10)}">
            </div>
            <div style="margin:var(--sp-3) 0">
                ${dimensions.map(d => `
                    <div class="eval-slider-row">
                        <span class="eval-slider-label">${window.Utils.escapeHtml(d.label)}</span>
                        <input type="range" class="eval-slider" id="ev-${d.key}" min="1" max="10" value="5">
                        <span class="eval-slider-value" id="ev-${d.key}-val">5</span>
                    </div>`).join("")}
                <div style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2);border-top:1px solid var(--color-border);padding-top:var(--sp-2)">
                    <span style="font-size:13px;color:var(--color-text-muted)">Media:</span>
                    <strong id="ev-avg-display" style="font-size:16px;color:var(--color-pink)">5.0</strong>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="ev-video">URL Video</label>
                <input id="ev-video" class="form-input" type="url" placeholder="https://...">
            </div>
            <div class="form-group">
                <label class="form-label" for="ev-notes">Note</label>
                <textarea id="ev-notes" class="form-input" rows="2"></textarea>
            </div>
            <div id="ev-error" class="form-error hidden"></div>`;
    }
    static getEvaluationModalFooter() {
        return `
            <button class="btn-dash" id="ev-cancel" type="button">Annulla</button>
            <button class="btn-dash pink" id="ev-save" type="button"><i class="ph ph-star"></i> SALVA</button>`;
    }

    static getActivityModalBody(act) {
        return `
            <div class="form-group">
                <label class="form-label" for="ac-title">Titolo *</label>
                <input id="ac-title" class="form-input" type="text" value="${window.Utils.escapeHtml(act?.title || "")}" placeholder="es. Incontro con club...">
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="ac-date">Data *</label>
                    <input id="ac-date" class="form-input" type="date" value="${act?.date?.substring(0, 10) || ""}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="ac-type">Tipo</label>
                    <input id="ac-type" class="form-input" type="text" value="${window.Utils.escapeHtml(act?.activity_type || "")}" placeholder="es. Riunione...">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="ac-loc">Luogo</label>
                <input id="ac-loc" class="form-input" type="text" value="${window.Utils.escapeHtml(act?.location || "")}">
            </div>
            <div class="form-group">
                <label class="form-label" for="ac-outcome">Esito</label>
                <input id="ac-outcome" class="form-input" type="text" value="${window.Utils.escapeHtml(act?.outcome || "")}" placeholder="es. Accordo raggiunto">
            </div>
            <div class="form-group">
                <label class="form-label" for="ac-notes">Note</label>
                <textarea id="ac-notes" class="form-input" rows="2">${window.Utils.escapeHtml(act?.notes || "")}</textarea>
            </div>
            <div id="ac-error" class="form-error hidden"></div>`;
    }
    static getActivityModalFooter(isEdit) {
        return `
            <button class="btn-dash" id="ac-cancel" type="button">Annulla</button>
            <button class="btn-dash pink" id="ac-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`;
    }

    static getColDetailModalBody(col) {
        return `
            <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
                <div style="display:flex;gap:var(--sp-2);align-items:center;justify-content:space-between">
                    <div style="display:flex;gap:var(--sp-2);align-items:center">
                        ${this.renderStatusBadge(col.status, "col")}
                        <span style="font-size:13px;color:var(--color-text-muted)">${window.Utils.escapeHtml(col.partner_type || "")}</span>
                    </div>
                    ${col.logo_path ? `<img src="${window.Utils.escapeHtml(col.logo_path)}" style="height:40px;object-fit:contain;border-radius:var(--radius-sm)">` : ""}
                </div>
                ${col.agreement_type ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Accordo</span><div style="font-weight:600">${window.Utils.escapeHtml(col.agreement_type)}</div></div>` : ""}
                ${col.start_date || col.end_date ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Periodo</span><div>${window.Utils.escapeHtml(col.start_date) || "?"} → ${window.Utils.escapeHtml(col.end_date) || "∞"}</div></div>` : ""}
                ${col.referent_name ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Referente</span><div>${window.Utils.escapeHtml(col.referent_name)} ${col.referent_contact ? "· " + window.Utils.escapeHtml(col.referent_contact) : ""}</div></div>` : ""}
                ${col.description ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Descrizione</span><div style="font-size:13px">${window.Utils.escapeHtml(col.description).replace(/\n/g, "<br>")}</div></div>` : ""}
                ${col.notes ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Note interne</span><div style="font-size:13px">${window.Utils.escapeHtml(col.notes)}</div></div>` : ""}
                ${col.website || col.instagram || col.facebook || col.youtube ? `<div style="display:flex;gap:12px;align-items:center;padding-top:var(--sp-2);border-top:1px solid var(--color-border)">
                    ${col.website ? `<a href="${window.Utils.escapeHtml(col.website.startsWith("http") ? col.website : "https://" + col.website)}" target="_blank" style="color:var(--color-text-muted);font-size:22px"><i class="ph ph-globe"></i></a>` : ""}
                    ${col.instagram ? `<a href="${window.Utils.escapeHtml(col.instagram.startsWith("http") ? col.instagram : "https://instagram.com/" + col.instagram.replace("@", ""))}" target="_blank" style="color:var(--color-pink);font-size:22px"><i class="ph ph-instagram-logo"></i></a>` : ""}
                    ${col.facebook ? `<a href="${window.Utils.escapeHtml(col.facebook.startsWith("http") ? col.facebook : "https://" + col.facebook)}" target="_blank" style="color:#1877F2;font-size:22px"><i class="ph ph-facebook-logo"></i></a>` : ""}
                    ${col.youtube ? `<a href="${window.Utils.escapeHtml(col.youtube.startsWith("http") ? col.youtube : "https://youtube.com/" + col.youtube)}" target="_blank" style="color:#FF0000;font-size:22px"><i class="ph ph-youtube-logo"></i></a>` : ""}
                </div>` : ""}
                <div id="col-docs-area" style="margin-top:var(--sp-3)">
                    <span style="font-size:12px;color:var(--color-text-muted);display:block;margin-bottom:var(--sp-1)">Documenti Allegati</span>
                    <div id="col-docs-list" style="font-size:13px;display:flex;flex-direction:column;gap:4px">Caricamento...</div>
                </div>
            </div>`;
    }
}
