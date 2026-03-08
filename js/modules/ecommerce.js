/**
 * ecommerce.js — Modulo eCommerce
 * Fusion ERP v1.0
 *
 * Pattern identico a outseason.js:
 *   - IIFE che espone window.Ecommerce = { init, destroy }
 *   - Stili CSS inline iniettati nell'#app
 *   - Usa Store.get/api() per le chiamate API
 *   - Usa EcommerceDB (Dexie.js) per IndexedDB locale
 */

'use strict';

const Ecommerce = (() => {

    let _abortCtrl = new AbortController();
    let _currentTab = 'articles'; // 'articles' | 'orders'
    let _lastOrdersFetch = null;

    // ══════════════════════════════════════════════════════════════════════
    // STYLES
    // ══════════════════════════════════════════════════════════════════════
    const _CSS = `
        .ec-page { padding: 24px; max-width: 1400px; margin: 0 auto; animation: ecFadeIn .4s ease; }
        @keyframes ecFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* Header */
        .ec-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .ec-header h1 { font-size: 1.8rem; font-weight: 700;
            background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .ec-header-badge { padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;
            background: rgba(99,102,241,0.15); color: #818cf8; }

        /* Removed Sub-tabs */

        /* Action btn */
        .ec-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px;
            border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s ease;
            border: 1px solid; }
        .ec-btn-primary { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #818cf8; }
        .ec-btn-primary:hover { background: rgba(99,102,241,0.25); border-color: rgba(99,102,241,0.7); transform: translateY(-1px); }
        .ec-btn-success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.4); color: #10b981; }
        .ec-btn-success:hover { background: rgba(16,185,129,0.22); border-color: rgba(16,185,129,0.7); transform: translateY(-1px); }
        .ec-btn-danger { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }
        .ec-btn-danger:hover { background: rgba(239,68,68,0.18); transform: translateY(-1px); }
        .ec-btn-ghost { background: transparent; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
        .ec-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

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
            background: rgba(245,158,11,0.12); color: #f59e0b; }
        .ec-badge-consegnato { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
            border-radius: 8px; font-size: 12px; font-weight: 600;
            background: rgba(16,185,129,0.12); color: #10b981; }
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
    `;

    // ══════════════════════════════════════════════════════════════════════
    // NANO BANANA OPTIMIZER (Image Enhancement)
    // ══════════════════════════════════════════════════════════════════════
    function _applyNanoBananaEffect(base64Src) {
        return new Promise((resolve) => {
            if (!base64Src || !base64Src.startsWith('data:image/')) return resolve(base64Src);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

                    // Distanza dal bianco puro (255, 255, 255)
                    const distFromWhite = Math.sqrt((r - 255) ** 2 + (g - 255) ** 2 + (b - 255) ** 2);

                    if (distFromWhite < 30) {
                        data[i + 3] = 0; // Rimuove completamente lo sfondo bianco
                    } else if (distFromWhite < 80) {
                        // Anti-alias morbido per l'alone attorno ai bordi dell'oggetto
                        const alphaRatio = Math.max(0, (distFromWhite - 30) / 50);
                        data[i + 3] = Math.floor(a * alphaRatio);

                        // Incrementa vividezza sull'oggetto sfumato
                        const factor = (259 * (20 + 255)) / (255 * (259 - 20));
                        data[i] = Math.max(0, Math.min(255, factor * (r - 128) + 128));
                        data[i + 1] = Math.max(0, Math.min(255, factor * (g - 128) + 128));
                        data[i + 2] = Math.max(0, Math.min(255, factor * (b - 128) + 128));
                    } else if (a > 0) {
                        // Aumenta contrasto del 20% per rendere l'immagine nettamente più viva
                        const factor = (259 * (20 + 255)) / (255 * (259 - 20));
                        data[i] = Math.max(0, Math.min(255, factor * (r - 128) + 128));
                        data[i + 1] = Math.max(0, Math.min(255, factor * (g - 128) + 128));
                        data[i + 2] = Math.max(0, Math.min(255, factor * (b - 128) + 128));
                    }
                }
                ctx.putImageData(imgData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(base64Src);
            img.src = base64Src;
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ══════════════════════════════════════════════════════════════════════

    function _renderPage() {
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = `
        <style>${_CSS}</style>
        <div class="ec-page">
            <div class="ec-header">
                <h1><i class="ph ph-shopping-cart" style="font-size:28px;-webkit-text-fill-color:#818cf8;"></i> eCommerce</h1>
                <span class="ec-header-badge" id="ec-badge">—</span>
            </div>

            <!-- Sub-tabs removed -->

            <!-- Content panels -->
            <div id="ec-panel-articles" style="${_currentTab === 'articles' ? '' : 'display:none;'}"></div>
            <div id="ec-panel-orders" style="${_currentTab === 'orders' ? '' : 'display:none;'}"></div>
        </div>
        `;

        // Tab switching
        const tabArt = document.getElementById('ec-tab-articles');
        const tabOrd = document.getElementById('ec-tab-orders');
        if (tabArt) tabArt.addEventListener('click', () => Router.navigate('ecommerce-articles'), { signal: _abortCtrl.signal });
        if (tabOrd) tabOrd.addEventListener('click', () => Router.navigate('ecommerce-orders'), { signal: _abortCtrl.signal });

        // Load initial panel
        if (_currentTab === 'articles') {
            _loadArticlesPanel();
        } else {
            _loadOrdersPanel();
        }
    }

    function _switchTab(tab) {
        _currentTab = tab;
        const isArt = (tab === 'articles');

        const tabArtBtn = document.getElementById('ec-tab-articles');
        const tabOrdBtn = document.getElementById('ec-tab-orders');
        if (tabArtBtn) tabArtBtn.classList.toggle('active', isArt);
        if (tabOrdBtn) tabOrdBtn.classList.toggle('active', !isArt);

        const panelArt = document.getElementById('ec-panel-articles');
        const panelOrd = document.getElementById('ec-panel-orders');
        if (panelArt) panelArt.style.display = isArt ? '' : 'none';
        if (panelOrd) panelOrd.style.display = isArt ? 'none' : '';
    }

    // ══════════════════════════════════════════════════════════════════════
    // ARTICOLI TAB
    // ══════════════════════════════════════════════════════════════════════

    async function _upgradeImagesNanoBanana() {
        try {
            const done = await EcommerceDB.getMeta('nanoBananaUpgradeAggressivo_v2');
            if (done) return;

            const articoli = await EcommerceDB.getArticoli();
            let count = 0;
            for (let a of articoli) {
                if (a.immagineBase64 && (!a.immagineMimeType || a.immagineMimeType === 'image/jpeg' || (a.immagineMimeType === 'image/png' && a.immagineBase64.length > 500))) {
                    try {
                        const newB64 = await _applyNanoBananaEffect(a.immagineBase64);
                        if (newB64 !== a.immagineBase64) {
                            a.immagineBase64 = newB64;
                            a.immagineMimeType = 'image/png';
                            await EcommerceDB.saveArticolo(a);
                            count++;
                        }
                    } catch (err) { }
                }
            }
            if (count > 0) {
                console.log(`NanoBanana v2: upgraded ${count} legacy images.`);
                const panel = document.getElementById('ec-panel-articles');
                if (panel && _currentTab === 'articles') _renderArticoliGrid(panel);
            }
            await EcommerceDB.setMeta('nanoBananaUpgradeAggressivo_v2', true);
        } catch (e) {
            console.error('NanoBanana: auto-upgrade failed', e);
        }
    }

    async function _loadArticlesPanel() {
        const panel = document.getElementById('ec-panel-articles');
        if (!panel) return;

        // Eseguiamo la migrazione silenziosa in background delle vecchie immagini JPG
        _upgradeImagesNanoBanana();

        try {
            const count = await EcommerceDB.countArticoli();
            const badge = document.getElementById('ec-badge');
            if (badge) badge.textContent = count > 0 ? `${count} Articoli` : 'Articoli';

            // Show import banner if DB is empty AND import not yet done
            const importDone = await EcommerceDB.getMeta('importCompletato');

            if (count === 0 && !importDone) {
                _renderImportBanner(panel);
                return;
            }

            _renderArticoliGrid(panel);
        } catch (err) {
            panel.innerHTML = `<div class="ec-empty"><i class="ph ph-warning-circle"></i><p>Errore: ${Utils.escapeHtml(err.message)}</p></div>`;
        }
    }

    function _renderImportBanner(panel) {
        panel.innerHTML = `
        <div class="ec-import-banner">
            <span class="ec-import-banner-icon">📦</span>
            <div style="flex:1; min-width:0;">
                <h3>Nessun articolo trovato</h3>
                <p>Importa i prodotti dal sito originale in un click, oppure aggiungili manualmente.</p>
            </div>
            <div style="display:flex; gap:10px; flex-shrink:0; flex-wrap:wrap;">
                <button class="ec-btn ec-btn-primary" id="ec-start-wizard" type="button">
                    <i class="ph ph-download-simple"></i> Importa dal Sito
                </button>
                <button class="ec-btn ec-btn-ghost" id="ec-skip-import" type="button">
                    Aggiungi Manualmente
                </button>
            </div>
        </div>
        <div id="ec-wizard-area"></div>
        `;

        document.getElementById('ec-start-wizard').addEventListener('click', () => {
            document.querySelector('.ec-import-banner').style.display = 'none';
            _renderImportWizard(document.getElementById('ec-wizard-area'));
        }, { signal: _abortCtrl.signal });

        document.getElementById('ec-skip-import').addEventListener('click', async () => {
            await EcommerceDB.setMeta('importCompletato', true);
            _renderArticoliGrid(panel);
        }, { signal: _abortCtrl.signal });
    }

    async function _renderArticoliGrid(panel) {
        const articoli = await EcommerceDB.getArticoli();
        const categorie = [...new Set(articoli.map(a => a.categoria).filter(Boolean))].sort();
        const badge = document.getElementById('ec-badge');
        if (badge) badge.textContent = `${articoli.length} Articoli`;

        panel.innerHTML = `
        <div class="ec-toolbar">
            <div class="ec-search">
                <i class="ph ph-magnifying-glass"></i>
                <input type="text" id="ec-search-input" placeholder="Cerca articolo..." autocomplete="off">
            </div>
            <select class="ec-filter-cat" id="ec-cat-filter">
                <option value="">Tutte le categorie</option>
                ${categorie.map(c => `<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join('')}
            </select>
            <button class="ec-btn ec-btn-success" id="ec-add-btn" type="button">
                <i class="ph ph-plus"></i> Aggiungi Articolo
            </button>
        </div>
        <div class="ec-grid" id="ec-articles-grid">
            ${articoli.length === 0 ? _emptyState() : articoli.map(_renderCard).join('')}
        </div>
        `;

        // Search + filter
        const searchInput = document.getElementById('ec-search-input');
        const catFilter = document.getElementById('ec-cat-filter');
        let _searchTimer;
        const _applyFilters = () => {
            clearTimeout(_searchTimer);
            _searchTimer = setTimeout(() => {
                const q = searchInput.value.trim().toLowerCase();
                const cat = catFilter.value;
                const filtered = articoli.filter(a =>
                    (!q || a.nome.toLowerCase().includes(q)) &&
                    (!cat || a.categoria === cat)
                );
                document.getElementById('ec-articles-grid').innerHTML =
                    filtered.length === 0 ? _emptyState() : filtered.map(_renderCard).join('');
                _bindCardActions(panel, articoli);
            }, 200);
        };
        searchInput.addEventListener('input', _applyFilters, { signal: _abortCtrl.signal });
        catFilter.addEventListener('change', _applyFilters, { signal: _abortCtrl.signal });

        document.getElementById('ec-add-btn').addEventListener('click', () => _showFormModal(null, panel), { signal: _abortCtrl.signal });
        _bindCardActions(panel, articoli);
    }

    function _renderCard(a) {
        const imgHtml = a.immagineBase64
            ? `<img class="ec-card-img" src="${a.immagineBase64}" alt="${Utils.escapeHtml(a.nome)}" loading="lazy">`
            : `<div class="ec-card-img-placeholder"><i class="ph ph-image"></i></div>`;
        const badge = a.disponibile
            ? `<span class="ec-badge-disponibile">● Disponibile</span>`
            : `<span class="ec-badge-non-disponibile">● Non Disponibile</span>`;
        return `
        <div class="ec-card" data-id="${a.id}">
            <div class="ec-card-img-wrapper">
                ${imgHtml}
            </div>
            <div class="ec-card-body">
                <div class="ec-card-cat">${Utils.escapeHtml(a.categoria || '—')}</div>
                <div class="ec-card-name" title="${Utils.escapeHtml(a.nome)}">${Utils.escapeHtml(a.nome)}</div>
                <div class="ec-card-price">${(a.prezzo ?? 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</div>
                <div class="ec-card-footer">
                    ${badge}
                    <div class="ec-card-actions">
                        <button class="ec-icon-btn ec-edit-btn" data-id="${a.id}" title="Modifica">✏️</button>
                        <button class="ec-icon-btn ec-delete-btn" data-id="${a.id}" title="Elimina">🗑️</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function _bindCardActions(panel, articoli) {
        document.querySelectorAll('.ec-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                const a = articoli.find(x => x.id === id);
                if (a) _showFormModal(a, panel);
            }, { signal: _abortCtrl.signal });
        });
        document.querySelectorAll('.ec-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                const art = articoli.find(x => x.id === id);
                const name = art ? art.nome : 'questo articolo';
                UI.confirm(`Eliminare "${name}"? L'operazione non è reversibile.`, async () => {
                    await EcommerceDB.deleteArticolo(id);
                    UI.toast('Articolo eliminato', 'success');
                    _renderArticoliGrid(panel);
                });
            }, { signal: _abortCtrl.signal });
        });
    }

    function _emptyState() {
        return `<div class="ec-empty" style="grid-column:1/-1;">
            <i class="ph ph-shopping-bag"></i>
            <p>Nessun articolo trovato</p>
        </div>`;
    }

    // ── Form Modal (Add / Edit) ────────────────────────────────────────────
    function _showFormModal(articolo, panel) {
        const isEdit = !!articolo;
        const bodyEl = document.createElement('div');
        bodyEl.className = 'ec-form';

        bodyEl.innerHTML = `
        <div class="ec-form-row">
            <div>
                <label for="ec-f-nome">Nome *</label>
                <input type="text" id="ec-f-nome" placeholder="Nome prodotto" value="${Utils.escapeHtml(articolo?.nome || '')}" required>
            </div>
            <div>
                <label for="ec-f-prezzo">Prezzo (€) *</label>
                <input type="number" id="ec-f-prezzo" placeholder="0.00" step="0.01" min="0" value="${articolo?.prezzo ?? ''}">
            </div>
        </div>
        <div>
            <label for="ec-f-categoria">Categoria</label>
            <input type="text" id="ec-f-categoria" placeholder="es. Abbigliamento" value="${Utils.escapeHtml(articolo?.categoria || '')}">
        </div>
        <div>
            <label for="ec-f-desc">Descrizione</label>
            <textarea id="ec-f-desc" placeholder="Descrizione del prodotto...">${Utils.escapeHtml(articolo?.descrizione || '')}</textarea>
        </div>
        <div>
            <label>Immagine</label>
            <p style="font-size:12px;opacity:.55;margin:0 0 8px;">Carica un file dal tuo computer, oppure incolla un URL.</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <input type="file" id="ec-f-img-file" accept="image/*" style="flex:1;min-width:0;">
                <input type="text" id="ec-f-img-url" placeholder="https://... URL immagine (facoltativo)" style="flex:2;min-width:0;">
            </div>
            <img id="ec-f-img-preview" class="ec-img-preview"
                src="${articolo?.immagineBase64 || ''}"
                style="${articolo?.immagineBase64 ? 'display:block;' : 'display:none;'}">
        </div>
        <div class="ec-toggle">
            <input type="checkbox" id="ec-f-disponibile" ${(articolo?.disponibile ?? true) ? 'checked' : ''}>
            <label for="ec-f-disponibile" style="text-transform:none;opacity:1;font-size:14px;">Articolo disponibile</label>
        </div>
        <div id="ec-form-error" style="color:#ef4444;font-size:13px;display:none;"></div>
        `;

        const footerEl = document.createElement('div');
        footerEl.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';
        footerEl.innerHTML = `
        <button class="ec-btn ec-btn-ghost" id="ec-f-cancel" type="button">Annulla</button>
        <button class="ec-btn ec-btn-primary" id="ec-f-save" type="button">
            ${isEdit ? '💾 Salva Modifiche' : '➕ Aggiungi Articolo'}
        </button>`;

        const modal = UI.modal({ title: isEdit ? `Modifica: ${articolo.nome}` : 'Nuovo Articolo', body: bodyEl, footer: footerEl });

        // Image file input → base64

        let _currentBase64 = articolo?.immagineBase64 || null;
        let _currentMime = articolo?.immagineMimeType || null;
        const preview = document.getElementById('ec-f-img-preview');

        document.getElementById('ec-f-img-file').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                _currentBase64 = await EcommerceDB.fileToBase64(file);
                _currentMime = file.type;
                preview.src = _currentBase64;
                preview.style.display = 'block';
            } catch (err) {
                UI.toast('Errore lettura immagine', 'error');
            }
        });

        // Save
        document.getElementById('ec-f-cancel').addEventListener('click', () => modal.close());
        document.getElementById('ec-f-save').addEventListener('click', async () => {
            const errEl = document.getElementById('ec-form-error');
            errEl.style.display = 'none';
            const nome = document.getElementById('ec-f-nome').value.trim();
            if (!nome) { errEl.textContent = 'Il nome è obbligatorio.'; errEl.style.display = 'block'; return; }

            // If URL was pasted and no file selected, fetch → base64 via proxy note
            const urlInput = document.getElementById('ec-f-img-url').value.trim();
            if (urlInput && !_currentBase64) {
                const b64 = await EcommerceDB.urlToBase64(urlInput);
                if (b64) { _currentBase64 = b64; _currentMime = 'image/jpeg'; }
                else { UI.toast('Impossibile scaricare l\'immagine dall\'URL (CORS o URL non valido).', 'warning', 4000); }
            }

            const saveBtn = document.getElementById('ec-f-save');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvataggio...';
            try {
                if (_currentBase64) {
                    _currentBase64 = await _applyNanoBananaEffect(_currentBase64);
                    _currentMime = 'image/png';
                }
                await EcommerceDB.saveArticolo({
                    id: isEdit ? articolo.id : undefined,
                    nome,
                    prezzo: parseFloat(document.getElementById('ec-f-prezzo').value) || 0,
                    categoria: document.getElementById('ec-f-categoria').value.trim(),
                    descrizione: document.getElementById('ec-f-desc').value.trim(),
                    disponibile: document.getElementById('ec-f-disponibile').checked,
                    immagineBase64: _currentBase64,
                    immagineMimeType: _currentMime,
                });
                UI.toast(isEdit ? 'Articolo aggiornato' : 'Articolo aggiunto', 'success');
                modal.close();
                _renderArticoliGrid(panel);
            } catch (err) {
                errEl.textContent = 'Errore salvataggio: ' + err.message;
                errEl.style.display = 'block';
                saveBtn.disabled = false;
                saveBtn.textContent = isEdit ? '💾 Salva Modifiche' : '➕ Aggiungi Articolo';
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    // IMPORT WIZARD
    // ══════════════════════════════════════════════════════════════════════

    function _renderImportWizard(container) {
        container.innerHTML = `
        <div class="ec-wizard">
            <div class="ec-wizard-step">Step 1 di 3</div>
            <h3>🌐 Connessione al Negozio Originale</h3>
            <p class="ec-wizard-note">
                Il sistema recupererà l'elenco dei prodotti da
                <strong>fusionteamvolley.it/fusion-shop/</strong> tramite il server (nessun problema CORS).
                Le immagini verranno scaricate e salvate localmente in formato base64 — nessuna dipendenza esterna.
            </p>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button class="ec-btn ec-btn-primary" id="ec-wizard-fetch" type="button">
                    <i class="ph ph-cloud-arrow-down" style="font-size:16px;"></i>
                    Recupera Prodotti
                </button>
                <button class="ec-btn ec-btn-ghost" id="ec-wizard-cancel" type="button">Annulla</button>
            </div>
            <div id="ec-wizard-status" style="margin-top:16px;"></div>
        </div>`;

        document.getElementById('ec-wizard-cancel').addEventListener('click', () => {
            _loadArticlesPanel();
        }, { signal: _abortCtrl.signal });

        document.getElementById('ec-wizard-fetch').addEventListener('click', async () => {
            await _wizardFetchProducts(container);
        }, { signal: _abortCtrl.signal });
    }

    async function _wizardFetchProducts(container) {
        const statusEl = document.getElementById('ec-wizard-status');
        const fetchBtn = document.getElementById('ec-wizard-fetch');
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<div class="ec-spinner"></div> Recupero in corso...';

        try {
            Store.invalidate('scrapeShop');
            const data = await Store.get('scrapeShop', 'ecommerce');
            const products = data.products || [];

            if (products.length === 0) {
                statusEl.innerHTML = `
                    <div class="ec-cors-warning">
                        <strong>⚠️ Nessun prodotto rilevato</strong><br>
                        Il negozio potrebbe essere offline o cambiato struttura.<br>
                        Puoi comunque aggiungere gli articoli manualmente.
                    </div>
                    <button class="ec-btn ec-btn-ghost" id="ec-wizard-manual" type="button">
                        Passa all'inserimento manuale
                    </button>`;
                document.getElementById('ec-wizard-manual').addEventListener('click', async () => {
                    await EcommerceDB.setMeta('importCompletato', true);
                    _renderArticoliGrid(document.getElementById('ec-panel-articles'));
                });
                return;
            }

            _wizardShowPreview(container, products);

        } catch (err) {
            statusEl.innerHTML = `<div class="ec-cors-warning">
                <strong>⚠️ Errore di connessione</strong><br>
                ${Utils.escapeHtml(err.message)}<br><br>
                Puoi aggiungere gli articoli manualmente cliccando "Aggiungi Manualmente".
            </div>`;
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = '<i class="ph ph-cloud-arrow-down"></i> Riprova';
        }
    }

    function _wizardShowPreview(container, products) {
        const previewItems = products.map(p => `
            <div class="ec-product-preview-item">
                ${p.immagineUrl ? `<img class="ec-product-preview-img" src="${Utils.escapeHtml(p.immagineUrl)}" alt="" loading="lazy">` :
                '<div class="ec-product-preview-img" style="display:flex;align-items:center;justify-content:center;font-size:28px;color:rgba(255,255,255,.2);">📦</div>'}
                <div class="ec-product-preview-name" title="${Utils.escapeHtml(p.nome)}">${Utils.escapeHtml(p.nome)}</div>
                <div class="ec-product-preview-price">${p.prezzo > 0 ? p.prezzo.toLocaleString('it-IT') + ' €' : '—'}</div>
            </div>`).join('');

        container.innerHTML = `
        <div class="ec-wizard">
            <div class="ec-wizard-step">Step 2 di 3</div>
            <h3>📋 Anteprima Prodotti (${products.length} trovati)</h3>
            <p class="ec-wizard-note">Verifica i prodotti rilevati. Cliccando <strong>Conferma e Salva</strong> le immagini verranno scaricate e salvate localmente.</p>
            <div class="ec-product-preview-grid">${previewItems}</div>
            <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
                <button class="ec-btn ec-btn-success" id="ec-wizard-confirm" type="button">
                    ✅ Conferma e Salva (${products.length} articoli)
                </button>
                <button class="ec-btn ec-btn-ghost" id="ec-wizard-back" type="button">← Indietro</button>
            </div>
            <div id="ec-wizard-progress-area" style="margin-top:20px;display:none;">
                <div class="ec-wizard-step">Step 3 di 3 — Download immagini</div>
                <div class="ec-progress"><div class="ec-progress-bar" id="ec-prog-bar" style="width:0%;"></div></div>
                <p id="ec-prog-text" class="ec-wizard-note">0 / ${products.length} immagini scaricate...</p>
            </div>
        </div>`;

        document.getElementById('ec-wizard-back').addEventListener('click', () => _renderImportWizard(container), { signal: _abortCtrl.signal });
        document.getElementById('ec-wizard-confirm').addEventListener('click', () => _wizardSave(container, products), { signal: _abortCtrl.signal });
    }

    async function _wizardSave(container, products) {
        document.getElementById('ec-wizard-confirm').disabled = true;
        document.getElementById('ec-wizard-back').disabled = true;
        const progressArea = document.getElementById('ec-wizard-progress-area');
        progressArea.style.display = 'block';
        const progBar = document.getElementById('ec-prog-bar');
        const progText = document.getElementById('ec-prog-text');

        const total = products.length;
        const toSave = [];
        let downloaded = 0;

        for (const p of products) {
            let b64 = null;
            let mime = null;
            if (p.immagineUrl) {
                b64 = await EcommerceDB.urlToBase64(p.immagineUrl);
                if (b64) b64 = await _applyNanoBananaEffect(b64);
                mime = b64 ? (b64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg') : null;
            }
            downloaded++;
            const pct = Math.round((downloaded / total) * 100);
            progBar.style.width = pct + '%';
            progText.textContent = `${downloaded} / ${total} immagini scaricate (${b64 ? 'OK' : 'skipped'}: ${Utils.escapeHtml(p.nome)})`;

            toSave.push({
                nome: p.nome,
                prezzo: p.prezzo || 0,
                immagineBase64: b64,
                immagineMimeType: mime,
                descrizione: p.descrizione || '',
                categoria: p.categoria || '',
                disponibile: true,
            });
        }

        await EcommerceDB.bulkSaveArticoli(toSave);
        await EcommerceDB.setMeta('importCompletato', true);

        progText.textContent = `✅ ${toSave.length} articoli salvati con successo!`;
        UI.toast(`Importazione completata: ${toSave.length} articoli`, 'success', 5000);

        setTimeout(() => {
            const panel = document.getElementById('ec-panel-articles');
            if (panel) _renderArticoliGrid(panel);
        }, 1200);
    }

    // ══════════════════════════════════════════════════════════════════════
    // ORDINI TAB
    // ══════════════════════════════════════════════════════════════════════

    async function _loadOrdersPanel() {
        const panel = document.getElementById('ec-panel-orders');
        if (!panel) return;

        panel.innerHTML = `<div style="padding:40px;text-align:center;opacity:.5;">
            <div class="ec-spinner" style="width:28px;height:28px;margin:0 auto 12px;"></div>
            <p>Caricamento ordini...</p>
        </div>`;

        try {
            const data = await Store.get('getOrders', 'ecommerce');
            const orders = data.orders || [];
            const statiMap = await EcommerceDB.getAllStatiOrdini();

            _lastOrdersFetch = new Date();
            _renderOrdersTable(panel, orders, statiMap);

            const badge = document.getElementById('ec-badge');
            if (badge) badge.textContent = `${orders.length} Ordini`;

        } catch (err) {
            panel.innerHTML = `<div class="ec-empty">
                <i class="ph ph-warning-circle"></i>
                <p>Errore caricamento ordini: ${Utils.escapeHtml(err.message)}</p>
            </div>`;
        }
    }

    function _renderOrdersTable(panel, ordersAll, statiMap) {
        let _activeFilter = 'all';

        const _getFilteredOrders = () => {
            if (_activeFilter === 'all') return ordersAll;
            return ordersAll.filter(o => {
                const stato = statiMap.get(String(o.id))?.stato || null;
                return stato === _activeFilter;
            });
        };

        const _lastUpdateStr = () => _lastOrdersFetch
            ? 'Ultimo aggiornamento: ' + _lastOrdersFetch.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
            : '';

        const _renderRows = (orders, sm) => orders.map(o => {
            let localStato = sm.get(String(o.id))?.stato || null;
            if (!localStato && o.statoForms) {
                // sync the Cognito status if not manually overridden
                localStato = String(o.statoForms).toLowerCase() === 'pagato' ? 'pagato' : null;
            }
            const badgeHtml = _statoBadge(localStato);
            const dateStr = o.dataOrdine ? new Date(o.dataOrdine).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
            const totaleStr = o.totale > 0 ? o.totale.toLocaleString('it-IT', { minimumFractionDigits: 2 }) + ' €' : '—';

            // Articoli: use mapped field or orderSummary fallback (plain text)
            const articoliText = o.articoli
                || (o.orderSummary ? o.orderSummary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '')
                || '—';

            // Debug: list available Cognito field names (shown on hover)
            const campiStr = Array.isArray(o._campiDisponibili)
                ? o._campiDisponibili.join(', ')
                : '';
            const debugIcon = campiStr
                ? `<span title="Campi Cognito disponibili:\n${campiStr}" style="cursor:help;opacity:.4;font-size:11px;margin-left:4px;">ℹ</span>`
                : '';

            return `<tr>
                <td style="font-weight:600;">${Utils.escapeHtml(o.nomeCliente || '—')}${debugIcon}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${Utils.escapeHtml(articoliText)}">
                    ${Utils.escapeHtml(articoliText.substring(0, 70))}${articoliText.length > 70 ? '…' : ''}
                </td>
                <td style="font-weight:700;">${totaleStr}</td>
                <td>${dateStr}</td>
                <td>${badgeHtml}</td>
                <td>
                    <select class="ec-stato-select" data-order-id="${Utils.escapeHtml(String(o.id))}">
                        <option value="" ${!localStato ? 'selected' : ''}>— Imposta Stato</option>
                        <option value="pagato" ${localStato === 'pagato' ? 'selected' : ''}>🟡 Pagato</option>
                        <option value="consegnato" ${localStato === 'consegnato' ? 'selected' : ''}>🟢 Consegnato</option>
                    </select>
                </td>
            </tr>`;
        }).join('');

        const _render = () => {
            const filtered = _getFilteredOrders();
            const tbody = panel.querySelector('#ec-orders-tbody');
            if (tbody) tbody.innerHTML = filtered.length === 0
                ? `<tr><td colspan="6" style="text-align:center;padding:40px;opacity:.5;">Nessun ordine trovato</td></tr>`
                : _renderRows(filtered, statiMap);

            // Re-bind selects
            panel.querySelectorAll('.ec-stato-select').forEach(sel => {
                sel.addEventListener('change', async () => {
                    const orderId = sel.dataset.orderId;
                    const stato = sel.value;
                    if (stato) {
                        await EcommerceDB.setStatoOrdine(orderId, stato);
                        statiMap.set(String(orderId), { ordineId: orderId, stato });
                        UI.toast('Stato aggiornato', 'success', 2000);
                        _render();
                    }
                }, { signal: _abortCtrl.signal });
            });
        };

        panel.innerHTML = `
        <div class="ec-orders-toolbar">
            <div class="ec-filter-bar">
                <button class="ec-filter-btn active" data-filter="all" type="button">Tutti (${ordersAll.length})</button>
                <button class="ec-filter-btn" data-filter="pagato" type="button">🟡 Pagati</button>
                <button class="ec-filter-btn" data-filter="consegnato" type="button">🟢 Consegnati</button>
            </div>
            <button class="ec-btn ec-btn-ghost" id="ec-orders-refresh" type="button" style="margin-left:auto;">
                <i class="ph ph-arrows-clockwise"></i> Aggiorna
            </button>
            <span class="ec-last-update" id="ec-last-update">${_lastUpdateStr()}</span>
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
                    ${ordersAll.length === 0
                ? `<tr><td colspan="6" style="text-align:center;padding:40px;opacity:.5;">Nessun ordine trovato</td></tr>`
                : _renderRows(ordersAll, statiMap)}
                </tbody>
            </table>
        </div>`;

        // Filter buttons
        panel.querySelectorAll('.ec-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.ec-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                _activeFilter = btn.dataset.filter;
                _render();
            }, { signal: _abortCtrl.signal });
        });

        // Refresh button
        document.getElementById('ec-orders-refresh').addEventListener('click', async () => {
            Store.invalidate('getOrders');
            await _loadOrdersPanel();
        }, { signal: _abortCtrl.signal });

        // Bind initial selects
        _render();
    }

    function _statoBadge(stato) {
        if (stato === 'pagato') return `<span class="ec-badge-pagato">🟡 Pagato</span>`;
        if (stato === 'consegnato') return `<span class="ec-badge-consegnato">🟢 Consegnato</span>`;
        return `<span class="ec-badge-pending">⚪ Da definire</span>`;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ══════════════════════════════════════════════════════════════════════

    return {
        destroy() {
            _abortCtrl.abort();
        },

        async init() {
            _abortCtrl.abort();
            _abortCtrl = new AbortController();
            const route = (typeof Router !== 'undefined') ? Router.getCurrentRoute() : 'ecommerce-articles';
            _currentTab = route === 'ecommerce-orders' ? 'orders' : 'articles';
            _lastOrdersFetch = null;

            document.getElementById('page-title').textContent = 'eCommerce';
            document.getElementById('page-subtitle').textContent = _currentTab === 'orders' ? 'Gestione ordini negozio' : 'Gestione articoli negozio';

            _renderPage();
        },
    };
})();

window.Ecommerce = Ecommerce;
