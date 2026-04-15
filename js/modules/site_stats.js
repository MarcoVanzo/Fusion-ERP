/**
 * Web Analytics Module
 * Renders the Looker Studio iFrames for analytics directly in the ERP.
 */

"use strict";

window.WebAnalytics = (() => {
  const state = {
    activeSite: "site1",
    sites: {
      site1: {
        id: "site1",
        name: "Fusion Team Volley",
        // Sostituisci questo URL con l'Embed URL generato da Looker Studio
        url: "https://lookerstudio.google.com/embed/reporting/60af0b7f-f543-46ac-ba17-9c66c1c40cc2/page/B0usF",
      },
      site2: {
        id: "site2",
        name: "OutSeason",
        // Sostituisci questo URL con l'Embed URL generato da Looker Studio
        url: "https://lookerstudio.google.com/embed/reporting/a0244411-6043-4111-84c2-e90d12eafd83/page/v3usF",
      },
    },
  };

  async function init() {
    _render();
  }

  function _render() {
    const app = document.getElementById("app");
    if (!app) return;

    let html = `
            <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
                <div>
                    <h2 class="page-title">Web Analytics</h2>
                    <p class="text-muted" style="margin-top:0.25rem;">Dati di utilizzo traffico web (Powered by Looker Studio)</p>
                </div>
                <div class="actions">
                    <select id="analytics-site-select" class="form-input" style="min-width: 250px; font-weight:600; cursor:pointer;">
                        ${Object.values(state.sites)
                          .map(
                            (s) =>
                              `<option value="${s.id}" ${s.id === state.activeSite ? "selected" : ""}>${Utils.escapeHtml(s.name)}</option>`,
                          )
                          .join("")}
                    </select>
                </div>
            </div>
            
            <div class="page-content" style="padding:0; margin-top:1rem; height:calc(100vh - 180px); display:flex; flex-direction:column;">
                <div style="flex:1; padding:0; border-radius:12px; overflow:hidden; border:1px solid var(--color-border); background:var(--color-surface); box-shadow:0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); position:relative;">
                    <div id="analytics-iframe-container" style="position:absolute; top:0; left:0; right:0; bottom:0; overflow:hidden;">
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
    const select = document.getElementById("analytics-site-select");
    if (select) {
      select.addEventListener("change", (e) => {
        state.activeSite = e.target.value;
        _loadIframe();
      });
    }
  }

  function _loadIframe() {
    const container = document.getElementById("analytics-iframe-container");
    if (!container) return;

    const activeData = state.sites[state.activeSite];

    if (activeData.url) {
      // Show loading spinner while iframe loads
      container.innerHTML = `
                <div id="analytics-loading" style="position:absolute; top:0; left:0; right:0; bottom:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--color-surface); z-index:2;">
                    <div style="width:40px; height:40px; border:3px solid var(--color-border); border-top-color:var(--color-primary); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
                    <p style="margin-top:1rem; color:var(--text-muted); font-size:14px;">Caricamento dashboard...</p>
                </div>
                <iframe 
                    id="analytics-iframe"
                    src="${activeData.url}" 
                    style="width:100%; height:100%; border:none; display:block;" 
                    allowfullscreen
                    loading="eager"
                    sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                    allow="fullscreen"
                    referrerpolicy="no-referrer-when-downgrade"
                ></iframe>
            `;

      // Add spin animation if not already in document
      if (!document.getElementById('analytics-spin-style')) {
        const style = document.createElement('style');
        style.id = 'analytics-spin-style';
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      }

      const iframe = document.getElementById('analytics-iframe');
      if (iframe) {
        iframe.addEventListener('load', () => {
          const loader = document.getElementById('analytics-loading');
          if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.3s ease';
            setTimeout(() => loader.remove(), 300);
          }
        });

        // Timeout: if iframe hasn't loaded after 15s, hide spinner and show message
        setTimeout(() => {
          const loader = document.getElementById('analytics-loading');
          if (loader) {
            loader.innerHTML = `
                        <i class="ph ph-warning" style="font-size:48px; color:var(--color-warning); margin-bottom:1rem;"></i>
                        <h3 style="margin:0 0 0.5rem 0; font-weight:600; color:var(--text-main); font-size:1.1rem;">Caricamento lento</h3>
                        <p style="margin:0; font-size:14px; color:var(--text-muted); max-width:400px; text-align:center; line-height:1.5;">
                            La dashboard potrebbe richiedere il login a Google.<br>
                            <a href="${activeData.url}" target="_blank" rel="noopener" style="color:var(--color-primary); text-decoration:underline; margin-top:0.5rem; display:inline-block;">Apri in una nuova scheda →</a>
                        </p>
                    `;
            loader.style.opacity = '0.95';
          }
        }, 15000);
      }
    } else {
      container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; font-family:var(--font-body); color:var(--text-muted); background:var(--bg-body); text-align:center; padding:2rem;">
                    <i class="ph ph-chart-line-up" style="font-size:64px; color:var(--color-primary); margin-bottom:1rem; opacity:0.5;"></i>
                    <h3 style="margin:0 0 0.5rem 0; font-weight:600; color:var(--text-main); font-size:1.25rem;">Dashboard non collegata</h3>
                    <p style="margin:0 0 1.5rem 0; font-size:15px; max-width:450px; line-height:1.5;">Per visualizzare i dati in questa scheda, crea o apri un report su <b>Google Looker Studio</b>, genera il link per l'incorporamento (embed) e incollalo all'interno del file <code>js/modules/site_stats.js</code> alla variabile <code>url</code> del sito corrispondente.</p>
                </div>
            `;
    }
  }

  function destroy() {
    // Cleanup: remove injected style
    const style = document.getElementById('analytics-spin-style');
    if (style) style.remove();
  }

  return { init, destroy };
})();
