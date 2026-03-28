/**
 * Staff Wizard Module
 * Fusion ERP v1.1
 */

const StaffWizard = {
    teamCheckboxes: function(teams, selectedIds = []) {
        return teams.map(t => {
            const isChecked = selectedIds.includes(String(t.id));
            const teamName = t.match(/^U\\d+$/) ? t.category.replace("U", "Under ") : (t.category ? t.category + " — " + t.name : t.name);
            return `<label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" name="staff-teams" value="${Utils.escapeHtml(String(t.id))}" class="form-checkbox" ${isChecked ? "checked" : ""}> ${Utils.escapeHtml(teamName)}${t.season ? " — " + Utils.escapeHtml(t.season) : ""}</label>`;
        }).join("");
    },

    roleOptions: function(selectedRole = "") {
        const roles = ["Primo Allenatore", "Secondo Allenatore", "Preparatore Atletico", "Medico", "Fisioterapista", "Segreteria", "Direttore Tecnico", "Dirigente", "Addetta Stampa", "Altro"];
        return roles.map(r => `<option ${selectedRole === r ? "selected" : ""}>${r}</option>`).join("");
    },

    editModalBody: function(staff, teamsList) {
        return `
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-fname">Nome *</label><input id="es-fname" class="form-input" type="text" value="${Utils.escapeHtml(staff.first_name || "")}" required></div>
                <div class="form-group"><label class="form-label" for="es-lname">Cognome *</label><input id="es-lname" class="form-input" type="text" value="${Utils.escapeHtml(staff.last_name || "")}" required></div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="es-role">Ruolo / Qualifica</label>
                    <select id="es-role" class="form-select">
                        <option value="">Seleziona...</option>
                        ${StaffWizard.roleOptions(staff.role)}
                    </select>
                </div>
                <div class="form-group"><label class="form-label" for="es-birth">Data di Nascita</label><input id="es-birth" class="form-input" type="date" value="${staff.birth_date ? staff.birth_date.substring(0, 10) : ""}"></div>
            </div>
            <div class="form-group">
                <label class="form-label">Squadre (Opzionale)</label>
                <div id="es-teams-wrapper" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:120px;overflow-y:auto;padding:8px;border:1px solid var(--color-border);border-radius:6px;background:rgba(0,0,0,0.2);">
                    ${StaffWizard.teamCheckboxes(teamsList, (staff.team_season_ids || []).map(String))}
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-birthplace">Luogo di Nascita</label><input id="es-birthplace" class="form-input" type="text" value="${Utils.escapeHtml(staff.birth_place || "")}"></div>
                <div class="form-group"><label class="form-label" for="es-rescity">Città di Residenza</label><input id="es-rescity" class="form-input" type="text" value="${Utils.escapeHtml(staff.residence_city || "")}"></div>
            </div>
            <div class="form-group"><label class="form-label" for="es-resaddr">Via di Residenza</label><input id="es-resaddr" class="form-input" type="text" value="${Utils.escapeHtml(staff.residence_address || "")}"></div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-phone">Cellulare</label><input id="es-phone" class="form-input" type="tel" value="${Utils.escapeHtml(staff.phone || "")}"></div>
                <div class="form-group"><label class="form-label" for="es-email">E-Mail</label><input id="es-email" class="form-input" type="email" value="${Utils.escapeHtml(staff.email || "")}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-fiscal">Codice Fiscale</label><input id="es-fiscal" class="form-input" type="text" value="${Utils.escapeHtml(staff.fiscal_code || "")}" maxlength="16" style="text-transform:uppercase;"></div>
                <div class="form-group"><label class="form-label" for="es-doc">Documento d'Identità</label><input id="es-doc" class="form-input" type="text" value="${Utils.escapeHtml(staff.identity_document || "")}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-medcert">Scadenza Cert. Medico</label><input id="es-medcert" class="form-input" type="date" value="${staff.medical_cert_expires_at ? staff.medical_cert_expires_at.substring(0, 10) : ""}"></div>
            </div>
            <div class="form-group">
                <label class="form-label" for="es-notes">Note</label>
                <textarea id="es-notes" class="form-input" rows="2" style="resize:vertical;">${Utils.escapeHtml(staff.notes || "")}</textarea>
            </div>
            <div id="es-error" class="form-error hidden"></div>
        `;
    },

    newModalSteps: function(teamsList) {
        return [
            `
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-fname">Nome *</label><input id="es-fname" class="form-input" type="text" placeholder="Marco" required></div>
                <div class="form-group"><label class="form-label" for="es-lname">Cognome *</label><input id="es-lname" class="form-input" type="text" placeholder="Rossi" required></div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="es-role">Ruolo / Qualifica</label>
                    <select id="es-role" class="form-select">
                        <option value="">Seleziona...</option>
                        ${StaffWizard.roleOptions()}
                    </select>
                </div>
                <div class="form-group"><label class="form-label" for="es-birth">Data di Nascita</label><input id="es-birth" class="form-input" type="date"></div>
            </div>
            <div class="form-group">
                <label class="form-label">Squadre (Opzionale)</label>
                <div id="es-teams-wrapper" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:120px;overflow-y:auto;padding:8px;border:1px solid var(--color-border);border-radius:6px;background:rgba(0,0,0,0.2);">
                    ${StaffWizard.teamCheckboxes(teamsList)}
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-birthplace">Luogo di Nascita</label><input id="es-birthplace" class="form-input" type="text" placeholder="Roma"></div>
                <div class="form-group"><label class="form-label" for="es-rescity">Città di Residenza</label><input id="es-rescity" class="form-input" type="text" placeholder="Milano"></div>
            </div>
            `,
            `
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-phone">Cellulare</label><input id="es-phone" class="form-input" type="tel" placeholder="+39 333 1234567"></div>
                <div class="form-group"><label class="form-label" for="es-email">E-Mail</label><input id="es-email" class="form-input" type="email" placeholder="nome@email.com"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-fiscal">Codice Fiscale</label><input id="es-fiscal" class="form-input" type="text" placeholder="RSSMRC90A01H501Z" maxlength="16" style="text-transform:uppercase;"></div>
                <div class="form-group"><label class="form-label" for="es-doc">Documento d'Identità</label><input id="es-doc" class="form-input" type="text" placeholder="CI / Passaporto"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="es-medcert">Scadenza Cert. Medico</label><input id="es-medcert" class="form-input" type="date"></div>
            </div>
            <div class="form-group"><label class="form-label" for="es-notes">Note</label><textarea id="es-notes" class="form-input" rows="2" placeholder="Note aggiuntive..." style="resize:vertical;"></textarea></div>
            `
        ];
    },

    getFormData: function(wrapperElement) {
        const data = {};
        wrapperElement.querySelectorAll("input:not([type=checkbox]), select, textarea").forEach(el => {
            if (el.id) data[el.id] = el.value;
        });
        const teamCheckboxes = Array.from(wrapperElement.querySelectorAll('input[name="staff-teams"]:checked'));
        data["es-teams"] = teamCheckboxes.map(cb => cb.value);
        return data;
    }
};

export default StaffWizard;
