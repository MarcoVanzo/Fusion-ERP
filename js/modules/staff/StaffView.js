/**
 * Staff View Module
 * Fusion ERP v1.1
 */

const STAFF_COLORS = ["#f472b6", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#0ea5e9"];

const StaffView = {
    getColor: function(name) {
        if (!name) return STAFF_COLORS[0];
        let t = 0;
        for (let a = 0; a < name.length; a++) t = name.charCodeAt(a) + ((t << 5) - t);
        return STAFF_COLORS[Math.abs(t) % STAFF_COLORS.length];
    },

    formatTeamName: function(category, name) {
        let a = (category || "").toUpperCase();
        return a.match(/^U\\d+$/) ? a.replace("U", "Under ") : a ? category + " — " + name : name || "";
    },

    fieldValue: function(label, value, valueColor = "var(--color-white)") {
        return `
            <div style="display:flex;flex-direction:column;gap:2px;">
                <span style="font-size:11px;color:var(--color-silver);text-transform:uppercase;font-weight:600;letter-spacing:0.04em;">${Utils.escapeHtml(label)}</span>
                <span style="font-size:14px;font-weight:500;color:${valueColor};">${value ? Utils.escapeHtml(String(value)) : '<span style="color:var(--color-text-muted);">—</span>'}</span>
            </div>
        `;
    },

    dashboard: function(staff, roles, isAdmin) {
        return `
            <div class="transport-dashboard">
                <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">
                    <div>
                        <h1 class="dash-title">Gestione <span style="color:var(--accent-pink);">Staff</span></h1>
                        <p class="dash-subtitle">${staff.length} membro${staff.length !== 1 ? "i" : ""} nel sistema</p>
                    </div>
                    <div style="display:flex;gap:12px; flex-wrap:wrap; align-items:center;">
                        <div class="input-wrapper" style="position:relative;min-width:220px;">
                            <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.4);font-size:16px;"></i>
                            <input type="text" id="staff-search" class="form-input" placeholder="Cerca membro staff..." style="padding-left:36px;height:42px;font-size:13px;background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);color:#fff;">
                        </div>
                        ${isAdmin ? '<button class="btn-dash pink" id="new-staff-btn" type="button"><i class="ph ph-plus-circle" style="font-size:18px;"></i> NUOVO MEMBRO</button>' : ""}
                    </div>
                </div>
                <div class="dash-filters" id="staff-role-filter" style="margin-bottom:24px;">
                    <button class="dash-filter active" data-role="" type="button">Tutti</button>
                    ${roles.map(r => `<button class="dash-filter" data-role="${Utils.escapeHtml(r.toLowerCase())}" type="button">${Utils.escapeHtml(r)}</button>`).join("")}
                </div>
                <div class="dash-stat-grid" id="staff-grid">
                    ${staff.length === 0 ? Utils.emptyState("Nessun membro staff", "Aggiungi il primo membro con il pulsante in alto.") : ""}
                </div>
            </div>
        `;
    },

    staffCard: function(member, teamsList) {
        const color = StaffView.getColor(member.full_name);
        const initials = Utils.initials(member.full_name);
        const now = new Date();
        const medExpired = member.medical_cert_expires_at && new Date(member.medical_cert_expires_at) < now;
        
        let teamNamesStr = member.team_names || "";
        if (!teamNamesStr && member.team_season_ids && member.team_season_ids.length > 0) {
            teamNamesStr = member.team_season_ids.map(id => {
                const tr = teamsList.find(t => String(t.id) === String(id));
                return tr ? StaffView.formatTeamName(tr.category, tr.name) : "";
            }).filter(Boolean).join(", ");
        }

        return `
            <div class="dash-stat-card" style="cursor:pointer;position:relative;overflow:hidden;padding:16px;" data-staff-id="${Utils.escapeHtml(member.id)}" data-name="${Utils.escapeHtml((member.full_name || "").toLowerCase())}" data-role="${Utils.escapeHtml((member.role || "").toLowerCase())}">
                ${medExpired ? '<div style="position:absolute;top:var(--sp-2);right:var(--sp-2);width:8px;height:8px;border-radius:50%;background:var(--color-pink);box-shadow:0 0 6px var(--color-pink);"></div>' : ""}
                <div style="display:flex;align-items:flex-start;gap:var(--sp-2);">
                    <div style="width:48px;height:48px;background:${color};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:#000;border-radius:8px;position:relative;overflow:hidden;">
                        ${member.photo_path ? `<img src="${member.photo_path}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;">` : ""}
                        ${Utils.escapeHtml(initials)}
                    </div>
                    <div style="overflow:hidden;flex:1;">
                        <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;">${Utils.escapeHtml(member.full_name)}</div>
                        <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(member.role || "—")}</div>
                        <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(teamNamesStr)}</div>
                        ${member.phone ? `<div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;"><i class="ph ph-phone" style="font-size:11px;"></i> ${Utils.escapeHtml(member.phone)}</div>` : ""}
                    </div>
                </div>
            </div>
        `;
    },

    documentsTable: function(staff) {
        const today = new Date();
        const future60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
        let valid = 0, expiring = 0, expired = 0, missing = 0;

        const rows = staff.map(p => {
            let certHtml
            let certDate = p.medical_cert_expires_at ? new Date(p.medical_cert_expires_at) : null;
            let isExpired = certDate && certDate < today;
            let isExpiring = certDate && !isExpired && certDate < future60;

            if (isExpired) { expired++; certHtml = '<span class="badge badge-danger">Scaduto</span>'; }
            else if (isExpiring) { expiring++; certHtml = '<span class="badge badge-warning">In scadenza</span>'; }
            else if (certDate) { valid++; certHtml = '<span class="badge badge-success">Valido</span>'; }
            else { missing++; certHtml = '<span class="badge">Mancante</span>'; }

            let cStatus = p.contract_status === "firmato" ? '<span class="badge badge-success">Firmato</span>' 
                        : (p.contract_status === "inviato" ? '<span class="badge badge-warning">Inviato</span>' : '<span class="badge">Nessuno</span>');

            return `
                <tr style="cursor:pointer;" data-staff-id="${Utils.escapeHtml(p.id)}">
                    <td><strong>${Utils.escapeHtml(p.full_name)}</strong></td>
                    <td>${Utils.escapeHtml(p.role || "—")}</td>
                    <td style="color:${isExpired ? "var(--color-pink)" : isExpiring ? "var(--color-warning)" : "var(--color-text)"}">${certDate ? Utils.formatDate(p.medical_cert_expires_at) : '<span style="color:var(--color-text-muted)">—</span>'}</td>
                    <td>${certHtml}</td>
                    <td>${Utils.escapeHtml(p.identity_document || "—")}</td>
                    <td>${Utils.escapeHtml(p.fiscal_code || "—")}</td>
                    <td>${cStatus}</td>
                </tr>
            `;
        }).join("");

        return `
            <div class="transport-dashboard">
                <div class="dash-top-bar" style="border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:24px;margin-bottom:24px;">
                    <div><h1 class="dash-title">Documenti <span style="color:var(--accent-pink);">Staff</span></h1><p class="dash-subtitle">Stato dei documenti e contratti dello staff</p></div>
                </div>
                <p class="section-label">Stato Certificati Medici</p>
                <div class="dash-stat-grid" style="margin-bottom:var(--sp-4);">
                    <div class="dash-stat-card"><span class="stat-label">Validi</span><span class="stat-value" style="color:var(--color-success)">${valid}</span></div>
                    <div class="dash-stat-card"><span class="stat-label">In scadenza (60gg)</span><span class="stat-value" style="color:var(--color-warning)">${expiring}</span></div>
                    <div class="dash-stat-card"><span class="stat-label">Scaduti o Mancanti</span><span class="stat-value" style="color:var(--color-pink)">${expired + missing}</span></div>
                </div>
                <div class="table-wrapper" style="background:var(--color-black);border:1px solid rgba(255,255,255,0.05);border-radius:12px;overflow:hidden;">
                    <table class="table">
                        <thead style="background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.05);">
                            <tr>
                                <th style="color:var(--color-silver);font-weight:600;font-size:12px;">Membro</th>
                                <th style="color:var(--color-silver);font-weight:600;font-size:12px;">Ruolo</th>
                                <th style="color:var(--color-silver);font-weight:600;font-size:12px;">Scadenza Cert. Medico</th>
                                <th style="color:var(--color-silver);font-weight:600;font-size:12px;">Stato Cert.</th>
                                <th style="color:var(--color-silver);font-weight:600;font-size:12px;">Doc. Identità</th>
                                <th style="color:var(--color-silver);font-weight:600;font-size:12px;">Cod. Fiscale</th>
                                <th style="color:var(--color-silver);font-weight:600;font-size:12px;">Contratto</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:var(--sp-4);">Nessun membro</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    },

    staffDetail: function(p, teamsList, isAdmin) {
        const initials = Utils.initials(p.full_name);
        const color = StaffView.getColor(p.full_name);
        const now = new Date();
        const medExpired = p.medical_cert_expires_at && new Date(p.medical_cert_expires_at) < now;
        
        // Build team string
        let teamNamesStr = p.team_names || "";
        if (!teamNamesStr && p.team_season_ids && p.team_season_ids.length > 0) {
            teamNamesStr = p.team_season_ids.map(id => {
                const tr = teamsList.find(t => String(t.id) === String(id));
                return tr ? StaffView.formatTeamName(tr.category, tr.name) : "";
            }).filter(Boolean).join(", ");
        }

        const buildUploadRow = (id, iconClass, docTitle, filePath, missingText, inputId, iconColor) => `
            <div class="dash-card" style="padding:var(--sp-3);">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <i class="${iconClass}" style="font-size:24px;color:${iconColor};flex-shrink:0;"></i>
                        <div>
                            <div style="font-size:13px;font-weight:600;">${docTitle}</div>
                            <div style="font-size:11px;color:var(--color-text-muted);">
                                ${filePath ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(filePath.split("/").pop()) : missingText}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;gap:var(--sp-2);align-items:center;">
                        ${filePath ? `<a href="api/router.php?module=staff&action=downloadDoc&field=${inputId.replace('upload-','').replace('-btn','')}_file_path&id=${p.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ""}
                        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="${inputId}" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button><input type="file" id="${inputId}-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ""}
                    </div>
                </div>
            </div>
        `;

        return `
            <div class="transport-dashboard" style="min-height:100vh;">
                <!-- BREADCRUMB NAV -->
                <div style="display:flex;align-items:center;gap:var(--sp-2);padding:0 var(--sp-4);">
                    <button class="btn btn-ghost btn-sm" id="staff-back" style="color:var(--color-text-muted);border:none;padding:0;display:flex;align-items:center;gap:6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;" type="button">
                        <i class="ph ph-arrow-left" style="font-size:16px;"></i> Staff 
                    </button>
                    <div style="flex:1;"></div>
                    ${isAdmin ? '<button class="btn btn-primary btn-sm" id="staff-edit-btn" type="button" style="margin-right:8px;"><i class="ph ph-pencil-simple"></i> MODIFICA</button>' : ""}
                    ${isAdmin ? '<button class="btn btn-default btn-sm" id="staff-delete-btn" type="button" style="color:var(--color-pink);border-color:rgba(255,0,122,0.3);"><i class="ph ph-trash"></i></button>' : ""}
                </div>

                <!-- HEADER STAFF -->
                <div style="display:flex; align-items:center; gap:var(--sp-4); padding:0 var(--sp-4); margin-top:var(--sp-2);">
                    <div style="display:flex; flex-direction:column;">
                        <h2 style="font-size:2.5rem; font-weight:800; margin:0; line-height:1.1; font-family:var(--font-display); text-transform:uppercase; letter-spacing:-0.5px;">
                            ${Utils.escapeHtml(p.first_name || "")} <span style="font-weight:300; color:var(--color-text-muted);">${Utils.escapeHtml(p.last_name || "")}</span>
                        </h2>
                        <div style="font-size:15px; color:var(--color-white); margin-top:8px; display:flex; gap:12px; align-items:center;">
                            ${p.role ? `<span style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-weight:600; font-size:13px; letter-spacing:0.5px; text-transform:uppercase;">${Utils.escapeHtml(p.role)}</span>` : ""}
                            ${teamNamesStr ? `<span style="color:var(--color-text-muted); font-weight:500;">${Utils.escapeHtml(teamNamesStr)}</span>` : ""}
                        </div>
                    </div>
                </div>

                <!-- TAB BAR -->
                <div style="position:relative;margin:0 calc(var(--sp-4) * -1);padding:0 var(--sp-4);border-bottom:1px solid var(--color-border);margin-bottom:var(--sp-4);">
                    <div id="staff-tab-bar" class="fusion-tabs-container">
                        <button class="fusion-tab active" data-stab="anagrafica" type="button"><i class="ph ph-identification-card"></i> Anagrafica </button>
                        <button class="fusion-tab" data-stab="documenti" type="button"><i class="ph ph-file-text"></i> Documenti </button>
                    </div>
                </div>

                <!-- TAB: ANAGRAFICA -->
                <div id="stab-panel-anagrafica" class="athlete-tab-panel" style="display:flex;flex-direction:column;gap:var(--sp-4);padding:0 var(--sp-4);">
                    <div style="display:flex;flex-direction:row;align-items:flex-start;gap:var(--sp-4);">
                        <!-- FOTO PERSONALE -->
                        <div style="width:280px;flex-shrink:0;">
                            <p class="section-label" style="text-align:center;">Foto Personale</p>
                            <div class="dash-card" style="padding:var(--sp-3);">
                                <div style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-3);">
                                    <div id="staff-photo-preview" style="width:240px;height:240px;border-radius:16px;overflow:hidden;flex-shrink:0;border:2px solid var(--color-border);background:${color};display:flex;align-items:center;justify-content:center;">
                                        ${p.photo_path ? `<img src="${Utils.escapeHtml(p.photo_path)}" alt="Foto staff" style="width:100%;height:100%;object-fit:cover;object-position:center">` : `<span style="font-family:var(--font-display);font-size:4.5rem;font-weight:700;color:#000;">${Utils.escapeHtml(initials)}</span>`}
                                    </div>
                                    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;">
                                        <div style="font-size:13px;color:var(--color-text-muted);text-align:center;">
                                            ${p.photo_path ? "Foto caricata" : "Nessuna foto caricata"}
                                        </div>
                                        ${isAdmin ? `<label for="staff-photo-upload" class="btn btn-default btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;width:100%;justify-content:center;"><i class="ph ph-camera"></i> ${p.photo_path ? "Cambia foto" : "Carica foto"}</label><input id="staff-photo-upload" type="file" accept="image/jpeg,image/png,image/webp" style="display:none;" data-staff-id="${p.id}"><div id="staff-photo-status" style="font-size:12px;color:var(--color-text-muted);text-align:center;"></div>` : ""}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="flex:1;">
                            <p class="section-label">Dati Anagrafici e Contatti</p>
                            <div class="dash-card" style="padding:var(--sp-3);">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3);">
                                    ${StaffView.fieldValue("Nome", p.first_name)}
                                    ${StaffView.fieldValue("Cognome", p.last_name)}
                                    ${StaffView.fieldValue("Ruolo / Qualifica", p.role)}
                                    ${StaffView.fieldValue("Squadre", teamNamesStr)}
                                    ${StaffView.fieldValue("Data di Nascita", p.birth_date ? Utils.formatDate(p.birth_date) : null)}
                                    ${StaffView.fieldValue("Luogo di Nascita", p.birth_place)}
                                    ${StaffView.fieldValue("Città di Residenza", p.residence_city)}
                                    ${StaffView.fieldValue("Via di Residenza", p.residence_address)}
                                    ${StaffView.fieldValue("Cellulare", p.phone)}
                                    ${StaffView.fieldValue("E-Mail", p.email)}
                                </div>
                                ${p.notes ? `<div style="margin-top:var(--sp-2);padding-top:var(--sp-2);border-top:1px solid var(--color-border);"><span style="font-size:11px;color:var(--color-silver);text-transform:uppercase;font-weight:600;">Note</span><p style="font-size:14px;margin-top:4px;line-height:1.6;">${Utils.escapeHtml(p.notes)}</p></div>` : ""}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB: DOCUMENTI -->
                <div id="stab-panel-documenti" class="athlete-tab-panel" style="display:none;flex-direction:column;gap:var(--sp-4);padding:0 var(--sp-4);">
                    <div>
                        <p class="section-label">Matricola e Dati</p>
                        <div class="dash-card" style="padding:var(--sp-3);">
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
                                ${StaffView.fieldValue("Codice Fiscale", p.fiscal_code)}
                                ${StaffView.fieldValue("Documento d'Identità", p.identity_document)}
                                ${StaffView.fieldValue("Scadenza Cert. Medico", p.medical_cert_expires_at ? Utils.formatDate(p.medical_cert_expires_at) : null, medExpired ? "var(--color-pink)" : null)}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                            <p class="section-label" style="margin-bottom:0;">Contratto di Collaborazione</p>
                            ${isAdmin && p.email ? `<button class="btn btn-primary btn-sm" id="generate-contract-btn" style="font-size:11px;padding:4px 10px;">+ NUOVO</button>` : (!p.email ? '<span style="font-size:11px;color:var(--color-pink);">Email mancante per contratto</span>' : "")}
                        </div>
                        <div class="dash-card" style="padding:var(--sp-3);">
                            ${!p.contract_status ? Utils.emptyState("Nessun contratto attivo", "Genera un nuovo contratto per questo membro.") : `
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                                    <div><span style="font-size:12px;color:var(--color-text-muted);">Stato:</span> <strong style="color:${p.contract_status === "firmato" ? "var(--color-success)" : (p.contract_status === "inviato" ? "var(--color-info)" : "var(--color-white)")};text-transform:uppercase;font-size:12px;letter-spacing:1px;">${p.contract_status}</strong></div>
                                    ${p.contract_signed_at ? `<div style="font-size:12px;color:var(--color-text-muted);">Firmato il: ${Utils.formatDateTime(p.contract_signed_at)}</div>` : ""}
                                </div>
                                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-3);padding:var(--sp-3);background:rgba(0,0,0,0.2);border-radius:6px;">
                                    ${StaffView.fieldValue("Valido dal", p.contract_valid_from ? Utils.formatDate(p.contract_valid_from) : null)}
                                    ${StaffView.fieldValue("Valido al", p.contract_valid_to ? Utils.formatDate(p.contract_valid_to) : null)}
                                    ${StaffView.fieldValue("Compenso mensile", p.contract_monthly_fee ? "€ " + Number(p.contract_monthly_fee).toFixed(2) : "A titolo gratuito")}
                                </div>
                                <div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-3);">
                                    ${p.contract_status === "firmato" && p.contract_signed_pdf_path ? `<a href="api/router.php?module=staff&action=downloadContract&id=${p.id}" target="_blank" class="btn btn-default btn-sm"><i class="ph ph-download"></i> SCARICA FIRMATO</a>` : ""}
                                    ${p.contract_status === "inviato" && isAdmin ? `<button class="btn btn-default btn-sm" id="check-contract-btn" data-id="${p.id}"><i class="ph ph-arrows-clockwise"></i> VERIFICA STATO</button>` : ""}
                                </div>
                            `}
                        </div>
                    </div>
                    <div>
                        <p class="section-label">Allegati</p>
                        <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
                            ${buildUploadRow(p.id, "ph ph-file-pdf", "Contratto", p.contract_file_path, "Nessun file caricato", "upload-contract-file-btn", "var(--color-pink)")}
                            ${buildUploadRow(p.id, "ph ph-identification-badge", "CI Fronte", p.id_doc_file_path, "Nessun file caricato", "upload-id-doc-btn", "var(--color-info)")}
                            ${buildUploadRow(p.id, "ph ph-identification-card", "CI Retro", p.id_doc_back_file_path, "Nessun file caricato", "upload-id-doc-back-btn", "var(--color-info)")}
                            ${buildUploadRow(p.id, "ph ph-credit-card", "CF Fronte", p.cf_doc_file_path, "Nessun file caricato", "upload-cf-doc-btn", "var(--color-success)")}
                            ${buildUploadRow(p.id, "ph ph-credit-card", "CF Retro", p.cf_doc_back_file_path, "Nessun file caricato", "upload-cf-doc-back-btn", "var(--color-success)")}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

export default StaffView;
