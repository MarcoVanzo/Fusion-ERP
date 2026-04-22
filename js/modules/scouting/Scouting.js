import { ScoutingAPI } from './ScoutingAPI.js';
import { ScoutingView } from './ScoutingView.js';

class ScoutingModule {
    constructor() {
        this._abort = new AbortController();
        this._athletes = [];
        this._lastSync = null;
        this._activeView = 'anagrafica';
    }

    /**
     * Helper to retrieve abort signal to prevent memory leaks from event listeners 
     */
    sig() {
        return { signal: this._abort.signal };
    }

    /**
     * Unbinds all listeners and resets data
     */
    destroy() {
        this._abort.abort();
        this._abort = new AbortController();
        this._athletes = [];
        this._lastSync = null;
        this._activeView = 'anagrafica';
    }

    /**
     * Entry point loaded by Router
     */
    async init() {
        const container = document.getElementById("app");
        if (!container) return;

        window.UI.loading(true);
        container.innerHTML = window.UI.skeletonPage();

        try {
            await this.refreshData(false);
            container.innerHTML = ScoutingView.renderMainLayout();
            this.renderTableData(document.getElementById("scouting-content-area"));
        } catch (err) {
            console.error("[Scouting] Init error", err);
            container.innerHTML = window.Utils.emptyState("Errore di caricamento", err.message);
            window.UI.toast("Impossibile caricare il database scouting: " + err.message, "error");
        } finally {
            window.UI.loading(false);
        }
    }

    /**
     * Fetch records and update internal state
     * @param {boolean} reRender Trigger a re-render of table area after fetch
     */
    async refreshData(reRender = true) {
        try {
            const result = await ScoutingAPI.listDatabase();
            this._athletes = result.entries || result || [];
            this._lastSync = result.last_sync || null;

            if (reRender) {
                const area = document.getElementById("scouting-content-area");
                if (area) this.renderTableData(area);
            }
        } catch (err) {
            console.error(err);
            window.UI.toast("Errore nel caricamento del database", "error");
        }
    }

    /**
     * Injects the Table HTML and attaches interaction listeners
     * @param {HTMLElement} container Node where table area goes
     */
    renderTableData(container) {
        if (!container) return;
        
        // Ensure DOM wipe before binding new listeners
        container.innerHTML = "";
        
        const user = window.App.getUser();
        const role = user?.role?.toLowerCase();
        const canEdit = ["admin", "manager", "allenatore"].includes(role);
        
        console.log("[Scouting] User role:", role, "canEdit:", canEdit);
        
        container.innerHTML = ScoutingView.renderTableArea(this._athletes, this._lastSync, canEdit, this._activeView);
        this.bindTableEvents(container, canEdit);
    }

    bindTableEvents(container, canEdit) {
        // Search Input Filtering
        container.querySelector("#scouting-search")?.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase().trim();
            const filtered = this._athletes.filter(
                (a) => (a.nome && a.nome.toLowerCase().includes(term)) ||
                       (a.cognome && a.cognome.toLowerCase().includes(term)) ||
                       (a.societa_appartenenza && a.societa_appartenenza.toLowerCase().includes(term))
            );
            
            const tbody = document.getElementById("scouting-tbody");
            if (tbody) tbody.innerHTML = ScoutingView.renderRows(filtered, canEdit, this._activeView);
            
            const countBadge = document.getElementById("scouting-count");
            if (countBadge) countBadge.textContent = `${filtered.length} atleti`;
        }, this.sig());

        if (canEdit) {
            console.log("[Scouting] Binding event listeners for edit actions");
            
            // View Tabs
            const viewTabs = container.querySelectorAll(".scouting-view-tab");
            viewTabs.forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const view = e.currentTarget.dataset.view;
                    if (view !== this._activeView) {
                        this._activeView = view;
                        this.renderTableData(container);
                    }
                }, this.sig());
            });

            // New Entry Button
            const addBtn = container.querySelector("#scouting-add-btn");
            if (addBtn) {
                console.log("[Scouting] Add button found, attaching listener");
                // Remove sig for debugging to ensure listener is ALWAYS attached if button exists
                addBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    console.log("[Scouting] Add button clicked!");
                    this.openSidePanel();
                });
            } else {
                console.error("[Scouting] ERROR: #scouting-add-btn NOT found in container!");
            }

            // Cognito Sync Button
            const syncBtn = container.querySelector("#scouting-sync-btn");
            if (syncBtn) {
                console.log("[Scouting] Sync button found, attaching listener");
                syncBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    console.log("[Scouting] Sync button clicked!");
                    this.handleSync();
                });
            } else {
                console.error("[Scouting] ERROR: #scouting-sync-btn NOT found in container!");
            }

            // Edit Athlete Rows Delegation
            const tbody = container.querySelector("#scouting-tbody");
            if (tbody) {
                tbody.addEventListener("click", (e) => {
                    const btn = e.target.closest(".edit-athlete-btn");
                    if (btn) {
                        e.stopPropagation();
                        // Support numeric conversion if originally int, otherwise string match
                        const id = btn.dataset.id;
                        const athlete = this._athletes.find(a => a.id == id);
                        if (athlete) {
                            this.openSidePanel(athlete);
                        }
                    }

                    const delBtn = e.target.closest(".delete-athlete-btn");
                    if (delBtn) {
                        e.stopPropagation();
                        if (confirm("Sei sicuro di voler eliminare questo atleta?")) {
                            this.handleDelete(delBtn.dataset.id);
                        }
                    }
                }, this.sig());
            }
        }
    }

    async handleSync() {
        const btn = document.getElementById("scouting-sync-btn");
        const statusEl = document.getElementById("scouting-sync-status");

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Sincronizzazione…';
        }
        if (statusEl) {
            statusEl.style.display = "block";
            statusEl.innerHTML = '<span style="font-size:12px;color:var(--color-warning)"><i class="ph ph-arrows-clockwise"></i> Sincronizzazione in corso…</span>';
        }

        try {
            const res = await ScoutingAPI.syncFromCognito();
            const total = res.total || 0;
            const now = new Date().toLocaleString("it-IT");

            if (statusEl) {
                statusEl.innerHTML = `<span style="font-size:12px;color:var(--color-success)">✅ Sincronizzati ${total} atleti — ${now}</span>`;
            }

            window.UI.toast(`Sincronizzazione completata: ${total} atleti importati`, "success");
            window.Store.invalidate("scouting");
            await this.refreshData(true);
        } catch (err) {
            if (statusEl) {
                statusEl.innerHTML = `<span style="font-size:12px;color:var(--color-pink)">⚠️ ${err.message}</span>`;
            }
            window.UI.toast("Errore: " + err.message, "error");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Sincronizza da Cognito';
            }
        }
    }

    async handleDelete(id) {
        try {
            await ScoutingAPI.deleteEntry({ id });
            window.UI.toast("Atleta eliminato con successo", "success");
            window.Store.invalidate("scouting");
            await this.refreshData(true);
        } catch (err) {
            window.UI.toast("Errore durante l'eliminazione: " + err.message, "error");
        }
    }

    openSidePanel(athlete = null) {
        const isEdit = athlete !== null;
        const panel = document.getElementById("scouting-side-panel");
        if (!panel) return;

        panel.innerHTML = ScoutingView.renderSidePanelForm(athlete);
        panel.style.display = "flex";
        
        // Trigger reflow for transition
        void panel.offsetWidth;
        panel.classList.add("open");

        const closeModal = () => {
            panel.classList.remove("open");
            setTimeout(() => {
                panel.style.display = "none";
                panel.innerHTML = "";
            }, 300); // match transition time
        };

        // UI Closure Bindings
        document.getElementById("sc-cancel-panel")?.addEventListener("click", closeModal, this.sig());
        document.getElementById("sc-cancel-panel-btn")?.addEventListener("click", closeModal, this.sig());

        // Save Bindings
        document.getElementById("sc-save-panel")?.addEventListener("click", async (e) => {
            const errorDiv = document.getElementById("sc-error");
            const saveBtn = e.currentTarget;

            const payload = {
                nome: document.getElementById("sc-nome")?.value.trim(),
                cognome: document.getElementById("sc-cognome")?.value.trim(),
                ruolo: document.getElementById("sc-ruolo")?.value.trim(),
                societa_appartenenza: document.getElementById("sc-societa")?.value.trim(),
                email: document.getElementById("sc-email")?.value.trim(),
                cellulare: document.getElementById("sc-cellulare")?.value.trim(),
                anno_nascita: document.getElementById("sc-anno")?.value,
                rilevatore: document.getElementById("sc-rilevatore")?.value.trim(),
                data_rilevazione: document.getElementById("sc-data")?.value,
                note: document.getElementById("sc-note")?.value.trim(),
                altezza: document.getElementById("sc-altezza")?.value,
                peso: document.getElementById("sc-peso")?.value,
                reach_cm: document.getElementById("sc-reach")?.value,
                cmj: document.getElementById("sc-cmj")?.value,
                salto_rincorsa: document.getElementById("sc-salto")?.value
            };

            if (isEdit) {
                payload.id = saveBtn.dataset.id; // retrieved from dataset injected by ScoutingView
            }

            if (!payload.nome || !payload.cognome) {
                errorDiv.textContent = "Nome e cognome sono obbligatori.";
                errorDiv.classList.remove("hidden");
                return;
            }

            try {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvataggio...';

                if (isEdit) {
                    await ScoutingAPI.updateEntry(payload);
                } else {
                    await ScoutingAPI.addManualEntry(payload);
                }

                window.Store.invalidate("scouting");
                window.UI.toast(isEdit ? "Modifiche salvate con successo" : "Atleta salvato con successo", "success");
                closeModal();
                await this.refreshData(true);
            } catch (err) {
                errorDiv.textContent = err.message || "Errore durante il salvataggio.";
                errorDiv.classList.remove("hidden");
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> SALVA';
            }
        }, this.sig());
    }
}

// Attach purely constructed instance to window environment mapping Router mechanics
window.Scouting = new ScoutingModule();
export default window.Scouting;
