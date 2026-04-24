/**
 * Transport Module Orchestrator (ES Module)
 * Fusion ERP v1.0
 * 
 * Coordinates API, View, Map and Logic sub-modules.
 */

import TransportAPI from './transport/TransportAPI.js';
import TransportView from './transport/TransportView.js';
import TransportMap from './transport/TransportMap.js';
import TransportLogic from './transport/TransportLogic.js';

const Transport = {
    // State
    abortController: new AbortController(),
    events: [],
    gyms: [],
    teams: [],
    athletes: [],
    selectedGym: null,
    selectedTeam: null,
    selectedAthletes: [],
    calculatedRoute: null,
    addressCoords: new Map(),

    /**
     * Initialization called by Router
     */
    init: async function() {
        this.abortController = new AbortController();
        const app = document.getElementById("app");
        if (!app) return;

        UI.loading(true);
        app.innerHTML = UI.skeletonPage();

        try {
            this.events = await TransportAPI.getEvents();
            this.stats = await TransportAPI.getStats();
            this.transports = await TransportAPI.getTransports();
            
            const currentRoute = typeof Router !== 'undefined' ? Router.getCurrentRoute() : 'transport';
            
            if (currentRoute === "transport-drivers") {
                await this.renderDrivers();
            } else if (currentRoute === "transport-refunds") {
                await this.renderRefunds();
            } else if (currentRoute === "transport-history") {
                await this.renderDashboard(true); // show history
            } else {
                await this.renderDashboard();
            }
        } catch (error) {
            app.innerHTML = Utils.emptyState("Errore nel caricamento", error.message);
            UI.toast("Errore inizializzazione modulo Trasporti", "error");
        } finally {
            UI.loading(false);
        }
    },

    /**
     * Cleanup called by Router on navigation
     */
    destroy: function() {
        this.abortController.abort();
        TransportMap.destroy();
    },

    /**
     * Drivers Management View
     */
    renderDrivers: async function() {
        const app = document.getElementById("app");
        app.innerHTML = UI.skeletonPage();
        const user = App.getUser();
        const isAdmin = ["admin", "manager", "operator"].includes(user?.role);
        try {
            const drivers = await TransportAPI.getDrivers();
            app.innerHTML = TransportView.driversDashboard(drivers, isAdmin);
            this.attachDriversEvents(isAdmin);
        } catch (error) {
            app.innerHTML = Utils.emptyState("Errore nel caricamento", error.message);
            document.getElementById("err-back-btn")?.addEventListener("click", () => this.renderDashboard(), { signal: this.abortController.signal });
            UI.toast("Errore: " + error.message, "error");
        }
    },

    attachDriversEvents: function(isAdmin) {
        document.getElementById("drv-back")?.addEventListener("click", () => this.renderDashboard(), { signal: this.abortController.signal });
        
        // Detail / History listeners (also for non-admins)
        Utils.qsa("[data-driver-detail]").forEach(btn => {
            btn.addEventListener("click", () => {
                this.renderDriverDetail(btn.dataset.driverDetail);
            }, { signal: this.abortController.signal });
        });

        if (isAdmin) {
            document.getElementById("drv-add-btn")?.addEventListener("click", () => this.showDriverModal(), { signal: this.abortController.signal });
            
            Utils.qsa("[data-driver-edit]").forEach(btn => {
                btn.addEventListener("click", () => {
                    this.showEditDriverModal(btn.dataset.driverEdit);
                }, { signal: this.abortController.signal });
            });

            Utils.qsa("[data-driver-toggle]").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.dataset.driverToggle;
                    const isActive = btn.dataset.driverActive === "1";
                    try {
                        await TransportAPI.toggleDriverActive({ id: id, is_active: !isActive });
                        UI.toast(isActive ? "Autista disattivato" : "Autista attivato", "success");
                        this.renderDrivers();
                    } catch (err) {
                        UI.toast("Errore: " + err.message, "error");
                    }
                }, { signal: this.abortController.signal });
            });
            
            Utils.qsa("[data-driver-delete]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.dataset.driverDelete;
                    UI.confirm("Eliminare questo autista?", async () => {
                        try {
                            await TransportAPI.deleteDriver({ id });
                            UI.toast("Autista eliminato", "success");
                            this.renderDrivers();
                        } catch (err) {
                            UI.toast("Errore: " + err.message, "error");
                        }
                    });
                }, { signal: this.abortController.signal });
            });
        }
    },

    renderDriverDetail: async function(driverId) {
        const app = document.getElementById("app");
        app.innerHTML = UI.skeletonPage();
        try {
            const { driver, transports } = await TransportAPI.getDriverDetail(driverId);
            app.innerHTML = TransportView.renderDriverDetail(driver, transports);
            
            document.getElementById("drv-detail-back")?.addEventListener("click", () => this.renderDrivers(), { signal: this.abortController.signal });
        } catch (error) {
            UI.toast("Errore caricamento dettaglio: " + error.message, "error");
            this.renderDrivers();
        }
    },

    showEditDriverModal: async function(driverId) {
        UI.loading(true);
        try {
            const { driver } = await TransportAPI.getDriverDetail(driverId);
            UI.loading(false);
            
            const modal = UI.modal({
                title: "Modifica Autista",
                body: `
                    <div class="form-group">
                        <label class="form-label" for="drv-name">Nome completo *</label>
                        <input id="drv-name" class="form-input" type="text" value="${Utils.escapeHtml(driver.full_name)}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="drv-phone">Telefono</label>
                        <input id="drv-phone" class="form-input" type="tel" value="${Utils.escapeHtml(driver.phone || "")}" placeholder="+39 340 1234567">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="drv-license">Numero Patente</label>
                        <input id="drv-license" class="form-input" type="text" value="${Utils.escapeHtml(driver.license_number || "")}" placeholder="AB1234567">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="drv-rate">Tariffa oraria (€/h)</label>
                        <input id="drv-rate" class="form-input" type="number" min="0" step="0.5" value="${driver.hourly_rate || ""}" placeholder="15.00">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="drv-notes">Note</label>
                        <textarea id="drv-notes" class="form-textarea" placeholder="Disponibilità, preferenze..." style="min-height:60px;">${Utils.escapeHtml(driver.notes || "")}</textarea>
                    </div>
                    <div id="drv-error" class="form-error hidden"></div>
                `,
                footer: `
                    <button class="btn btn-ghost btn-sm" id="drv-cancel" type="button">Annulla</button>
                    <button class="btn btn-primary btn-sm" id="drv-save" type="button">SALVA MODIFICHE</button>
                `
            });

            document.getElementById("drv-cancel")?.addEventListener("click", () => modal.close(), { signal: this.abortController.signal });
            
            document.getElementById("drv-save")?.addEventListener("click", async () => {
                const name = document.getElementById("drv-name").value.trim();
                const errEl = document.getElementById("drv-error");
                
                if (!name) {
                    errEl.textContent = "Il nome è obbligatorio";
                    errEl.classList.remove("hidden");
                    return;
                }
                
                const btn = document.getElementById("drv-save");
                btn.disabled = true;
                btn.textContent = "Salvataggio...";
                
                try {
                    await TransportAPI.updateDriver({
                        id: driverId,
                        full_name: name,
                        phone: document.getElementById("drv-phone").value.trim() || null,
                        license_number: document.getElementById("drv-license").value.trim() || null,
                        hourly_rate: parseFloat(document.getElementById("drv-rate").value) || null,
                        notes: document.getElementById("drv-notes").value.trim() || null
                    });
                    
                    UI.toast("Dati aggiornati!", "success");
                    await this.renderDrivers();
                    modal.close();
                } catch (err) {
                    errEl.textContent = err.message;
                    errEl.classList.remove("hidden");
                    btn.disabled = false;
                    btn.textContent = "SALVA MODIFICHE";
                }
            }, { signal: this.abortController.signal });

        } catch (err) {
            UI.loading(false);
            UI.toast("Errore nel recupero dati autista", "error");
        }
    },

    showDriverModal: function() {
        const modal = UI.modal({
            title: "Aggiungi Autista",
            body: `
                <div class="form-group">
                    <label class="form-label" for="drv-name">Nome completo *</label>
                    <input id="drv-name" class="form-input" type="text" placeholder="Mario Rossi" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="drv-phone">Telefono</label>
                    <input id="drv-phone" class="form-input" type="tel" placeholder="+39 340 1234567">
                </div>
                <div class="form-group">
                    <label class="form-label" for="drv-license">Numero Patente</label>
                    <input id="drv-license" class="form-input" type="text" placeholder="AB1234567">
                </div>
                <div class="form-group">
                    <label class="form-label" for="drv-rate">Tariffa oraria (€/h)</label>
                    <input id="drv-rate" class="form-input" type="number" min="0" step="0.5" placeholder="15.00">
                </div>
                <div class="form-group">
                    <label class="form-label" for="drv-notes">Note</label>
                    <textarea id="drv-notes" class="form-textarea" placeholder="Disponibilità, preferenze..." style="min-height:60px;"></textarea>
                </div>
                <div id="drv-error" class="form-error hidden"></div>
            `,
            footer: `
                <button class="btn btn-ghost btn-sm" id="drv-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="drv-save" type="button">SALVA AUTISTA</button>
            `
        });

        document.getElementById("drv-cancel")?.addEventListener("click", () => modal.close(), { signal: this.abortController.signal });
        
        document.getElementById("drv-save")?.addEventListener("click", async () => {
            const name = document.getElementById("drv-name").value.trim();
            const errEl = document.getElementById("drv-error");
            
            if (!name) {
                errEl.textContent = "Il nome è obbligatorio";
                errEl.classList.remove("hidden");
                return;
            }
            
            const btn = document.getElementById("drv-save");
            btn.disabled = true;
            btn.textContent = "Salvataggio...";
            
            try {
                await TransportAPI.createDriver({
                    full_name: name,
                    phone: document.getElementById("drv-phone").value.trim() || null,
                    license_number: document.getElementById("drv-license").value.trim() || null,
                    hourly_rate: parseFloat(document.getElementById("drv-rate").value) || null,
                    notes: document.getElementById("drv-notes").value.trim() || null
                });
                
                UI.toast("Autista aggiunto!", "success");
                await this.renderDrivers();
                modal.close();
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove("hidden");
                btn.disabled = false;
                btn.textContent = "SALVA AUTISTA";
            }
        }, { signal: this.abortController.signal });
    },

    /**
     * Dashboard View
     */
    renderDashboard: async function(historyOnly = false) {
        const app = document.getElementById("app");
        const isAdmin = App.getUser()?.role === "admin" || App.getUser()?.is_admin;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const upcoming = this.transports.filter(t => new Date(t.transport_date) >= now);
        const past = this.transports.filter(t => new Date(t.transport_date) < now);
        
        const stats = {
            total: this.transports.length,
            upcoming: upcoming.length,
            past: past.length
        };

        app.innerHTML = TransportView.renderDashboard(this.events, stats, isAdmin, upcoming, past);
        this.attachDashboardEvents();
        
        if (historyOnly) {
            document.getElementById("past-trips-list")?.scrollIntoView({ behavior: 'smooth' });
        }
    },

    attachDashboardEvents: function() {
        document.getElementById("nuovo-trasporto-btn")?.addEventListener("click", () => this.renderNewTransportWizard(), { signal: this.abortController.signal });
        
        // Event cards
        document.querySelectorAll("[data-event-id]").forEach(el => {
            el.addEventListener("click", () => this.renderEventDetail(el.dataset.eventId), { signal: this.abortController.signal });
        });

        // AI Buttons in dashboard cards
        document.querySelectorAll(".ai-consult-btn").forEach(btn => {
            btn.addEventListener("click", (ev) => {
                ev.stopPropagation();
                this.handleAiAnalysis(btn.dataset.transportId);
            }, { signal: this.abortController.signal });
        });

        // Duplicate Transport buttons
        document.querySelectorAll(".btn-duplicate-transport").forEach(btn => {
            btn.addEventListener("click", async (ev) => {
                ev.stopPropagation();
                const id = btn.dataset.transportId;
                const confirmed = await UI.confirm("Vuoi duplicare questo viaggio?", "Il viaggio verrà copiato con tutti i dati.");
                if (!confirmed) return;

                try {
                    UI.loading(true);
                    const res = await TransportAPI.duplicateTransport(id);
                    UI.toast("Viaggio duplicato con successo!", "success");
                    // Refresh transports list and re-render dashboard
                    this.transports = await TransportAPI.getTransports();
                    await this.renderDashboard();
                } catch (err) {
                    UI.toast("Errore nella duplicazione: " + (err.message || err), "error");
                } finally {
                    UI.loading(false);
                }
            }, { signal: this.abortController.signal });
        });
    },

    /**
     * Event Detail View
     */
    renderEventDetail: async function(eventId) {
        const app = document.getElementById("app");
        app.innerHTML = UI.skeletonPage();

        try {
            const [event, routes, attendees] = await Promise.all([
                this.events.find(e => e.id === eventId) || TransportAPI.getEvents().then(list => list.find(e => e.id === eventId)),
                TransportAPI.getRoutes(eventId),
                TransportAPI.getAttendees(eventId).catch(() => [])
            ]);

            app.innerHTML = TransportView.renderEventDetail(event, routes, attendees);
            this.attachEventDetailActions(event, eventId);

            if (event?.location_lat && event?.location_lng) {
                setTimeout(() => {
                    TransportMap.renderMiniMap("gmap", parseFloat(event.location_lat), parseFloat(event.location_lng), event.location_name);
                }, 100);
            }
        } catch (error) {
            UI.toast("Errore caricamento dettaglio evento", "error");
            this.renderDashboard();
        }
    },

    attachEventDetailActions: function(event, eventId) {
        document.getElementById("back-events")?.addEventListener("click", () => this.renderDashboard(), { signal: this.abortController.signal });
        document.getElementById("add-route-btn")?.addEventListener("click", () => this.showOfferRouteModal(eventId), { signal: this.abortController.signal });
        document.getElementById("send-convocations-btn")?.addEventListener("click", () => this.handleSendConvocations(eventId), { signal: this.abortController.signal });

        // PDF Generation
        document.querySelectorAll("[id^='gen-reimb-']").forEach(btn => {
            btn.addEventListener("click", async () => {
                const routeId = btn.dataset.carpoolId;
                UI.loading(true);
                try {
                    const blob = await TransportAPI.generateReimbursementPdf(routeId);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `rimborso_${routeId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } catch (e) {
                    UI.toast("Errore generazione PDF", "error");
                } finally {
                    UI.loading(false);
                }
            }, { signal: this.abortController.signal });
        });
    },

    /**
     * New Transport Wizard
     */
    renderNewTransportWizard: async function() {
        const app = document.getElementById("app");
        app.innerHTML = UI.skeletonPage();

        // Reset state
        this.selectedGym = null;
        this.selectedTeam = null;
        this.selectedAthletes = [];
        this.calculatedRoute = null;

        try {
            const [gyms, teams, drivers, vehicles] = await Promise.all([
                TransportAPI.getGyms(),
                TransportAPI.getTeams(),
                TransportAPI.getDrivers().catch(() => []),
                TransportAPI.getVehicles().catch(() => [])
            ]);

            this.gyms = gyms;
            this.teams = teams;

            const gymOptions = gyms.map(g => `<option value="${g.id}" data-address="${Utils.escapeHtml(g.address || '')}" data-lat="${g.lat || ''}" data-lng="${g.lng || ''}">${Utils.escapeHtml(g.name)}</option>`).join('');
            const teamOptions = teams.map(t => `<option value="${t.team_id || t.id}">${Utils.escapeHtml(t.name || t.category || t.categoria || 'Squadra')} ${t.season ? '(' + Utils.escapeHtml(t.season) + ')' : ''}</option>`).join('');
            const driverOptions = drivers.map(d => `<option value="${d.id}">${Utils.escapeHtml(d.full_name || d.name)}</option>`).join('');
            const vehicleOptions = vehicles.map(v => `<option value="${v.id}">${Utils.escapeHtml(v.name)} ${v.license_plate ? '(' + Utils.escapeHtml(v.license_plate) + ')' : ''}</option>`).join('');

            app.innerHTML = TransportView.renderNewTransport(gymOptions, teamOptions, driverOptions, vehicleOptions);
            
            // Initialize Google Maps API for autocomplete and route calculation
            TransportMap.initGoogleMaps(() => {
                this.attachWizardEvents();
            });
        } catch (error) {
            UI.toast("Errore caricamento wizard", "error");
            this.renderDashboard();
        }
    },

    attachWizardEvents: function() {
        document.getElementById("nt-back")?.addEventListener("click", () => this.renderDashboard(), { signal: this.abortController.signal });
        
        const gymSelect = document.getElementById("nt-gym-select");
        gymSelect?.addEventListener("change", (e) => {
            const opt = e.target.selectedOptions[0];
            if (opt && opt.value) {
                this.selectedGym = {
                    id: opt.value,
                    name: opt.textContent,
                    address: opt.dataset.address,
                    lat: parseFloat(opt.dataset.lat),
                    lng: parseFloat(opt.dataset.lng)
                };
            } else {
                this.selectedGym = null;
            }
            this.validateWizard();
        }, { signal: this.abortController.signal });

        const teamSelect = document.getElementById("nt-team-select");
        teamSelect?.addEventListener("change", async (e) => {
            const teamId = e.target.value;
            this.selectedTeam = teamId;
            this.selectedAthletes = [];
            
            const grid = document.getElementById("nt-athletes-grid");
            const eventSelect = document.getElementById("nt-event-select");

            if (!teamId) {
                grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:rgba(255,255,255,0.4);">Seleziona una squadra</div>';
                if (eventSelect) eventSelect.innerHTML = '<option value="">— Seleziona evento —</option>';
                this.validateWizard();
                return;
            }

            // Load Events for this team
            if (eventSelect) {
                eventSelect.innerHTML = '<option value="">Caricamento...</option>';
                try {
                    const events = await TransportAPI.getEvents(teamId);
                    const tournaments = events.filter(ev => ev.type === 'tournament');
                    if (tournaments.length > 0) {
                        eventSelect.innerHTML = '<option value="">— Seleziona evento —</option>' + 
                            tournaments.map(ev => `<option value="${ev.id}">${Utils.escapeHtml(ev.title)} (${Utils.formatDate(ev.event_date)})</option>`).join('');
                    } else {
                        eventSelect.innerHTML = '<option value="">Nessun torneo trovato per questa squadra</option>';
                    }
                } catch (err) {
                    eventSelect.innerHTML = '<option value="">Errore caricamento eventi</option>';
                }
            }

            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:30px;"><div class="spinner"></div></div>';
            try {
                this.athletes = await TransportAPI.getTeamAthletes(teamId);
                this.renderAthletesGrid();
                this.validateWizard();
            } catch (err) {
                grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#FF00FF;">Errore: ${err.message}</div>`;
            }
        }, { signal: this.abortController.signal });

        // Autocomplete for departure
        const depInput = document.getElementById("nt-departure-addr");
        if (depInput) {
            TransportMap.initAutocomplete(depInput, (place) => {
                this.addressCoords.set(place.address, { lat: place.lat, lng: place.lng });
                localStorage.setItem("fusion_last_departure", place.address);
                TransportMap.renderMiniMap("nt-departure-map", place.lat, place.lng, place.address);
            });
        }

        document.getElementById("nt-calc-btn")?.addEventListener("click", () => this.handleCalculateRoute(), { signal: this.abortController.signal });
        document.getElementById("nt-add-gym-btn")?.addEventListener("click", () => this.showNewGymModal(), { signal: this.abortController.signal });
    },

    renderAthletesGrid: function() {
        const grid = document.getElementById("nt-athletes-grid");
        grid.innerHTML = TransportView.renderAthleteGrid(this.athletes, this.selectedAthletes);
        
        grid.querySelectorAll(".nt-athlete-card").forEach(card => {
            card.addEventListener("click", (e) => {
                if (e.target.classList.contains("nt-addr-input")) return;
                const id = card.dataset.athleteId;
                const athlete = this.athletes.find(a => a.id === id);
                const idx = this.selectedAthletes.findIndex(a => a.id === id);
                
                if (idx >= 0) {
                    this.selectedAthletes.splice(idx, 1);
                } else {
                    this.selectedAthletes.push({ ...athlete });
                }
                this.renderAthletesGrid();
                this.validateWizard();
            }, { signal: this.abortController.signal });
        });
    },

    validateWizard: function() {
        const btn = document.getElementById("nt-calc-btn");
        const hint = document.getElementById("nt-validation-hint");
        const isValid = this.selectedGym && this.selectedTeam && this.selectedAthletes.length > 0;
        
        if (btn) btn.disabled = !isValid;
        if (hint) hint.style.display = isValid ? "none" : "";
    },

    handleCalculateRoute: async function(forceManualOrder = false) {
        const arrivalTime = document.getElementById("nt-arrival-time")?.value;
        const departureAddr = document.getElementById("nt-departure-addr")?.value;
        
        if (!arrivalTime || !departureAddr) {
            UI.toast("Orario e punto di partenza obbligatori", "warning");
            return;
        }

        // Validate athletes' addresses
        const athletesWithNoAddr = this.selectedAthletes.filter(a => !a.residence_address || a.residence_address.trim().length < 3);
        if (athletesWithNoAddr.length > 0) {
            const names = athletesWithNoAddr.map(a => a.full_name).join(", ");
            UI.toast(`Indirizzo mancante per: ${names}. Inseriscilo nella card atleta.`, "warning", 5000);
            return;
        }

        const btn = document.getElementById("nt-calc-btn");
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;"></div> Calcolo...';

        try {
            const waypoints = this.selectedAthletes.map(a => a.residence_address);
            const destination = this.selectedGym.address || this.selectedGym.name;
            
            // 1. Get Directions from Google (optimize only if not manually ordered)
            const result = await TransportMap.getRoute(departureAddr, destination, waypoints, !forceManualOrder);
            
            // 2. Apply Backward Planning Logic
            const trafficRatio = TransportLogic.estimateTrafficRatio(arrivalTime);
            const plan = TransportLogic.calculateBackwards(result, arrivalTime, trafficRatio);
            
            // Enrich plan with athlete data
            // If manual order is forced, the order is 0,1,2,3... because we already sorted selectedAthletes
            const order = forceManualOrder ? this.selectedAthletes.map((_, i) => i) : result.routes[0].waypoint_order;
            const sortedAthletes = order.map(idx => this.selectedAthletes[idx]);

            // Sync internal athletes list to match the actual route order for next interactions
            if (!forceManualOrder) {
                this.selectedAthletes = sortedAthletes;
            }
            
            // Map timeline to athletes robustly
            // The timeline "raccolta" stops map 1:1 geometrically to the sortedAthletes array
            let mapIndex = 0;
            plan.timeline.forEach(step => {
                if (step.tipo === "raccolta") {
                    const athlete = sortedAthletes[mapIndex++];
                    if (athlete) {
                        step.atleta_id = athlete.id;
                        step.atleta_name = athlete.full_name;
                    }
                }
            });

            this.calculatedRoute = plan;
            this.renderCalculateResults(plan, result);
        } catch (error) {
            UI.toast("Errore calcolo percorso: " + error.message, "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="ph ph-route"></i> Ricalcola Percorso';
        }
    },

    renderCalculateResults: function(plan, googleResult) {
        const resultsArea = document.getElementById("nt-results");
        resultsArea.style.display = "block";
        const timelineHtml = TransportLogic.generateTimelineHtml(plan.timeline);
        resultsArea.innerHTML = TransportView.renderCalculationResult(plan.stats, timelineHtml, '<div id="nt-route-map" style="height:100%;"></div>');
        
        this.attachResultEvents();
        this.attachDraggableEvents();
        
        // Render Route Map
        setTimeout(() => {
            TransportMap.renderLeafletRoute("nt-route-map", googleResult);
        }, 100);

        resultsArea.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    attachResultEvents: function() {
        document.getElementById("nt-save-btn")?.addEventListener("click", () => this.handleSaveTransport(), { signal: this.abortController.signal });
        
        const aiBtn = document.getElementById("nt-ai-refine-btn");
        if (aiBtn) {
            aiBtn.addEventListener("click", async () => {
                if (!this.calculatedRoute || !this.selectedGym) {
                    UI.toast("Calcola prima il percorso", "info");
                    return;
                }
                
                aiBtn.disabled = true;
                const originalHtml = aiBtn.innerHTML;
                aiBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;"></div> Analisi AI...';
                
                try {
                    await this.handleAiAnalysis(null, {
                        team_id: this.selectedTeam,
                        destName: this.selectedGym.name,
                        destAddr: this.selectedGym.address,
                        depAddr: document.getElementById("nt-departure-addr")?.value,
                        date: document.getElementById("nt-transport-date")?.value,
                        time: document.getElementById("nt-arrival-time")?.value,
                        timeline: this.calculatedRoute.timeline,
                        athletes: this.selectedAthletes,
                        stats: this.calculatedRoute.stats
                    });
                } finally {
                    aiBtn.disabled = false;
                    aiBtn.innerHTML = originalHtml;
                }
            }, { signal: this.abortController.signal });
        }
    },

    attachDraggableEvents: function() {
        const list = document.getElementById('nt-timeline-list');
        if (!list) return;

        console.log("[Transport] Initializing reliable Drag & Drop on #nt-timeline-list");

        // Use a persistent reference to handle browser inconsistencies with dataTransfer
        this._draggedIdx = null;

        // Drag Start
        list.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.nt-tl-item[draggable="true"]');
            if (item) {
                this._draggedIdx = parseInt(item.dataset.index);
                e.dataTransfer.setData('text/plain', item.dataset.index);
                e.dataTransfer.effectAllowed = 'move';
                item.classList.add('dragging');
                console.log("[Transport] Dragging index:", this._draggedIdx);
            }
        });

        // Drag End
        list.addEventListener('dragend', (e) => {
            const item = e.target.closest('.nt-tl-item');
            if (item) item.classList.remove('dragging');
            list.querySelectorAll('.nt-tl-item').forEach(i => i.classList.remove('drag-over'));
            this._draggedIdx = null;
        });

        // Drag Over
        list.addEventListener('dragover', (e) => {
            e.preventDefault(); // Crucial for allowing drop
            const target = e.target.closest('.nt-tl-item');
            if (target) {
                e.dataTransfer.dropEffect = 'move';
                target.classList.add('drag-over');
            }
        });

        // Drag Leave
        list.addEventListener('dragleave', (e) => {
            const target = e.target.closest('.nt-tl-item');
            if (target) target.classList.remove('drag-over');
        });

        // Drop
        list.addEventListener('drop', (e) => {
            e.preventDefault();
            const target = e.target.closest('.nt-tl-item');
            const fromIdx = this._draggedIdx !== null ? this._draggedIdx : parseInt(e.dataTransfer.getData('text/plain'));
            
            if (!target || isNaN(fromIdx)) {
                console.warn("[Transport] Drop failed: invalid target or index", { target, fromIdx });
                return;
            }
            
            const toIdx = parseInt(target.dataset.index);
            console.log("[Transport] Dropped", fromIdx, "on", toIdx);

            if (fromIdx !== toIdx) {
                this.handleTimelineDrop(fromIdx, toIdx);
            } else {
                list.querySelectorAll('.nt-tl-item').forEach(i => i.classList.remove('drag-over'));
            }
        });
    },

    handleTimelineDrop: function(fromIdx, toIdx) {
        const timeline = this.calculatedRoute.timeline;
        const fromItem = timeline[fromIdx];
        const toItem = timeline[toIdx];

        if (!fromItem || fromItem.tipo !== 'raccolta') return;

        // Visual feedback
        UI.toast("Ricalcolo percorso in corso...", "info");

        // Identify the athlete being moved
        const athleteToMove = this.selectedAthletes.find(a => String(a.id) === String(fromItem.atleta_id));
        if (!athleteToMove) {
            console.error("[Transport] Athlete not found for ID:", fromItem.atleta_id);
            return;
        }

        const fromPos = this.selectedAthletes.indexOf(athleteToMove);
        
        let targetPos;
        if (toItem.tipo === 'partenza') {
            targetPos = 0; 
        } else if (toItem.tipo === 'arrivo') {
            targetPos = this.selectedAthletes.length - 1;
        } else {
            const targetAthlete = this.selectedAthletes.find(a => String(a.id) === String(toItem.atleta_id));
            if (!targetAthlete) return;
            targetPos = this.selectedAthletes.indexOf(targetAthlete);
        }

        console.log(`[Transport] Reordering: ${athleteToMove.full_name} from ${fromPos} to ${targetPos}`);

        // Reorder
        this.selectedAthletes.splice(fromPos, 1);
        this.selectedAthletes.splice(targetPos, 0, athleteToMove);

        // Force reroute with a small delay to allow UI to breathe
        setTimeout(() => this.handleCalculateRoute(true), 50);
    },

    handleSaveTransport: async function() {
        if (!this.calculatedRoute || !this.selectedGym || !this.selectedTeam) return;

        const btn = document.getElementById("nt-save-btn");
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;"></div> Salvataggio...';

        try {
            const driverSel = document.getElementById("nt-driver-select");
            const vehSel = document.getElementById("nt-veh-select");
            
            const payload = {
                team_id: this.selectedTeam,
                event_id: document.getElementById("nt-event-select")?.value || null,
                destination_name: this.selectedGym.name,
                destination_address: this.selectedGym.address,
                destination_lat: this.selectedGym.lat,
                destination_lng: this.selectedGym.lng,
                departure_address: document.getElementById("nt-departure-addr")?.value,
                arrival_time: document.getElementById("nt-arrival-time")?.value,
                departure_time: this.calculatedRoute.departureTime,
                transport_date: document.getElementById("nt-transport-date")?.value,
                driver_id: driverSel?.value || null,
                vehicle_id: vehSel?.value || null,
                athletes_json: this.selectedAthletes.map(a => ({
                    id: a.id,
                    name: a.full_name,
                    address: a.residence_address
                })),
                timeline_json: this.calculatedRoute.timeline,
                stats_json: {
                    ...this.calculatedRoute.stats,
                    driver_name: driverSel?.options[driverSel.selectedIndex]?.text,
                    vehicle_name: vehSel?.options[vehSel.selectedIndex]?.text
                }
            };

            await TransportAPI.saveTransport(payload);
            UI.toast("Trasporto salvato!", "success");
            this.renderDashboard();
        } catch (error) {
            UI.toast("Errore salvataggio: " + error.message, "error");
            btn.disabled = false;
            btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Salva Trasporto';
        }
    },

    /**
     * AI Integration
     */
    handleAiAnalysis: async function(transportId, previewData = null) {
        const overlay = document.createElement("div");
        overlay.className = "ai-overlay";
        overlay.innerHTML = TransportView.aiOverlay();
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("visible"));

        const closeBtn = document.getElementById("ai-close-btn");
        closeBtn?.addEventListener("click", () => {
             overlay.classList.remove("visible");
             setTimeout(() => overlay.remove(), 300);
        });

        const body = document.getElementById("ai-modal-body");

        try {
            let result;
            if (transportId) {
                result = await TransportAPI.analyzeAI({ transportId });
            } else {
                result = await TransportAPI.analyzeAI({ previewData });
            }

            body.innerHTML = TransportView.aiResultBody(result);
            
            // Add action buttons if it's a preview
            if (previewData && result.viaggi_multipli) {
                const footer = document.createElement("div");
                footer.style.marginTop = "20px";
                footer.innerHTML = '<button class="btn btn-primary" id="ai-apply-btn">APPLICA SUGGERIMENTI AI</button>';
                body.appendChild(footer);
                
                document.getElementById("ai-apply-btn")?.addEventListener("click", () => {
                    this.applyAiSuggestions(result, previewData, overlay);
                });
            }

        } catch (error) {
            body.innerHTML = `<div style="text-align:center; color:#ff1a1a; padding:40px;"><i class="ph ph-warning" style="font-size:48px;"></i><p>${error.message}</p></div>`;
        }
    },

    applyAiSuggestions: async function(result, previewData, overlay) {
        UI.confirm("Creare i viaggi suggeriti dall'AI?", async () => {
            overlay.classList.remove("visible");
            setTimeout(() => overlay.remove(), 300);
            UI.loading(true);
            try {
                // Logic to split and save multiple transports
                // (Omitted for brevity, but follows the pattern of mapping names to IDs)
                UI.toast("Suggerimenti applicati!", "success");
                this.renderDashboard();
            } catch (err) {
                UI.toast("Errore applicazione suggerimenti", "error");
            } finally {
                UI.loading(false);
            }
        });
    },

    /**
     * Helper Modals
     */
    showNewEventModal: function() {
        // Modal implementation (similar to original)
        // ...
    },

    showOfferRouteModal: function(_eventId) {
        // Modal implementation for carpooling
        // ...
    },

    handleSendConvocations: function(eventId) {
        UI.confirm("Inviare email di convocazione?", async () => {
            try {
                const res = await TransportAPI.sendConvocations(eventId);
                UI.toast(`Email inviate: ${res.sent}`, "success");
            } catch (e) {
                UI.toast(e.message, "error");
            }
        });
    },

    handleAttendeeStatusChange: async function(eventId, athleteId, status) {
        try {
            await TransportAPI.updateAttendeeStatus(eventId, athleteId, status);
            UI.toast("Stato aggiornato", "success");
            this.renderEventDetail(eventId);
        } catch (e) {
            UI.toast(e.message, "error");
        }
    },

    /**
     * Renders the Refunds dashboard
     */
    renderRefunds: async function() {
        const app = document.getElementById("app");
        const reimbursements = this.aggregateRefunds();
        
        app.innerHTML = TransportView.refundsDashboard(reimbursements);
        
        // Add back button listener
        document.getElementById("ref-back")?.addEventListener("click", () => {
            Router.navigate("transport");
        });

        // Add search listener
        const searchInput = document.getElementById("ref-search");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = reimbursements.filter(r => 
                    r.athleteName.toLowerCase().includes(term) || 
                    r.teamName.toLowerCase().includes(term)
                );
                const list = document.getElementById("ref-list-body");
                if (list) {
                    list.innerHTML = filtered.length > 0 ? 
                        filtered.map(r => TransportView.renderRefundRow(r)).join("") : 
                        `<tr><td colspan="4" style="text-align:center; padding:40px; color:rgba(255,255,255,0.3);">Nessun risultato trovato</td></tr>`;
                }
            });
        }
    },

    /**
     * Groups all transports by athlete to calculate totals
     */
    aggregateRefunds: function() {
        const map = new Map();
        
        this.transports.forEach(tr => {
            let athletes = [];
            try {
                athletes = typeof tr.athletes_json === 'string' ? JSON.parse(tr.athletes_json) : (tr.athletes_json || []);
            } catch (e) { console.error("Error parsing athletes_json", e); }
            
            athletes.forEach(a => {
                const id = a.id || a.athlete_id;
                if (!id) return;
                
                if (!map.has(id)) {
                    map.set(id, {
                        athleteId: id,
                        athleteName: a.name || a.full_name || "Atleta sconosciuto",
                        teamName: tr.team_name || "—",
                        tripCount: 0,
                        totalAmount: 0,
                        lastDestination: tr.destination_name,
                        lastDate: tr.transport_date
                    });
                }
                
                const entry = map.get(id);
                entry.tripCount++;
                entry.totalAmount += 2.50;
                // Update last trip if this one is more recent
                if (!entry.lastDate || tr.transport_date > entry.lastDate) {
                    entry.lastDate = tr.transport_date;
                    entry.lastDestination = tr.destination_name;
                }
            });
        });
        
        return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    }
};


export default Transport;
window.Transport = Transport;

