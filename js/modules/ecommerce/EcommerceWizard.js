/**
 * EcommerceWizard
 * Handles complex modali, form rendering, and import wizards.
 */
import EcommerceAPI from './EcommerceAPI.js';

const EcommerceWizard = {
    
    /**
     * Returns the HTML body for the Article edit/create form.
     */
    articleForm(article) {
        const isEdit = !!article;
        return `
        <div class="ec-form">
            <div class="ec-form-row">
                <div>
                    <label for="ec-f-nome">Nome *</label>
                    <input type="text" id="ec-f-nome" placeholder="Nome prodotto" value="${Utils.escapeHtml(article?.nome || "")}" required>
                </div>
                <div>
                    <label for="ec-f-prezzo">Prezzo (€) *</label>
                    <input type="number" id="ec-f-prezzo" placeholder="0.00" step="0.01" min="0" value="${article?.prezzo ?? ""}">
                </div>
            </div>
            <div>
                <label for="ec-f-categoria">Categoria</label>
                <input type="text" id="ec-f-categoria" placeholder="es. Abbigliamento" value="${Utils.escapeHtml(article?.categoria || "")}">
            </div>
            <div>
                <label for="ec-f-desc">Descrizione</label>
                <textarea id="ec-f-desc" placeholder="Descrizione del prodotto...">${Utils.escapeHtml(article?.descrizione || "")}</textarea>
            </div>
            <div>
                <label>Immagine</label>
                <p style="font-size:12px;opacity:.55;margin:0 0 8px;">Carica un file dal computer, oppure incolla un URL.</p>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <input type="file" id="ec-f-img-file" accept="image/*" style="flex:1;min-width:0;">
                    <input type="text" id="ec-f-img-url" placeholder="https://... URL immagine (facoltativo)" style="flex:2;min-width:0;">
                </div>
                <img id="ec-f-img-preview" class="ec-img-preview"
                    src="${article?.immagineBase64 || ""}"
                    style="${article?.immagineBase64 ? "display:block;" : "display:none;"}">
            </div>
            <div class="ec-toggle">
                <input type="checkbox" id="ec-f-disponibile" ${(article?.disponibile ?? true) ? "checked" : ""}>
                <label for="ec-f-disponibile" style="text-transform:none;opacity:1;font-size:14px;">Articolo disponibile</label>
            </div>
            <div id="ec-form-error" style="color:#ef4444;font-size:13px;display:none;"></div>
        </div>
        `;
    },

    articleFormFooter(article) {
        const isEdit = !!article;
        return `
        <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button class="btn-dash" id="ec-f-cancel" type="button">Annulla</button>
            <button class="btn-dash pink" id="ec-f-save" type="button">
                ${isEdit ? "💾 Salva Modifiche" : "➕ Aggiungi Articolo"}
            </button>
        </div>`;
    },

    /**
     * Gets the data from the rendered form and parses inputs.
     */
    getArticleFormData(wrapper, currentBase64, currentMimeType) {
        const title = wrapper.querySelector("#ec-f-nome").value.trim();
        const priceRaw = wrapper.querySelector("#ec-f-prezzo")?.value.replace(/[^0-9,.]/g, "").replace(",", ".");
        
        return {
            nome: title,
            prezzo: parseFloat(priceRaw) || 0,
            categoria: wrapper.querySelector("#ec-f-categoria").value.trim(),
            descrizione: wrapper.querySelector("#ec-f-desc").value.trim(),
            disponibile: wrapper.querySelector("#ec-f-disponibile").checked,
            immagineBase64: currentBase64,
            immagineMimeType: currentMimeType
        };
    },

    // ------------------------------------------------------------------------
    // WIZARD IMPORT
    // ------------------------------------------------------------------------

    importStep1() {
        return `
        <div class="ec-wizard">
            <div class="ec-wizard-step">Step 1 di 3</div>
            <h3>🌐 Connessione al Negozio Originale</h3>
            <p class="ec-wizard-note">
                Il sistema recupererà l'elenco dei prodotti da
                <strong>fusionteamvolley.it/fusion-shop/</strong> tramite il backend.
                Le immagini verranno scaricate e incapsulate localmente e offline.
            </p>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button class="btn-dash pink" id="ec-wizard-fetch" type="button">
                    <i class="ph ph-cloud-arrow-down" style="font-size:16px;"></i> Recupera Prodotti
                </button>
                <button class="btn-dash" id="ec-wizard-cancel" type="button">Annulla</button>
            </div>
            <div id="ec-wizard-status" style="margin-top:16px;"></div>
        </div>`;
    },

    importStepError(message) {
        return `
        <div class="ec-cors-warning">
            <strong>⚠️ Errore di connessione</strong><br>
            ${Utils.escapeHtml(message)}<br><br>
            Puoi aggiungere gli articoli manualmente cliccando "Aggiungi Manualmente".
        </div>`;
    },

    importStepOffline() {
        return `
        <div class="ec-cors-warning">
            <strong>⚠️ Nessun prodotto rilevato</strong><br>
            Il negozio potrebbe essere offline o cambiato struttura.<br>
            Puoi comunque aggiungere gli articoli manualmente.
        </div>
        <button class="btn-dash" id="ec-wizard-manual" type="button">
            Passa all'inserimento manuale
        </button>`;
    },

    importStep2(products) {
        const gridItems = products.map(p => {
            const imgHtml = p.immagineUrl 
                ? `<img class="ec-product-preview-img" src="${Utils.escapeHtml(p.immagineUrl)}" alt="" loading="lazy">` 
                : '<div class="ec-product-preview-img" style="display:flex;align-items:center;justify-content:center;font-size:28px;color:rgba(255,255,255,.2);">📦</div>';
            return `
            <div class="ec-product-preview-item">
                ${imgHtml}
                <div class="ec-product-preview-name" title="${Utils.escapeHtml(p.nome)}">${Utils.escapeHtml(p.nome)}</div>
                <div class="ec-product-preview-price">${p.prezzo > 0 ? (p.prezzo.toLocaleString('it-IT') + ' €') : '—'}</div>
            </div>`;
        }).join("");

        return `
        <div class="ec-wizard">
            <div class="ec-wizard-step">Step 2 di 3</div>
            <h3>📋 Anteprima Prodotti (${products.length} trovati)</h3>
            <p class="ec-wizard-note">Verifica i prodotti rilevati. Cliccando <strong>Conferma e Salva</strong> le immagini verranno scaricate e processate per la dashboard.</p>
            
            <div class="ec-product-preview-grid">${gridItems}</div>
            
            <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
                <button class="btn-dash cyan" id="ec-wizard-confirm" type="button">
                    ✅ Conferma e Salva (${products.length} articoli)
                </button>
                <button class="btn-dash" id="ec-wizard-back" type="button">← Indietro</button>
            </div>
            
            <div id="ec-wizard-progress-area" style="margin-top:20px;display:none;">
                <div class="ec-wizard-step">Step 3 di 3 — Download immagini</div>
                <div class="ec-progress"><div class="ec-progress-bar" id="ec-prog-bar" style="width:0%;"></div></div>
                <p id="ec-prog-text" class="ec-wizard-note">0 / ${products.length} immagini scaricate...</p>
            </div>
        </div>`;
    }
};

export default EcommerceWizard;
