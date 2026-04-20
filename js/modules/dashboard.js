"use strict";
const Dashboard = (() => {
  let _abort = new AbortController();
  function _sig() {
    return { signal: _abort.signal };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _weekdayShort(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });
  }

  function _isWithinLast14Days(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 14;
  }

  // Costruisce una list item di "novità recente"
  function recentItem(icon, text, badge, color) {
    return `
      <div style="display:flex; align-items:flex-start; gap:12px; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(0,0,0,0.2); border-radius:8px; margin-bottom:8px;">
        <i class="ph-fill ph-${icon}" style="color:${color}; font-size:20px; margin-top:2px;"></i>
        <div style="flex:1;">
          <div style="font-size:13px; font-weight:600; color:white; line-height:1.4;">${text}</div>
          ${badge ? `<div style="font-size:10px; font-weight:800; color:${color}; margin-top:4px; text-transform:uppercase;">${badge}</div>` : ''}
        </div>
      </div>
    `;
  }

  function emptyState(text) {
    return `<div style="text-align:center; padding:24px 0; color:var(--color-text-muted); font-size:12px; font-style:italic;">${text}</div>`;
  }

    // ── Render Full Page ──────────────────────────────────────────────────────
  function render(data) {
    _abort.abort();
    _abort = new AbortController();

    const el = document.getElementById("app");
    if (!el) return;

    function buildList(items, emptyMsg = "Nessuna variazione negli ultimi 14 gg") {
      if (!items || items.length === 0) return emptyState(emptyMsg);
      return items.map(i => recentItem(i.icon, i.text, i.badge, i.color)).join('');
    }

    const sportivaHtml = buildList(data?.sportiva);
    const operativitaHtml = buildList(data?.operativita);
    const comunicazioneHtml = buildList(data?.comunicazione);
    const adminHtml = buildList(data?.admin);
    const clubHtml = buildList(data?.club);
    const ecommerceHtml = buildList(data?.ecommerce);

    el.innerHTML = `
      <div style="padding: 24px; max-width: 1400px; margin: 0 auto; animation: fade-in 0.4s ease-out;" id="dash-main-container">

        <div style="margin-bottom: 24px; display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <h1 style="font-size: 28px; font-weight: 800; font-family:var(--font-display); letter-spacing:-0.5px; text-transform:uppercase; margin:0">Dashboard</h1>
            <p style="font-size: 14px; color: var(--color-text-muted); margin: 4px 0 0;">
              Attività e Variazioni reali delle <strong>Ultime 2 Settimane</strong>
            </p>
          </div>
          <div style="font-size:12px; color:gray; background:rgba(255,255,255,0.05); padding:8px 16px; border-radius:8px;">
            <i class="ph ph-clock text-amber-500"></i> Dati DB al ${new Date().toLocaleDateString("it-IT")}
          </div>
        </div>

        <!-- Griglia 6 Quadrati (3 per riga) -->
        <div class="dash-matrix-grid">
          
          <!-- 1. AREA SPORTIVA -->
          <div class="dash-box" data-route="athletes" style="border-top-color: #A78BFA;">
            <div class="dash-box-header">
              <i class="ph-bold ph-barbell" style="color:#A78BFA"></i> Area Sportiva
            </div>
            <div class="dash-box-content custom-scrollbar">
              ${sportivaHtml}
            </div>
          </div>

          <!-- 2. OPERATIVITÀ -->
          <div class="dash-box" data-route="transport" style="border-top-color: #60A5FA;">
            <div class="dash-box-header">
              <i class="ph-bold ph-calendar-check" style="color:#60A5FA"></i> Operatività
            </div>
            <div class="dash-box-content custom-scrollbar">
              ${operativitaHtml}
            </div>
          </div>

          <!-- 3. COMUNICAZIONE -->
          <div class="dash-box" data-route="website" style="border-top-color: #34D399;">
            <div class="dash-box-header">
              <i class="ph-bold ph-megaphone" style="color:#34D399"></i> Comunicazione
            </div>
            <div class="dash-box-content custom-scrollbar">
              ${comunicazioneHtml}
            </div>
          </div>

          <!-- 4. AMMINISTRAZIONE -->
          <div class="dash-box" data-route="finance" style="border-top-color: #FCD34D;">
            <div class="dash-box-header">
              <i class="ph-bold ph-vault" style="color:#FCD34D"></i> Amministrazione
            </div>
            <div class="dash-box-content custom-scrollbar">
              ${adminHtml}
            </div>
          </div>

          <!-- 5. IL CLUB -->
          <div class="dash-box" data-route="societa" style="border-top-color: #F87171;">
            <div class="dash-box-header">
              <i class="ph-bold ph-buildings" style="color:#F87171"></i> Il Club
            </div>
            <div class="dash-box-content custom-scrollbar">
              ${clubHtml}
            </div>
          </div>

          <!-- 6. ECOMMERCE & EXTRA (Sesto quadrato per completare la griglia) -->
          <div class="dash-box" data-route="ecommerce-orders" style="border-top-color: #F472B6;">
            <div class="dash-box-header">
              <i class="ph-bold ph-shopping-bag" style="color:#F472B6"></i> eCommerce & OutSeason
            </div>
            <div class="dash-box-content custom-scrollbar">
              ${ecommerceHtml}
            </div>
          </div>

        </div>

      </div>

      <style>
        .dash-matrix-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          /* Auto rows to make sure they all look like squares/rectangles of same height */
          grid-auto-rows: 400px;
        }

        @media (max-width: 1024px) {
          .dash-matrix-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .dash-matrix-grid { grid-template-columns: repeat(1, minmax(0, 1fr)); grid-auto-rows: 350px; }
        }

        .dash-box {
          background: rgba(20, 20, 25, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          border-top-width: 4px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        }

        .dash-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
          border-color: rgba(255,255,255,0.2);
        }

        .dash-box-header {
          padding: 20px;
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.2);
        }

        .dash-box-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        /* Scrollbar custom per i box */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      </style>
    `;

    // Routing delegation
    document.getElementById("dash-main-container")?.addEventListener("click", (e) => {
      const target = e.target.closest("[data-route]");
      if (target) {
        Router.navigate(target.dataset.route);
      }
    }, { signal: _abort.signal });
  }

  return {
    destroy() {
      _abort.abort();
      _abort = new AbortController();
    },
    async init() {
      const el = document.getElementById("app");
      if (!el) return;
      el.innerHTML = UI.skeletonPage();
      try {
        const data = await Store.get("matrixData", "dashboard").catch(
          () => null,
        );
        render(data);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("[Dashboard] init error", err);
        render(null);
      }
    },
  };
})();
window.Dashboard = Dashboard;
