/**
 * Web Analytics Module
 * Renders the Looker Studio iFrames for analytics directly in the ERP.
 */

'use strict';

window.WebAnalytics = (() => {
    const state = {
        activeSite: 'site1',
        sites: {
            site1: {
                id: 'site1',
                name: 'Fusion Team Volley',
                // Sostituisci questo URL con l'Embed URL generato da Looker Studio
                url: 'https://lookerstudio.google.com/embed/reporting/138879d2-8174-485c-b92c-e3f634cc1af5/page/7uusF' 
            },
            site2: {
                id: 'site2',
                name: 'Sito Secondario',
                // Sostituisci questo URL con l'Embed URL generato da Looker Studio
                url: ''
            }
        }
    };

    async function init() {
        _render();
    }

    function _render() {
        const app = document.getElementById('app');
        if (!app) return;

        let html = `
            <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
                <div>
                    <h2 class="page-title">Web Analytics</h2>
                    <p class="text-muted" style="margin-top:0.25rem;">Dati di utilizzo traffico web (Powered by Looker Studio)</p>
                </div>
                <div class="actions">
                    <select id="analytics-site-select" class="form-input" style="min-width: 250px; font-weight:600; cursor:pointer;">
                        ${Object.values(state.sites).map(s => `<option value="${s.id}" ${s.id === state.activeSite ? 'selected' : ''}>${Utils.escapeHtml(s.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div class="page-content" style="padding:0; margin-top:1rem; height:calc(100vh - 180px); display:flex; flex-direction:column;">
                <div style="flex:1; padding:0; border-radius:12px; overflow:hidden; border:1px solid var(--color-border); background:var(--color-surface); display:flex; flex-direction:column; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);">
                    <div id="analytics-iframe-container" style="flex:1; width:100%; height:100%; position:relative;">
                        <!-- iFrame will be injected here -->
                    </div>
                </div>
            </div>
        `;

        app.innerHTML = html;
        _attachEvents();
        _loadIframe();
    }

    function _attachEvents() {
        const select = document.getElementById('analytics-site-select');
        if (select) {
            select.addEventListener('change', (e) => {
                state.activeSite = e.target.value;
                _loadIframe();
            });
        }
    }

    function _loadIframe() {
        const container = document.getElementById('analytics-iframe-container');
        if (!container) return;

        const activeData = state.sites[state.activeSite];

        if (activeData.url) {
            container.innerHTML = `<iframe src="${activeData.url}" style="width:100%; height:100%; border:none; display:block;" allowfullscreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>`;
        } else {
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; font-family:var(--font-body); color:var(--text-muted); background:var(--bg-body); text-align:center; padding:2rem;">
                    <i class="ph ph-chart-line-up" style="font-size:64px; color:var(--color-primary); margin-bottom:1rem; opacity:0.5;"></i>
                    <h3 style="margin:0 0 0.5rem 0; font-weight:600; color:var(--text-main); font-size:1.25rem;">Dashboard non collegata</h3>
                    <p style="margin:0 0 1.5rem 0; font-size:15px; max-width:450px; line-height:1.5;">Per visualizzare i dati in questa scheda, crea o apri un report su <b>Google Looker Studio</b>, genera il link per l'incorporamento (embed) e incollalo all'interno del file <code>js/modules/web_analytics.js</code> alla variabile <code>url</code> del sito corrispondente.</p>
                </div>
            `;
        }
    }

    function destroy() {
        // Cleanup if necessary
    }

    return { init, destroy };
})();
