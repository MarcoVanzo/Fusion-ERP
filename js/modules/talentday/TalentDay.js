import { TalentDayAPI } from './TalentDayAPI.js';
import { TalentDayView } from './TalentDayView.js';

class TalentDayModule {
    constructor() {
        this._abort = new AbortController();
        this._entries = [];
        this._activeView = 'anagrafica'; // 'anagrafica' | 'fisici'
    }

    /** Helper to retrieve abort signal to prevent memory leaks from event listeners */
    sig() {
        return { signal: this._abort.signal };
    }

    /** Unbinds all listeners and resets data */
    destroy() {
        this._abort.abort();
        this._abort = new AbortController();
        this._entries = [];
        this._activeView = 'anagrafica';
    }

    /** Entry point loaded by Router */
    async init() {
        const container = document.getElementById("app");
        if (!container) return;

        window.UI.loading(true);
        container.innerHTML = window.UI.skeletonPage();

        try {
            await this.refreshData(false);
            container.innerHTML = TalentDayView.renderMainLayout();
            this.renderTableData(document.getElementById("td-content-area"));
        } catch (err) {
            console.error("[TalentDay] Init error", err);
            container.innerHTML = window.Utils.emptyState("Errore di caricamento", err.message);
            window.UI.toast("Impossibile caricare le registrazioni Talent Day: " + err.message, "error");
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
            const result = await TalentDayAPI.listEntries();
            this._entries = result.entries || result || [];

            if (reRender) {
                const area = document.getElementById("td-content-area");
                if (area) this.renderTableData(area);
            }
        } catch (err) {
            console.error("[TalentDay] Data fetch error", err);
            window.UI.toast("Errore nel caricamento dei dati Talent Day", "error");
        }
    }

    /**
     * Injects the Table HTML and attaches interaction listeners
     * @param {HTMLElement} container Node where table area goes
     */
    renderTableData(container) {
        if (!container) return;

        container.innerHTML = "";

        const user = window.App.getUser();
        const role = user?.role?.toLowerCase();
        const canEdit = ["admin", "manager", "allenatore"].includes(role);

        container.innerHTML = TalentDayView.renderTableArea(this._entries, this._activeView, canEdit);
        this.bindTableEvents(container, canEdit);
    }

    bindTableEvents(container, canEdit) {
        // ── Search ──
        container.querySelector("#td-search")?.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase().trim();
            const filtered = this._entries.filter(
                (a) => (a.nome && a.nome.toLowerCase().includes(term)) ||
                       (a.cognome && a.cognome.toLowerCase().includes(term)) ||
                       (a.tappa && a.tappa.toLowerCase().includes(term)) ||
                       (a.club_tesseramento && a.club_tesseramento.toLowerCase().includes(term))
            );

            const tbody = document.getElementById("td-tbody");
            if (tbody) tbody.innerHTML = TalentDayView.renderRows(filtered, this._activeView, canEdit);

            const countBadge = document.getElementById("td-count");
            if (countBadge) countBadge.textContent = `${filtered.length} registrazioni`;
        }, this.sig());

        // ── View Tabs Toggle ──
        container.querySelectorAll(".td-view-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                this._activeView = tab.dataset.view;
                this.renderTableData(container);
            }, this.sig());
        });

        if (canEdit) {
            // ── Add Button ──
            const addBtn = container.querySelector("#td-add-btn");
            if (addBtn) {
                addBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    this.openSidePanel();
                }, this.sig());
            }

            // ── Table Row Actions (Edit / Delete) via Delegation ──
            const tbody = container.querySelector("#td-tbody");
            if (tbody) {
                tbody.addEventListener("click", (e) => {
                    const editBtn = e.target.closest(".td-edit-btn");
                    if (editBtn) {
                        e.stopPropagation();
                        const id = editBtn.dataset.id;
                        const entry = this._entries.find(a => a.id == id);
                        if (entry) this.openSidePanel(entry);
                    }

                    const delBtn = e.target.closest(".td-delete-btn");
                    if (delBtn) {
                        e.stopPropagation();
                        if (confirm("Sei sicuro di voler eliminare questa registrazione?")) {
                            this.handleDelete(delBtn.dataset.id);
                        }
                    }
                }, this.sig());
            }
        }
    }

    async handleDelete(id) {
        try {
            await TalentDayAPI.deleteEntry({ id });
            window.UI.toast("Registrazione eliminata con successo", "success");
            window.Store.invalidate("talentday");
            await this.refreshData(true);
        } catch (err) {
            window.UI.toast("Errore durante l'eliminazione: " + err.message, "error");
        }
    }

    openSidePanel(entry = null) {
        const isEdit = entry !== null;
        const panel = document.getElementById("td-side-panel");
        if (!panel) return;

        panel.innerHTML = TalentDayView.renderSidePanelForm(entry);
        panel.style.display = "flex";

        // Trigger reflow for transition
        void panel.offsetWidth;
        panel.classList.add("open");

        const closeModal = () => {
            panel.classList.remove("open");
            setTimeout(() => {
                panel.style.display = "none";
                panel.innerHTML = "";
            }, 300);
        };

        // Close bindings
        document.getElementById("td-cancel-panel")?.addEventListener("click", closeModal, this.sig());
        document.getElementById("td-cancel-panel-btn")?.addEventListener("click", closeModal, this.sig());

        // Save binding
        document.getElementById("td-save-panel")?.addEventListener("click", async (ev) => {
            const errorDiv = document.getElementById("td-error");
            const saveBtn = ev.currentTarget;

            const payload = {
                data_registrazione: document.getElementById("td-data-reg")?.value || null,
                ora_registrazione:  document.getElementById("td-ora-reg")?.value || null,
                email:              document.getElementById("td-email")?.value.trim() || null,
                tappa:              document.getElementById("td-tappa")?.value.trim() || null,
                nome:               document.getElementById("td-nome")?.value.trim(),
                cognome:            document.getElementById("td-cognome")?.value.trim(),
                indirizzo:          document.getElementById("td-indirizzo")?.value.trim() || null,
                citta_cap:          document.getElementById("td-citta-cap")?.value.trim() || null,
                data_nascita:       document.getElementById("td-data-nascita")?.value || null,
                cellulare:          document.getElementById("td-cellulare")?.value.trim() || null,
                taglia_tshirt:      document.getElementById("td-taglia")?.value || null,
                club_tesseramento:  document.getElementById("td-club")?.value.trim() || null,
                ruolo:              document.getElementById("td-ruolo")?.value.trim() || null,
                campionati:         document.getElementById("td-campionati")?.value.trim() || null,
                nome_genitore:      document.getElementById("td-nome-gen")?.value.trim() || null,
                telefono_genitore:  document.getElementById("td-tel-gen")?.value.trim() || null,
                email_genitore:     document.getElementById("td-email-gen")?.value.trim() || null,
                altezza:            document.getElementById("td-altezza")?.value || null,
                peso:               document.getElementById("td-peso")?.value || null,
                reach_cm:           document.getElementById("td-reach")?.value || null,
                cmj:                document.getElementById("td-cmj")?.value || null,
                salto_rincorsa:     document.getElementById("td-salto")?.value || null,
            };

            if (isEdit) {
                payload.id = saveBtn.dataset.id;
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
                    await TalentDayAPI.updateEntry(payload);
                } else {
                    await TalentDayAPI.addEntry(payload);
                }

                window.Store.invalidate("talentday");
                window.UI.toast(isEdit ? "Modifiche salvate con successo" : "Registrazione salvata con successo", "success");
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

// Attach instance to window for Router mechanics
window.TalentDay = new TalentDayModule();
export default window.TalentDay;
