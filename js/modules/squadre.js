/**
 * Squadre Module — Main Orchestrator
 * Fusion ERP v1.1
 */
import TeamsAPI from './teams/TeamsAPI.js';
import TeamsView from './teams/TeamsView.js';

const Squadre = {
    _abort: new AbortController(),
    _teams: [],
    _currentTab: "squadre", // 'squadre' | 'stagioni'

    _resetAbort: function() {
        this._abort.abort();
        this._abort = new AbortController();
    },

    /** signal() helper for event listeners */
    sig: function() { return { signal: this._abort.signal }; },

    destroy: function() {
        this._abort.abort();
    },

    init: async function() {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        this._resetAbort();
        UI.loading(true);
        appContainer.innerHTML = TeamsView.skeleton();
        
        try {
            // Check initial tab from route
            const route = Router.getCurrentRoute();
            this._currentTab = route === "squadre-stagioni" ? "stagioni" : "squadre";

            await this.loadData();
            this.render();
            this.attachGlobalEvents();
        } catch (err) {
            console.error("[Squadre] Init error:", err);
            appContainer.innerHTML = Utils.emptyState("Errore caricamento", err.message);
            UI.toast("Errore caricamento modulo Squadre", "error");
        } finally {
            UI.loading(false);
        }
    },

    loadData: async function() {
        this._teams = await TeamsAPI.list();
    },

    render: function() {
        const container = document.getElementById("squadre-list-container");
        if (!container) return;

        const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
        
        // Update nav active state
        document.querySelectorAll(".squadre-tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === this._currentTab);
        });

        if (this._currentTab === 'squadre') {
            container.innerHTML = TeamsView.teamsList(this._teams, isAdmin);
            this.attachTeamsEvents(container, isAdmin);
        } else {
            const seasonMap = this.groupSeasons();
            const seasonNames = Object.keys(seasonMap).sort((a, b) => b.localeCompare(a));
            container.innerHTML = TeamsView.seasonsList(seasonNames, seasonMap, isAdmin, this._teams);
            this.attachSeasonsEvents(container, isAdmin);
        }
    },

    groupSeasons: function() {
        const seasonMap = {};
        this._teams.forEach(team => {
            (team.seasons || []).forEach(season => {
                if (!seasonMap[season.season]) seasonMap[season.season] = [];
                seasonMap[season.season].push({
                    teamId: team.id,
                    teamName: team.name,
                    teamCategory: team.category,
                    teamColorHex: team.color_hex,
                    teamSeasonId: season.id,
                    is_active: parseInt(season.is_active)
                });
            });
        });
        return seasonMap;
    },

    switchTab: function(tab) {
        if (this._currentTab === tab) return;
        this._currentTab = tab;
        Router.updateHash(tab === "stagioni" ? "squadre-stagioni" : "squadre");
        this.render();
    },

    refresh: async function() {
        UI.loading(true);
        try {
            await this.loadData();
            this.render();
        } catch (err) {
            UI.toast(err.message, "error");
        } finally {
            UI.loading(false);
        }
    },

    attachGlobalEvents: function() {
        document.querySelectorAll(".squadre-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => this.switchTab(btn.dataset.tab), this.sig());
        });

        document.getElementById("btn-new-team")?.addEventListener("click", () => this.openTeamModal(), this.sig());
        document.getElementById("btn-new-season-bulk")?.addEventListener("click", () => this.openBulkSeasonModal(), this.sig());
    },

    attachTeamsEvents: function(container, isAdmin) {
        if (!isAdmin) return;

        container.querySelectorAll("[data-add-season-to-team]").forEach(btn => {
            btn.addEventListener("click", () => {
                const team = this._teams.find(t => String(t.id) === btn.dataset.addSeasonToTeam);
                if (team) this.openSeasonMappingModal(team);
            }, this.sig());
        });

        container.querySelectorAll("[data-toggle-season-status]").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.toggleSeasonStatus;
                const action = btn.dataset.action; // '0' for deactivate, '1' for activate
                try {
                    btn.disabled = true;
                    await TeamsAPI.toggleSeason(id, action);
                    UI.toast(action === '1' ? "Stagione attivata" : "Stagione disattivata", "success");
                    await this.refresh();
                } catch (err) {
                    UI.toast(err.message, "error");
                    btn.disabled = false;
                }
            }, this.sig());
        });

        container.querySelectorAll("[data-edit-team-profile]").forEach(btn => {
            btn.addEventListener("click", () => {
                const team = this._teams.find(t => String(t.id) === btn.dataset.editTeamProfile);
                if (team) this.openTeamModal(team);
            }, this.sig());
        });
        
        container.querySelectorAll("[data-delete-team-full]").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.deleteTeamFull;
                if (!confirm("Sei sicuro di voler eliminare questa squadra?")) return;
                try {
                    await TeamsAPI.deleteTeam(id);
                    UI.toast("Squadra rimossa", "success");
                    await this.refresh();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    },

    attachSeasonsEvents: function(container, isAdmin) {
        if (!isAdmin) return;

        container.querySelectorAll("[data-assoc-team-to-season]").forEach(btn => {
            btn.addEventListener("click", () => {
                const seasonName = btn.dataset.assocTeamToSeason;
                this.openAddTeamToSeasonModal(seasonName);
            }, this.sig());
        });

        container.querySelectorAll("[data-remove-season-mapping]").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.removeSeasonMapping;
                if (!confirm(`Rimuovere la squadra dalla stagione ${btn.dataset.seasonName}?`)) return;
                try {
                    await TeamsAPI.deleteSeason(id);
                    UI.toast("Stagione rimossa dalla squadra", "success");
                    await this.refresh();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    },

    // ─── MODALS ─────────────────────────────────────────────────────────────────

    openTeamModal: function(team = null) {
        const isEdit = !!team;
        const modal = UI.modal({
            title: isEdit ? "Modifica Squadra" : "Nuova Squadra",
            body: TeamsView.teamModal(team, this._teams),
            footer: `
                <button class="btn-dash ghost" id="modal-cancel">Annulla</button>
                <button class="btn-dash primary" id="modal-save">${isEdit ? "SALVA" : "CREA SQUADRA"}</button>
            `
        });

        document.getElementById("modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        
        // Toggle new season input
        if (!isEdit) {
            document.getElementById("team-initial-season")?.addEventListener("change", (e) => {
                const wrap = document.getElementById("team-new-season-wrap");
                if (wrap) wrap.classList.toggle("hidden", e.target.value !== "__new__");
            }, this.sig());
        }

        document.getElementById("modal-save")?.addEventListener("click", async () => {
            const body = {
                name: document.getElementById("team-name").value.trim(),
                gender: document.getElementById("team-gender").value,
                category: document.getElementById("team-category").value.trim()
            };

            if (!isEdit) {
                const sel = document.getElementById("team-initial-season").value;
                body.season = sel === "__new__" ? document.getElementById("team-new-season-name").value.trim() : sel;
            } else {
                body.id = team.id;
            }

            try {
                if (isEdit) await TeamsAPI.update(body);
                else await TeamsAPI.create(body);
                
                UI.toast(isEdit ? "Squadra aggiornata" : "Squadra creata", "success");
                modal.close();
                await this.refresh();
            } catch (err) {
                const errEl = document.getElementById("team-error");
                if (errEl) {
                    errEl.textContent = err.message;
                    errEl.classList.remove("hidden");
                }
            }
        }, this.sig());
    },

    openSeasonMappingModal: function(team) {
        const modal = UI.modal({
            title: `Nuova Stagione per ${team.name}`,
            body: TeamsView.seasonMappingModal(team),
            footer: `
                <button class="btn-dash ghost" id="mapping-cancel">Annulla</button>
                <button class="btn-dash primary" id="mapping-save">AGGIUNGI STAGIONE</button>
            `
        });

        document.getElementById("mapping-cancel")?.addEventListener("click", () => modal.close(), this.sig());

        document.getElementById("mapping-save")?.addEventListener("click", async () => {
            const seasonStr = document.getElementById("season-name").value.trim();
            const isActive = document.getElementById("season-active").checked ? 1 : 0;

            if (!seasonStr) {
                const errEl = document.getElementById("season-error");
                if (errEl) { errEl.textContent = "Inserisci il nome della stagione."; errEl.classList.remove("hidden"); }
                return;
            }

            try {
                await TeamsAPI.addSeason({ team_id: team.id, season: seasonStr, is_active: isActive });
                UI.toast("Stagione aggiunta", "success");
                modal.close();
                await this.refresh();
            } catch (err) {
                const errEl = document.getElementById("season-error");
                if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
            }
        }, this.sig());
    },

    openBulkSeasonModal: function() {
        const modal = UI.modal({
            title: "Nuova Stagione (Multipla)",
            body: TeamsView.bulkSeasonModal(this._teams),
            footer: `
                <button class="btn-dash ghost" id="bulk-cancel">Annulla</button>
                <button class="btn-dash primary" id="bulk-save">CREA STAGIONE</button>
            `
        });

        document.getElementById("bulk-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        
        document.getElementById("bulk-select-all")?.addEventListener("click", () => {
            document.querySelectorAll(".bulk-team-cb").forEach(cb => cb.checked = true);
        }, this.sig());

        document.getElementById("bulk-deselect-all")?.addEventListener("click", () => {
            document.querySelectorAll(".bulk-team-cb").forEach(cb => cb.checked = false);
        }, this.sig());

        document.getElementById("bulk-save")?.addEventListener("click", async () => {
            const seasonStr = document.getElementById("bulk-season-name").value.trim();
            const isActive = document.getElementById("bulk-season-active").checked ? 1 : 0;
            const selectedIds = [...document.querySelectorAll(".bulk-team-cb:checked")].map(cb => cb.value);

            if (!seasonStr) {
                UI.toast("Il nome della stagione è obbligatorio", "warning"); return;
            }
            if (selectedIds.length === 0) {
                UI.toast("Seleziona almeno una squadra", "warning"); return;
            }

            try {
                UI.loading(true);
                let errors = [];
                for (const teamId of selectedIds) {
                    try {
                        await TeamsAPI.addSeason({ team_id: teamId, season: seasonStr, is_active: isActive });
                    } catch (err) {
                        errors.push(err.message);
                    }
                }
                
                if (errors.length > 0) UI.toast(`Errori in alcune associazioni: ${errors.length}`, "warning");
                else UI.toast(`Stagione "${seasonStr}" creata con successo`, "success");
                
                modal.close();
                await this.refresh();
            } finally {
                UI.loading(false);
            }
        }, this.sig());
    },
    
    openAddTeamToSeasonModal: function(seasonName) {
        // Find teams NOT yet associated
        const associatedIds = new Set(this.groupSeasons()[seasonName]?.map(e => e.teamId) || []);
        const availableTeams = this._teams.filter(t => !associatedIds.has(t.id));

        if (availableTeams.length === 0) {
            UI.toast("Tutte le squadre sono già associate a questa stagione", "info"); return;
        }

        const modal = UI.modal({
            title: `Aggiungi squadre a ${seasonName}`,
            body: TeamsView.bulkSeasonModal(availableTeams), // Reuse bulk template
            footer: `
                <button class="btn-dash ghost" id="add-cancel">Annulla</button>
                <button class="btn-dash primary" id="add-save">AGGIUNGI</button>
            `
        });

        // Hide the season name input since it's fixed
        const nameGroup = document.getElementById("bulk-season-name").closest(".form-group");
        if (nameGroup) nameGroup.style.display = 'none';

        document.getElementById("add-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        
        document.getElementById("add-save")?.addEventListener("click", async () => {
            const selectedIds = [...document.querySelectorAll(".bulk-team-cb:checked")].map(cb => cb.value);
            if (selectedIds.length === 0) return;

            try {
                UI.loading(true);
                for (const teamId of selectedIds) {
                    await TeamsAPI.addSeason({ team_id: teamId, season: seasonName, is_active: 1 });
                }
                UI.toast("Squadre associate con successo", "success");
                modal.close();
                await this.refresh();
            } catch (err) {
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
            }
        }, this.sig());
    }
};

export default Squadre;
window.Squadre = Squadre;

