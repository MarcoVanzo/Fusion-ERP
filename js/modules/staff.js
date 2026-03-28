import StaffAPI from './staff/StaffAPI.js';
import StaffView from './staff/StaffView.js';
import StaffWizard from './staff/StaffWizard.js';

const Staff = {
    _abort: new AbortController(),
    _staffData: [],
    _teamsData: [],
    _currentMemberId: null,

    sig: function() { return { signal: this._abort.signal }; },

    destroy: function() {
        this._abort.abort();
        this._abort = new AbortController();
    },

    init: async function() {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        UI.loading(true);
        appContainer.innerHTML = UI.skeletonPage();

        try {
            [this._staffData, this._teamsData] = await Promise.all([
                StaffAPI.list(),
                StaffAPI.getTeams()
            ]);

            this._currentMemberId = null;

            if (Router.getCurrentRoute() === "staff-documents") {
                this.renderDocumentsView(appContainer);
            } else {
                this.renderDashboard(appContainer);
            }
        } catch (err) {
            console.error("Staff init err:", err);
            appContainer.innerHTML = Utils.emptyState("Errore caricamento staff", err.message);
            UI.toast("Errore caricamento staff", "error");
        } finally {
            UI.loading(false);
        }
    },

    renderDashboard: function(container) {
        const user = App.getUser();
        const isAdmin = ["admin", "manager", "operator"].includes(user?.role);
        
        // Extract unique roles
        const roles = [...new Set(this._staffData.map(s => s.role).filter(Boolean))].sort();

        container.innerHTML = StaffView.dashboard(this._staffData, roles, isAdmin);

        const grid = document.getElementById("staff-grid");
        if (this._staffData.length > 0) {
            grid.innerHTML = this._staffData.map(m => StaffView.staffCard(m, this._teamsData)).join("");
        }

        this.bindDashboardEvents(isAdmin);
    },

    bindDashboardEvents: function(isAdmin) {
        // Search
        document.getElementById("staff-search")?.addEventListener("input", (e) => {
            const term = e.target.value.trim().toLowerCase();
            document.querySelectorAll("[data-staff-id]").forEach(card => {
                const match = (card.dataset.name || "").includes(term) || (card.dataset.role || "").includes(term);
                card.style.display = match ? "" : "none";
            });
        }, this.sig());

        // Filters
        document.querySelectorAll("#staff-role-filter [data-role]").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll("#staff-role-filter [data-role]").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const role = btn.dataset.role;
                document.querySelectorAll("[data-staff-id]").forEach(card => {
                    card.style.display = (role && card.dataset.role !== role) ? "none" : "";
                });
            }, this.sig());
        });

        // Click on member
        document.querySelectorAll("[data-staff-id]").forEach(card => {
            card.addEventListener("click", () => this.openDetail(card.dataset.staffId), this.sig());
        });

        // Add
        if (isAdmin) {
            document.getElementById("new-staff-btn")?.addEventListener("click", () => this.openNewModal(), this.sig());
        }
    },

    renderDocumentsView: function(container) {
        const user = App.getUser();
        const isAdmin = ["admin", "manager", "operator"].includes(user?.role);
        
        container.innerHTML = StaffView.documentsTable(this._staffData);

        document.querySelectorAll("[data-staff-id]").forEach(row => {
            row.addEventListener("click", () => this.openDetail(row.dataset.staffId), this.sig());
        });
    },

    openDetail: async function(id) {
        this._currentMemberId = id;
        const container = document.getElementById("app");
        container.innerHTML = UI.skeletonPage();

        try {
            const memberData = await StaffAPI.get(id);
            const user = App.getUser();
            const isAdmin = ["admin", "manager", "operator"].includes(user?.role);

            container.innerHTML = StaffView.staffDetail(memberData, this._teamsData, isAdmin);
            this.bindDetailEvents(memberData, isAdmin);
        } catch (err) {
            container.innerHTML = Utils.emptyState("Errore caricamento membro", err.message);
        }
    },

    bindDetailEvents: function(memberData, isAdmin) {
        // Back
        document.getElementById("staff-back")?.addEventListener("click", () => this.init(), this.sig());

        // Tabs
        document.querySelectorAll("[data-stab]").forEach(btn => {
            btn.addEventListener("click", () => {
                const tab = btn.dataset.stab;
                document.querySelectorAll("[data-stab]").forEach(b => b.classList.toggle("active", b.dataset.stab === tab));
                document.getElementById("stab-panel-anagrafica").style.display = tab === "anagrafica" ? "flex" : "none";
                document.getElementById("stab-panel-documenti").style.display = tab === "documenti" ? "flex" : "none";
            }, this.sig());
        });

        if (isAdmin) {
            // Edit
            document.getElementById("staff-edit-btn")?.addEventListener("click", () => this.openEditModal(memberData), this.sig());

            // Delete
            document.getElementById("staff-delete-btn")?.addEventListener("click", () => this.confirmDelete(memberData), this.sig());

            // Photo Upload
            this.bindPhotoUpload(memberData.id);

            // Document Uploads
            ["contract-file", "id-doc", "id-doc-back", "cf-doc", "cf-doc-back"].forEach(type => {
                this.bindDocumentUpload(type, memberData.id);
            });

            // Contract Actions
            document.getElementById("generate-contract-btn")?.addEventListener("click", () => this.openContractModal(memberData.id), this.sig());
            document.getElementById("check-contract-btn")?.addEventListener("click", (e) => this.checkContract(memberData.id, e.target), this.sig());
        }
    },

    bindPhotoUpload: function(id) {
        const input = document.getElementById("staff-photo-upload");
        if (!input) return;
        input.addEventListener("change", async (ev) => {
            const file = ev.target.files[0];
            if (!file) return;
            const statusText = document.getElementById("staff-photo-status");
            if (statusText) statusText.textContent = "Caricamento...";
            try {
                await StaffAPI.uploadFile(id, file, "uploadPhoto");
                UI.toast("Foto aggiornata", "success");
                this.openDetail(id);
            } catch (err) {
                UI.toast(err.message, "error");
                if (statusText) statusText.textContent = "Errore: " + err.message;
            }
        }, this.sig());
    },

    bindDocumentUpload: function(type, id) {
        const btn = document.getElementById(`upload-${type}-btn`);
        const input = document.getElementById(`upload-${type}-input`);
        if (!btn || !input) return;

        btn.addEventListener("click", () => input.click(), this.sig());
        input.addEventListener("change", async (ev) => {
            const file = ev.target.files[0];
            if (!file) return;

            let action = "";
            if (type === "contract-file") action = "uploadContractFile";
            else if (type === "id-doc") action = "uploadIdDoc";
            else if (type === "id-doc-back") action = "uploadIdDocBack";
            else if (type === "cf-doc") action = "uploadCfDoc";
            else if (type === "cf-doc-back") action = "uploadCfDocBack";

            UI.toast("Caricamento in corso...", "info");
            try {
                await StaffAPI.uploadFile(id, file, action);
                UI.toast("Documento salvato", "success");
                this.openDetail(id);
            } catch (err) {
                UI.toast(err.message, "error");
            }
        }, this.sig());
    },

    openContractModal: function(id) {
        const modal = UI.modal({
            title: "Genera Contratto di Collaborazione",
            body: `
                <div class="form-grid">
                    <div class="form-group"><label class="form-label">Valido dal *</label><input type="date" id="cg-from" class="form-input" required></div>
                    <div class="form-group"><label class="form-label">Valido al *</label><input type="date" id="cg-to" class="form-input" required></div>
                </div>
                <div class="form-group"><label class="form-label">Compenso Mensile (€) (Opzionale)</label><input type="number" id="cg-fee" step="0.01" class="form-input" placeholder="Es. 150.00"></div>
                <div id="cg-error" class="form-error hidden"></div>
            `,
            footer: '<button class="btn btn-ghost btn-sm" id="cg-cancel">Annulla</button><button class="btn btn-primary btn-sm" id="cg-save">GENERA E INVIA</button>'
        });

        document.getElementById("cg-cancel").addEventListener("click", () => modal.close());
        document.getElementById("cg-save").addEventListener("click", async () => {
            const from = document.getElementById("cg-from").value;
            const to = document.getElementById("cg-to").value;
            const fee = document.getElementById("cg-fee").value || null;
            const btn = document.getElementById("cg-save");
            const err = document.getElementById("cg-error");

            if (!from || !to) {
                err.textContent = "Data di inizio e fine obbligatorie";
                err.classList.remove("hidden");
                return;
            }

            btn.disabled = true;
            btn.textContent = "Generazione...";
            try {
                await StaffAPI.generateContract({ staff_id: id, valid_from: from, valid_to: to, monthly_fee: fee });
                modal.close();
                UI.toast("Contratto generato e inviato", "success");
                this.init(); // Refresh data entirely
                setTimeout(() => this.openDetail(id), 500);
            } catch(e) {
                err.textContent = e.message;
                err.classList.remove("hidden");
                btn.disabled = false;
                btn.textContent = "GENERA E INVIA";
            }
        });
    },

    checkContract: async function(id, btn) {
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> VERIFICA...';
        try {
            const res = await StaffAPI.checkContractStatus(id);
            UI.toast(res.signed ? "Contratto firmato!" : "In attesa di firma.", res.signed ? "success" : "info");
            if (res.signed) {
                this.init();
                setTimeout(() => this.openDetail(id), 500);
            } else {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } catch (err) {
            UI.toast(err.message, "error");
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    confirmDelete: function(member) {
        const modal = UI.modal({
            title: "Elimina Membro Staff",
            body: `<p>Sei sicuro di voler eliminare <strong>${Utils.escapeHtml(member.full_name)}</strong>? L'operazione non è reversibile.</p>`,
            footer: '<button class="btn btn-ghost btn-sm" id="del-cancel">Annulla</button><button class="btn btn-primary btn-sm" id="del-confirm" style="background:var(--color-pink);border-color:var(--color-pink);">ELIMINA</button>'
        });
        document.getElementById("del-cancel").addEventListener("click", () => modal.close());
        document.getElementById("del-confirm").addEventListener("click", async () => {
            try {
                document.getElementById("del-confirm").disabled = true;
                await StaffAPI.delete(member.id);
                modal.close();
                UI.toast("Membro eliminato", "success");
                this.init();
            } catch (err) {
                UI.toast(err.message, "error");
            }
        });
    },

    openEditModal: function(member) {
        const modal = UI.modal({
            title: "Modifica Membro Staff",
            body: StaffWizard.editModalBody(member, this._teamsData),
            footer: '<button class="btn btn-ghost btn-sm" id="es-cancel">Annulla</button><button class="btn btn-primary btn-sm" id="es-save">SALVA MODIFICHE</button>'
        });

        document.getElementById("es-cancel").addEventListener("click", () => modal.close());
        document.getElementById("es-save").addEventListener("click", async () => {
            const wrapper = modal.element.querySelector(".fusion-modal-body");
            const data = StaffWizard.getFormData(wrapper);
            const err = document.getElementById("es-error");
            
            if (!data["es-fname"] || !data["es-lname"]) {
                err.textContent = "Nome e Cognome obbligatori";
                err.classList.remove("hidden");
                return;
            }

            const btn = document.getElementById("es-save");
            btn.disabled = true;
            btn.textContent = "Salvataggio...";

            try {
                await StaffAPI.update({
                    id: member.id,
                    first_name: data["es-fname"],
                    last_name: data["es-lname"],
                    role: data["es-role"] || null,
                    birth_date: data["es-birth"] || null,
                    birth_place: data["es-birthplace"] || null,
                    residence_address: data["es-resaddr"] || null,
                    residence_city: data["es-rescity"] || null,
                    phone: data["es-phone"] || null,
                    email: data["es-email"] || null,
                    fiscal_code: (data["es-fiscal"] || "").toUpperCase() || null,
                    identity_document: data["es-doc"] || null,
                    medical_cert_expires_at: data["es-medcert"] || null,
                    notes: data["es-notes"] || null,
                    team_ids: data["es-teams"] || []
                });
                modal.close();
                UI.toast("Salvataggio completato", "success");
                this.init();
                setTimeout(() => this.openDetail(member.id), 500);
            } catch (e) {
                err.textContent = e.message;
                err.classList.remove("hidden");
                btn.disabled = false;
                btn.textContent = "SALVA MODIFICHE";
            }
        });
    },

    openNewModal: function() {
        let step = 1;
        const stepsHtml = StaffWizard.newModalSteps(this._teamsData);
        const savedData = {};

        const modal = UI.modal({
            title: "Nuovo Membro Staff",
            body: '<div id="ns-wrapper"></div>',
            footer: '<button class="btn btn-ghost btn-sm" id="ns-cancel">Annulla</button><button class="btn btn-default btn-sm" id="ns-prev"><i class="ph ph-arrow-left"></i> Indietro</button><button class="btn btn-primary btn-sm" id="ns-next">Avanti <i class="ph ph-arrow-right"></i></button><button class="btn btn-primary btn-sm" id="ns-save">CREA MEMBRO</button>'
        });

        const renderStep = () => {
            const wrapper = document.getElementById("ns-wrapper");
            if (!wrapper) return;
            wrapper.innerHTML = `
                <div style="display:flex;align-items:center;margin-bottom:20px;">
                    <strong style="margin-right:12px;color:var(--color-pink)">Step ${step}/2:</strong>
                    ${step === 1 ? 'Dati Personali' : 'Contatti & Documenti'}
                </div>
                ${stepsHtml[step - 1]}
                <div id="ns-error" class="form-error hidden"></div>
            `;

            // Restore data
            Object.entries(savedData).forEach(([k, v]) => {
                const el = document.getElementById(k);
                if (el) el.value = v;
            });

            if (savedData["es-teams"]) {
                savedData["es-teams"].forEach(tid => {
                    const cb = wrapper.querySelector(`input[name="staff-teams"][value="${tid}"]`);
                    if (cb) cb.checked = true;
                });
            }

            document.getElementById("ns-prev").style.display = step === 1 ? "none" : "";
            document.getElementById("ns-next").style.display = step === 2 ? "none" : "";
            document.getElementById("ns-save").style.display = step === 2 ? "" : "none";
        };

        const preserveData = () => {
            const wrapper = document.getElementById("ns-wrapper");
            const data = StaffWizard.getFormData(wrapper);
            Object.assign(savedData, data);
        };

        renderStep();

        document.getElementById("ns-cancel").addEventListener("click", () => modal.close());
        document.getElementById("ns-prev").addEventListener("click", () => {
            preserveData();
            if (step > 1) { step--; renderStep(); }
        });
        document.getElementById("ns-next").addEventListener("click", () => {
            preserveData();
            if (step === 1 && (!savedData["es-fname"] || !savedData["es-lname"])) {
                const err = document.getElementById("ns-error");
                err.textContent = "Nome e Cognome obbligatori";
                err.classList.remove("hidden");
                return;
            }
            if (step < 2) { step++; renderStep(); }
        });

        document.getElementById("ns-save").addEventListener("click", async () => {
            preserveData();
            const btn = document.getElementById("ns-save");
            const err = document.getElementById("ns-error");
            btn.disabled = true;
            btn.textContent = "Creazione...";

            try {
                await StaffAPI.create({
                    first_name: savedData["es-fname"],
                    last_name: savedData["es-lname"],
                    role: savedData["es-role"] || null,
                    birth_date: savedData["es-birth"] || null,
                    birth_place: savedData["es-birthplace"] || null,
                    residence_city: savedData["es-rescity"] || null,
                    phone: savedData["es-phone"] || null,
                    email: savedData["es-email"] || null,
                    fiscal_code: (savedData["es-fiscal"] || "").toUpperCase() || null,
                    identity_document: savedData["es-doc"] || null,
                    medical_cert_expires_at: savedData["es-medcert"] || null,
                    notes: savedData["es-notes"] || null,
                    team_ids: savedData["es-teams"] || []
                });
                modal.close();
                UI.toast("Membro staff creato", "success");
                this.init();
            } catch (e) {
                err.textContent = e.message;
                err.classList.remove("hidden");
                btn.disabled = false;
                btn.textContent = "CREA MEMBRO";
            }
        });
    }
};

export default Staff;
window.Staff = Staff;
