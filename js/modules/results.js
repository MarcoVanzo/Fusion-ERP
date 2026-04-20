/**
 * Results Module — Main Orchestrator
 * Fusion ERP v1.1
 */
import ResultsAPI from './results/ResultsAPI.js';
import ResultsView from './results/ResultsView.js';

const Results = {
    _abort: new AbortController(),
    _championships: [],
    _currentChamp: null,
    _view: "matches", // 'matches' | 'standings'

    /** signal() helper for event listeners */
    sig: function() { return { signal: this._abort.signal }; },

    destroy: function() {
        this._abort.abort();
    },

    init: async function() {
        this._abort = new AbortController();
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        // Reset main container style (legacy fixes)
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
            mainContent.style.padding = "0";
            mainContent.style.backgroundColor = "#0a0a0c";
        }

        appContainer.innerHTML = ResultsView.skeleton();
        
        try {
            // Determine initial view from route
            const route = Router.getCurrentRoute();
            this._view = route === "results-standings" ? "standings" : "matches";

            await this.loadInitialData();
            this.renderToolbar();
            await this.loadAndRenderContent();
            this.attachGlobalEvents();
        } catch (err) {
            console.error("[Results] Init error:", err);
            const content = document.getElementById("res-content");
            if(content) content.innerHTML = Utils.emptyState("Errore caricamento", err.message);
        }
    },

    loadInitialData: async function() {
        this._championships = await ResultsAPI.listChampionships();
        if (this._championships.length > 0) {
            this._currentChamp = this._championships[0];
        }
    },

    renderToolbar: function() {
        const trigger = document.getElementById("res-champ-trigger");
        if (trigger) trigger.innerHTML = ResultsView.champTrigger(this._currentChamp);

        const dropdown = document.getElementById("res-champ-dropdown");
        if (dropdown) {
            // Remove existing list if any
            dropdown.querySelector(".res-champ-list")?.remove();
            
            const list = document.createElement("div");
            list.className = "res-champ-list";
            list.innerHTML = this._championships.map(c => 
                ResultsView.champOption(c, c.id === this._currentChamp?.id)
            ).join('');
            
            dropdown.appendChild(list);
            this.attachDropdownEvents(trigger, list);
        }

        // Update view buttons
        document.querySelectorAll(".res-view-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.view === this._view);
        });
    },

    loadAndRenderContent: async function() {
        const content = document.getElementById("res-content");
        if (!content) return;

        if (!this._currentChamp) {
            content.innerHTML = ResultsView.emptyState("Nessun campionato", "Aggiungi un campionato dalla gestione.");
            return;
        }

        content.innerHTML = ResultsView.loading();

        try {
            if (this._view === 'matches') {
                const data = await ResultsAPI.getMatches({ campionato_id: this._currentChamp.id });
                if (data.needs_sync) {
                    content.innerHTML = ResultsView.needsSync();
                    document.getElementById("res-sync-now-btn")?.addEventListener("click", () => this.sync(), this.sig());
                } else {
                    content.innerHTML = ResultsView.matchesList(data.matches, data.last_updated, data.source_url);
                    // Scroll to latest played round
                    const el = document.getElementById("res-last-played-round");
                    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
                }
            } else {
                const data = await ResultsAPI.getStandings({ campionato_id: this._currentChamp.id });
                if (data.needs_sync) {
                    content.innerHTML = ResultsView.needsSync();
                    document.getElementById("res-sync-now-btn")?.addEventListener("click", () => this.sync(), this.sig());
                } else {
                    content.innerHTML = ResultsView.standingsTable(data.standings, data.last_updated, data.source_url);
                }
            }
        } catch (err) {
            content.innerHTML = ResultsView.emptyState("Errore connessione", err.message);
        }
    },

    attachGlobalEvents: function() {
        document.getElementById("res-refresh-btn")?.addEventListener("click", () => this.refresh(), this.sig());
        document.getElementById("res-sync-btn")?.addEventListener("click", () => this.sync(), this.sig());
        document.getElementById("res-manage-btn")?.addEventListener("click", () => this.openManageModal(), this.sig());

        document.querySelectorAll(".res-view-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const newView = btn.dataset.view;
                if (this._view === newView) return;
                this._view = newView;
                Router.updateHash(newView === 'standings' ? 'results-standings' : 'results');
                this.renderToolbar();
                this.loadAndRenderContent();
            }, this.sig());
        });
    },

    attachDropdownEvents: function(trigger, list) {
        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = list.classList.contains("open");
            list.classList.toggle("open", !isOpen);
            trigger.classList.toggle("open", !isOpen);
        }, this.sig());

        document.addEventListener("click", () => {
            list.classList.remove("open");
            trigger.classList.remove("open");
        }, this.sig());

        list.querySelectorAll(".res-champ-option").forEach(opt => {
            opt.addEventListener("click", () => {
                const id = opt.dataset.id;
                this._currentChamp = this._championships.find(c => String(c.id) === id);
                this.renderToolbar();
                this.loadAndRenderContent();
            }, this.sig());
        });
    },

    refresh: async function() {
        UI.loading(true);
        try {
            Store.invalidate("getResults", "results");
            Store.invalidate("getStandings", "results");
            await this.loadAndRenderContent();
            UI.toast("Dati aggiornati", "success");
        } finally {
            UI.loading(false);
        }
    },

    sync: async function() {
        if (!this._currentChamp) return;
        const btn = document.getElementById("res-sync-btn");
        if (btn) btn.classList.add("loading");
        
        try {
            UI.toast("Sincronizzazione in corso...", "info");
            const res = await ResultsAPI.sync(this._currentChamp.id);
            UI.toast(`Sincronizzazione completata: ${res.matches} partite`, "success");
            await this.refresh();
        } catch (err) {
            UI.toast(err.message, "error");
        } finally {
            if (btn) btn.classList.remove("loading");
        }
    },

    openManageModal: function() {
        const modal = UI.modal({
            title: "Gestisci Campionati",
            body: ResultsView.manageModal(this._championships),
            footer: '<button class="btn-dash ghost" id="modal-close">Chiudi</button>'
        });

        document.getElementById("modal-close")?.addEventListener("click", () => modal.close(), this.sig());

        document.getElementById("res-modal-add-btn")?.addEventListener("click", async () => {
            const label = document.getElementById("res-new-label").value.trim();
            const url = document.getElementById("res-new-url").value.trim();
            if (!label || !url) return UI.toast("Nome e URL obbligatori", "warning");

            try {
                UI.loading(true);
                await ResultsAPI.add(label, url);
                UI.toast("Campionato aggiunto", "success");
                modal.close();
                this._abort.abort();
                await this.init();
            } catch (err) {
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
            }
        }, this.sig());

        document.querySelectorAll("[data-delete-champ]").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.deleteChamp;
                const label = btn.dataset.label;
                if (!confirm(`Rimuovere "${label}"?`)) return;

                try {
                    await ResultsAPI.delete(id);
                    UI.toast("Campionato rimosso", "success");
                    modal.close();
                    this._abort.abort();
                    await this.init();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    }
};

export default Results;
window.Results = Results;
