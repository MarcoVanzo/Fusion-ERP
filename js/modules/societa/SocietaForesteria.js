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

    refresh: async function(container, signal) {
        const data = await SocietaAPI.getForesteria();
        // Here we trigger the main Societa orchestrator to re-render or do it locally
        // container.dispatchEvent(new CustomEvent('forest-refresh'));
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
            gestureHandling: 'cooperative',
            styles: [/* Custom dark styles could go here */]
        });

        new google.maps.Marker({
            position: pos,
            map: map,
            title: info.address || "Foresteria",
            animation: google.maps.Animation.DROP
        });
    },

    showAddExpenseModal: function(container, signal) {
        // Modal logic
    },

    showEditInfoModal: function(container, info, signal) {
        const modal = UI.modal({
            title: "Modifica Informazioni Foresteria",
            body: `
                <div class="form-group">
                    <label class="form-label">Indirizzo</label>
                    <input type="text" id="mf-address" class="form-input" value="${Utils.escapeHtml(info.address)}">
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
                // Signal refresh
            } catch (err) {
                UI.toast(err.message, "error");
            }
        });
    },

    showUploadMediaModal: function(container, signal) { /* Logic */ },
    showAddYoutubeModal: function(container, signal) { /* Logic */ }
};
