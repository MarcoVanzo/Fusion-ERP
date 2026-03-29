/**
 * Societa Foresteria Module — Handles housing, expenses, and media
 */
import SocietaAPI from './SocietaAPI.js';

export default {
    abortController: new AbortController(),

    init: async function(container, signal) {
        this.abortController = new AbortController();
        const data = await SocietaAPI.getForesteria();
        
        this.render(container, data);
        this.attachEvents(container, data.info, signal);
        
        // Google Maps integration (if coordinates exist)
        if (data.info.lat && data.info.lng) {
            this.initMap(data.info);
        }
    },

    render: function(container, data) {
        // Implementation of rendering if not using SocietaView
        // ... (SocietaView.foresteria is already defined)
    },

    attachEvents: function(container, info, signal) {
        // Expense deletion
        container.querySelectorAll("[data-del-expense]").forEach(btn => {
            btn.addEventListener("click", async () => {
                UI.confirm("Eliminare questa spesa?", async () => {
                    try {
                        await SocietaAPI.deleteExpense(btn.dataset.delExpense);
                        UI.toast("Spesa rimossa", "success");
                        this.refresh(container, signal);
                    } catch (err) {
                        UI.toast("Errore: " + err.message, "error");
                    }
                });
            }, { signal });
        });

        // Add expense
        document.getElementById("forest-add-expense")?.addEventListener("click", () => this.showAddExpenseModal(container, signal), { signal });
        
        // Edit info
        document.getElementById("forest-edit-info")?.addEventListener("click", () => this.showEditInfoModal(container, info, signal), { signal });
        
        // Media management
        document.getElementById("forest-upload-media")?.addEventListener("click", () => this.showUploadMediaModal(container, signal), { signal });
        document.getElementById("forest-add-youtube")?.addEventListener("click", () => this.showAddYoutubeModal(container, signal), { signal });
        
        container.querySelectorAll(".forest-media-del").forEach(btn => {
            btn.addEventListener("click", ev => {
                ev.stopPropagation();
                UI.confirm("Rimuovere questo media?", async () => {
                    try {
                        await SocietaAPI.deleteForesteriaMedia(btn.dataset.id);
                        UI.toast("Media rimosso", "success");
                        this.refresh(container, signal);
                    } catch (err) {
                        UI.toast("Errore: " + err.message, "error");
                    }
                });
            }, { signal });
        });
    },

    refresh: async function() {
        if (window.Societa && typeof window.Societa.refreshTab === 'function') {
            await window.Societa.refreshTab();
        }
    },

    initMap: function(info) {
        const mapDiv = document.getElementById("forest-map-container");
        if (!mapDiv || typeof google === "undefined") return;

        const pos = { lat: parseFloat(info.lat), lng: parseFloat(info.lng) };
        const map = new google.maps.Map(mapDiv, {
            center: pos,
            zoom: 16,
            mapId: "fusion_premium_map",
            disableDefaultUI: false,
            gestureHandling: 'cooperative'
        });

        new google.maps.Marker({
            position: pos,
            map: map,
            title: info.address || "Foresteria",
            animation: google.maps.Animation.DROP
        });
    },

    showAddExpenseModal: function(container, signal) {
        const modal = UI.modal({
            title: "Aggiungi Spesa Foresteria",
            body: `
                <div class="form-group">
                    <label class="form-label">Data Spesa</label>
                    <input type="date" id="fe-date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">Descrizione</label>
                    <input type="text" id="fe-desc" class="form-input" placeholder="Es. Bolletta Luce Gennaio">
                </div>
                <div class="form-group">
                    <label class="form-label">Importo (€)</label>
                    <input type="number" step="0.01" id="fe-amount" class="form-input" placeholder="0.00">
                </div>
            `,
            footer: `<button class="btn-dash" id="fe-cancel">Annulla</button><button class="btn-dash pink" id="fe-save">Salva Spesa</button>`
        });

        document.getElementById("fe-cancel")?.addEventListener("click", () => modal.close());
        document.getElementById("fe-save")?.addEventListener("click", async () => {
            const data = {
                expense_date: document.getElementById("fe-date")?.value,
                description: document.getElementById("fe-desc")?.value,
                amount: document.getElementById("fe-amount")?.value
            };
            if (!data.description || !data.amount) {
                UI.toast("Inserire descrizione e importo", "warning");
                return;
            }
            try {
                await SocietaAPI.addExpense(data);
                UI.toast("Spesa aggiunta", "success");
                modal.close();
                this.refresh();
            } catch (err) {
                UI.toast(err.message, "error");
            }
        });
    },

    showEditInfoModal: function(container, info, signal) {
        const modal = UI.modal({
            title: "Modifica Informazioni Foresteria",
            body: `
                <div class="form-group">
                    <label class="form-label">Indirizzo</label>
                    <input type="text" id="mf-address" class="form-input" value="${Utils.escapeHtml(info.address || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Descrizione / Regolamento</label>
                    <textarea id="mf-desc" class="form-input" rows="8">${Utils.escapeHtml(info.description || '')}</textarea>
                </div>
            `,
            footer: `<button class="btn-dash" id="mf-cancel">Annulla</button><button class="btn-dash pink" id="mf-save">Salva</button>`
        });

        document.getElementById("mf-cancel")?.addEventListener("click", () => modal.close());
        document.getElementById("mf-save")?.addEventListener("click", async () => {
            const body = {
                address: document.getElementById("mf-address")?.value,
                description: document.getElementById("mf-desc")?.value
            };
            try {
                await SocietaAPI.saveForesteria(body);
                UI.toast("Informazioni salvate", "success");
                modal.close();
                this.refresh();
            } catch (err) {
                UI.toast(err.message, "error");
            }
        });
    },

    showUploadMediaModal: function(container, signal) {
        const modal = UI.modal({
            title: "Carica Media Foresteria",
            body: `
                <div class="form-group">
                    <label class="form-label">Seleziona File (Immagine o Video)</label>
                    <input type="file" id="fm-file" class="form-input" accept="image/*,video/*">
                </div>
            `,
            footer: `<button class="btn-dash" id="fm-cancel">Annulla</button><button class="btn-dash pink" id="fm-upload">Carica</button>`
        });

        document.getElementById("fm-cancel")?.addEventListener("click", () => modal.close());
        document.getElementById("fm-upload")?.addEventListener("click", async () => {
            const fileInput = document.getElementById("fm-file");
            if (!fileInput?.files[0]) {
                UI.toast("Selezionare un file", "warning");
                return;
            }
            const fd = new FormData();
            fd.append("file", fileInput.files[0]);
            try {
                UI.loading(true);
                await SocietaAPI.uploadForesteriaMedia(fd);
                UI.toast("Media caricato", "success");
                modal.close();
                this.refresh();
            } catch (err) {
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
            }
        });
    },

    showAddYoutubeModal: function(container, signal) {
        const modal = UI.modal({
            title: "Aggiungi Link YouTube",
            body: `
                <div class="form-group">
                    <label class="form-label">URL Video YouTube</label>
                    <input type="text" id="fy-url" class="form-input" placeholder="https://www.youtube.com/watch?v=...">
                </div>
            `,
            footer: `<button class="btn-dash" id="fy-cancel">Annulla</button><button class="btn-dash pink" id="fy-save">Aggiungi</button>`
        });

        document.getElementById("fy-cancel")?.addEventListener("click", () => modal.close());
        document.getElementById("fy-save")?.addEventListener("click", async () => {
            const url = document.getElementById("fy-url")?.value;
            if (!url) return;
            try {
                await SocietaAPI.addForesteriaYoutubeLink({ url });
                UI.toast("Link aggiunto", "success");
                modal.close();
                this.refresh();
            } catch (err) {
                UI.toast(err.message, "error");
            }
        });
    }
};
