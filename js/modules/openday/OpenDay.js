import { OpenDayAPI } from './OpenDayAPI.js?v=1002';
import { OpenDayView } from './OpenDayView.js?v=1002';

class OpenDayModule {
    constructor() {
        this._abort = new AbortController();
        this._entries = [];
        this._activeView = 'anagrafica';
        this._sortCol = '';
        this._sortDir = '';
        this._searchTerm = '';
        this._annata = new Date().getFullYear();
        this._availableYears = [this._annata];
    }

    sig() { return { signal: this._abort.signal }; }

    destroy() {
        this._abort.abort();
        this._abort = new AbortController();
        this._entries = [];
        this._activeView = 'anagrafica';
        this._sortCol = '';
        this._sortDir = '';
        this._searchTerm = '';
        this._annata = new Date().getFullYear();
        this._availableYears = [this._annata];
    }

    async init() {
        const container = document.getElementById("app");
        if (!container) return;

        window.UI.loading(true);
        container.innerHTML = window.UI.skeletonPage();

        try {
            await this.refreshData(false);
            container.innerHTML = OpenDayView.renderMainLayout(this._annata, this._availableYears);
            this.renderTableData(document.getElementById("od-content-area"));

            const statsArea = document.getElementById("od-stats-area");
            if (statsArea) statsArea.innerHTML = OpenDayView.renderStatsSummary(this._entries, this._annata);

            this.bindYearSelector();
        } catch (err) {
            console.error("[OpenDay] Init error", err);
            container.innerHTML = window.Utils.emptyState("Errore di caricamento", err.message);
            window.UI.toast("Impossibile caricare le registrazioni Open Day: " + err.message, "error");
        } finally {
            window.UI.loading(false);
        }
    }

    bindYearSelector() {
        const sel = document.getElementById("od-annata-select");
        if (!sel) return;
        sel.addEventListener("change", async () => {
            this._annata = parseInt(sel.value, 10);
            window.Store.invalidate("openday");
            await this.refreshData(true);

            const statsArea = document.getElementById("od-stats-area");
            if (statsArea) statsArea.innerHTML = OpenDayView.renderStatsSummary(this._entries, this._annata);
        }, this.sig());
    }

    async refreshData(reRender = true) {
        try {
            const result = await OpenDayAPI.listEntries(this._annata);
            this._entries = result.entries || result || [];
            if (result.available_years && result.available_years.length > 0) {
                this._availableYears = result.available_years;
            }

            if (reRender) {
                const area = document.getElementById("od-content-area");
                if (area) this.renderTableData(area);

                const statsArea = document.getElementById("od-stats-area");
                if (statsArea) statsArea.innerHTML = OpenDayView.renderStatsSummary(this._entries, this._annata);

                // Update year selector options if new years appeared
                const sel = document.getElementById("od-annata-select");
                if (sel) {
                    const currentOpts = Array.from(sel.options).map(o => parseInt(o.value, 10));
                    this._availableYears.forEach(y => {
                        if (!currentOpts.includes(y)) {
                            const opt = document.createElement("option");
                            opt.value = y;
                            opt.textContent = y;
                            sel.prepend(opt);
                        }
                    });
                    sel.value = this._annata;
                }
            }
        } catch (err) {
            console.error("[OpenDay] Data fetch error", err);
            window.UI.toast("Errore nel caricamento dei dati Open Day", "error");
        }
    }

    renderTableData(container) {
        if (!container) return;
        container.innerHTML = "";

        const user = window.App.getUser();
        const role = user?.role?.toLowerCase();
        const canEdit = ["admin", "manager", "allenatore"].includes(role);
        const filtered = this._getFilteredSorted();

        container.innerHTML = OpenDayView.renderTableArea(
            filtered, this._activeView, canEdit,
            this._sortCol, this._sortDir
        );
        this.bindTableEvents(container, canEdit);
    }

    _getFilteredSorted() {
        let data = [...this._entries];

        if (this._searchTerm) {
            const term = this._searchTerm;
            data = data.filter(
                (a) => (a.nome && a.nome.toLowerCase().includes(term)) ||
                       (a.cognome && a.cognome.toLowerCase().includes(term)) ||
                       (a.club_tesseramento && a.club_tesseramento.toLowerCase().includes(term))
            );
        }

        if (this._sortCol && this._sortDir) {
            const key = this._sortCol;
            const dir = this._sortDir === 'asc' ? 1 : -1;
            const numericKeys = new Set(['altezza', 'reach_cm', 'salto_rincorsa_1', 'salto_rincorsa_2', 'salto_rincorsa_3']);

            data.sort((a, b) => {
                let va = a[key] ?? '';
                let vb = b[key] ?? '';
                if (numericKeys.has(key)) {
                    va = va !== '' ? parseFloat(va) : -Infinity;
                    vb = vb !== '' ? parseFloat(vb) : -Infinity;
                    return (va - vb) * dir;
                }
                va = String(va).toLowerCase();
                vb = String(vb).toLowerCase();
                return va.localeCompare(vb, 'it') * dir;
            });
        }

        return data;
    }

    bindTableEvents(container, canEdit) {
        container.querySelector("#od-search")?.addEventListener("input", (e) => {
            this._searchTerm = e.target.value.toLowerCase().trim();
            this._rerenderTable(container, canEdit);
        }, this.sig());

        container.querySelectorAll(".od-sort-header").forEach((header) => {
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

        container.querySelectorAll(".od-view-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                this._activeView = tab.dataset.view;
                this.renderTableData(container);
            }, this.sig());
        });

        if (canEdit) {
            container.querySelector("#od-add-btn")?.addEventListener("click", (e) => {
                e.preventDefault();
                this.openSidePanel();
            }, this.sig());

            container.querySelector("#od-export-btn")?.addEventListener("click", (e) => {
                e.preventDefault();
                this.exportToExcel();
            }, this.sig());

            const tbody = container.querySelector("#od-tbody");
            if (tbody) {
                tbody.addEventListener("click", (e) => {
                    const editBtn = e.target.closest(".od-edit-btn");
                    if (editBtn) {
                        e.stopPropagation();
                        const entry = this._entries.find(a => a.id == editBtn.dataset.id);
                        if (entry) this.openSidePanel(entry);
                    }
                    const delBtn = e.target.closest(".od-delete-btn");
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

    _rerenderTable(container, canEdit) {
        const filtered = this._getFilteredSorted();

        const thead = container.querySelector("#od-table thead tr");
        if (thead) thead.innerHTML = OpenDayView._headers(this._activeView, canEdit, this._sortCol, this._sortDir);

        const tbody = document.getElementById("od-tbody");
        if (tbody) tbody.innerHTML = OpenDayView.renderRows(filtered, this._activeView, canEdit);

        const countBadge = document.getElementById("od-count");
        if (countBadge) countBadge.textContent = `${filtered.length} registrazioni`;

        container.querySelectorAll(".od-sort-header").forEach((header) => {
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
    }

    async handleDelete(id) {
        try {
            await OpenDayAPI.deleteEntry({ id });
            window.UI.toast("Registrazione eliminata con successo", "success");
            window.Store.invalidate("openday");
            await this.refreshData(true);
        } catch (err) {
            window.UI.toast("Errore durante l'eliminazione: " + err.message, "error");
        }
    }

    exportToExcel() {
        const data = this._getFilteredSorted();
        if (data.length === 0) {
            window.UI.toast("Nessun dato da esportare", "warning");
            return;
        }

        const headers = [
            "Data Reg.", "Ora", "Nome", "Cognome", "Email", "Cellulare",
            "Data Nascita", "Città/CAP", "Indirizzo", "Taglia", "Club", "Ruolo",
            "Campionati", "Genitore", "Tel. Gen.", "Email Gen.", "Altezza",
            "Reach", "Salto Rinc 1", "Salto Rinc 2", "Salto Rinc 3", "Privacy GDPR"
        ];

        const rows = data.map(e => [
            e.data_registrazione ? e.data_registrazione.substring(0, 10) : "",
            e.ora_registrazione || "",
            `"${(e.nome || "").replace(/"/g, '""')}"`,
            `"${(e.cognome || "").replace(/"/g, '""')}"`,
            `"${(e.email || "").replace(/"/g, '""')}"`,
            `"${(e.cellulare || "").replace(/"/g, '""')}"`,
            e.data_nascita || "",
            `"${(e.citta_cap || "").replace(/"/g, '""')}"`,
            `"${(e.indirizzo || "").replace(/"/g, '""')}"`,
            `"${(e.taglia_tshirt || "").replace(/"/g, '""')}"`,
            `"${(e.club_tesseramento || "").replace(/"/g, '""')}"`,
            `"${(e.ruolo || "").replace(/"/g, '""')}"`,
            `"${(e.campionati || "").replace(/"/g, '""')}"`,
            `"${(e.nome_genitore || "").replace(/"/g, '""')}"`,
            `"${(e.telefono_genitore || "").replace(/"/g, '""')}"`,
            `"${(e.email_genitore || "").replace(/"/g, '""')}"`,
            e.altezza || "",
            e.reach_cm || "",
            e.salto_rincorsa_1 || "",
            e.salto_rincorsa_2 || "",
            e.salto_rincorsa_3 || "",
            e.privacy_consent ? "SI" : "NO"
        ]);

        const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `OpenDay_${this._annata}_Export_${new Date().toISOString().substring(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    openSidePanel(entry = null) {
        const isEdit = entry !== null;
        const panel = document.getElementById("od-side-panel");
        if (!panel) return;

        panel.innerHTML = OpenDayView.renderSidePanelForm(entry, this._annata);
        panel.style.display = "flex";
        void panel.offsetWidth;
        panel.classList.add("open");

        const updateHeight = () => {
            if (window.visualViewport) {
                panel.style.height = window.visualViewport.height + "px";
                panel.style.top = window.visualViewport.offsetTop + "px";
            }
        };
        
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", updateHeight);
            window.visualViewport.addEventListener("scroll", updateHeight);
            updateHeight();
        }

        const closeModal = () => {
            panel.classList.remove("open");
            if (window.visualViewport) {
                window.visualViewport.removeEventListener("resize", updateHeight);
                window.visualViewport.removeEventListener("scroll", updateHeight);
            }
            setTimeout(() => { 
                panel.style.display = "none"; 
                panel.style.height = "";
                panel.style.top = "";
                panel.innerHTML = ""; 
            }, 300);
        };

        document.getElementById("od-cancel-panel")?.addEventListener("click", closeModal, this.sig());
        document.getElementById("od-cancel-panel-btn")?.addEventListener("click", closeModal, this.sig());

        document.getElementById("od-save-panel")?.addEventListener("click", async (ev) => {
            const errorDiv = document.getElementById("od-error");
            const saveBtn = ev.currentTarget;

            const payload = {
                annata:             this._annata,
                data_registrazione: document.getElementById("od-data-reg")?.value || null,
                ora_registrazione:  document.getElementById("od-ora-reg")?.value || null,
                email:              document.getElementById("od-email")?.value.trim() || null,
                nome:               document.getElementById("od-nome")?.value.trim(),
                cognome:            document.getElementById("od-cognome")?.value.trim(),
                privacy_consent:    document.getElementById("od-privacy-consent")?.checked ? 1 : 0,
                indirizzo:          document.getElementById("od-indirizzo")?.value.trim() || null,
                citta_cap:          document.getElementById("od-citta-cap")?.value.trim() || null,
                data_nascita:       document.getElementById("od-data-nascita")?.value || null,
                cellulare:          document.getElementById("od-cellulare")?.value.trim() || null,
                taglia_tshirt:      document.getElementById("od-taglia")?.value || null,
                club_tesseramento:  document.getElementById("od-club")?.value.trim() || null,
                ruolo:              document.getElementById("od-ruolo")?.value.trim() || null,
                campionati:         document.getElementById("od-campionati")?.value.trim() || null,
                nome_genitore:      document.getElementById("od-nome-gen")?.value.trim() || null,
                telefono_genitore:  document.getElementById("od-tel-gen")?.value.trim() || null,
                email_genitore:     document.getElementById("od-email-gen")?.value.trim() || null,
                altezza:            document.getElementById("od-altezza")?.value || null,
                reach_cm:           document.getElementById("od-reach")?.value || null,
                salto_rincorsa_1:   document.getElementById("od-salto-1")?.value || null,
                salto_rincorsa_2:   document.getElementById("od-salto-2")?.value || null,
                salto_rincorsa_3:   document.getElementById("od-salto-3")?.value || null,
            };

            if (isEdit) payload.id = saveBtn.dataset.id;

            if (!payload.nome || !payload.cognome) {
                errorDiv.textContent = "Nome e cognome sono obbligatori.";
                errorDiv.classList.remove("hidden");
                return;
            }

            try {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvataggio...';

                if (isEdit) await OpenDayAPI.updateEntry(payload);
                else await OpenDayAPI.addEntry(payload);

                window.Store.invalidate("openday");
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

window.OpenDay = new OpenDayModule();
export default window.OpenDay;
