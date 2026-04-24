/**
 * Athletes — Modulo Orchestratore Atleti (ES Module)
 * Gestisce l'integrazione tra API, View e componenti specializzati (Wizard, Metrics).
 */

import { AthletesAPI } from './athletes/AthletesAPI.js?v=3';
import { AthletesView } from './athletes/AthletesView.js?v=10';
import { AthletesWizard } from './athletes/AthletesWizard.js?v=2';
import { AthletesMetrics } from './athletes/AthletesMetricsV2.js?v=5';
import { AthleteHealth } from './athletes/AthleteHealth.js?v=1776199943';
import { AthletesValdLink } from './athletes/AthletesValdLink.js?v=1';
import TransportAPI from './transport/TransportAPI.js';

const Athletes = (() => {
    let abortController = new AbortController();
    let athletesData = [];
    let teamsData = [];
    let selectedTeamId = "";
    let currentTab = "anagrafica";
    let activeAthleteId = null;
    let isBulkMode = false;
    let selectedIds = new Set();
    let renderObserver = null;

    function getVariantFromRoute() {
        if (typeof Router === "undefined") return 'anagrafica';
        const route = Router.getCurrentRoute();
        if (route === 'athlete-documents') return 'documenti';
        if (route === 'athlete-metrics') return 'metrics';
        if (route === 'athlete-injuries') return 'infortuni';
        if (route === 'athlete-payments') return 'quote';
        if (route === 'athlete-attendances') return 'presenze';
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
            const initialTab = getVariantFromRoute();
            
            // Caricamento dati iniziali
            [teamsData, athletesData] = await Promise.all([
                AthletesAPI.getTeams(),
                AthletesAPI.getLightList()
            ]);

            // Per la vista quote, arricchisci con rimborsi trasporti reali
            if (initialTab === 'quote') {
                await enrichWithTransportReimbursements();
            }

            const params = Router.getParams();
            const user = App.getUser();

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
    async function renderDashboard() {
        const app = document.getElementById("app");
        const variant = getVariantFromRoute();

        // Per la vista quote, arricchisci con rimborsi trasporti reali
        if (variant === 'quote') {
            await enrichWithTransportReimbursements();
        }
        app.innerHTML = AthletesView.dashboard(teamsData, variant, athletesData);
        
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

        document.getElementById("manage-vald-links-btn")?.addEventListener("click", () => {
            AthletesValdLink.openModal(() => {
                refreshData(variant);
            });
        }, { signal });

        document.getElementById("bulk-quotes-btn")?.addEventListener("click", () => {
            if (!document.getElementById("bulk-quotes-modal")) {
                document.body.insertAdjacentHTML('beforeend', AthletesView.bulkQuotesModal(teamsData));
                bindBulkQuotesModal(variant);
            }
            document.getElementById("bulk-team-select").value = "";
            document.getElementById("bulk-athletes-container").innerHTML = '<div style="color:var(--color-text-muted); font-size:13px; text-align:center; padding:20px;">Seleziona una o più squadre per visualizzare le atlete.</div>';
            document.getElementById("bulk-selected-count").textContent = "0";
            document.getElementById("bulk-quota-iscrizione").value = "";
            document.getElementById("bulk-quota-vestiario").value = "";
            document.getElementById("bulk-quota-foresteria").value = "";
            document.getElementById("bulk-quota-deadline").value = "";
            document.getElementById("bulk-quotes-modal").style.display = "flex";
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
     * Binds bulk quotes modal events
     */
    function bindBulkQuotesModal(variant) {
        document.getElementById("close-bulk-modal")?.addEventListener("click", () => {
            document.getElementById("bulk-quotes-modal").style.display = "none";
        }, { signal: abortController.signal });
        document.getElementById("cancel-bulk-modal")?.addEventListener("click", () => {
            document.getElementById("bulk-quotes-modal").style.display = "none";
        }, { signal: abortController.signal });

        const teamSelect = document.getElementById("bulk-team-select");
        const container = document.getElementById("bulk-athletes-container");
        const countSpan = document.getElementById("bulk-selected-count");

        teamSelect.addEventListener("change", () => {
            const selectedTeams = Array.from(teamSelect.selectedOptions).map(opt => opt.value);
            if (selectedTeams.length === 0) {
                container.innerHTML = '<div style="color:var(--color-text-muted); font-size:13px; text-align:center; padding:20px;">Seleziona una o più squadre per visualizzare le atlete.</div>';
                countSpan.textContent = "0";
                return;
            }

            const filtered = athletesData.filter(a => {
                const seasonIds = a.team_season_ids ? String(a.team_season_ids).split(',') : [];
                return selectedTeams.includes(String(a.team_id)) || seasonIds.some(id => selectedTeams.includes(id));
            });

            if (filtered.length === 0) {
                container.innerHTML = '<div style="color:var(--color-text-muted); font-size:13px; text-align:center; padding:20px;">Nessuna atleta in queste squadre.</div>';
                countSpan.textContent = "0";
                return;
            }

            container.innerHTML = filtered.map(a => `
                <div style="display:flex; align-items:center; gap:12px; padding:8px 12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:6px;">
                    <input type="checkbox" class="bulk-athlete-cb" value="${a.id}" checked style="accent-color:var(--color-primary); width:16px; height:16px;">
                    <div style="flex:1;">
                        <div style="font-weight:600; color:var(--color-white); font-size:13px;">${Utils.escapeHtml(a.full_name)}</div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.4);">${Utils.escapeHtml(a.team_name)}</div>
                    </div>
                </div>
            `).join('');

            updateBulkSelectionCount();
            container.querySelectorAll('.bulk-athlete-cb').forEach(cb => cb.addEventListener('change', updateBulkSelectionCount, { signal: abortController.signal }));
        });

        function updateBulkSelectionCount() {
            countSpan.textContent = container.querySelectorAll('.bulk-athlete-cb:checked').length;
        }

        document.getElementById("save-bulk-modal")?.addEventListener("click", async () => {
            const selectedIds = Array.from(container.querySelectorAll('.bulk-athlete-cb:checked')).map(cb => cb.value);
            if (selectedIds.length === 0) {
                UI.toast("Seleziona almeno un'atleta.", "error");
                return;
            }

            const btnText = document.getElementById("save-bulk-modal-text");
            const originalText = btnText.textContent;
            btnText.textContent = "Salvataggio...";
            document.getElementById("save-bulk-modal").disabled = true;

            const iscrizioneTotal = document.getElementById("bulk-quota-iscrizione").value;
            const vestiario = document.getElementById("bulk-quota-vestiario").value;
            const foresteria = document.getElementById("bulk-quota-foresteria").value;
            const deadline = document.getElementById("bulk-quota-deadline").value;

            const payload = {};
            if (vestiario !== "") payload.quota_vestiario = vestiario;
            if (foresteria !== "") payload.quota_foresteria = foresteria;
            if (deadline !== "") payload.quota_payment_deadline = deadline;

            if (iscrizioneTotal !== "") {
                const total = parseFloat(iscrizioneTotal) || 0;
                payload.quota_iscrizione_rata1 = total / 2;
                payload.quota_iscrizione_rata2 = total / 2;
            }

            try {
                const promises = selectedIds.map(id => AthletesAPI.update({ id, ...payload }));
                await Promise.all(promises);
                
                UI.toast(`Quote assegnate a ${selectedIds.length} atlete con successo!`, "success");
                document.getElementById("bulk-quotes-modal").style.display = "none";
                refreshData(variant);
            } catch (err) {
                UI.toast("Errore durante l'assegnazione: " + err.message, "error");
            } finally {
                btnText.textContent = originalText;
                document.getElementById("save-bulk-modal").disabled = false;
            }
        });
    }

    /**
     * Filtra e renderizza la griglia atleti (con Chunked Rendering)
     */
    function filterAndRenderGrid(searchTerm = "", variant = 'anagrafica') {
        const grid = document.getElementById("athletes-grid");
        if (!grid) return;

        // Cleanup observer precedente se esiste
        if (renderObserver) {
            renderObserver.disconnect();
            renderObserver = null;
        }

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

        grid.innerHTML = ""; // Reset grid

        // Implementazione Chunked Rendering
        const CHUNK_SIZE = 30;
        let currentIndex = 0;

        const renderNextChunk = () => {
            const chunk = filtered.slice(currentIndex, currentIndex + CHUNK_SIZE);
            if (chunk.length === 0) return;

            // Rimuovi temporaneamente il sentinel observer se esiste
            const sentinel = grid.querySelector('.scroll-sentinel');
            if (sentinel) sentinel.remove();

            // Costruisci e inietta le card
            // FIX: Usare <tbody> come container temporaneo, perché <tr> dentro un <div>
            // viene eliminato dal parser HTML del browser, perdendo l'attributo data-id
            const fragment = document.createDocumentFragment();
            const tempTable = document.createElement('table');
            const tempBody = document.createElement('tbody');
            tempTable.appendChild(tempBody);
            tempBody.innerHTML = chunk.map(a => AthletesView.athleteCard(a, selectedIds.has(a.id), variant)).join('');
            
            Array.from(tempBody.children).forEach(card => {
                attachCardListeners(card, variant);
                fragment.appendChild(card);
            });

            grid.appendChild(fragment);
            currentIndex += CHUNK_SIZE;

            // Se ci sono ancora elementi, aggiungi il sentinel per l'observer
            if (currentIndex < filtered.length) {
                const newSentinel = document.createElement('div');
                newSentinel.className = 'scroll-sentinel';
                newSentinel.style.height = '1px';
                newSentinel.style.width = '100%';
                grid.appendChild(newSentinel);
                
                if (!renderObserver) {
                    renderObserver = new IntersectionObserver((entries) => {
                        if (entries[0].isIntersecting) {
                            renderNextChunk();
                        }
                    }, { rootMargin: '200px' });
                }
                renderObserver.observe(newSentinel);
            }
        };

        renderNextChunk();
    }

    function attachCardListeners(card, variant) {
        const id = card.dataset.id;
        
        // Edit rapido dalla lista
        const editBtn = card.querySelector(".quick-edit-btn");
        if (editBtn) {
            editBtn.onclick = (e) => {
                e.stopPropagation();
                if (variant === 'quote') {
                    renderProfile(id, 'quote');
                } else if (variant === 'infortuni') {
                    const athlete = athletesData.find(a => String(a.id) === String(id));
                    if (athlete) AthleteHealth.openNewInjury(athlete);
                } else {
                    const athlete = athletesData.find(a => String(a.id) === String(id));
                    if (athlete) renderEditForm(athlete);
                }
            };
        }

        // Inline editing per le quote (se nel tab quote)
        if (variant === 'quote') {
            card.querySelectorAll(".quota-inline-input").forEach(input => {
                input.onclick = (e) => e.stopPropagation();
                input.onchange = async (e) => {
                    const { field } = e.target.dataset;
                    const val = e.target.value;
                    try {
                        await AthletesAPI.update({ id, [field]: val });
                        UI.toast("Quota salvata", "success", 1000);
                        await refreshData('quote');
                    } catch (err) {
                        UI.toast(err.message, "error");
                    }
                };
            });

            card.querySelectorAll(".quota-status-toggle").forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const { field, value } = btn.dataset;
                    try {
                        await AthletesAPI.update({ id, [field]: value });
                        UI.toast("Pagamento aggiornato", "success", 1000);
                        await refreshData('quote');
                    } catch (err) {
                        UI.toast(err.message, "error");
                    }
                };
            });
        }

        card.onclick = () => {
            if (isBulkMode) {
                toggleSelection(id);
            } else {
                renderProfile(id, variant === 'anagrafica' ? null : variant);
            }
        };
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
            const user = App.getUser();
            const athlete = await AthletesAPI.getById(id);
            app.innerHTML = AthletesView.profileLayout(athlete, currentTab, user);

            // Listeners per Tab
            addProfileListeners(athlete);
            
            // Renderizza tab iniziale
            switchTab(currentTab, athlete);

            // Update URL
            Router.updateHash(Router.getCurrentRoute(), { id });

        } catch (e) {
            console.error('[Athletes] renderProfile failed:', e?.message || e);
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
                    Store.invalidate("auth");
                    Store.invalidate("athletes");
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
            case 'quote': {
                let transportReimbursement = 0;
                let tournamentHistory = [];
                try {
                    const [transportHist, tournamentHist] = await Promise.all([
                        AthletesAPI.getTransportHistory(athlete.id),
                        AthletesAPI.getTournamentHistory(athlete.id)
                    ]);
                    transportReimbursement = (transportHist || []).length * 2.50;
                    tournamentHistory = tournamentHist || [];
                } catch (e) { /* fallback silenzioso */ }
                panel.innerHTML = AthletesView.tabQuote(athlete, App.getUser().role === 'admin', transportReimbursement, tournamentHistory);
                addQuoteListeners(athlete);
                break;
            }

            case 'documenti':
                panel.innerHTML = AthletesView.tabDocumenti(athlete, true);
                addDocumentListeners(athlete);
                break;
            case 'metrics':
                await AthletesMetrics.render(panel, athlete.id);
                break;
            case 'infortuni':
                await AthleteHealth.render(panel, athlete);
                break;
            case 'subusers':
                await renderSubUsers(panel, athlete);
                break;
            case 'trasporti':
                panel.innerHTML = '<div class="loader-spinner"></div>';
                try {
                    const history = await AthletesAPI.getTransportHistory(athlete.id);
                    panel.innerHTML = AthletesView.tabTrasporti(athlete, history);
                } catch (e) {
                    panel.innerHTML = Utils.emptyState("Errore caricamento trasporti", e.message);
                }
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


    function addQuoteListeners(athlete) {
        const form = document.getElementById("athlete-quotas-form");
        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                // checkbox non spuntate non compaiono in FormData
                const checkboxes = ['quota_iscrizione_rata1_paid', 'quota_iscrizione_rata2_paid', 'quota_vestiario_paid', 'quota_foresteria_paid'];
                checkboxes.forEach(cb => {
                    data[cb] = data[cb] ? 1 : 0;
                });

                // Rimuovi finti campi transport e altri per pulire i dati
                delete data.quota_trasporti;
                delete data.quota_trasporti_paid;

                // Estrai e salva dinamicamente il pagamento dei tornei (tabella separata event_attendees)
                const tournamentPromises = Array.from(document.querySelectorAll('.tournament-payment-cb')).map(cb => {
                    return AthletesAPI.setTournamentPayment({
                        athlete_id: athlete.id,
                        event_id: cb.dataset.eventId,
                        has_paid: cb.checked ? 1 : 0
                    });
                });

                UI.loading(true);
                try {
                    // Esegui in parallelo il salvataggio anagrafica + tornei
                    await Promise.all([
                        AthletesAPI.update(data),
                        ...tournamentPromises
                    ]);
                    UI.toast("Quote aggiornate con successo", "success");
                    const updatedAthlete = await AthletesAPI.getById(athlete.id);
                    switchTab('quote', updatedAthlete);
                } catch (err) {
                    UI.toast(err.message, "error");
                } finally {
                    UI.loading(false);
                }
            });
        }
    }

    function renderEditForm(athlete) {
        const app = document.getElementById("app");
        app.innerHTML = AthletesView.athleteForm(athlete, teamsData);

        document.getElementById("cancel-form")?.addEventListener("click", () => renderProfile(athlete.id), { signal: abortController.signal });
        document.getElementById("cancel-form-btn")?.addEventListener("click", () => renderProfile(athlete.id), { signal: abortController.signal });

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

    window._handleAthleteDocumentUpload = async (athleteId, type, inputElement) => {
        const file = inputElement.files[0];
        if (!file) return;

        // eslint-disable-next-line no-undef
        UI.loading(true);
        try {
            await AthletesAPI.uploadDocument(athleteId, type, file);
            // eslint-disable-next-line no-undef
            UI.toast("Documento caricato con successo!", "success");
            const updatedAthlete = await AthletesAPI.getById(athleteId);
            switchTab(currentTab, updatedAthlete);
        } catch (err) {
            // eslint-disable-next-line no-undef
            UI.toast(err.message || "Errore durante l'upload", "error");
        } finally {
            // eslint-disable-next-line no-undef
            UI.loading(false);
            inputElement.value = ''; // Reset per ricaricamenti multipli
        }
    };

    function addDocumentListeners(athlete) {
        const docTypes = [
            'contract-file', 'id-doc-front', 'id-doc-back', 'cf-doc-front', 'cf-doc-back', 'med-cert',
            'photo-release', 'privacy-policy', 'guesthouse-rules', 'guesthouse-delegate', 'health-card'
        ];
        
        // Toggle Foresteria
        document.getElementById("toggle-foresteria-btn")?.addEventListener("click", () => {
            const container = document.getElementById("foresteria-docs-container");
            if (container) {
                const isHidden = container.style.display === "none";
                container.style.display = isHidden ? "block" : "none";
                document.getElementById("toggle-foresteria-btn").style.background = isHidden ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.02)";
            }
        });

        // Event listener rimosso qui e spostato in attributi inline (onchange/onclick) in AthletesView.js per maggiore affidabilità

        // View document buttons — fetch document via API and open in new tab
        document.querySelectorAll('.view-doc-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const athleteId = btn.dataset.athleteId;
                const field = btn.dataset.field;
                
                btn.disabled = true;
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Caricamento...';
                
                try {
                    const response = await fetch(`api/?module=athletes&action=downloadDoc&id=${athleteId}&field=${field}`, {
                        credentials: 'include',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    });
                    
                    if (!response.ok) {
                        // Try to parse JSON error
                        let errMsg = 'Errore nel download del documento';
                        try {
                            const errData = await response.json();
                            errMsg = errData.error || errMsg;
                        } catch (_) { /* ignore parse error */ }
                        throw new Error(errMsg);
                    }
                    
                    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // Open in new tab
                    const newTab = window.open(blobUrl, '_blank');
                    if (!newTab) {
                        // Popup blocked — fallback to download
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = `documento_${field}.${contentType.includes('pdf') ? 'pdf' : 'jpg'}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        UI.toast('Documento scaricato (popup bloccato dal browser)', 'info');
                    }
                    
                    // Cleanup blob URL after a delay to let the new tab load
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                } catch (err) {
                    console.error('[Athletes] Document view failed:', err);
                    UI.toast(err.message || 'Errore nel caricamento del documento', 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            });
        });
    }

    async function renderSubUsers(panel, athlete) {
        panel.innerHTML = '<div class="loader-spinner"></div>';
        try {
            const user = App.getUser();
            if (user.role === 'admin' && !athlete.user_id) {
                panel.innerHTML = Utils.emptyState(
                    "Utente Atleta Mancante", 
                    "Devi prima generare un utente per questa atleta dal pulsante 'Genera Utente' prima di poter invitare dei genitori o tutor."
                );
                return;
            }

            const params = user.role === 'admin' ? { athlete_user_id: athlete.user_id } : {};
            const subs = await Store.get("getSubUsers", "auth", params);
            panel.innerHTML = AthletesView.tabSubUsers(subs);

            // Add Invite Listener
            const inviteBtn = document.getElementById("invite-subuser-btn");
            const modal = document.getElementById("invite-modal");
            const closeBtn = document.getElementById("close-invite-modal");
            const confirmBtn = document.getElementById("confirm-invite-btn");

            if (inviteBtn && modal) {
                inviteBtn.onclick = () => modal.style.display = "flex";
                closeBtn.onclick = () => modal.style.display = "none";
                
                confirmBtn.onclick = async () => {
                    const email = document.getElementById("invite-email").value;
                    const name = document.getElementById("invite-name").value;

                    if (!email || !name) {
                        UI.toast("Inserisci tutti i dati", "error");
                        return;
                    }

                    UI.loading(true);
                    try {
                        const payload = { email, full_name: name };
                        if (user.role === 'admin') payload.athlete_user_id = athlete.user_id;

                        await Store.api("inviteSubUser", "auth", payload);
                        UI.toast("Invito inviato con successo!", "success");
                        modal.style.display = "none";
                        await renderSubUsers(panel, athlete);
                    } catch (e) {
                        UI.toast(e.message, "error");
                    } finally {
                        UI.loading(false);
                    }
                };
            }
        } catch (e) {
            panel.innerHTML = Utils.emptyState("Errore caricamento sotto-utenti", e.message);
        }
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
     * Carica tutti i trasporti e calcola il rimborso per atleta (€2.50/viaggio)
     * Arricchisce athletesData con il campo _transportReimbursement
     */
    async function enrichWithTransportReimbursements() {
        try {
            const transports = await TransportAPI.getTransports();
            const reimbMap = new Map();
            transports.forEach(tr => {
                let athletes
                try {
                    athletes = typeof tr.athletes_json === 'string' ? JSON.parse(tr.athletes_json) : (tr.athletes_json || []);
                } catch { athletes = []; }
                athletes.forEach(a => {
                    const id = a.id || a.athlete_id;
                    if (!id) return;
                    reimbMap.set(String(id), (reimbMap.get(String(id)) || 0) + 2.50);
                });
            });
            athletesData.forEach(a => {
                a._transportReimbursement = reimbMap.get(String(a.id)) || 0;
            });
        } catch (e) {
            console.warn('Impossibile caricare rimborsi trasporti:', e);
        }
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
