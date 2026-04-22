/**
 * EcommerceView
 * Handles HTML skeletons, CSS generation, grid rendering, and tables.
 */
const EcommerceView = {

    skeleton(activeTab) {
        return `
        <style>
        .ec-page { padding: 24px; max-width: 1400px; margin: 0 auto; animation: ecFadeIn .4s ease; }
        @keyframes ecFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* Header */
        .ec-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .ec-header h1 { font-size: 1.8rem; font-weight: 700;
            background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .ec-header-badge { padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;
            background: rgba(99,102,241,0.15); color: #818cf8; }

        /* Import Banner */
        .ec-import-banner { display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
            padding: 24px 28px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25);
            border-radius: 16px; margin-bottom: 28px; }
        .ec-import-banner-icon { font-size: 36px; flex-shrink: 0; }
        .ec-import-banner h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 4px; }
        .ec-import-banner p { font-size: 13px; opacity: .65; margin: 0; }

        /* Products grid */
        .ec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
        
        .ec-card { 
            position: relative;
            background: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%); 
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px; overflow: hidden; 
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
        }
        .ec-card::before {
            content: ""; position: absolute; inset: 0; pointer-events: none;
            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%);
            opacity: 0; transition: opacity 0.4s ease; z-index: 2;
        }
        .ec-card:hover { 
            transform: translateY(-8px) scale(1.02); 
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.15) inset; 
            border-color: rgba(99,102,241,0.4); 
        }
        .ec-card:hover::before { opacity: 1; }

        .ec-card-img-wrapper {
            position: relative; width: 100%; height: 210px; display: flex; align-items: center; justify-content: center;
            background: radial-gradient(circle at top, rgba(99,102,241,0.12) 0%, transparent 70%);
            overflow: hidden; padding: 24px;
        }
        .ec-card-img { 
            width: 100%; height: 100%; object-fit: contain; 
            filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4)) saturate(1.2); 
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); 
            z-index: 10; 
        }
        .ec-card:hover .ec-card-img {
            transform: scale(1.15) translateY(-5px) rotate(2.5deg);
            filter: drop-shadow(0 15px 25px rgba(99,102,241,0.4)) saturate(1.4) contrast(1.1);
        }
        .ec-card-img-placeholder { 
            width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.02); font-size: 56px; color: rgba(255,255,255,0.1); 
            transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ec-card:hover .ec-card-img-placeholder { transform: scale(1.1) rotate(2.5deg); color: rgba(99,102,241,0.3); }

        .ec-card-body { padding: 18px 20px 20px; position: relative; z-index: 10; }
        .ec-card-cat { font-size: 11px; opacity: .6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 700; color: #a78bfa; }
        .ec-card-name { font-size: 16px; font-weight: 800; margin-bottom: 8px; line-height: 1.3;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .ec-card-price { font-size: 1.4rem; font-weight: 900; 
            background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%); 
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; 
            display: inline-block; }
        .ec-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(255,255,255,0.1); }
        .ec-badge-disponibile { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;
            background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981; box-shadow: 0 2px 8px rgba(16,185,129,0.1); }
        .ec-badge-non-disponibile { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;
            background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }
        .ec-card-actions { display: flex; gap: 8px; }
        .ec-icon-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04); cursor: pointer; display: flex; align-items: center;
            justify-content: center; font-size: 14px; transition: all .15s; }
        .ec-icon-btn:hover { background: rgba(255,255,255,0.09); transform: scale(1.1); }

        /* Toolbar (search + add btn) */
        .ec-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .ec-search { flex: 1; min-width: 200px; max-width: 340px; position: relative; }
        .ec-search input { width: 100%; padding: 9px 12px 9px 36px; background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: inherit; font-size: 14px; }
        .ec-search input:focus { outline: none; border-color: rgba(99,102,241,0.5); }
        .ec-search i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
            font-size: 16px; opacity: .5; pointer-events: none; }
        .ec-filter-cat { padding: 9px 12px; background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: inherit; font-size: 14px; }
        .ec-filter-cat:focus { outline: none; border-color: rgba(99,102,241,0.5); }

        /* Empty state */
        .ec-empty { padding: 64px 24px; text-align: center; opacity: .55; }
        .ec-empty i { font-size: 48px; display: block; margin-bottom: 16px; }
        .ec-empty p { font-size: 15px; }

        /* Form modal */
        .ec-form { display: flex; flex-direction: column; gap: 14px; }
        .ec-form label { font-size: 12px; font-weight: 600; text-transform: uppercase;
            letter-spacing: .5px; opacity: .65; display: block; margin-bottom: 4px; }
        .ec-form input[type=text], .ec-form input[type=number], .ec-form textarea, .ec-form select {
            width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
            color: inherit; font-size: 14px; }
        .ec-form textarea { resize: vertical; min-height: 80px; }
        .ec-form input:focus, .ec-form textarea:focus, .ec-form select:focus
            { outline: none; border-color: rgba(99,102,241,0.5); }
        .ec-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ec-img-preview { width: 100%; max-height: 180px; object-fit: contain;
            border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); margin-top: 8px; display: none; }
        .ec-toggle { display: flex; align-items: center; gap: 10px; }
        .ec-toggle input[type=checkbox] { width: 18px; height: 18px; cursor: pointer; accent-color: #818cf8; }

        /* Import Wizard */
        .ec-wizard { max-width: 720px; }
        .ec-wizard-step { font-size: 12px; opacity: .5; text-transform: uppercase;
            letter-spacing: 1px; margin-bottom: 8px; }
        .ec-wizard h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; }
        .ec-progress { height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; margin: 16px 0; overflow: hidden; }
        .ec-progress-bar { height: 100%; background: linear-gradient(90deg, #6366f1, #a78bfa);
            border-radius: 4px; transition: width .3s ease; }
        .ec-product-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr));
            gap: 12px; max-height: 360px; overflow-y: auto; margin: 16px 0; padding-right: 4px; }
        .ec-product-preview-item { background: rgba(255,255,255,0.04); border-radius: 10px;
            padding: 10px; text-align: center; border: 1px solid rgba(255,255,255,0.07); }
        .ec-product-preview-img { width: 100%; height: 100px; object-fit: contain; padding: 6px; border-radius: 8px;
            background: transparent; margin-bottom: 6px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)) saturate(1.2) contrast(1.1); }
        .ec-product-preview-name { font-size: 12px; font-weight: 600; overflow: hidden;
            text-overflow: ellipsis; white-space: nowrap; }
        .ec-product-preview-price { font-size: 13px; color: #818cf8; font-weight: 700; }
        .ec-wizard-note { font-size: 13px; opacity: .6; line-height: 1.7; }
        .ec-cors-warning { padding: 14px 18px; background: rgba(245,158,11,0.08);
            border: 1px solid rgba(245,158,11,0.25); border-radius: 12px; font-size: 13px; margin: 16px 0; }
        .ec-cors-warning strong { color: #f59e0b; }

        /* Orders table */
        .ec-orders-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .ec-filter-bar { display: flex; gap: 4px; background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 4px; }
        .ec-filter-btn { padding: 6px 14px; border: none; background: none; border-radius: 6px;
            cursor: pointer; font-size: 13px; color: inherit; opacity: .6; transition: all .15s; }
        .ec-filter-btn.active { background: rgba(99,102,241,0.15); color: #818cf8; opacity: 1; font-weight: 600; }
        .ec-table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px; overflow: hidden; }
        .ec-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ec-table thead th { padding: 11px 14px; text-align: left; font-weight: 600;
            text-transform: uppercase; font-size: 11px; letter-spacing: .5px;
            opacity: .5; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }
        .ec-table tbody td { padding: 13px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
        .ec-table tbody tr:last-child td { border-bottom: none; }
        .ec-table tbody tr:hover { background: rgba(255,255,255,0.03); }
        .ec-badge-pagato { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
            border-radius: 8px; font-size: 12px; font-weight: 600;
            background: rgba(16,185,129,0.12); color: #10b981; }
        .ec-badge-nonpagato { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
            border-radius: 8px; font-size: 12px; font-weight: 600;
            background: rgba(239,68,68,0.12); color: #ef4444; }
        .ec-badge-consegnato { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
            border-radius: 8px; font-size: 12px; font-weight: 600;
            background: rgba(59,130,246,0.12); color: #3b82f6; }
        .ec-badge-pending { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
            border-radius: 8px; font-size: 12px; font-weight: 600;
            background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); }
        .ec-stato-select { padding: 5px 10px; background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
            color: inherit; font-size: 12px; cursor: pointer; }
        .ec-stato-select:focus { outline: none; border-color: rgba(99,102,241,0.5); }
        .ec-last-update { font-size: 12px; opacity: .5; margin-left: auto; }
        .ec-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #818cf8; border-radius: 50%; animation: ecSpin .7s linear infinite; display: inline-block; }
        @keyframes ecSpin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
            .ec-page { padding: 12px; }
            .ec-grid { grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 12px; }
            .ec-form-row { grid-template-columns: 1fr; }
            .ec-header h1 { font-size: 1.4rem; }
        }
        </style>

        <div class="transport-dashboard" style="min-height:100vh; padding: 24px;">
            <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center;">
                <h1 class="dash-title"><i class="ph ph-shopping-cart"></i> eCommerce</h1>
                <span class="ec-header-badge" id="ec-badge">—</span>
            </div>

            <!-- Content panels -->
            <div id="ec-panel-articles" style="${activeTab === "articles" ? "" : "display:none;"}"></div>
            <div id="ec-panel-orders" style="${activeTab === "orders" ? "" : "display:none;"}"></div>
        </div>
        `;
    },

    articleGrid(articles, categories) {
        const catsHtml = categories.map(cat => `<option value="${Utils.escapeHtml(cat)}">${Utils.escapeHtml(cat)}</option>`).join("");
        
        let gridHtml;
        if (articles.length === 0) {
            gridHtml = `
            <div class="ec-empty" style="grid-column:1/-1;">
                <i class="ph ph-shopping-bag"></i>
                <p>Nessun articolo trovato</p>
            </div>`;
        } else {
            gridHtml = articles.map(a => this.articleCard(a)).join("");
        }

        return `
        <div class="ec-toolbar">
            <div class="ec-search">
                <i class="ph ph-magnifying-glass"></i>
                <input type="text" id="ec-search-input" placeholder="Cerca articolo..." autocomplete="off">
            </div>
            <select class="ec-filter-cat" id="ec-cat-filter">
                <option value="">Tutte le categorie</option>
                ${catsHtml}
            </select>
            <button class="btn-dash cyan" id="ec-add-btn" type="button">
                <i class="ph ph-plus"></i> Aggiungi Articolo
            </button>
        </div>
        <div class="ec-grid" id="ec-articles-grid">
            ${gridHtml}
        </div>
        `;
    },

    articleCard(a) {
        const cover = a.immagineBase64 
            ? `<img class="ec-card-img" src="${a.immagineBase64}" alt="${Utils.escapeHtml(a.nome)}" loading="lazy">` 
            : '<div class="ec-card-img-placeholder"><i class="ph ph-image"></i></div>';
        
        const badge = a.disponibile !== false
            ? '<span class="ec-badge-disponibile">● Disponibile</span>'
            : '<span class="ec-badge-non-disponibile">● Non Disponibile</span>';

        const priceFormat = (a.prezzo ?? 0).toLocaleString("it-IT", { minimumFractionDigits: 2 });

        return `
        <div class="ec-card" data-id="${a.id}">
            <div class="ec-card-img-wrapper">
                ${cover}
            </div>
            <div class="ec-card-body">
                <div class="ec-card-cat">${Utils.escapeHtml(a.categoria || "—")}</div>
                <div class="ec-card-name" title="${Utils.escapeHtml(a.nome)}">${Utils.escapeHtml(a.nome)}</div>
                <div class="ec-card-price">${priceFormat} €</div>
                <div class="ec-card-footer">
                    ${badge}
                    <div class="ec-card-actions">
                        <button class="ec-icon-btn ec-edit-btn" data-id="${a.id}" title="Modifica">✏️</button>
                        <button class="ec-icon-btn ec-delete-btn" data-id="${a.id}" title="Elimina">🗑️</button>
                    </div>
                </div>
            </div>
        </div>`;
    },

    importBanner() {
        return `
        <div class="ec-import-banner">
            <span class="ec-import-banner-icon">📦</span>
            <div style="flex:1; min-width:0;">
                <h3>Nessun articolo trovato</h3>
                <p>Importa i prodotti dal sito originale in un click, oppure aggiungili manualmente.</p>
            </div>
            <div style="display:flex; gap:10px; flex-shrink:0; flex-wrap:wrap;">
                <button class="btn-dash pink" id="ec-start-wizard" type="button">
                    <i class="ph ph-download-simple"></i> Importa dal Sito
                </button>
                <button class="btn-dash" id="ec-skip-import" type="button">
                    Aggiungi Manualmente
                </button>
            </div>
        </div>
        <div id="ec-wizard-area"></div>
        `;
    },

    ordersTable(orders, lastUpdateTimestamp = null) {
        let tbodyHtml;
        if (orders.length === 0) {
            tbodyHtml = '<tr><td colspan="6" style="text-align:center;padding:40px;opacity:.5;">Nessun ordine trovato</td></tr>';
        } else {
            tbodyHtml = orders.map(o => this.orderRow(o)).join("");
        }

        const lastUpdateText = lastUpdateTimestamp 
            ? "Ultimo aggiornamento: " + lastUpdateTimestamp.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) 
            : "";

        return `
        <div class="ec-orders-toolbar">
            <div class="ec-filter-bar">
                <button class="ec-filter-btn active" data-filter="all" type="button">Tutti (${orders.length})</button>
                <button class="ec-filter-btn" data-filter="pagato" type="button">🟢 Pagati</button>
                <button class="ec-filter-btn" data-filter="non pagato" type="button">🔴 Non Pagati</button>
                <button class="ec-filter-btn" data-filter="consegnato" type="button">🔵 Consegnati</button>
            </div>
            <button class="btn-dash" id="ec-orders-refresh" type="button" style="margin-left:auto;">
                <i class="ph ph-arrows-clockwise"></i> Aggiorna
            </button>
            <span class="ec-last-update" id="ec-last-update">${lastUpdateText}</span>
        </div>

        <div class="ec-table-wrap">
            <table class="ec-table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Articoli</th>
                        <th>Totale</th>
                        <th>Data</th>
                        <th>Stato</th>
                        <th>Cambia Stato</th>
                    </tr>
                </thead>
                <tbody id="ec-orders-tbody">
                    ${tbodyHtml}
                </tbody>
            </table>
        </div>
        `;
    },

    orderRow(ord) {
        let statoInterno = ord.statoInterno;
        if (statoInterno && statoInterno.toLowerCase() === "da definire") {
            statoInterno = null;
        }
        if (!statoInterno && ord.statoForms) {
            const sf = String(ord.statoForms).toLowerCase();
            if (sf === "pagato" || sf === "non pagato") statoInterno = sf;
        }

        const fallback = statoInterno || "da definire";
        let statusBadge
        if (fallback === "pagato") statusBadge = '<span class="ec-badge-pagato">🟢 Pagato</span>';
        else if (fallback === "non pagato") statusBadge = '<span class="ec-badge-nonpagato">🔴 Non Pagato</span>';
        else if (fallback === "consegnato") statusBadge = '<span class="ec-badge-consegnato">🔵 Consegnato</span>';
        else statusBadge = '<span class="ec-badge-pending">⚪ Da definire</span>';

        const dataStr = ord.dataOrdine
            ? new Date(ord.dataOrdine).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
            : "—";

        const totalStr = ord.totale > 0 
            ? ord.totale.toLocaleString("it-IT", { minimumFractionDigits: 2 }) + " €"
            : "—";

        const itemsStr = ord.articoli || 
            (ord.orderSummary ? ord.orderSummary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "") || "—";

        const fields = Array.isArray(ord._campiDisponibili) ? ord._campiDisponibili.join(", ") : "";
        const infoIcon = fields ? `<span title="Campi Cognito disponibili:\n${fields}" style="cursor:help;opacity:.4;font-size:11px;margin-left:4px;">ℹ</span>` : "";

        return `<tr>
            <td style="font-weight:600;">${Utils.escapeHtml(ord.nomeCliente || "—")}${infoIcon}</td>
            <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${Utils.escapeHtml(itemsStr)}">
                ${Utils.escapeHtml(itemsStr.substring(0, 70))}${itemsStr.length > 70 ? "…" : ""}
            </td>
            <td style="font-weight:700;">${totalStr}</td>
            <td>${dataStr}</td>
            <td>${statusBadge}</td>
            <td>
                <select class="ec-stato-select" data-order-id="${Utils.escapeHtml(String(ord.id))}">
                    <option value="" ${statoInterno ? "" : "selected"}>— Imposta Stato</option>
                    <option value="pagato" ${statoInterno === "pagato" ? "selected" : ""}>🟢 Pagato</option>
                    <option value="non pagato" ${statoInterno === "non pagato" ? "selected" : ""}>🔴 Non Pagato</option>
                    <option value="consegnato" ${statoInterno === "consegnato" ? "selected" : ""}>🔵 Consegnato</option>
                </select>
            </td>
        </tr>`;
    }
};

export default EcommerceView;
