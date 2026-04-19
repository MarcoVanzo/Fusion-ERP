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

    render: function(_container, _data) {
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
        if (window.Store) Store.invalidate("getForesteria");
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

    showAddExpenseModal: function(_container, _signal) {
        const modal = UI.modal({
            title: "Nuova Spesa Foresteria",
            body: `
                <div id="fe-step-1">
                    <div style="text-align:center; margin-bottom:var(--sp-4); padding:var(--sp-4); border:2px dashed var(--color-border); border-radius:16px; background:rgba(255,255,255,0.02)">
                        <i class="ph ph-camera" style="font-size:48px; color:var(--color-pink); margin-bottom:12px; display:block"></i>
                        <p style="font-size:14px; color:var(--color-text-muted); margin-bottom:12px">Carica la foto della ricevuta (opzionale)</p>
                        <input type="file" id="fe-receipt" accept="image/*" style="display:none">
                        <button class="btn-dash" onclick="document.getElementById('fe-receipt').click()"><i class="ph ph-upload-simple"></i> Scegli file</button>
                        <div id="fe-receipt-name" style="margin-top:8px; font-size:12px; color:var(--color-cyan)"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="text-align:center; display:block; font-size:14px">IMPORTO SPESO (€)</label>
                        <input type="number" step="0.01" id="fe-amount" class="form-input" placeholder="0.00" style="font-size:32px; font-weight:800; text-align:center; height:70px; color:var(--color-pink)">
                    </div>
                </div>

                <div id="fe-step-2" class="hidden">
                    <div class="form-group">
                        <label class="form-label">Data Spesa</label>
                        <input type="date" id="fe-date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoria</label>
                        <select id="fe-category" class="form-input">
                            <option value="cibo">Cibo/Spesa</option>
                            <option value="utenze">Utenze</option>
                            <option value="manutenzione">Manutenzione</option>
                            <option value="pulizie">Pulizie</option>
                            <option value="frutta_verdura">Frutta e Verdura</option>
                            <option value="abbigliamento">Abbigliamento</option>
                            <option value="affitto">Affitto</option>
                            <option value="altro" selected>Altro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descrizione / Negozio</label>
                        <input type="text" id="fe-desc" class="form-input" placeholder="Es. Esselunga, Carrefour...">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Note aggiuntive (opzionale)</label>
                        <textarea id="fe-notes" class="form-input" rows="2" placeholder="Dettagli spesa..."></textarea>
                    </div>
                </div>
            `,
            footer: `
                <div id="fe-footer-1" style="display:flex; width:100%; gap:var(--sp-2)">
                    <button class="btn-dash" id="fe-cancel" style="flex:1">Annulla</button>
                    <button class="btn-dash pink" id="fe-next" style="flex:2">Avanti <i class="ph ph-caret-right"></i></button>
                </div>
                <div id="fe-footer-2" class="hidden" style="display:flex; width:100%; gap:var(--sp-2)">
                    <button class="btn-dash" id="fe-back" style="flex:1"><i class="ph ph-caret-left"></i> Indietro</button>
                    <button class="btn-dash pink" id="fe-save" style="flex:2">Salva Spesa</button>
                </div>
            `
        });

        // Step 1 -> 2
        document.getElementById("fe-next")?.addEventListener("click", () => {
            const amount = document.getElementById("fe-amount")?.value;
            if (!amount || parseFloat(amount) <= 0) {
                UI.toast("Inserire un importo valido", "warning");
                return;
            }
            document.getElementById("fe-step-1").classList.add("hidden");
            document.getElementById("fe-footer-1").classList.add("hidden");
            document.getElementById("fe-step-2").classList.remove("hidden");
            document.getElementById("fe-footer-2").classList.remove("hidden");
        });

        // Step 2 -> 1
        document.getElementById("fe-back")?.addEventListener("click", () => {
            document.getElementById("fe-step-1").classList.remove("hidden");
            document.getElementById("fe-footer-1").classList.remove("hidden");
            document.getElementById("fe-step-2").classList.add("hidden");
            document.getElementById("fe-footer-2").classList.add("hidden");
        });

        // Receipt name update
        document.getElementById("fe-receipt")?.addEventListener("change", (e) => {
            const name = e.target.files[0]?.name;
            if (name) document.getElementById("fe-receipt-name").textContent = name;
        });

        document.getElementById("fe-cancel")?.addEventListener("click", () => modal.close());
        document.getElementById("fe-save")?.addEventListener("click", async () => {
            const desc = document.getElementById("fe-desc")?.value;
            const amount = document.getElementById("fe-amount")?.value;
            const date = document.getElementById("fe-date")?.value;
            const category = document.getElementById("fe-category")?.value;
            const notes = document.getElementById("fe-notes")?.value;
            const receiptFile = document.getElementById("fe-receipt")?.files[0];

            if (!desc) {
                UI.toast("Inserire una descrizione", "warning");
                return;
            }

            const fd = new FormData();
            fd.append("description", desc);
            fd.append("amount", amount);
            fd.append("expense_date", date);
            fd.append("category", category);
            fd.append("notes", notes || "");
            if (receiptFile) fd.append("receipt", receiptFile);

            try {
                UI.loading(true);
                await SocietaAPI.addExpense(fd);
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

    showEditInfoModal: function(container, info, _signal) {
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

    showUploadMediaModal: function(_container, _signal) {
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

    showAddYoutubeModal: function(_container, _signal) {
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
            'cibo': 'Cibo/Spesa',
            'utenze': 'Utenze',
            'manutenzione': 'Manutenzione',
            'pulizie': 'Pulizie',
            'frutta_verdura': 'Frutta e Verdura',
            'abbigliamento': 'Abbigliamento',
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
