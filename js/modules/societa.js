/**
 * Societa Module — Main Orchestrator
 * Fusion ERP v1.1
 */
import SocietaAPI from './societa/SocietaAPI.js';
import SocietaView from './societa/SocietaView.js';
import SocietaOrgChart from './societa/SocietaOrgChart.js';
import SocietaForesteria from './societa/SocietaForesteria.js';

const Societa = {
    _abort: new AbortController(),
    _currentTab: 'identita',
    _data: {
        profile: null,
        roles: [],
        members: [],
        documents: [],
        deadlines: [],
        sponsors: [],
        titles: [],
        foresteria: null
    },

    /** signal() helper for event listeners */
    sig: function() { return { signal: this._abort.signal }; },

    destroy: function() {
        this._abort.abort();
    },

    init: async function() {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        UI.loading(true);
        appContainer.innerHTML = SocietaView.skeleton();
        
        try {
            const route = Router.getCurrentRoute();
            this._currentTab = {
                "societa-organigramma": "organigramma",
                "societa-membri": "membri",
                "societa-documenti": "documenti",
                "societa-scadenze": "scadenze",
                "societa-sponsor": "sponsor",
                "societa-titoli": "titoli",
                "societa-foresteria": "foresteria"
            }[route] || "identita";

            // Load initial data
            await this.reloadData();
            
            this.render();
        } catch (err) {
            console.error("[Societa] Init error:", err);
            appContainer.innerHTML = Utils.emptyState("Errore caricamento", err.message);
            UI.toast("Errore caricamento modulo Società", "error");
        } finally {
            UI.loading(false);
        }
    },

    reloadData: async function() {
        const promises = {
            profile: SocietaAPI.getProfile().catch(() => ({})),
            roles: SocietaAPI.listRoles().catch(() => []),
            members: SocietaAPI.listMembers().catch(() => []),
            documents: SocietaAPI.listDocuments().catch(() => []),
            deadlines: SocietaAPI.listDeadlines().catch(() => []),
            sponsors: SocietaAPI.listSponsors().catch(() => []),
            titles: SocietaAPI.listTitoli().catch(() => [])
        };

        if (this._currentTab === 'foresteria' || this._currentTab === 'spese-foresteria') {
            promises.foresteria = SocietaAPI.getForesteria().catch(err => {
                console.error("[Societa] Error fetching foresteria data:", err);
                return null;
            });
        }

        const keys = Object.keys(promises);
        const results = await Promise.all(Object.values(promises));
        
        // Map results back to this._data using keys to avoid race condition index mismatches
        keys.forEach((key, index) => {
            if (key === 'titles') {
                this._data.titles = results[index];
            } else {
                this._data[key] = results[index];
            }
        });
    },

    render: function() {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);

        switch (this._currentTab) {
            case 'identita':
                appContainer.innerHTML = SocietaView.identity(this._data.profile, isAdmin);
                this.attachIdentityEvents(appContainer, isAdmin);
                break;
            case 'organigramma':
                appContainer.innerHTML = SocietaView.orgChart(this._data.roles, isAdmin);
                if (isAdmin) SocietaOrgChart.initDragAndDrop(appContainer, () => this.refreshTab(), this._abort.signal);
                this.attachOrgEvents(appContainer, isAdmin);
                break;
            case 'membri':
                appContainer.innerHTML = SocietaView.membersTable(this._data.members, isAdmin);
                this.attachMembersEvents(appContainer, isAdmin);
                break;
            case 'documenti':
                appContainer.innerHTML = SocietaView.documentsGrid(this._data.documents, isAdmin);
                this.attachDocumentsEvents(appContainer, isAdmin);
                break;
            case 'scadenze':
                appContainer.innerHTML = SocietaView.deadlines(this._data.deadlines, isAdmin);
                this.attachDeadlinesEvents(appContainer, isAdmin);
                break;
            case 'sponsor':
                appContainer.innerHTML = SocietaView.sponsorsGrid(this._data.sponsors, isAdmin);
                this.attachSponsorsEvents(appContainer, isAdmin);
                break;
            case 'titoli':
                appContainer.innerHTML = SocietaView.titoli(this._data.titles, isAdmin);
                this.attachTitoliEvents(appContainer, isAdmin);
                break;
            case 'foresteria':
                if (this._data.foresteria) {
                   appContainer.innerHTML = SocietaView.foresteriaInfo(this._data.foresteria.info, this._data.foresteria.media, isAdmin);
                   SocietaForesteria.attachInfoEvents(appContainer, this._data.foresteria.info, this._abort.signal);
                   if (this._data.foresteria.info && this._data.foresteria.info.lat) SocietaForesteria.initMap(this._data.foresteria.info);
                } else {
                   appContainer.innerHTML = Utils.emptyState("Dati mancanti", "Impossibile caricare i dati della foresteria.");
                }
                break;
        }
    },

    refreshTab: async function() {
        UI.loading(true);
        try {
            await this.reloadData();
            this.render();
        } catch (err) {
            UI.toast(err.message, "error");
        } finally {
            UI.loading(false);
        }
    },

    attachIdentityEvents: function(container, isAdmin) {
        if (!isAdmin) return;

        container.querySelector("#soc-logo-btn")?.addEventListener("click", () => {
            container.querySelector("#soc-logo-input")?.click();
        }, this.sig());

        container.querySelector("#soc-logo-input")?.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const fd = new FormData();
                fd.append("logo", file);
                const res = await SocietaAPI.uploadLogo(fd);
                this._data.profile.logo_path = res.logo_path;
                UI.toast("Logo caricato", "success");
                this.render();
            } catch (err) {
                UI.toast(err.message, "error");
            }
        }, this.sig());

        // Salva profilo — pulsante ora nell'header (dash-top-bar)
        container.querySelector("#soc-save-profile")?.addEventListener("click", async () => {
            const errEl = container.querySelector("#soc-profile-err");
            const body = {
                mission: container.querySelector("#soc-mission")?.value,
                vision: container.querySelector("#soc-vision")?.value,
                values: container.querySelector("#soc-values")?.value,
                founded_year: container.querySelector("#soc-founded")?.value,
                primary_color: container.querySelector("#soc-color-primary")?.value,
                secondary_color: container.querySelector("#soc-color-secondary")?.value,
                legal_address: container.querySelector("#soc-legal-addr")?.value,
                operative_address: container.querySelector("#soc-op-addr")?.value
            };
            try {
                if (errEl) errEl.classList.add("hidden");
                await SocietaAPI.saveProfile(body);
                UI.toast("Profilo aggiornato", "success");
                this.refreshTab();
            } catch (err) {
                if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
                UI.toast(err.message, "error");
            }
        }, this.sig());
    },

    attachOrgEvents: function(container, isAdmin) {
        if (!isAdmin) return;
        // Logic for adding/editing roles
    },

    attachMembersEvents: function(container, isAdmin) {
        // Search filter
        container.querySelector("#soc-members-search")?.addEventListener("input", (e) => {
            const val = e.target.value.toLowerCase();
            container.querySelectorAll("#soc-members-tbody tr").forEach(tr => {
                const match = tr.dataset.memberName.includes(val);
                tr.style.display = match ? "" : "none";
            });
        }, this.sig());
        
        if (!isAdmin) return;
        // Add member logic
    },

    attachDocumentsEvents: function(container, isAdmin) {
        if (!isAdmin) return;
        // Upload doc logic
    },

    attachDeadlinesEvents: function(container, isAdmin) {
        // Filter logic
        container.querySelectorAll("[data-dl-status]").forEach(btn => {
            btn.addEventListener("click", () => {
               // ... (logic from legacy)
            }, this.sig());
        });
    },

    attachSponsorsEvents: function(container, isAdmin) {
        if (!isAdmin) return;

        container.querySelector("#soc-add-sponsor")?.addEventListener("click", () => {
            this.openSponsorModal();
        }, this.sig());

        container.querySelectorAll("[data-sp-edit]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.spEdit;
                const sp = this._data.sponsors.find(x => x.id === id);
                if (sp) this.openSponsorModal(sp);
            }, this.sig());
        });

        container.querySelectorAll("[data-sp-del]").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.spDel;
                if (!confirm("Sei sicuro di voler eliminare questo sponsor?")) return;
                try {
                    await SocietaAPI.deleteSponsor(id);
                    UI.toast("Sponsor eliminato", "success");
                    this.refreshTab();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });

        container.querySelectorAll("[data-sp-logo]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.spLogo;
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (evt) => {
                    const file = evt.target.files[0];
                    if (!file) return;
                    try {
                        const fd = new FormData();
                        fd.append("logo", file);
                        fd.append("id", id);
                        await SocietaAPI.uploadSponsorLogo(fd);
                        UI.toast("Logo sponsor aggiornato", "success");
                        this.refreshTab();
                    } catch (err) {
                        UI.toast(err.message, "error");
                    }
                };
                input.click();
            }, this.sig());
        });
    },

    openSponsorModal: function(sponsor = null) {
        const isEdit = !!sponsor;
        const modal = UI.modal({
            title: isEdit ? "Modifica Sponsor" : "Nuovo Sponsor",
            body: SocietaView.sponsorModal(sponsor),
            footer: '<button class="btn-dash ghost" id="sp-modal-cancel">Annulla</button><button class="btn-dash primary" id="sp-modal-save">Salva</button>'
        });

        document.getElementById("sp-modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("sp-modal-save")?.addEventListener("click", async () => {
            const errEl = document.getElementById("sp-modal-err");
            const name = document.getElementById("sp-name").value.trim();
            if (!name) {
                if (errEl) { errEl.textContent = "Il nome dello sponsor è obbligatorio"; errEl.classList.remove("hidden"); }
                return;
            }

            const data = {
                name: name,
                tipo: document.getElementById("sp-tipo").value,
                stagione: document.getElementById("sp-stagione").value.trim(),
                is_active: document.getElementById("sp-active").checked ? 1 : 0,
                description: document.getElementById("sp-desc").value.trim(),
                website_url: document.getElementById("sp-website").value.trim(),
                instagram_url: document.getElementById("sp-instagram").value.trim(),
                facebook_url: document.getElementById("sp-facebook").value.trim(),
                linkedin_url: document.getElementById("sp-linkedin").value.trim()
            };

            if (isEdit) data.id = sponsor.id;

            try {
                if (errEl) errEl.classList.add("hidden");
                if (isEdit) {
                    await SocietaAPI.updateSponsor(data);
                    UI.toast("Sponsor aggiornato", "success");
                } else {
                    await SocietaAPI.createSponsor(data);
                    UI.toast("Sponsor creato", "success");
                }
                modal.close();
                this.refreshTab();
            } catch (err) {
                if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
            }
        }, this.sig());
    },

    attachTitoliEvents: function(container, isAdmin) {
        if (!isAdmin) return;
        // Titoli CRUD logic
    }
};

export default Societa;
window.Societa = Societa;
