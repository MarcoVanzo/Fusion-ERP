/**
 * Societa Foresteria Module — Handles housing, expenses, and media
 */
import SocietaAPI from './SocietaAPI.js';

export default {
    abortController: new AbortController(),
    _chartJsPromise: null,

    loadChartJs: function() {
        if (window.Chart) return Promise.resolve();
        if (this._chartJsPromise) return this._chartJsPromise;

        this._chartJsPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/chart.js";
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
        return this._chartJsPromise;
    },

    init: async function(container, signal) {
        this.abortController = new AbortController();
        const data = await SocietaAPI.getForesteria();
        
        this.render(container, data);
        this.attachEvents(container, data.info, signal);
        
        // Initialize charts
        if (data.expenses && data.expenses.length > 0) {
            this.initCharts(data.expenses);
        }
        
        // Google Maps integration (if coordinates exist)
        if (data.info.lat && data.info.lng) {
            this.initMap(data.info);
        }
    },

    render: function(container, data) {
        // Implementation of rendering if not using SocietaView
        // ... (SocietaView.foresteria is already defined)
    },

    attachInfoEvents: function(container, info, signal) {
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

    attachExpenseEvents: function(container, signal) {
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
    },


    refresh: async function() {
        if (window.Societa && typeof window.Societa.refreshTab === 'function' && Router.getCurrentRoute().startsWith('societa')) {
            await window.Societa.refreshTab();
        } else if (window.Finance && typeof window.Finance.refresh === 'function' && Router.getCurrentRoute().startsWith('finance')) {
            await window.Finance.refresh();
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
                    <input type="text" id="fe-desc" class="form-input" placeholder="Es. Spesa Esselunga">
                </div>
                <div class="form-group">
                    <label class="form-label">Categoria</label>
                    <select id="fe-category" class="form-input">
                        <option value="cibo">Cibo / Alimentari</option>
                        <option value="utenze">Utenze (Luce, Gas, Acqua)</option>
                        <option value="manutenzione">Manutenzione</option>
                        <option value="pulizie">Pulizie</option>
                        <option value="frutta_verdura">Frutta e Verdura</option>
                        <option value="affitto">Affitto</option>
                        <option value="altro" selected>Altro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Importo (€)</label>
                    <input type="number" step="0.01" id="fe-amount" class="form-input" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label class="form-label">Scontrino / Ricevuta (opzionale)</label>
                    <input type="file" id="fe-receipt" class="form-input" accept="image/*,application/pdf">
                </div>
            `,
            footer: `<button class="btn-dash" id="fe-cancel">Annulla</button><button class="btn-dash pink" id="fe-save">Salva Spesa</button>`
        });

        document.getElementById("fe-cancel")?.addEventListener("click", () => modal.close());
        document.getElementById("fe-save")?.addEventListener("click", async () => {
            const desc = document.getElementById("fe-desc")?.value;
            const amount = document.getElementById("fe-amount")?.value;
            const date = document.getElementById("fe-date")?.value;
            const category = document.getElementById("fe-category")?.value;
            const receiptFile = document.getElementById("fe-receipt")?.files[0];

            if (!desc || !amount) {
                UI.toast("Inserire descrizione e importo", "warning");
                return;
            }

            const fd = new FormData();
            fd.append("description", desc);
            fd.append("amount", amount);
            fd.append("expense_date", date);
            fd.append("category", category);
            if (receiptFile) {
                fd.append("receipt", receiptFile);
            }

            try {
                UI.loading(true);
                await SocietaAPI.addExpense(fd, false);
                UI.toast("Spesa aggiunta", "success");
                modal.close();
                this.refresh();
            } catch (err) {
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
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
    },

    initCharts: async function(expenses) {
        const canvas = document.getElementById("forest-expenses-chart");
        if (!canvas) return;

        try {
            await this.loadChartJs();
        } catch (e) {
            console.error("[Foresteria] Failed to load Chart.js", e);
            return;
        }

        // Process data
        const catTotals = {};
        const catLabels = {
            'cibo': 'Cibo / Alimentari',
            'utenze': 'Utenze',
            'manutenzione': 'Manutenzione',
            'pulizie': 'Pulizie',
            'frutta_verdura': 'Frutta e Verdura',
            'affitto': 'Affitto',
            'altro': 'Altro'
        };

        expenses.forEach(e => {
            const cat = e.category || 'altro';
            catTotals[cat] = (catTotals[cat] || 0) + parseFloat(e.amount || 0);
        });

        const labels = Object.keys(catTotals).map(k => catLabels[k] || k);
        const data = Object.values(catTotals);
        
        // Colors palette (Harmonious with Fusion ERP theme)
        const colors = [
            '#FF007A', // Primary Pink
            '#00B7FF', // Cyan
            '#10B981', // Success Green
            '#F59E0B', // Amber
            '#8B5CF6', // Violet
            '#6366F1', // Indigo
            '#94A3B8'  // Slate
        ];

        // Destroy existing
        if (window._forestChart) window._forestChart.destroy();

        const ctx = canvas.getContext('2d');
        window._forestChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'rgba(0,0,0,0.2)',
                    borderWidth: 2,
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const val = ctx.raw.toLocaleString('it-IT', { minimumFractionDigits: 2 });
                                return ` ${ctx.label}: € ${val}`;
                            }
                        }
                    }
                }
            }
        });

        // Build Custom Legend
        const legendContainer = document.getElementById("chart-legend");
        if (legendContainer) {
            const total = data.reduce((a, b) => a + b, 0);
            legendContainer.innerHTML = labels.map((l, i) => {
                const perc = total > 0 ? ((data[i] / total) * 100).toFixed(0) : 0;
                return `
                    <div style="display:flex; align-items:center; gap:10px; font-size:12px;">
                        <div style="width:10px; height:10px; border-radius:3px; background:${colors[i % colors.length]}"></div>
                        <div style="flex:1; color:rgba(255,255,255,0.7)">${l}</div>
                        <div style="font-weight:700; color:rgba(255,255,255,0.9)">${perc}%</div>
                    </div>
                `;
            }).join('');
        }
    }
};
