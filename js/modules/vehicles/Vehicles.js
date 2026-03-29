import { VehiclesAPI } from './VehiclesAPI.js';
import { VehiclesView } from './VehiclesView.js';

class VehiclesModule {
    constructor() {
        this._abort = new AbortController();
        this.vehicles = [];
        this.currentVehicle = null;
        this.currentTab = 'anomalies';
    }

    sig() {
        return { signal: this._abort.signal };
    }

    destroy() {
        this._abort.abort();
        this._abort = new AbortController();
        this.vehicles = [];
        this.currentVehicle = null;
        this.currentTab = 'anomalies';
    }

    async init() {
        const appEl = document.getElementById("app");
        if (!appEl) return;

        try {
            window.UI.loading(true);
            appEl.innerHTML = window.UI.skeletonPage();

            this.vehicles = await VehiclesAPI.getAllVehicles();

            const user = window.App.getUser();
            const canEdit = ["admin", "manager", "operator"].includes(user?.role);

            appEl.innerHTML = VehiclesView.renderDashboard(this.vehicles, canEdit);

            this.bindDashboardEvents();
        } catch (error) {
            appEl.innerHTML = window.Utils.emptyState("Errore nel caricamento dei mezzi", error.message);
            window.UI.toast("Errore caricamento mezzi", "error");
        } finally {
            window.UI.loading(false);
        }
    }

    bindDashboardEvents() {
        const addBtn = document.getElementById("new-vehicle-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => this.openVehicleModal(), this.sig());
        }

        window.Utils.qsa(".vehicle-card").forEach((card) => {
            card.addEventListener("click", () => this.showVehicleDetail(card.dataset.id), this.sig());
        });
    }

    async showVehicleDetail(id) {
        const appEl = document.getElementById("app");
        
        try {
            window.UI.loading(true);
            appEl.innerHTML = window.UI.skeletonPage();

            this.currentVehicle = await VehiclesAPI.getVehicleById(id);
            if (!this.currentVehicle) return;

            const user = window.App.getUser();
            const canEdit = ["admin", "manager", "operator"].includes(user?.role);

            appEl.innerHTML = VehiclesView.renderDetail(this.currentVehicle, this.currentTab, canEdit);

            this.bindDetailEvents(canEdit);
        } catch (error) {
            window.UI.toast(error.message, "error");
            await this.init();
        } finally {
            window.UI.loading(false);
        }
    }

    bindDetailEvents(canEdit) {
        const backBtn = document.getElementById("btn-back");
        if (backBtn) {
            backBtn.addEventListener("click", () => this.init(), this.sig());
        }

        const editBtn = document.getElementById("btn-edit-veh");
        if (editBtn) {
            editBtn.addEventListener("click", () => this.openVehicleModal(this.currentVehicle), this.sig());
        }

        window.Utils.qsa(".fusion-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                this.currentTab = tab.dataset.tab;
                
                // Re-render only the detail view instead of a full fetch
                const appEl = document.getElementById("app");
                appEl.innerHTML = VehiclesView.renderDetail(this.currentVehicle, this.currentTab, canEdit);
                this.bindDetailEvents(canEdit);
            }, this.sig());
        });

        // Maintenance events
        const addMaintBtn = document.getElementById("btn-add-maint");
        if (addMaintBtn) {
            addMaintBtn.addEventListener("click", () => this.openMaintenanceModal(this.currentVehicle.id), this.sig());
        }

        // Anomaly events
        const addAnomalyBtn = document.getElementById("btn-add-anomaly");
        if (addAnomalyBtn) {
            addAnomalyBtn.addEventListener("click", () => this.openAnomalyModal(this.currentVehicle.id), this.sig());
        }

        window.Utils.qsa(".anomaly-status-update").forEach((select) => {
            select.addEventListener("change", async (e) => {
                const newStatus = e.target.value;
                const anomalyId = e.target.dataset.id;

                if (newStatus === "resolved") {
                    e.target.value = "open"; // reset visual state pending modal
                    this.openAnomalyResolutionModal(anomalyId, this.currentVehicle.id);
                } else {
                    try {
                        window.UI.loading(true);
                        await VehiclesAPI.updateAnomalyStatus({ id: anomalyId, status: newStatus });
                        window.UI.toast("Stato aggiornato", "success");
                        await this.showVehicleDetail(this.currentVehicle.id);
                    } catch (error) {
                        window.UI.toast(error.message, "error");
                    } finally {
                        window.UI.loading(false);
                    }
                }
            }, this.sig());
        });
    }

    openVehicleModal(vehicle = null) {
        const isEdit = !!vehicle;
        const modal = window.UI.modal({
            title: isEdit ? "Modifica Mezzo" : "Nuovo Mezzo",
            body: VehiclesView.getVehicleModalBody(vehicle),
            footer: VehiclesView.getVehicleModalFooter(vehicle)
        });

        const cancelBtn = document.getElementById("veh-cancel");
        if (cancelBtn) cancelBtn.addEventListener("click", () => modal.close(), this.sig());

        const saveBtn = document.getElementById("veh-save");
        if (saveBtn) {
            saveBtn.addEventListener("click", async () => {
                const name = document.getElementById("veh-name").value.trim();
                const plate = document.getElementById("veh-plate").value.trim().toUpperCase();

                if (!name || !plate) {
                    document.getElementById("veh-error").textContent = "Nome e targa sono obbligatori";
                    document.getElementById("veh-error").classList.remove("hidden");
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.innerHTML = "Salvataggio...";

                try {
                    const payload = {
                        name: name,
                        license_plate: plate,
                        capacity: document.getElementById("veh-cap").value,
                        status: document.getElementById("veh-status").value,
                        insurance_expiry: document.getElementById("veh-ins").value || null,
                        road_tax_expiry: document.getElementById("veh-tax").value || null,
                        notes: document.getElementById("veh-notes").value || null,
                    };

                    if (isEdit) payload.id = vehicle.id;

                    if (isEdit) {
                        await VehiclesAPI.updateVehicle(payload);
                    } else {
                        await VehiclesAPI.createVehicle(payload);
                    }

                    window.Store.invalidate("vehicles");
                    window.UI.toast(isEdit ? "Mezzo aggiornato" : "Mezzo aggiunto", "success");
                    await this.init(); // Refresh dashboard or current view
                    modal.close();
                } catch (error) {
                    document.getElementById("veh-error").textContent = error.message;
                    document.getElementById("veh-error").classList.remove("hidden");
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = "Salva";
                }
            }, this.sig());
        }

        const delBtn = document.getElementById("veh-del");
        if (delBtn && isEdit) {
            delBtn.addEventListener("click", () => {
                window.UI.confirm(
                    `Eliminare definitivamente il mezzo "${vehicle?.name || ''}"? Verranno eliminati anche tutto lo storico manutenzioni e anomalie!`,
                    async () => {
                        delBtn.disabled = true;
                        try {
                            await VehiclesAPI.deleteVehicle(vehicle.id);
                            window.Store.invalidate("vehicles");
                            window.UI.toast("Veicolo eliminato", "success");
                            await this.init();
                            modal.close();
                        } catch (error) {
                            window.UI.toast(error.message, "error");
                            delBtn.disabled = false;
                        }
                    }
                );
            }, this.sig());
        }
    }

    openMaintenanceModal(vehicleId) {
        const modal = window.UI.modal({
            title: "Registra Manutenzione",
            body: VehiclesView.getMaintenanceModalBody(),
            footer: VehiclesView.getMaintenanceModalFooter()
        });

        document.getElementById("m-cancel")?.addEventListener("click", () => modal.close(), this.sig());

        document.getElementById("m-save")?.addEventListener("click", async () => {
            const dateStr = document.getElementById("m-date").value;
            if (!dateStr) {
                document.getElementById("m-err").textContent = "La data è obbligatoria";
                document.getElementById("m-err").classList.remove("hidden");
                return;
            }

            const saveBtn = document.getElementById("m-save");
            saveBtn.disabled = true;

            try {
                await VehiclesAPI.addMaintenance({
                    vehicle_id: vehicleId,
                    maintenance_date: dateStr,
                    type: document.getElementById("m-type").value,
                    mileage: document.getElementById("m-km").value || null,
                    cost: document.getElementById("m-cost").value || 0,
                    description: document.getElementById("m-desc").value || null,
                    next_maintenance_date: document.getElementById("m-next-date").value || null,
                    next_maintenance_mileage: document.getElementById("m-next-km").value || null,
                });

                window.UI.toast("Manutenzione salvata", "success");
                await this.showVehicleDetail(vehicleId);
                modal.close();
            } catch (error) {
                document.getElementById("m-err").textContent = error.message;
                document.getElementById("m-err").classList.remove("hidden");
                saveBtn.disabled = false;
            }
        }, this.sig());
    }

    openAnomalyModal(vehicleId) {
        const modal = window.UI.modal({
            title: "Segnala Guasto / Anomalia",
            body: VehiclesView.getAnomalyModalBody(),
            footer: VehiclesView.getAnomalyModalFooter()
        });

        document.getElementById("a-cancel")?.addEventListener("click", () => modal.close(), this.sig());

        document.getElementById("a-save")?.addEventListener("click", async () => {
            const description = document.getElementById("a-desc").value.trim();
            if (!description) {
                document.getElementById("a-err").textContent = "Inserisci una descrizione";
                document.getElementById("a-err").classList.remove("hidden");
                return;
            }

            const saveBtn = document.getElementById("a-save");
            saveBtn.disabled = true;

            try {
                await VehiclesAPI.addAnomaly({
                    vehicle_id: vehicleId,
                    severity: document.getElementById("a-sev").value,
                    description: description,
                });

                window.UI.toast("Segnalazione inviata", "success");
                await this.showVehicleDetail(vehicleId);
                modal.close();
            } catch (error) {
                document.getElementById("a-err").textContent = error.message;
                document.getElementById("a-err").classList.remove("hidden");
                saveBtn.disabled = false;
            }
        }, this.sig());
    }

    openAnomalyResolutionModal(anomalyId, vehicleId) {
        const modal = window.UI.modal({
            title: "Chiudi Anomalia",
            body: VehiclesView.getResolveAnomalyModalBody(),
            footer: VehiclesView.getResolveAnomalyModalFooter()
        });

        document.getElementById("ar-cancel")?.addEventListener("click", () => modal.close(), this.sig());

        document.getElementById("ar-save")?.addEventListener("click", async () => {
            const saveBtn = document.getElementById("ar-save");
            saveBtn.disabled = true;

            try {
                await VehiclesAPI.updateAnomalyStatus({
                    id: anomalyId,
                    status: "resolved",
                    resolution_notes: document.getElementById("ar-notes").value.trim() || null,
                });

                window.UI.toast("Anomalia chiusa", "success");
                await this.showVehicleDetail(vehicleId);
                modal.close();
            } catch (error) {
                document.getElementById("ar-err").textContent = error.message;
                document.getElementById("ar-err").classList.remove("hidden");
                saveBtn.disabled = false;
            }
        }, this.sig());
    }
}

// Instantiate and expose globally for the Router
window.Vehicles = new VehiclesModule();
