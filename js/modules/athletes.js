/**
 * Athletes — Modulo Orchestratore Atleti (ES Module)
 * Gestisce l'integrazione tra API, View e componenti specializzati (Wizard, Metrics).
 */

import { AthletesAPI } from './athletes/AthletesAPI.js?v=2';
import { AthletesView } from './athletes/AthletesView.js?v=2';
import { AthletesWizard } from './athletes/AthletesWizard.js?v=2';
import { AthletesMetrics } from './athletes/AthletesMetricsV2.js?v=5';

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
            const user = Auth.user();

            if (user && user.role === 'atleta') {
                // Se è un atleta, cerchiamo il suo ID atleta tramite il suo user_id
                // In un sistema reale, potremmo avere un endpoint dedicato o averlo nel JWT
                // Supponiamo che il backend restituisca l'atleta collegato se richiesto
                const athlete = await AthletesAPI.getByUserId(user.id);
                if (athlete) {
                    await renderProfile(athlete.id, initialTab);
                } else {
                    app.innerHTML = Utils.emptyState("Profilo non trovato", "Il tuo account non è ancora collegato a un'anagrafica atleta.");
                }
            } else if (params.id) {
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
            const seasonIds = a.team_season_ids ? String(a.team_season_ids).split(',') : [];
            const matchesTeam = !selectedTeamId || 
                                String(a.team_id) === String(selectedTeamId) || 
                                seasonIds.includes(String(selectedTeamId));
            
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
            const id = card.dataset.id;
            
            // Edit rapido dalla lista
            const editBtn = card.querySelector(".quick-edit-btn");
            if (editBtn) {
                editBtn.onclick = (e) => {
                    e.stopPropagation();
                    const athlete = athletesData.find(a => String(a.id) === String(id));
                    if (athlete) renderEditForm(athlete);
                };
            }

            card.onclick = () => {
                if (isBulkMode) {
                    toggleSelection(id);
                } else {
                    renderProfile(id, variant === 'anagrafica' ? null : variant);
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
        const signal = abortController.signal;
        const backBtn = document.getElementById("back-to-list");
        if (backBtn) backBtn.onclick = () => renderDashboard();

        const editBtn = document.getElementById("edit-athlete-btn");
        if (editBtn) {
            editBtn.onclick = () => renderEditForm(athlete);
        }

        const genUserBtn = document.getElementById("generate-user-btn");
        if (genUserBtn) {
            genUserBtn.onclick = async () => {
                if (!confirm(`Vuoi generare un accesso per ${athlete.full_name}? Verrà inviata una mail a ${athlete.email}`)) return;
                UI.loading(true);
                try {
                    await AthletesAPI.generateUser(athlete.id);
                    UI.toast("Utente generato correttamente", "success");
                    await renderProfile(athlete.id, currentTab);
                } catch (e) {
                    UI.toast(e.message, "error");
                } finally {
                    UI.loading(false);
                }
            };
        }

        document.querySelectorAll("#athlete-tab-bar .fusion-tab").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.dataset.tab;
                switchTab(target, athlete);
            }, { signal });
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
                // Listener rimosso da qui perché spostato in addProfileListeners (header)
                // ma manteniamo addAnagraficaListeners per altri controlli (es. toggle active)
                addAnagraficaListeners(athlete);
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
            case 'subusers':
                await renderSubUsers(panel, athlete);
                break;
            // Add other tabs here...
        }
    }

    function addAnagraficaListeners(athlete) {
        const signal = abortController.signal;
        // edit-athlete-btn listener rimosso perché gestito in addProfileListeners (header)

        document.getElementById("toggle-active-btn")?.addEventListener("click", async () => {
            UI.loading(true);
            try {
                const newState = athlete.is_active ? 0 : 1;
                await AthletesAPI.update({ id: athlete.id, is_active: newState });
                UI.toast(`Atleta ${newState ? 'attivata' : 'disattivata'}`, "success");
                const updated = await AthletesAPI.getById(athlete.id);
                switchTab('anagrafica', updated);
            } catch (e) {
                UI.toast(e.message, "error");
            } finally {
                UI.loading(false);
            }
        }, { signal });
    }

    function renderEditForm(athlete) {
        const app = document.getElementById("app");
        app.innerHTML = AthletesView.athleteForm(athlete, teamsData);

        document.getElementById("cancel-form")?.addEventListener("click", () => renderProfile(athlete.id));
        document.getElementById("cancel-form-btn")?.addEventListener("click", () => renderProfile(athlete.id));

        document.getElementById("athlete-edit-form")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Handle multi-team checkboxes
            const teamIds = Array.from(e.target.querySelectorAll('input[name="team_season_ids[]"]:checked')).map(cb => cb.value);
            data.team_season_ids = teamIds;

            UI.loading(true);
            try {
                await AthletesAPI.update(data);
                UI.toast("Atleta aggiornata con successo", "success");
                renderProfile(athlete.id);
            } catch (err) {
                const errEl = document.getElementById("form-error");
                if (errEl) {
                    errEl.textContent = err.message;
                    errEl.classList.remove("hidden");
                }
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
            }
        });

        // Autocomplete for address if needed (reusing logic from wizard if applicable)
        if (typeof google !== 'undefined') {
            const input = document.querySelector('input[name="residence_address"]');
            if (input) {
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
                    if (city) {
                        const cityInput = document.querySelector('input[name="residence_city"]');
                        if (cityInput) cityInput.value = city;
                    }
                });
            }
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
