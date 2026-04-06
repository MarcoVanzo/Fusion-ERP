/**
 * AthletesWizard — Logica per la creazione e modifica atleti (Wizard 4 step)
 */

import { AthletesAPI } from './AthletesAPI.js';

export const AthletesWizard = {
    /**
     * Apre il modal per la creazione di un nuovo atleta
     */
    async openCreate(teams, onSave) {
        let currentStep = 1;
        const stepLabels = ["Dati Obbligatori", "Dati Sportivi", "Contatti", "Documenti"];
        let formData = {};

        const stepsTemplates = [
            // Step 1: Dati Obbligatori
            (teams) => `
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="na-fname">Nome *</label><input id="na-fname" class="form-input" type="text" placeholder="Marco" required></div>
                    <div class="form-group"><label class="form-label" for="na-lname">Cognome *</label><input id="na-lname" class="form-input" type="text" placeholder="Rossi" required></div>
                </div>
                <div class="form-group">
                    <label class="form-label">Squadre *</label>
                    <div id="na-team-panel" class="multi-team-panel" style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:10px;background:rgba(255,255,255,0.04);border:1px solid var(--color-border);border-radius:var(--radius);">
                        ${teams.map(t => `
                            <label class="multi-team-option" for="na-team-${Utils.escapeHtml(t.id)}">
                                <input type="checkbox" id="na-team-${Utils.escapeHtml(t.id)}" class="na-team-cb" value="${Utils.escapeHtml(t.id)}" style="display:none;">
                                <span class="multi-team-label">${Utils.escapeHtml(t.name)} — ${Utils.escapeHtml(t.season)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="na-birth">Data di Nascita</label><input id="na-birth" class="form-input" type="date"></div>
                    <div class="form-group"><label class="form-label" for="na-birthplace">Luogo di Nascita</label><input id="na-birthplace" class="form-input" type="text"></div>
                </div>
            `,
            // Step 2: Dati Sportivi
            () => `
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="na-role">Ruolo</label><input id="na-role" class="form-input" type="text" placeholder="Schiacciatore"></div>
                    <div class="form-group"><label class="form-label" for="na-jersey">N° Maglia</label><input id="na-jersey" class="form-input" type="number" min="1" max="99"></div>
                </div>
                <div class="form-group"><label class="form-label" for="na-federal">ID Federale (FIPAV)</label><input id="na-federal" class="form-input" type="text"></div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="na-height">Altezza (cm)</label><input id="na-height" class="form-input" type="number"></div>
                    <div class="form-group"><label class="form-label" for="na-weight">Peso (kg)</label><input id="na-weight" class="form-input" type="number"></div>
                </div>
            `,
            // Step 3: Contatti
            () => `
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="na-phone">Cellulare</label><input id="na-phone" class="form-input" type="tel"></div>
                    <div class="form-group"><label class="form-label" for="na-email">E-Mail</label><input id="na-email" class="form-input" type="email"></div>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="na-shirt">Taglia Maglia</label><input id="na-shirt" class="form-input" type="text" placeholder="es. M"></div>
                    <div class="form-group"><label class="form-label" for="na-shoe">Numero Scarpe</label><input id="na-shoe" class="form-input" type="text" placeholder="es. 41"></div>
                </div>
                <div class="form-group">
                    <label class="form-label">Indirizzo di Residenza</label>
                    <input id="na-resaddr" class="form-input" type="text" placeholder="Via Roma 1, Milano">
                </div>
                <div class="form-group">
                    <label class="form-label">Città</label>
                    <input id="na-rescity" class="form-input" type="text">
                </div>
            `,
            // Step 4: Documenti & Privacy
            () => `
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="na-fiscal">Codice Fiscale</label><input id="na-fiscal" class="form-input" type="text" maxlength="16" style="text-transform:uppercase;"></div>
                    <div class="form-group"><label class="form-label" for="na-idcard">Documento Identità (Nr.)</label><input id="na-idcard" class="form-input" type="text"></div>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="na-medcert">Scadenza Certificato Medico</label><input id="na-medcert" class="form-input" type="date"></div>
                    <div class="form-group">
                        <label class="form-label" for="na-privacy">Consenso Privacy & Foto</label>
                        <label class="multi-team-option" style="padding:10px;display:flex;align-items:center;gap:10px;">
                            <input type="checkbox" id="na-image-consent" value="1">
                            <span style="font-size:12px;">Consenso Riprese Social</span>
                        </label>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="na-parent">Contatto Genitore (per minori)</label><input id="na-parent" class="form-input" type="text"></div>
                    <div class="form-group"><label class="form-label" for="na-parent-phone">Cellulare Genitore</label><input id="na-parent-phone" class="form-input" type="tel"></div>
                </div>
            `
        ];

        const modal = UI.modal({
            title: "Nuovo Atleta",
            body: '<div id="wizard-body"></div>',
            footer: `
                <button class="btn btn-ghost btn-sm" id="na-cancel">Annulla</button>
                <button class="btn btn-default btn-sm" id="na-prev" style="display:none;"><i class="ph ph-arrow-left"></i> Indietro</button>
                <button class="btn btn-primary btn-sm" id="na-next">Avanti <i class="ph ph-arrow-right"></i></button>
                <button class="btn btn-primary btn-sm" id="na-save" style="display:none;">CREA ATLETA</button>
            `
        });

        const syncData = () => {
            const inputs = document.querySelectorAll("#wizard-step-content input, #wizard-step-content select");
            inputs.forEach(input => {
                if (input.type === 'checkbox') return;
                formData[input.id] = input.value;
            });
            const teamIds = Array.from(document.querySelectorAll(".na-team-cb:checked")).map(cb => cb.value);
            if (teamIds.length > 0 || formData.teams_touched) {
                formData.team_season_ids = teamIds;
                formData.teams_touched = true;
            }
        };

        const renderStep = () => {
            const body = document.getElementById("wizard-body");
            if (!body) return;

            body.innerHTML = `
                <div class="wizard-stepper" style="display:flex;align-items:center;gap:0;margin-bottom:20px;">
                    ${[1,2,3,4].map(step => `
                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
                            <div class="step-circle" style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
                                ${step < currentStep ? 'background:var(--color-success);color:#000;' : step === currentStep ? 'background:var(--color-pink);color:#fff;' : 'background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);'}">
                                ${step < currentStep ? '✓' : step}
                            </div>
                            <div style="font-size:10px;text-transform:uppercase;font-weight:600;color:${step === currentStep ? 'var(--color-white)' : 'rgba(255,255,255,0.35)'};">${stepLabels[step-1]}</div>
                        </div>
                        ${step < 4 ? `<div style="flex:0.5;height:2px;background:${step < currentStep ? 'var(--color-success)' : 'rgba(255,255,255,0.1)'};margin-bottom:20px;"></div>` : ''}
                    `).join('')}
                </div>
                <div id="wizard-step-content">${stepsTemplates[currentStep-1](teams)}</div>
                <div id="na-error" class="form-error hidden"></div>
            `;

            // Restore data
            Object.entries(formData).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (el && el.type !== 'checkbox') el.value = val;
            });
            if (formData.team_season_ids) {
                formData.team_season_ids.forEach(id => {
                    const cb = document.getElementById(`na-team-${id}`);
                    if (cb) {
                        cb.checked = true;
                        cb.closest(".multi-team-option")?.classList.add("selected");
                    }
                });
            }

            // Events for checkboxes
            document.querySelectorAll(".na-team-cb").forEach(cb => {
                cb.addEventListener("change", (e) => {
                    e.target.closest(".multi-team-option")?.classList.toggle("selected", e.target.checked);
                    syncData();
                });
            });

            // Navigation buttons
            document.getElementById("na-prev").style.display = currentStep === 1 ? "none" : "";
            document.getElementById("na-next").style.display = currentStep === 4 ? "none" : "";
            document.getElementById("na-save").style.display = currentStep === 4 ? "" : "none";

            // Google Maps
            if (currentStep === 3) this._initAddressAutocomplete();
        };

        document.getElementById("na-cancel").onclick = () => modal.close();
        document.getElementById("na-prev").onclick = () => { syncData(); currentStep--; renderStep(); };
        document.getElementById("na-next").onclick = () => {
            if (currentStep === 1) {
                const fName = document.getElementById("na-fname")?.value.trim();
                const lName = document.getElementById("na-lname")?.value.trim();
                const teamsSelected = document.querySelectorAll(".na-team-cb:checked").length;
                if (!fName || !lName || teamsSelected === 0) {
                    const err = document.getElementById("na-error");
                    err.textContent = "Nome, cognome e almeno una squadra sono obbligatori";
                    err.classList.remove("hidden");
                    return;
                }
            }
            syncData();
            currentStep++;
            renderStep();
        };

        document.getElementById("na-save").onclick = async () => {
            syncData();
            const btn = document.getElementById("na-save");
            btn.disabled = true;
            btn.textContent = "Creazione...";
            
            try {
                await AthletesAPI.create({
                    first_name: formData["na-fname"],
                    last_name: formData["na-lname"],
                    team_season_ids: formData.team_season_ids,
                    birth_date: formData["na-birth"],
                    birth_place: formData["na-birthplace"],
                    role: formData["na-role"],
                    jersey_number: formData["na-jersey"],
                    federal_id: formData["na-federal"],
                    height_cm: formData["na-height"],
                    weight_kg: formData["na-weight"],
                    phone: formData["na-phone"],
                    email: formData["na-email"],
                    shirt_size: formData["na-shirt"],
                    shoe_size: formData["na-shoe"],
                    residence_address: formData["na-resaddr"],
                    residence_city: formData["na-rescity"],
                    fiscal_code: formData["na-fiscal"],
                    identity_document: formData["na-idcard"],
                    medical_cert_expires_at: formData["na-medcert"],
                    image_release_consent: document.getElementById("na-image-consent")?.checked ? 1 : 0,
                    parent_contact: formData["na-parent"],
                    parent_phone: formData["na-parent-phone"]
                });
                
                UI.toast("Atleta creato con successo", "success");
                modal.close();
                if (onSave) onSave();
            } catch (e) {
                const err = document.getElementById("na-error");
                err.textContent = e.message;
                err.classList.remove("hidden");
                btn.disabled = false;
                btn.textContent = "CREA ATLETA";
            }
        };

        renderStep();
    },

    /**
     * Inizializza l'autocompletamento di Google Maps per l'indirizzo
     */
    _initAddressAutocomplete() {
        if (typeof google === 'undefined') return;
        const input = document.getElementById("na-resaddr");
        if (!input) return;

        const autocomplete = new google.maps.places.Autocomplete(input, {
            types: ['address'],
            componentRestrictions: { country: 'it' },
            fields: ['address_components', 'formatted_address']
        });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            let city = "";
            place.address_components?.forEach(c => {
                if (c.types.includes("locality")) city = c.long_name;
            });
            if (city) document.getElementById("na-rescity").value = city;
        });
    }
};
