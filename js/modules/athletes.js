/**
 * Athletes — Modulo Orchestratore Atleti (ES Module)
 * Gestisce l'integrazione tra API, View e componenti specializzati (Wizard, Metrics).
 */

import { AthletesAPI } from './athletes/AthletesAPI.js';
import { AthletesView } from './athletes/AthletesView.js';
import { AthletesWizard } from './athletes/AthletesWizard.js';
import { AthletesMetrics } from './athletes/AthletesMetrics.js';

const Athletes = (() => {
    let abortController = new AbortController();
    let athletesData = [];
    let teamsData = [];
    let selectedTeamId = "";
    let currentTab = "anagrafica";
    let activeAthleteId = null;
    let isBulkMode = false;
    let selectedIds = new Set();

    /**
     * Inizializzazione del modulo
     */
    async function init() {
        UI.loading(true);
        const app = document.getElementById("app");
        if (!app) return;

        // Recupero stato filtri persistente
        if (typeof FilterState !== "undefined") {
            selectedTeamId = FilterState.restore("athletes", "team", "");
            currentTab = FilterState.restore("athletes", "tab", "anagrafica");
        }

        try {
            // Caricamento dati iniziali
            [teamsData, athletesData] = await Promise.all([
                AthletesAPI.getTeams(),
                AthletesAPI.getLightList()
            ]);

            const params = Router.getParams();
            if (params.id) {
                await renderProfile(params.id);
            } else {
                renderDashboard();
            }

        } catch (e) {
            app.innerHTML = Utils.emptyState("Errore caricamento atleti", e.message);
            UI.toast("Errore nel caricamento del modulo atleti", "error");
        } finally {
            UI.loading(false);
        }
    }

    /**
     * Renderizza la Dashboard (Lista Atleti)
     */
    function renderDashboard() {
        const app = document.getElementById("app");
        app.innerHTML = AthletesView.dashboard(teamsData);
        
        // Applicazione filtri iniziali
        filterAndRenderGrid();

        // Event Listeners
        addDashboardListeners();
        
        // Reset breadcrumb
        Router.updateHash(Router.getCurrentRoute(), {});
        activeAthleteId = null;
    }

    /**
     * Aggiunge listeners alla dashboard
     */
    function addDashboardListeners() {
        const signal = abortController.signal;

        document.getElementById("new-athlete-btn")?.addEventListener("click", () => {
            AthletesWizard.openCreate(teamsData, () => {
                refreshData();
            });
        }, { signal });

        document.getElementById("athlete-search")?.addEventListener("input", (e) => {
            debounce(() => filterAndRenderGrid(e.target.value), 300);
        }, { signal });

        document.getElementById("team-filter")?.addEventListener("change", (e) => {
            selectedTeamId = e.target.value;
            if (typeof FilterState !== "undefined") FilterState.save("athletes", "team", selectedTeamId);
            filterAndRenderGrid();
        }, { signal });

        document.getElementById("reset-filters")?.addEventListener("click", () => {
            selectedTeamId = "";
            document.getElementById("athlete-search").value = "";
            document.getElementById("team-filter").value = "";
            filterAndRenderGrid();
        }, { signal });
    }

    /**
     * Filtra e renderizza la griglia atleti
     */
    function filterAndRenderGrid(searchTerm = "") {
        const grid = document.getElementById("athletes-grid");
        if (!grid) return;

        searchTerm = searchTerm.toLowerCase();
        
        const filtered = athletesData.filter(a => {
            const matchesTeam = !selectedTeamId || String(a.team_id) === String(selectedTeamId);
            const matchesSearch = !searchTerm || 
                a.full_name.toLowerCase().includes(searchTerm) || 
                (a.role && a.role.toLowerCase().includes(searchTerm)) ||
                (a.jersey_number && String(a.jersey_number).includes(searchTerm));
            
            return matchesTeam && matchesSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = Utils.emptyState("Nessun atleta trovato", "Prova a cambiare i filtri.");
            return;
        }

        grid.innerHTML = filtered.map(a => AthletesView.athleteCard(a, selectedIds.has(a.id))).join('');

        // Listeners sulle card
        grid.querySelectorAll(".athlete-card").forEach(card => {
            card.onclick = () => {
                if (isBulkMode) {
                    toggleSelection(card.dataset.id);
                } else {
                    renderProfile(card.dataset.id);
                }
            };
        });
    }

    /**
     * Renderizza il profilo di un singolo atleta
     */
    async function renderProfile(id) {
        activeAthleteId = id;
        UI.loading(true);
        const app = document.getElementById("app");

        try {
            const athlete = await AthletesAPI.getById(id);
            app.innerHTML = AthletesView.profileLayout(athlete, currentTab);

            // Listeners per Tab
            addProfileListeners(athlete);
            
            // Renderizza tab iniziale
            switchTab(currentTab, athlete);

            // Update URL
            Router.updateHash(Router.getCurrentRoute(), { id });

        } catch (e) {
            UI.toast("Atleta non trovato", "error");
            renderDashboard();
        } finally {
            UI.loading(false);
        }
    }

    function addProfileListeners(athlete) {
        const backBtn = document.getElementById("back-to-list");
        if (backBtn) backBtn.onclick = () => renderDashboard();

        document.querySelectorAll(".athlete-tab-btn").forEach(btn => {
            btn.onclick = () => {
                const tab = btn.dataset.tab;
                switchTab(tab, athlete);
            };
        });
    }

    async function switchTab(tab, athlete) {
        currentTab = tab;
        if (typeof FilterState !== "undefined") FilterState.save("athletes", "tab", tab);

        // UI Update: toggle active state on buttons
        document.querySelectorAll(".athlete-tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === tab);
        });

        // Toggle panel visibility
        document.querySelectorAll(".athlete-tab-panel").forEach(panel => {
            panel.style.display = panel.id === `tab-panel-${tab}` ? 'block' : 'none';
        });

        const panel = document.getElementById(`tab-panel-${tab}`);
        if (!panel) return;

        // Lazy load content per tab
        switch (tab) {
            case 'anagrafica':
                panel.innerHTML = AthletesView.tabAnagrafica(athlete);
                break;
            case 'documenti':
                panel.innerHTML = AthletesView.tabDocumenti(athlete, true);
                this._addDocumentListeners(athlete);
                break;
            case 'metrics':
                await AthletesMetrics.render(panel, athlete.id);
                break;
            // Add other tabs here...
        }
    }

    async function refreshData() {
        athletesData = await AthletesAPI.getLightList();
        if (!activeAthleteId) filterAndRenderGrid();
    }

    let debounceTimer;
    function debounce(func, delay) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(func, delay);
    }

    /**
     * Teardown del modulo
     */
    function destroy() {
        abortController.abort();
        abortController = new AbortController();
        athletesData = [];
        teamsData = [];
        selectedIds.clear();
    }

    // Export internal functions needed for event listeners in View
    return { init, destroy };
})();

// Esportazione per il router
export default Athletes;
window.Athletes = Athletes;
