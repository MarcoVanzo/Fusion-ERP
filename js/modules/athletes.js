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

    function getVariantFromRoute() {
        if (typeof Router === "undefined") return 'anagrafica';
        const route = Router.getCurrentRoute();
        if (route === 'athlete-documents') return 'documenti';
        if (route === 'athlete-metrics') return 'metrics';
        if (route === 'athlete-payments') return 'pagamenti';
        return 'anagrafica';
    }

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
                const initialTab = getVariantFromRoute();
                await renderProfile(params.id, initialTab);
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
        const variant = getVariantFromRoute();

        app.innerHTML = AthletesView.dashboard(teamsData, variant);
        
        // Applicazione filtri iniziali
        filterAndRenderGrid("", variant);

        // Event Listeners
        addDashboardListeners(variant);
        
        // Reset breadcrumb
        Router.updateHash(Router.getCurrentRoute(), {});
        activeAthleteId = null;
    }

    /**
     * Aggiunge listeners alla dashboard
     */
    function addDashboardListeners(variant = 'anagrafica') {
        const signal = abortController.signal;
        const getSearch = () => document.getElementById("athlete-search")?.value || "";

        document.getElementById("new-athlete-btn")?.addEventListener("click", () => {
            AthletesWizard.openCreate(teamsData, () => {
                refreshData(variant);
            });
        }, { signal });

        document.getElementById("athlete-search")?.addEventListener("input", (e) => {
            debounce(() => filterAndRenderGrid(e.target.value, variant), 300);
        }, { signal });

        document.getElementById("team-filter")?.addEventListener("change", (e) => {
            selectedTeamId = e.target.value;
            if (typeof FilterState !== "undefined") FilterState.save("athletes", "team", selectedTeamId);
            filterAndRenderGrid(getSearch(), variant);
        }, { signal });

        document.getElementById("reset-filters")?.addEventListener("click", () => {
            selectedTeamId = "";
            if (document.getElementById("athlete-search")) document.getElementById("athlete-search").value = "";
            if (document.getElementById("team-filter")) document.getElementById("team-filter").value = "";
            if (typeof FilterState !== "undefined") FilterState.save("athletes", "team", "");
            filterAndRenderGrid("", variant);
        }, { signal });
    }

    /**
     * Filtra e renderizza la griglia atleti
     */
    function filterAndRenderGrid(searchTerm = "", variant = 'anagrafica') {
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

        grid.innerHTML = filtered.map(a => AthletesView.athleteCard(a, selectedIds.has(a.id), variant)).join('');

        // Listeners sulle card
        grid.querySelectorAll(".athlete-card").forEach(card => {
            card.onclick = () => {
                if (isBulkMode) {
                    toggleSelection(card.dataset.id);
                } else {
                    renderProfile(card.dataset.id, variant === 'anagrafica' ? null : variant);
                }
            };
        });
    }

    /**
     * Renderizza il profilo di un singolo atleta
     */
    async function renderProfile(id, initialTab = null) {
        activeAthleteId = id;
        currentTab = initialTab || FilterState.restore("athletes", "tab", "anagrafica");
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

        document.querySelectorAll("#athlete-tab-bar .fusion-tab").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.dataset.tab;
                switchTab(target, athlete);
            });
        });
    }

    async function switchTab(tab, athlete) {
        currentTab = tab;
        if (typeof FilterState !== "undefined") FilterState.save("athletes", "tab", tab);

        // UI Update: toggle active state on buttons
        document.querySelectorAll("#athlete-tab-bar .fusion-tab").forEach(btn => {
            btn.classList.remove("active");
            if (btn.dataset.tab === currentTab) btn.classList.add("active");
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
            case 'pagamenti':
                panel.innerHTML = AthletesView.tabPagamenti(athlete);
                break;
            case 'documenti':
                panel.innerHTML = AthletesView.tabDocumenti(athlete, true);
                addDocumentListeners(athlete);
                break;
            case 'metrics':
                await AthletesMetrics.render(panel, athlete.id);
                break;
            // Add other tabs here...
        }
    }

    function addDocumentListeners(athlete) {
        const docTypes = ['contract-file', 'id-doc-front', 'id-doc-back', 'cf-doc-front', 'cf-doc-back', 'med-cert'];
        docTypes.forEach(type => {
            const btn = document.getElementById(`upload-${type}-btn`);
            const input = document.getElementById(`upload-${type}-input`);
            if (btn && input) {
                btn.onclick = () => input.click();
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    UI.loading(true);
                    try {
                        await AthletesAPI.uploadDocument(athlete.id, type, file);
                        UI.toast("Documento caricato con successo!", "success");
                        // Ricarica i dati dell'atleta e aggiorna il tab
                        const updatedAthlete = await AthletesAPI.getById(athlete.id);
                        switchTab(currentTab, updatedAthlete);
                    } catch (err) {
                        UI.toast(err.message || "Errore durante l'upload", "error");
                    } finally {
                        UI.loading(false);
                    }
                };
            }
        });
    }

    async function refreshData(variant = 'anagrafica') {
        athletesData = await AthletesAPI.getLightList();
        if (!activeAthleteId) filterAndRenderGrid("", variant);
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
