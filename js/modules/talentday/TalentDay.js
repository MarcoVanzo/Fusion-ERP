import { TalentDayAPI } from './TalentDayAPI.js?v=1001';
import { TalentDayView } from './TalentDayView.js?v=1001';

class TalentDayModule {
    constructor() {
        this._abort = new AbortController();
        this._entries = [];
        this._activeView = 'anagrafica'; // 'anagrafica' | 'fisici'
        this._sortCol = '';
        this._sortDir = ''; // 'asc' | 'desc' | ''
        this._tappaFilter = '';
        this._searchTerm = '';
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
        this._sortCol = '';
        this._sortDir = '';
        this._tappaFilter = '';
        this._searchTerm = '';
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
        } catch (_err) {
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
        } catch (_err) {
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

        const filtered = this._getFilteredSorted();
        const tappaList = this._getTappaList();

        container.innerHTML = TalentDayView.renderTableArea(
            filtered, this._activeView, canEdit,
            tappaList, this._tappaFilter,
            this._sortCol, this._sortDir
        );
        this.bindTableEvents(container, canEdit);
    }

    /** Return predefined tappa list for the filter dropdown */
    _getTappaList() {
        return TalentDayView.TAPPE;
    }

    /** Apply search, tappa filter, and sort to entries */
    _getFilteredSorted() {
        let data = [...this._entries];

        // Tappa filter
        if (this._tappaFilter) {
            data = data.filter(e => e.tappa === this._tappaFilter);
        }

        // Search
        if (this._searchTerm) {
            const term = this._searchTerm;
            data = data.filter(
                (a) => (a.nome && a.nome.toLowerCase().includes(term)) ||
                       (a.cognome && a.cognome.toLowerCase().includes(term)) ||
                       (a.tappa && a.tappa.toLowerCase().includes(term)) ||
                       (a.club_tesseramento && a.club_tesseramento.toLowerCase().includes(term))
            );
        }

        // Sort
        if (this._sortCol && this._sortDir) {
            const key = this._sortCol;
            const dir = this._sortDir === 'asc' ? 1 : -1;
            // Numeric keys for physical measurements
            const numericKeys = new Set(['altezza', 'peso', 'reach_cm', 'cmj', 'salto_rincorsa']);

            data.sort((a, b) => {
                let va = a[key] ?? '';
                let vb = b[key] ?? '';

                if (numericKeys.has(key)) {
                    va = va !== '' ? parseFloat(va) : -Infinity;
                    vb = vb !== '' ? parseFloat(vb) : -Infinity;
                    return (va - vb) * dir;
                }

                // String comparison
                va = String(va).toLowerCase();
                vb = String(vb).toLowerCase();
                return va.localeCompare(vb, 'it') * dir;
            });
        }

        return data;
    }

    bindTableEvents(container, canEdit) {
        // ── Search ──
        container.querySelector("#td-search")?.addEventListener("input", (e) => {
            this._searchTerm = e.target.value.toLowerCase().trim();
            this._rerenderTable(container, canEdit);
        }, this.sig());

        // ── Tappa Filter ──
        container.querySelector("#td-tappa-filter")?.addEventListener("change", (e) => {
            this._tappaFilter = e.target.value;
            this._rerenderTable(container, canEdit);
        }, this.sig());

        // ── Sortable Headers ──
        container.querySelectorAll(".td-sort-header").forEach((header) => {
            header.addEventListener("click", () => {
                const key = header.dataset.sortKey;
                if (this._sortCol === key) {
                    // Cycle: asc → desc → none
                    if (this._sortDir === 'asc') this._sortDir = 'desc';
                    else { this._sortCol = ''; this._sortDir = ''; }
                } else {
                    this._sortCol = key;
                    this._sortDir = 'asc';
                }
                this._rerenderTable(container, canEdit);
            }, this.sig());
        });

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

    /** Re-render just the table content (headers + rows + count) without full container rebuild */
    _rerenderTable(container, canEdit) {
        const filtered = this._getFilteredSorted();
        const _tappaList = this._getTappaList();

        // Update headers
        const thead = container.querySelector("#td-table thead tr");
        if (thead) thead.innerHTML = TalentDayView._headers(this._activeView, canEdit, this._sortCol, this._sortDir);

        // Update rows
        const tbody = document.getElementById("td-tbody");
        if (tbody) tbody.innerHTML = TalentDayView.renderRows(filtered, this._activeView, canEdit);

        // Update count badge
        const countBadge = document.getElementById("td-count");
        if (countBadge) countBadge.textContent = `${filtered.length} registrazioni`;

        // Re-bind sort headers (they were replaced)
        container.querySelectorAll(".td-sort-header").forEach((header) => {
            header.addEventListener("click", () => {
                const key = header.dataset.sortKey;
                if (this._sortCol === key) {
                    if (this._sortDir === 'asc') this._sortDir = 'desc';
                    else { this._sortCol = ''; this._sortDir = ''; }
                } else {
                    this._sortCol = key;
                    this._sortDir = 'asc';
                }
                this._rerenderTable(container, canEdit);
            }, this.sig());
        });

        // Re-bind tbody delegation for edit/delete on new rows
        if (canEdit) {
            const newTbody = container.querySelector("#td-tbody");
            if (newTbody) {
                newTbody.addEventListener("click", (e) => {
                    const editBtn = e.target.closest(".td-edit-btn");
                    if (editBtn) {
                        e.stopPropagation();
                        const entry = this._entries.find(a => a.id == editBtn.dataset.id);
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
        } catch (_err) {
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
                privacy_consent:    document.getElementById("td-privacy-consent")?.checked ? 1 : 0,
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
            } catch (_err) {
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
