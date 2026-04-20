/**
 * Ecommerce Module — Main Orchestrator
 * Fusion ERP
 */
import EcommerceAPI from './ecommerce/EcommerceAPI.js';
import EcommerceView from './ecommerce/EcommerceView.js';
import EcommerceWizard from './ecommerce/EcommerceWizard.js';

const Ecommerce = {
    _abort: new AbortController(),
    _activeTab: "articles",
    _lastUpdate: null,

    sig: function() { return { signal: this._abort.signal }; },

    destroy: function() {
        this._abort.abort();
        this._abort = new AbortController();
    },

    init: async function() {
        this.destroy(); // Clear existing listeners
        
        const route = typeof Router !== "undefined" ? Router.getCurrentRoute() : "ecommerce-articles";
        this._activeTab = route === "ecommerce-orders" ? "orders" : "articles";
        this._lastUpdate = null;

        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        // Render skeleton and top bar
        appContainer.innerHTML = EcommerceView.skeleton(this._activeTab);

        // Bind main tabs (note: UI sub-tabs were removed according to legacy, 
        // rely on routing to switch tabs now if needed, though they don't visually exist 
        // other than sidebar links. If they existed, we'd bind them here.)
        const tabArt = document.getElementById("ec-tab-articles");
        const tabOrd = document.getElementById("ec-tab-orders");
        if (tabArt) tabArt.addEventListener("click", () => Router.navigate("ecommerce-articles"), this.sig());
        if (tabOrd) tabOrd.addEventListener("click", () => Router.navigate("ecommerce-orders"), this.sig());

        if (this._activeTab === "articles") {
            await this.loadArticlesList();
        } else {
            await this.loadOrdersList();
        }
    },

    // ------------------------------------------------------------------------
    // ARTICLES
    // ------------------------------------------------------------------------

    loadArticlesList: async function() {
        const panel = document.getElementById("ec-panel-articles");
        if (!panel) return;

        try {
            // First time logic + data gathering
            const totalArticles = await EcommerceAPI.countArticles();
            const badge = document.getElementById("ec-badge");
            if (badge) badge.textContent = totalArticles > 0 ? `${totalArticles} Articoli` : "Articoli";

            const importDone = await EcommerceAPI.getMeta("importCompletato");
            if (totalArticles === 0 && !importDone) {
                this.renderImportBanner(panel);
                return;
            }

            this.renderArticleGrid(panel);
        } catch (err) {
            panel.innerHTML = `<div class="ec-empty"><i class="ph ph-warning-circle"></i><p>Errore: ${Utils.escapeHtml(err.message)}</p></div>`;
        }
    },

    renderImportBanner: function(panel) {
        panel.innerHTML = EcommerceView.importBanner();
        
        document.getElementById("ec-start-wizard").addEventListener("click", () => {
            document.querySelector(".ec-import-banner").style.display = "none";
            this.openImportWizard(document.getElementById("ec-wizard-area"));
        }, this.sig());

        document.getElementById("ec-skip-import").addEventListener("click", async () => {
            await EcommerceAPI.setMeta("importCompletato", true);
            this.renderArticleGrid(panel);
        }, this.sig());
    },

    renderArticleGrid: async function(panel) {
        const articles = await EcommerceAPI.getArticles();
        const categories = [...new Set(articles.map(a => a.categoria).filter(Boolean))].sort();
        
        const badge = document.getElementById("ec-badge");
        if (badge) badge.textContent = `${articles.length} Articoli`;

        panel.innerHTML = EcommerceView.articleGrid(articles, categories);

        const searchInput = document.getElementById("ec-search-input");
        const catFilter = document.getElementById("ec-cat-filter");
        
        let debounceTimer;
        const filterGrid = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const term = searchInput.value.trim().toLowerCase();
                const cat = catFilter.value;
                const filtered = articles.filter(a => 
                    (!term || a.nome.toLowerCase().includes(term)) && 
                    (!cat || a.categoria === cat)
                );

                const grid = document.getElementById("ec-articles-grid");
                if (filtered.length === 0) {
                    grid.innerHTML = `<div class="ec-empty" style="grid-column:1/-1;">
                        <i class="ph ph-shopping-bag"></i><p>Nessun articolo trovato</p></div>`;
                } else {
                    grid.innerHTML = filtered.map(a => EcommerceView.articleCard(a)).join("");
                }
                
                this.bindArticleCards(panel, articles);
            }, 200);
        };

        searchInput.addEventListener("input", filterGrid, this.sig());
        catFilter.addEventListener("change", filterGrid, this.sig());
        
        document.getElementById("ec-add-btn").addEventListener("click", () => this.openArticleModal(null, panel), this.sig());

        this.bindArticleCards(panel, articles);
    },

    bindArticleCards: function(panel, articlesList) {
        document.querySelectorAll(".ec-edit-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const item = articlesList.find(a => a.id === Number(btn.dataset.id));
                if (item) this.openArticleModal(item, panel);
            }, this.sig());
        });

        document.querySelectorAll(".ec-delete-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const item = articlesList.find(a => a.id === Number(btn.dataset.id));
                const name = item ? item.nome : "questo articolo";
                UI.confirm(`Eliminare "${name}"? L'operazione non è reversibile.`, async () => {
                    await EcommerceAPI.deleteArticle(Number(btn.dataset.id));
                    UI.toast("Articolo eliminato", "success");
                    await this.renderArticleGrid(panel);
                });
            }, this.sig());
        });
    },

    openArticleModal: function(article, panel) {
        let currentBase64 = article?.immagineBase64 || null;
        let currentMimeType = article?.immagineMimeType || null;

        const bodyWrap = document.createElement("div");
        bodyWrap.innerHTML = EcommerceWizard.articleForm(article);

        const footerWrap = document.createElement("div");
        footerWrap.innerHTML = EcommerceWizard.articleFormFooter(article);

        const modal = UI.modal({
            title: article ? `Modifica: ${article.nome}` : "Nuovo Articolo",
            body: bodyWrap,
            footer: footerWrap
        });

        const imgPreview = document.getElementById("ec-f-img-preview");

        // Handle File Pick
        document.getElementById("ec-f-img-file").addEventListener("change", async (ev) => {
            const file = ev.target.files[0];
            if (file) {
                try {
                    currentBase64 = await EcommerceAPI.fileToBase64(file);
                    currentMimeType = file.type;
                    imgPreview.src = currentBase64;
                    imgPreview.style.display = "block";
                } catch (err) {
                    UI.toast("Errore lettura immagine", "error");
                }
            }
        });

        document.getElementById("ec-f-cancel").addEventListener("click", () => modal.close());
        
        // Save
        document.getElementById("ec-f-save").addEventListener("click", async () => {
            const errorDiv = document.getElementById("ec-form-error");
            errorDiv.style.display = "none";

            const data = EcommerceWizard.getArticleFormData(bodyWrap, currentBase64, currentMimeType);
            const urlInput = document.getElementById("ec-f-img-url").value.trim();

            if (!data.nome) {
                errorDiv.textContent = "Il nome è obbligatorio.";
                errorDiv.style.display = "block";
                return;
            }

            // Url over file if url is filled
            if (urlInput && !currentBase64) {
                const base64FromUrl = await EcommerceAPI.urlToBase64(urlInput);
                if (base64FromUrl) {
                    data.immagineBase64 = base64FromUrl;
                    data.immagineMimeType = "image/jpeg";
                } else {
                    UI.toast("Impossibile scaricare l'immagine dall'URL (CORS o URL non valido).", "warning");
                }
            }

            const btnSave = document.getElementById("ec-f-save");
            btnSave.disabled = true;
            btnSave.textContent = "Salvataggio...";

            try {
                if (data.immagineBase64) {
                    // Try processing alpha transparency
                    data.immagineBase64 = await EcommerceAPI.processImageTransparent(data.immagineBase64);
                    data.immagineMimeType = "image/png";
                }

                if (article) data.id = article.id; // pass id for update

                await EcommerceAPI.saveArticle(data);
                UI.toast(article ? "Articolo aggiornato" : "Articolo aggiunto", "success");
                
                await this.renderArticleGrid(panel);
                modal.close();
            } catch (err) {
                errorDiv.textContent = "Errore salvataggio: " + err.message;
                errorDiv.style.display = "block";
                btnSave.disabled = false;
                btnSave.textContent = article ? "💾 Salva Modifiche" : "➕ Aggiungi Articolo";
            }
        });
    },

    openImportWizard: function(container) {
        container.innerHTML = EcommerceWizard.importStep1();

        document.getElementById("ec-wizard-cancel").addEventListener("click", () => this.init(), this.sig());
        document.getElementById("ec-wizard-fetch").addEventListener("click", async () => {
            
            const statusDiv = document.getElementById("ec-wizard-status");
            const btnFetch = document.getElementById("ec-wizard-fetch");
            btnFetch.disabled = true;
            btnFetch.innerHTML = '<div class="ec-spinner"></div> Recupero in corso...';

            try {
                await EcommerceAPI.fetchRemoteProducts();
                const getResp = await Store.get("scrapeShop", "ecommerce");
                const products = getResp.products || [];

                if (products.length === 0) {
                    statusDiv.innerHTML = EcommerceWizard.importStepOffline();
                    document.getElementById("ec-wizard-manual").addEventListener("click", async () => {
                        await EcommerceAPI.setMeta("importCompletato", true);
                        this.renderArticleGrid(document.getElementById("ec-panel-articles"));
                    });
                    return;
                }

                // Move to Step 2
                container.innerHTML = EcommerceWizard.importStep2(products);
                
                document.getElementById("ec-wizard-back").addEventListener("click", () => this.openImportWizard(container), this.sig());
                document.getElementById("ec-wizard-confirm").addEventListener("click", () => this.executeImportDownload(container, products), this.sig());

            } catch (err) {
                const msg = (err.message && err.message.toLowerCase().includes("fetch"))
                    ? "Errore di rete o server non raggiungibile (Timeout/CORS). Assicurati di essere connesso."
                    : err.message;
                statusDiv.innerHTML = EcommerceWizard.importStepError(msg);
                btnFetch.disabled = false;
                btnFetch.innerHTML = '<i class="ph ph-cloud-arrow-down"></i> Riprova';
            }
        }, this.sig());
    },

    executeImportDownload: async function(container, products) {
        document.getElementById("ec-wizard-confirm").disabled = true;
        document.getElementById("ec-wizard-back").disabled = true;
        document.getElementById("ec-wizard-progress-area").style.display = "block";

        const progBar = document.getElementById("ec-prog-bar");
        const progText = document.getElementById("ec-prog-text");
        
        const total = products.length;
        const toSave = [];
        let done = 0;

        for (const p of products) {
            let base64 = null;
            let mime = null;

            if (p.immagineUrl) {
                base64 = await EcommerceAPI.urlToBase64(p.immagineUrl);
                if (base64) {
                    base64 = await EcommerceAPI.processImageTransparent(base64);
                    mime = base64.startsWith("data:image/png") ? "image/png" : "image/jpeg";
                }
            }
            done++;
            const pct = Math.round((done / total) * 100);
            progBar.style.width = pct + "%";
            progText.textContent = `${done} / ${total} immagini scaricate (${base64 ? "OK" : "skipped"}: ${Utils.escapeHtml(p.nome)})`;

            toSave.push({
                nome: p.nome,
                prezzo: p.prezzo || 0,
                immagineBase64: base64,
                immagineMimeType: mime,
                descrizione: p.descrizione || "",
                categoria: p.categoria || "",
                disponibile: true
            });
        }

        await EcommerceAPI.bulkSaveArticles(toSave);
        await EcommerceAPI.setMeta("importCompletato", true);
        
        progText.textContent = `✅ ${toSave.length} articoli salvati con successo!`;
        UI.toast(`Importazione completata: ${toSave.length} articoli`, "success");
        
        setTimeout(() => {
            const panel = document.getElementById("ec-panel-articles");
            if (panel) this.renderArticleGrid(panel);
        }, 1200);
    },

    // ------------------------------------------------------------------------
    // ORDERS
    // ------------------------------------------------------------------------

    loadOrdersList: async function() {
        const panel = document.getElementById("ec-panel-orders");
        if (!panel) return;

        panel.innerHTML = `<div style="padding:40px;text-align:center;opacity:.5;">
            <div class="ec-spinner" style="width:28px;height:28px;margin:0 auto 12px;"></div>
            <p>Caricamento ordini...</p>
        </div>`;

        try {
            const orders = await EcommerceAPI.getOrders();
            this._lastUpdate = new Date();
            
            const badge = document.getElementById("ec-badge");
            if (badge) badge.textContent = `${orders.length} Ordini`;

            this.renderOrdersTable(panel, orders);
        } catch (err) {
            panel.innerHTML = `<div class="ec-empty">
                <i class="ph ph-warning-circle"></i>
                <p>Errore caricamento ordini: ${Utils.escapeHtml(err.message)}</p>
            </div>`;
        }
    },

    renderOrdersTable: function(panel, ordersData) {
        let currentFilter = "all";

        const getFiltered = () => {
             if (currentFilter === "all") return ordersData;
             return ordersData.filter(o => {
                 let s = String(o.statoInterno || "").toLowerCase();
                 if (s && s !== "da definire") return s === currentFilter;
                 let sf = String(o.statoForms || "").toLowerCase();
                 if (sf === "pagato" || sf === "non pagato") return sf === currentFilter;
                 return "da definire" === currentFilter;
             });
        };

        const drawTable = () => {
            const sub = getFiltered();
            panel.innerHTML = EcommerceView.ordersTable(sub, this._lastUpdate);
            this.bindOrdersEvents(panel, ordersData, drawTable); // Rebind after draw
        };

        drawTable();

        // Bind filter nav outside table draw
        panel.addEventListener("click", (e) => {
            if (e.target.classList.contains("ec-filter-btn")) {
                panel.querySelectorAll(".ec-filter-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                currentFilter = e.target.dataset.filter;
                drawTable();
            }
        });
    },

    bindOrdersEvents: function(panel, ordersData, redrawCallback) {
        // Sync API
        const refreshBtn = document.getElementById("ec-orders-refresh");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", async (e) => {
                const b = e.currentTarget;
                b.disabled = true;
                b.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Sincronizzazione...';
                try {
                    const res = await EcommerceAPI.syncOrders();
                    UI.toast(res?.message || "Sincronizzazione completata", "success");
                    await this.loadOrdersList(); // Reloads entirely
                } catch (err) {
                    UI.toast(err.message, "error");
                    b.disabled = false;
                    b.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Aggiorna';
                }
            }, this.sig());
        }

        // Status Changer
        panel.querySelectorAll(".ec-stato-select").forEach(sel => {
            sel.addEventListener("change", async () => {
                const id = sel.dataset.orderId;
                const val = sel.value;
                if (!val) return;
                
                try {
                    await EcommerceAPI.updateOrderStatus(id, val);
                    const original = ordersData.find(o => String(o.id) === String(id));
                    if (original) original.statoInterno = val;
                    UI.toast("Stato aggiornato nel server", "success", 2000);
                    redrawCallback();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    }
};

export default Ecommerce;
window.Ecommerce = Ecommerce;
