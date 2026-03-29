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
            this.attachGlobalEvents();
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

        if (this._currentTab === 'foresteria') {
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
        const contentEl = document.getElementById("soc-tab-content");
        if (!contentEl) return;

        const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
        
        // Update nav active state
        document.querySelectorAll(".soc-nav-item").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === this._currentTab);
        });

        switch (this._currentTab) {
            case 'identita':
                contentEl.innerHTML = SocietaView.identity(this._data.profile, isAdmin);
                this.attachIdentityEvents(contentEl, isAdmin);
                break;
            case 'organigramma':
                contentEl.innerHTML = SocietaView.orgChart(this._data.roles, isAdmin);
                if (isAdmin) SocietaOrgChart.initDragAndDrop(contentEl, () => this.refreshTab(), this._abort.signal);
                this.attachOrgEvents(contentEl, isAdmin);
                break;
            case 'membri':
                contentEl.innerHTML = SocietaView.membersTable(this._data.members, isAdmin);
                this.attachMembersEvents(contentEl, isAdmin);
                break;
            case 'documenti':
                contentEl.innerHTML = SocietaView.documentsGrid(this._data.documents, isAdmin);
                this.attachDocumentsEvents(contentEl, isAdmin);
                break;
            case 'scadenze':
                contentEl.innerHTML = SocietaView.deadlines(this._data.deadlines, isAdmin);
                this.attachDeadlinesEvents(contentEl, isAdmin);
                break;
            case 'sponsor':
                contentEl.innerHTML = SocietaView.sponsorsGrid(this._data.sponsors, isAdmin);
                this.attachSponsorsEvents(contentEl, isAdmin);
                break;
            case 'titoli':
                contentEl.innerHTML = SocietaView.titoli(this._data.titles, isAdmin);
                this.attachTitoliEvents(contentEl, isAdmin);
                break;
            case 'foresteria':
                if (this._data.foresteria) {
                   contentEl.innerHTML = SocietaView.foresteria(this._data.foresteria.info, this._data.foresteria.expenses, this._data.foresteria.media, isAdmin);
                   SocietaForesteria.attachEvents(contentEl, this._data.foresteria.info, this._abort.signal);
                   if (this._data.foresteria.info.lat) SocietaForesteria.initMap(this._data.foresteria.info);
                } else {
                   contentEl.innerHTML = Utils.emptyState("Dati mancanti", "Impossibile caricare i dati della foresteria.");
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

    attachGlobalEvents: function() {
        document.querySelectorAll(".soc-nav-item").forEach(btn => {
            btn.addEventListener("click", () => {
                const tab = btn.dataset.tab;
                if (tab === this._currentTab) return;
                
                const route = tab === 'identita' ? 'societa' : `societa-${tab}`;
                Router.navigate(route);
            }, this.sig());
        });
    },

    attachIdentityEvents: function(container, isAdmin) {
        if (!isAdmin) return;
        
        container.querySelector("#soc-logo-btn")?.addEventListener("click", () => {
            document.getElementById("soc-logo-input")?.click();
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

        container.querySelector("#soc-save-profile")?.addEventListener("click", async () => {
            const body = {
                mission: document.getElementById("soc-mission")?.value,
                vision: document.getElementById("soc-vision")?.value,
                values: document.getElementById("soc-values")?.value,
                founded_year: document.getElementById("soc-founded")?.value,
                primary_color: document.getElementById("soc-color-primary")?.value,
                secondary_color: document.getElementById("soc-color-secondary")?.value,
                legal_address: document.getElementById("soc-legal-addr")?.value,
                operative_address: document.getElementById("soc-op-addr")?.value
            };
            try {
                await SocietaAPI.saveProfile(body);
                UI.toast("Profilo aggiornato", "success");
                this.refreshTab();
            } catch (err) {
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
        // Sponsor CRUD logic
    },

    attachTitoliEvents: function(container, isAdmin) {
        if (!isAdmin) return;
        // Titoli CRUD logic
    }
};

export default Societa;
window.Societa = Societa;
