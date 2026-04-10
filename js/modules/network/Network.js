import { NetworkAPI } from './NetworkAPI.js';
import { NetworkView } from './NetworkView.js';

class NetworkModule {
    constructor() {
        this._abort = new AbortController();
        this._currentTab = "collaborazioni";
        this._collaborations = [];
        this._trials = [];
        this._activities = [];
        this._hubConfig = { text: "", logo_path: "" };
        this._colFilterStatus = "";
        this._trialFilterStatus = "";
    }

    sig() {
        return { signal: this._abort.signal };
    }

    destroy() {
        this._abort.abort();
        this._abort = new AbortController();
        this._collaborations = [];
        this._trials = [];
        this._activities = [];
    }

    async init() {
        const app = document.getElementById("app");
        if (!app) return;

        window.UI.loading(true);
        app.innerHTML = window.UI.skeletonPage();

        try {
            [this._collaborations, this._trials, this._activities, this._hubConfig] = await Promise.all([
                NetworkAPI.listCollaborations().catch(() => []),
                NetworkAPI.listTrials().catch(() => []),
                NetworkAPI.listActivities().catch(() => []),
                NetworkAPI.getHubConfig().catch(() => ({ text: "", logo_path: "" }))
            ]);

            const currentRoute = window.Router.getCurrentRoute();
            this._currentTab = currentRoute === "network-prove" ? "prove" : (currentRoute === "network-attivita" ? "attivita" : "collaborazioni");

            app.innerHTML = NetworkView.renderMainLayout(this._currentTab);

            app.querySelectorAll(".net-main-tab").forEach(btn => {
                btn.addEventListener("click", () => {
                    this._currentTab = btn.dataset.netMainTab;
                    app.querySelectorAll(".net-main-tab").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    this.renderActiveTab();
                }, this.sig());
            });

            this.renderActiveTab();
        } catch (err) {
            console.error("[Network] Init error:", err);
            app.innerHTML = window.Utils.emptyState("Errore caricamento", err.message);
        } finally {
            window.UI.loading(false);
        }
    }

    renderActiveTab() {
        const container = document.getElementById("net-tab-content");
        if (!container) return;

        container.innerHTML = ""; // immediately clear DOM to avoid lingering listeners
        const user = window.App.getUser();
        const canEdit = ["admin", "manager"].includes(user?.role);

        if (this._currentTab === "collaborazioni") {
            container.innerHTML = NetworkView.renderCollaborations(this._collaborations, this._hubConfig, this._colFilterStatus, canEdit);
            this.bindCollaborationsEvents(container, canEdit);
        } else if (this._currentTab === "prove") {
            container.innerHTML = NetworkView.renderTrials(this._trials, this._trialFilterStatus, canEdit);
            this.bindTrialsEvents(container);
        } else if (this._currentTab === "attivita") {
            container.innerHTML = NetworkView.renderActivities(this._activities, canEdit);
            this.bindActivitiesEvents(container);
        }
    }

    // --- COLLABORATIONS ---
    bindCollaborationsEvents(container, canEdit) {
        const grid = container.querySelector(".net-card-grid");
        if (grid) {
            grid.addEventListener("click", (e) => {
                const editBtn = e.target.closest(".btn-edit-col");
                if (editBtn) {
                    e.stopPropagation();
                    const id = editBtn.dataset.id;
                    this.openCollaborationModal(this._collaborations.find(c => c.id === id));
                    return;
                }

                const delBtn = e.target.closest(".btn-del-col");
                if (delBtn) {
                    e.stopPropagation();
                    const id = delBtn.dataset.id;
                    this.handleDeleteCollaboration(id);
                    return;
                }

                const card = e.target.closest(".collab-card");
                if (card) {
                    const id = card.dataset.openCol;
                    this.showCollaborationDetail(id);
                }
            }, this.sig());
        }

        container.querySelectorAll("[data-col-status]").forEach(btn => {
            btn.addEventListener("click", () => {
                this._colFilterStatus = btn.dataset.colStatus;
                this.renderActiveTab();
            }, this.sig());
        });

        if (canEdit) {
            container.querySelector("#net-add-col")?.addEventListener("click", () => this.openCollaborationModal(null), this.sig());
            container.querySelector("#net-edit-hub")?.addEventListener("click", () => this.openHubEditModal(), this.sig());
        }
    }

    openHubEditModal() {
        const modal = window.UI.modal({
            title: "Modifica HUB Savino del Bene",
            body: NetworkView.getHubEditModalBody(this._hubConfig),
            footer: NetworkView.getHubEditModalFooter()
        });

        document.getElementById("hub-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("hub-save")?.addEventListener("click", async () => {
            const btn = document.getElementById("hub-save");
            btn.disabled = true;
            btn.textContent = "Salvataggio...";
            try {
                const text = document.getElementById("hub-text").value;
                await NetworkAPI.updateHubText(text);

                const file = document.getElementById("hub-logo-input").files[0];
                if (file) {
                    const fd = new FormData();
                    fd.append("logo", file);
                    await NetworkAPI.uploadHubLogo(fd);
                }

                this._hubConfig = await NetworkAPI.getHubConfig();
                window.UI.toast("HUB aggiornato", "success");
                this.renderActiveTab();
                modal.close();
            } catch (err) {
                const errEl = document.getElementById("hub-error");
                if (errEl) {
                    errEl.textContent = err.message;
                    errEl.classList.remove("hidden");
                }
                btn.disabled = false;
                btn.textContent = "SALVA";
            }
        }, this.sig());
    }

    openCollaborationModal(col) {
        const isEdit = !!col;
        const modal = window.UI.modal({
            title: isEdit ? "Modifica Collaborazione" : "Nuova Collaborazione",
            body: NetworkView.getCollaborationModalBody(col),
            footer: NetworkView.getCollaborationModalFooter(isEdit)
        });

        document.getElementById("cl-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("cl-save")?.addEventListener("click", async () => {
            const name = document.getElementById("cl-name").value.trim();
            const errEl = document.getElementById("cl-error");
            if (!name) {
                errEl.textContent = "Il nome è obbligatorio";
                errEl.classList.remove("hidden");
                return;
            }

            const saveBtn = document.getElementById("cl-save");
            saveBtn.disabled = true;
            saveBtn.textContent = "Salvataggio...";

            try {
                const data = {
                    partner_name: name,
                    partner_type: document.getElementById("cl-type").value,
                    status: document.getElementById("cl-status").value,
                    agreement_type: document.getElementById("cl-agreement").value || null,
                    start_date: document.getElementById("cl-start").value || null,
                    end_date: document.getElementById("cl-end").value || null,
                    referent_name: document.getElementById("cl-ref-name").value || null,
                    referent_contact: document.getElementById("cl-ref-contact").value || null,
                    notes: document.getElementById("cl-notes").value || null,
                    website: document.getElementById("cl-website").value || null,
                    instagram: document.getElementById("cl-instagram").value || null,
                    facebook: document.getElementById("cl-facebook").value || null,
                    youtube: document.getElementById("cl-youtube").value || null,
                    description: document.getElementById("cl-description").value || null
                };

                let colId = col?.id;
                if (isEdit) {
                    await NetworkAPI.updateCollaboration({ id: colId, ...data });
                } else {
                    const res = await NetworkAPI.createCollaboration(data);
                    colId = res.id;
                }

                const logo = document.getElementById("cl-logo-file").files[0];
                if (logo) {
                    const fd = new FormData();
                    fd.append("collaboration_id", colId);
                    fd.append("logo", logo);
                    await NetworkAPI.uploadColLogo(fd);
                }

                const contract = document.getElementById("cl-contract-file").files[0];
                if (contract) {
                    const fd = new FormData();
                    fd.append("collaboration_id", colId);
                    fd.append("doc_type", "contratto");
                    fd.append("file", contract);
                    await NetworkAPI.uploadColDocument(fd);
                }

                this._collaborations = await NetworkAPI.listCollaborations();
                window.UI.toast(isEdit ? "Aggiornato" : "Creato", "success");
                this.renderActiveTab();
                modal.close();
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove("hidden");
                saveBtn.disabled = false;
                saveBtn.textContent = isEdit ? "SALVA" : "CREA";
            }
        }, this.sig());
    }

    showCollaborationDetail(id) {
        const col = this._collaborations.find(c => c.id === id);
        if (!col) return;

        const modal = window.UI.modal({
            title: window.Utils.escapeHtml(col.partner_name),
            body: NetworkView.getColDetailModalBody(col),
            footer: '<button class="btn-dash" id="cod-close" type="button">Chiudi</button>'
        });

        document.getElementById("cod-close")?.addEventListener("click", () => modal.close(), this.sig());

        NetworkAPI.listColDocuments(col.id)
            .then(docs => {
                const el = document.getElementById("col-docs-list");
                if (!el) return;
                if (docs.length === 0) {
                    el.innerHTML = '<span style="color:var(--color-text-muted);font-style:italic">Nessun documento</span>';
                    return;
                }
                el.innerHTML = docs.map(d => `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px;background:var(--color-bg-alt);border-radius:var(--radius-sm)">
                        <span style="display:flex;align-items:center;gap:6px">
                            <i class="ph ph-file-text" style="color:var(--color-primary)"></i>
                            ${window.Utils.escapeHtml(d.file_name)}
                            ${d.doc_type ? `<small class="badge badge-sm">${window.Utils.escapeHtml(d.doc_type)}</small>` : ""}
                        </span>
                        <a href="api/?module=network&action=downloadColDocument&docId=${d.id}" target="_blank" class="btn-dash" style="height:24px;width:24px;padding:0;display:flex;align-items:center;justify-content:center"><i class="ph ph-download-simple"></i></a>
                    </div>`).join("");
            }).catch(err => {
                const el = document.getElementById("col-docs-list");
                if (el) el.innerHTML = `<span style="color:var(--color-pink)">Errore: ${err.message}</span>`;
            });
    }

    async handleDeleteCollaboration(id) {
        const col = this._collaborations.find(c => c.id === id);
        if (!col) return;
        window.UI.confirm(`Eliminare la collaborazione con <strong>${window.Utils.escapeHtml(col.partner_name)}</strong>?`, async () => {
            try {
                await NetworkAPI.deleteCollaboration(id);
                this._collaborations = this._collaborations.filter(c => c.id !== id);
                window.UI.toast("Collaborazione eliminata", "success");
                this.renderActiveTab();
            } catch (err) {
                window.UI.toast("Errore: " + err.message, "error");
            }
        });
    }

    // --- TRIALS ---
    bindTrialsEvents(container) {
        container.querySelectorAll("[data-tr-status]").forEach(btn => {
            btn.addEventListener("click", () => {
                this._trialFilterStatus = btn.dataset.trStatus;
                this.renderActiveTab();
            }, this.sig());
        });

        const tbody = container.querySelector("#trial-tbody");
        if (tbody) {
            tbody.addEventListener("click", (e) => {
                const id = e.target.closest("button")?.dataset.id;
                if (!id) return;

                if (e.target.closest(".btn-eval-trial")) this.showEvaluationModal(id);
                else if (e.target.closest(".btn-edit-trial")) this.openTrialModal(this._trials.find(t => t.id === id));
                else if (e.target.closest(".btn-convert-trial")) this.handleConvertToScouting(id);
                else if (e.target.closest(".btn-del-trial")) this.handleDeleteTrial(id);
            }, this.sig());
        }

        container.querySelector("#net-add-trial")?.addEventListener("click", () => this.openTrialModal(null), this.sig());
    }

    openTrialModal(trial) {
        const isEdit = !!trial;
        const modal = window.UI.modal({
            title: isEdit ? "Modifica Atleta in Prova" : "Nuovo Atleta in Prova",
            body: NetworkView.getTrialModalBody(trial),
            footer: NetworkView.getTrialModalFooter(isEdit)
        });

        document.getElementById("tr-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("tr-save")?.addEventListener("click", async () => {
            const first = document.getElementById("tr-first").value.trim();
            const last = document.getElementById("tr-last").value.trim();
            const errEl = document.getElementById("tr-error");
            if (!first || !last) {
                errEl.textContent = "Nome e cognome obbligatori";
                errEl.classList.remove("hidden");
                return;
            }

            const saveBtn = document.getElementById("tr-save");
            saveBtn.disabled = true;
            saveBtn.textContent = "Salvataggio...";

            try {
                const data = {
                    athlete_first_name: first,
                    athlete_last_name: last,
                    birth_date: document.getElementById("tr-dob").value || null,
                    nationality: document.getElementById("tr-nat").value || null,
                    position: document.getElementById("tr-pos").value || null,
                    origin_club: document.getElementById("tr-club").value || null,
                    trial_start: document.getElementById("tr-start").value || null,
                    trial_end: document.getElementById("tr-end").value || null,
                    status: document.getElementById("tr-status").value || "in_valutazione",
                    notes: document.getElementById("tr-notes").value || null
                };

                if (isEdit) {
                    await NetworkAPI.updateTrial({ id: trial.id, ...data });
                } else {
                    await NetworkAPI.createTrial(data);
                }

                this._trials = await NetworkAPI.listTrials();
                window.UI.toast(isEdit ? "Atleta aggiornato" : "Atleta aggiunto", "success");
                this.renderActiveTab();
                modal.close();
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove("hidden");
                saveBtn.disabled = false;
                saveBtn.textContent = isEdit ? "SALVA" : "CREA";
            }
        }, this.sig());
    }

    showEvaluationModal(trialId) {
        const dimensions = [
            { key: "score_technical", label: "Tecnica" },
            { key: "score_tactical", label: "Tattica" },
            { key: "score_physical", label: "Fisico" },
            { key: "score_mental", label: "Mental" },
            { key: "score_potential", label: "Potenziale" }
        ];

        const modal = window.UI.modal({
            title: "Scheda di Valutazione",
            body: NetworkView.getEvaluationModalBody(dimensions),
            footer: NetworkView.getEvaluationModalFooter()
        });

        dimensions.forEach(d => {
            const input = document.getElementById("ev-" + d.key);
            const val = document.getElementById("ev-" + d.key + "-val");
            input?.addEventListener("input", () => {
                if (val) val.textContent = input.value;
                const total = dimensions.reduce((acc, dim) => acc + parseInt(document.getElementById("ev-" + dim.key).value), 0);
                const avg = total / dimensions.length;
                const disp = document.getElementById("ev-avg-display");
                if (disp) disp.textContent = avg.toFixed(1);
            }, this.sig());
        });

        document.getElementById("ev-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("ev-save")?.addEventListener("click", async () => {
            const date = document.getElementById("ev-date").value;
            if (!date) {
                const errEl = document.getElementById("ev-error");
                errEl.textContent = "Data obbligatoria";
                errEl.classList.remove("hidden");
                return;
            }

            const saveBtn = document.getElementById("ev-save");
            saveBtn.disabled = true;
            saveBtn.textContent = "Salvataggio...";

            try {
                const evData = {
                    trial_id: trialId,
                    eval_date: date,
                    video_url: document.getElementById("ev-video").value || null,
                    notes: document.getElementById("ev-notes").value || null
                };
                dimensions.forEach(d => {
                    evData[d.key] = parseInt(document.getElementById("ev-" + d.key).value);
                });

                await NetworkAPI.evaluateTrial(evData);
                this._trials = await NetworkAPI.listTrials();
                window.UI.toast("Valutazione salvata", "success");
                this.renderActiveTab();
                modal.close();
            } catch (err) {
                const errEl = document.getElementById("ev-error");
                errEl.textContent = err.message;
                errEl.classList.remove("hidden");
                saveBtn.disabled = false;
                saveBtn.textContent = "SALVA";
            }
        }, this.sig());
    }

    async handleConvertToScouting(id) {
        const trial = this._trials.find(t => t.id === id);
        if (!trial) return;
        window.UI.confirm(`Convertire <strong>${window.Utils.escapeHtml(trial.full_name || (trial.athlete_first_name + " " + trial.athlete_last_name))}</strong> in scouting?`, async () => {
            try {
                await NetworkAPI.convertToScouting(id);
                this._trials = await NetworkAPI.listTrials();
                window.UI.toast("Convertito in Scouting ✓", "success");
                this.renderActiveTab();
            } catch (err) {
                window.UI.toast("Errore: " + err.message, "error");
            }
        });
    }

    async handleDeleteTrial(id) {
        window.UI.confirm("Rimuovere definitivamente l'atleta in prova?", async () => {
            try {
                await NetworkAPI.deleteTrial(id);
                this._trials = this._trials.filter(t => t.id !== id);
                window.UI.toast("Atleta rimosso", "success");
                this.renderActiveTab();
            } catch (err) {
                window.UI.toast("Errore: " + err.message, "error");
            }
        });
    }

    // --- ACTIVITIES ---
    bindActivitiesEvents(container) {
        container.querySelector("#net-act-search")?.addEventListener("input", (e) => {
            const q = e.target.value.trim().toLowerCase();
            container.querySelectorAll("[data-act-title]").forEach(item => {
                item.style.display = item.dataset.actTitle.includes(q) ? "" : "none";
            });
        }, this.sig());

        const timeline = container.querySelector("#net-timeline");
        if (timeline) {
            timeline.addEventListener("click", (e) => {
                const id = e.target.closest("button")?.dataset.id;
                if (!id) return;
                if (e.target.closest(".btn-edit-act")) this.openActivityModal(this._activities.find(a => a.id === id));
                else if (e.target.closest(".btn-del-act")) this.handleDeleteActivity(id);
            }, this.sig());
        }

        container.querySelector("#net-add-act")?.addEventListener("click", () => this.openActivityModal(null), this.sig());
    }

    openActivityModal(act) {
        const isEdit = !!act;
        const modal = window.UI.modal({
            title: isEdit ? "Modifica Attività" : "Nuova Attività",
            body: NetworkView.getActivityModalBody(act),
            footer: NetworkView.getActivityModalFooter(isEdit)
        });

        document.getElementById("ac-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("ac-save")?.addEventListener("click", async () => {
            const title = document.getElementById("ac-title").value.trim();
            const date = document.getElementById("ac-date").value;
            if (!title || !date) {
                const errEl = document.getElementById("ac-error");
                errEl.textContent = "Titolo e data obbligatori";
                errEl.classList.remove("hidden");
                return;
            }
            const saveBtn = document.getElementById("ac-save");
            saveBtn.disabled = true;
            saveBtn.textContent = "Salvataggio...";

            try {
                const data = {
                    title,
                    date,
                    activity_type: document.getElementById("ac-type").value || null,
                    location: document.getElementById("ac-loc").value || null,
                    outcome: document.getElementById("ac-outcome").value || null,
                    notes: document.getElementById("ac-notes").value || null
                };

                if (isEdit) {
                    await NetworkAPI.updateActivity({ id: act.id, ...data });
                } else {
                    await NetworkAPI.createActivity(data);
                }

                this._activities = await NetworkAPI.listActivities();
                window.UI.toast("Attività salvata", "success");
                this.renderActiveTab();
                modal.close();
            } catch (err) {
                const errEl = document.getElementById("ac-error");
                errEl.textContent = err.message;
                errEl.classList.remove("hidden");
                saveBtn.disabled = false;
                saveBtn.textContent = isEdit ? "SALVA" : "CREA";
            }
        }, this.sig());
    }

    async handleDeleteActivity(id) {
        window.UI.confirm("Eliminare questa attività?", async () => {
            try {
                await NetworkAPI.deleteActivity(id);
                this._activities = this._activities.filter(a => a.id !== id);
                window.UI.toast("Attività eliminata", "success");
                this.renderActiveTab();
            } catch (err) {
                window.UI.toast("Errore: " + err.message, "error");
            }
        });
    }
}

window.Network = new NetworkModule();
export default window.Network;
