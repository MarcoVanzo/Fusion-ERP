/**
 * Finance Module — Main Orchestrator
 * Fusion ERP v1.1
 */
import FinanceAPI from './finance/FinanceAPI.js';
import FinanceView from './finance/FinanceView.js';

const Finance = {
    _abort: new AbortController(),
    _data: null,
    _categories: {},
    _accounts: [],
    _currentView: "dashboard", // 'dashboard' | 'entries' | 'accounts'

    /** signal() helper for event listeners */
    sig: function() { return { signal: this._abort.signal }; },

    destroy: function() {
        this._abort.abort();
    },

    init: async function() {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        appContainer.innerHTML = FinanceView.skeleton();
        
        try {
            // Load essential metadata
            this._categories = await FinanceAPI.getCategories();
            this._accounts = await FinanceAPI.getChartOfAccounts();

            await this.loadAndRender();
        } catch (err) {
            console.error("[Finance] Init error:", err);
            appContainer.innerHTML = Utils.emptyState("Errore caricamento", err.message);
        }
    },

    loadAndRender: async function() {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        UI.loading(true);
        try {
            if (this._currentView === "dashboard") {
                this._data = await FinanceAPI.getDashboard();
                appContainer.innerHTML = FinanceView.dashboard(this._data, this._categories);
                this.attachDashboardEvents(appContainer);
            } else if (this._currentView === "accounts") {
                appContainer.innerHTML = FinanceView.accountsList(this._accounts);
                this.attachBasicEvents(appContainer);
            }
        } catch (err) {
            UI.toast(err.message, "error");
        } finally {
            UI.loading(false);
        }
    },

    attachDashboardEvents: function(container) {
        container.querySelector("#btn-new-entry")?.addEventListener("click", () => this.openEntryModal(), this.sig());
        container.querySelector("#btn-view-accounts")?.addEventListener("click", () => {
            this._currentView = "accounts";
            this.loadAndRender();
        }, this.sig());

        container.querySelectorAll(".finance-entry-row").forEach(row => {
            row.addEventListener("click", async () => {
                const id = row.dataset.id;
                try {
                    UI.loading(true);
                    const data = await FinanceAPI.getEntry(id);
                    if (data && data.entry) {
                        const modal = UI.modal({
                            title: Utils.escapeHtml(data.entry.description),
                            body: FinanceView.entryDetailModal(data.entry, this._categories),
                            footer: '<button class="btn-dash ghost" id="modal-close-detail">Chiudi</button>'
                        });
                        document.getElementById("modal-close-detail")?.addEventListener("click", () => modal.close(), this.sig());
                    }
                } catch (err) {
                    UI.toast("Impossibile caricare i dettagli: " + err.message, "error");
                } finally {
                    UI.loading(false);
                }
            }, this.sig());
        });
    },

    attachBasicEvents: function(container) {
        container.querySelector("#btn-back-dash")?.addEventListener("click", () => {
            this._currentView = "dashboard";
            this.loadAndRender();
        }, this.sig());
    },

    openEntryModal: function() {
        const modal = UI.modal({
            title: "Nuova Registrazione",
            body: FinanceView.entryModal(this._categories, this._accounts),
            footer: '<button class="btn-dash ghost" id="modal-cancel">Annulla</button><button class="btn-dash primary" id="modal-save">REGISTRA</button>'
        });

        document.getElementById("modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());

        document.getElementById("modal-save")?.addEventListener("click", async () => {
            const form = document.getElementById("entry-form");
            const data = {
                description: document.getElementById("entry-desc").value.trim(),
                entry_date: document.getElementById("entry-date").value,
                category: document.getElementById("entry-cat").value,
                total_amount: parseFloat(document.getElementById("entry-amount").value),
                payment_method: document.getElementById("entry-payment").value,
                lines: [
                    { account_id: document.getElementById("entry-debit").value, debit: parseFloat(document.getElementById("entry-amount").value), credit: 0 },
                    { account_id: document.getElementById("entry-credit").value, debit: 0, credit: parseFloat(document.getElementById("entry-amount").value) }
                ]
            };

            if (!data.description || !data.total_amount) {
                UI.toast("Descrizione e importo obbligatori", "warning");
                return;
            }

            try {
                UI.loading(true);
                await FinanceAPI.createEntry(data);
                UI.toast("Registrazione salvata", "success");
                modal.close();
                await this.refresh();
            } catch (err) {
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
            }
        }, this.sig());
    },

    refresh: async function() {
        Store.invalidate("dashboard", "finance");
        await this.loadAndRender();
    }
};

export default Finance;
window.Finance = Finance;
