/**
 * Tournaments Module — Main Orchestrator
 * Fusion ERP v1.1
 */
import TournamentsAPI from './tournaments/TournamentsAPI.js';
import TournamentsView from './tournaments/TournamentsView.js';

const Tournaments = {
    _abort: new AbortController(),
    _tournaments: [],
    _currentData: null,
    _teams: [],

    /** signal() helper for event listeners */
    sig: function() { return { signal: this._abort.signal }; },

    destroy: function() {
        this._abort.abort();
        this._abort = new AbortController();
    },

    init: async function() {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        // Reset main container style (legacy fixes)
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
            mainContent.style.padding = "0";
            mainContent.style.backgroundColor = "#0a0a0c";
        }

        appContainer.innerHTML = TournamentsView.skeleton();
        
        try {
            this.attachListEvents();
            await this.loadList();
            this._teams = await TournamentsAPI.getTeams();
        } catch (err) {
            console.error("[Tournaments] Init error:", err);
            const content = document.getElementById("trm-list-content");
            if(content) content.innerHTML = Utils.emptyState("Errore caricamento", err.message);
        }
    },

    loadList: async function() {
        const listContent = document.getElementById("trm-list-content");
        if (!listContent) return;

        try {
            this._tournaments = await TournamentsAPI.list();
            listContent.innerHTML = TournamentsView.list(this._tournaments);

            // Event delegation for cards and buttons
            listContent.onclick = async (e) => {
                const target = e.target;
                
                // 1. Copy Action
                const btnCopy = target.closest(".btn-copy-trm");
                if (btnCopy) {
                    e.stopPropagation();
                    const id = btnCopy.dataset.id;
                    try {
                        UI.loading(true);
                        await TournamentsAPI.duplicate(id);
                        Store.invalidate("tournaments");
                        UI.toast("Torneo copiato con successo", "success");
                        await this.loadList();
                    } catch (err) {
                        UI.toast(err.message, "error");
                    } finally {
                        UI.loading(false);
                    }
                    return;
                }

                // 2. Delete Action
                const btnDelete = target.closest(".btn-delete-trm");
                if (btnDelete) {
                    e.stopPropagation();
                    const id = btnDelete.dataset.id;
                    UI.confirm(
                        "Sei sicuro di voler eliminare questo torneo? L'azione è irreversibile.",
                        async () => {
                            try {
                                UI.loading(true);
                                await TournamentsAPI.delete(id);
                                Store.invalidate("tournaments");
                                UI.toast("Torneo eliminato", "success");
                                await this.loadList();
                            } catch (err) {
                                UI.toast(err.message, "error");
                            } finally {
                                UI.loading(false);
                            }
                        }
                    );
                    return;
                }

                // 3. Open Detail
                const card = target.closest(".trm-card");
                if (card) {
                    this.openDetail(card.dataset.id);
                }
            };
        } catch (err) {
            listContent.innerHTML = `<div style="text-align:center; grid-column:1/-1; color:#ef4444; padding:20px;">${Utils.escapeHtml(err.message)}</div>`;
        }
    },

    attachListEvents: function() {
        document.getElementById("btn-new-tournament")?.addEventListener("click", () => this.openTournamentModal(), this.sig());
    },

    openDetail: async function(id) {
        document.getElementById("trm-list-view").style.display = "none";
        const detailView = document.getElementById("trm-detail-view");
        detailView.style.display = "block";
        detailView.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.5;">Caricamento dettagli...</div>';

        try {
            this._currentData = await TournamentsAPI.get(id);
            detailView.innerHTML = TournamentsView.detail(this._currentData);
            this.attachDetailEvents(detailView, id);
        } catch (err) {
            UI.toast(err.message, "error");
            this.closeDetail();
        }
    },

    closeDetail: function() {
        document.getElementById("trm-detail-view").style.display = "none";
        document.getElementById("trm-list-view").style.display = "block";
        this._currentData = null;
        this.loadList();
    },

    attachDetailEvents: function(container, tournamentId) {
        container.querySelector("#btn-back-trm")?.addEventListener("click", () => this.closeDetail(), this.sig());
        container.querySelector("#btn-edit-trm")?.addEventListener("click", () => this.openTournamentModal(this._currentData.tournament), this.sig());
        
        container.querySelector("#btn-add-expense")?.addEventListener("click", () => this.openExpenseModal(tournamentId), this.sig());

        container.querySelectorAll(".btn-delete-expense").forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                UI.confirm("Eliminare questa voce di spesa?", async () => {
                    try {
                        UI.loading(true);
                        await TournamentsAPI.deleteExpense(id);
                        Store.invalidate("tournaments");
                        UI.toast("Spesa eliminata", "success");
                        await this.openDetail(tournamentId);
                    } catch (err) {
                        UI.toast(err.message, "error");
                    } finally {
                        UI.loading(false);
                    }
                });
            };
        });
        
        container.querySelector("#btn-save-roster")?.addEventListener("click", async (e) => {
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = "Salvataggio...";
            
            const attendees = [];
            container.querySelectorAll(".trm-roster-cb").forEach(cb => {
                attendees.push({
                    athlete_id: cb.dataset.id,
                    status: cb.checked ? "confirmed" : "absent"
                });
            });

            try {
                await TournamentsAPI.updateRoster(tournamentId, attendees);
                Store.invalidate("tournaments");
                UI.toast("Roster salvato", "success");
                this.openDetail(tournamentId); // Refresh
            } catch (err) {
                UI.toast(err.message, "error");
                btn.disabled = false;
                btn.textContent = "Salva Roster";
            }
        }, this.sig());

        container.querySelectorAll(".btn-edit-match").forEach(btn => {
            btn.addEventListener("click", () => {
                const matchJson = btn.dataset.json;
                try {
                    const matchData = JSON.parse(matchJson);
                    this.openMatchModal(matchData);
                } catch(e) {
                    console.error("Match JSON parse error", e);
                }
            }, this.sig());
        });

        // Tabs
        container.querySelectorAll(".res-view-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                container.querySelectorAll(".res-view-btn").forEach(b => b.classList.remove("active"));
                container.querySelectorAll(".trm-panel").forEach(p => p.classList.remove("active"));
                btn.classList.add("active");
                container.querySelector("#" + btn.dataset.target)?.classList.add("active");
            }, this.sig());
        });
    },

    openTournamentModal: function(tournament = null) {
        const modal = UI.modal({
            title: (tournament ? "Modifica" : "Nuovo") + " Torneo",
            body: TournamentsView.tournamentModal(tournament, this._teams),
            footer: '<button class="btn-dash ghost" id="modal-cancel">Annulla</button><button class="btn-dash primary" id="modal-save">Salva</button>'
        });

        document.getElementById("modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("modal-save")?.addEventListener("click", async () => {
            const data = {
                id: document.getElementById("tm-id").value,
                team_id: document.getElementById("tm-team").value,
                title: document.getElementById("tm-title").value.trim(),
                event_date: document.getElementById("tm-start").value,
                event_end: document.getElementById("tm-end").value || null,
                location_name: document.getElementById("tm-loc").value.trim(),
                website_url: document.getElementById("tm-url").value.trim(),
                fee_per_athlete: parseFloat(document.getElementById("tm-fee").value) || 0,
                accommodation_info: document.getElementById("tm-notes").value.trim()
            };

            if (!data.team_id || !data.title || !data.event_date) {
                UI.toast("I campi Squadra, Titolo e Inizio sono obbligatori.", "warning");
                return;
            }

            try {
                UI.loading(true);
                const res = await TournamentsAPI.save(data);
                Store.invalidate("tournaments");
                UI.toast("Torneo salvato", "success");
                modal.close();
                if (this._currentData) {
                    this.openDetail(res.id || data.id);
                } else {
                    this.loadList();
                }
            } catch (err) {
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
            }
        }, this.sig());
    },

    openMatchModal: function(matchData = null) {
        if (!this._currentData) return;
        
        const modal = UI.modal({
            title: (matchData ? "Modifica" : "Nuovo") + " Match",
            body: TournamentsView.matchModal(matchData),
            footer: '<button class="btn-dash ghost" id="modal-cancel">Annulla</button><button class="btn-dash primary" id="modal-save">Salva</button>'
        });

        document.getElementById("modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("modal-save")?.addEventListener("click", async () => {
            const data = {
                id: document.getElementById("mm-id").value,
                event_id: this._currentData.tournament.id,
                opponent_name: document.getElementById("mm-opp").value.trim(),
                match_time: document.getElementById("mm-time").value,
                court_name: document.getElementById("mm-court").value.trim(),
                our_score: parseInt(document.getElementById("mm-our").value) || 0,
                opponent_score: parseInt(document.getElementById("mm-opps").value) || 0,
                status: 'played'
            };

            if (!data.opponent_name || !data.match_time) {
                UI.toast("Avversario e Data sono obbligatori.", "warning");
                return;
            }

            try {
                UI.loading(true);
                await TournamentsAPI.saveMatch(data);
                UI.toast("Match salvato", "success");
                modal.close();
                this.openDetail(this._currentData.tournament.id);
            } catch (err) {
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
            }
        }, this.sig());
    },

    openExpenseModal: function(tournamentId) {
        const modal = UI.modal({
            title: "Nuova Spesa",
            body: TournamentsView.expenseModal(),
            footer: '<button class="btn-dash ghost" id="modal-cancel">Annulla</button><button class="btn-dash primary" id="modal-save">Salva</button>'
        });

        document.getElementById("modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("modal-save")?.addEventListener("click", async () => {
            const data = {
                event_id: tournamentId,
                description: document.getElementById("ex-desc").value.trim(),
                amount: parseFloat(document.getElementById("ex-amount").value) || 0
            };

            if (!data.description || data.amount <= 0) {
                UI.toast("Descrizione e Importo sono obbligatori.", "warning");
                return;
            }

            try {
                UI.loading(true);
                await TournamentsAPI.saveExpense(data);
                Store.invalidate("tournaments");
                UI.toast("Spesa salvata", "success");
                modal.close();
                this.openDetail(tournamentId);
            } catch (err) {
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
            }
        }, this.sig());
    }
};

export default Tournaments;
window.Tournaments = Tournaments;
