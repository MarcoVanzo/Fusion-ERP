"use strict";

const Dashboard = (() => {
    let _abortController = new AbortController();

    function render(kpis = null, recentMatches = [], deadlines = []) {
        const container = document.getElementById("app");
        if (!container) return;

        // --- KPIs Data ---
        const weeklyTransports = kpis?.weekly_transports ?? 0;
        const newOrders = kpis?.new_orders ?? 0;
        const unreadWhatsapp = kpis?.unread_whatsapp ?? 0;
        const newOutseason = kpis?.new_outseason ?? 0;
        const pendingPayments = kpis?.pending_payments ?? 0;

        // --- Render Matches List ---
        let matchesHtml = "";
        if (recentMatches === null) {
            matchesHtml = `
        <div style="display:flex; flex-direction:column; gap:12px; padding:var(--sp-2);">
          <div class="skeleton" style="height:60px; border-radius:var(--radius-sm);"></div>
          <div class="skeleton" style="height:60px; border-radius:var(--radius-sm); opacity:0.6;"></div>
          <div class="skeleton" style="height:60px; border-radius:var(--radius-sm); opacity:0.3;"></div>
        </div>`;
        } else if (recentMatches.length > 0) {
            matchesHtml = recentMatches.map(m => {
                const isHome = (m.home || "").toLowerCase().includes("fusion");
                const opponent = isHome ? (m.away || "—") : (m.home || "—");
                const homeScore = m.sets_home ?? m.score_home ?? "—";
                const awayScore = m.sets_away ?? m.score_away ?? "—";
                const fusionScore = isHome ? homeScore : awayScore;
                const opponentScore = isHome ? awayScore : homeScore;

                let scoreColor = "var(--color-text-muted)";
                if (fusionScore !== "—" && opponentScore !== "—") {
                    if (fusionScore > opponentScore) scoreColor = "#00E676";
                    else if (fusionScore < opponentScore) scoreColor = "#FF3B30";
                    else scoreColor = "#FFD600";
                }

                return `
          <div class="fixture-card">
            <div class="team-logo" style="background:rgba(255,0,255,0.1);color:#FF00FF;"><i class="ph ph-volleyball" style="font-size:18px;"></i></div>
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:700;">Fusion Team vs ${Utils.escapeHtml(opponent)}</div>
              <div style="font-size:11px; color:var(--color-text-muted); margin-top:2px;">${Utils.escapeHtml(m.date || "")} ${m.time ? "• " + Utils.escapeHtml(m.time) : ""}</div>
            </div>
            <div style="font-size:18px; font-weight:800; color:${scoreColor};">${fusionScore}–${opponentScore}</div>
          </div>`;
            }).join("");
        } else {
            matchesHtml = `
        <div style="text-align:center; padding:var(--sp-4); color:var(--color-text-muted); font-size:13px;">
          <i class="ph ph-trophy" style="font-size:32px; display:block; margin-bottom:var(--sp-1);"></i>
          Nessuna partita questa settimana
        </div>`;
        }

        // --- Render Deadlines ---
        let deadlinesHtml = "";
        if (deadlines && deadlines.length > 0) {
            deadlinesHtml = `<div class="deadline-list">` + deadlines.map(d => {
                const priority = d.days_left <= 7 ? "urgent" : d.days_left <= 15 ? "warning" : "ok";
                const daysLabel = d.days_left === 0 ? "OGGI" : d.days_left === 1 ? "domani" : `${d.days_left} giorni`;
                const iconColor = priority === "urgent" ? "#FF3B30" : priority === "warning" ? "#FF9500" : "#FFD600";

                return `<div class="deadline-row ${priority}">
          <div class="deadline-icon" style="color:${iconColor};"><i class="ph ph-${Utils.escapeHtml(d.icon)}"></i></div>
          <div class="deadline-info">
            <div class="deadline-name">${Utils.escapeHtml(d.name)}</div>
            <div class="deadline-label">${Utils.escapeHtml(d.label)} • scade ${Utils.escapeHtml(d.expiry_date)}</div>
          </div>
          <div class="deadline-days ${priority}">${daysLabel}</div>
        </div>`;
            }).join("") + `</div>`;
        } else {
            deadlinesHtml = `<div style="text-align:center; padding:20px; color:var(--color-text-muted); font-size:13px;">
          <i class="ph ph-check-circle" style="font-size:32px; display:block; margin-bottom:8px; color:#00E676;"></i>
          Nessuna scadenza nei prossimi 60 giorni 🎉
        </div>`;
        }

        // --- Final HTML Build ---
        container.innerHTML = `
      <div class="dash-container">
        <!-- KPI ROW -->
        <div class="dash-kpi-row" style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
          
          <div class="kpi-item" onclick="Router.navigate('transport')" style="cursor: pointer; flex: 1; min-width: 140px;">
            <div class="kpi-header">TRASPORTI SETTIMANA <i class="ph-fill ph-bus"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val" style="color: ${weeklyTransports > 0 ? '#FFD600' : 'var(--color-text)'}">${weeklyTransports}</div>
              <div class="kpi-trend">in programma</div>
            </div>
          </div>
          
          <div class="kpi-item" onclick="Router.navigate('outseason')" style="cursor: pointer; flex: 1; min-width: 140px;">
            <div class="kpi-header">NUOVI OUT SEASON <i class="ph-fill ph-users"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val" style="color: ${newOutseason > 0 ? '#00E676' : 'var(--color-text)'}">${newOutseason}</div>
              <div class="kpi-trend">ultimi 7 gg</div>
            </div>
          </div>

          <div class="kpi-item" onclick="Router.navigate('ecommerce')" style="cursor: pointer; flex: 1; min-width: 140px;">
            <div class="kpi-header">NUOVI ORDINI ECOMMERCE <i class="ph-fill ph-shopping-cart"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val" style="color: ${newOrders > 0 ? '#FF00FF' : 'var(--color-text)'}">${newOrders}</div>
              <div class="kpi-trend">ultimi 7 gg</div>
            </div>
          </div>

          <div class="kpi-item" onclick="Router.navigate('finance')" style="cursor: pointer; flex: 1; min-width: 140px;">
            <div class="kpi-header">PAGAMENTI IN SOSPESO <i class="ph-fill ph-credit-card"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val" style="color: ${pendingPayments > 0 ? '#FF3B30' : 'var(--color-text)'}">${pendingPayments}</div>
              <div class="kpi-trend">da saldare</div>
            </div>
          </div>

          <div class="kpi-item" onclick="Router.navigate('whatsapp-inbox')" style="cursor: pointer; flex: 1; min-width: 140px;">
            <div class="kpi-header">MESSAGGI WA <i class="ph-fill ph-whatsapp-logo"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val" style="color: ${unreadWhatsapp > 0 ? '#00E676' : 'var(--color-text)'}">${unreadWhatsapp}</div>
              <div class="kpi-trend">da leggere</div>
            </div>
          </div>

        </div>

        <!-- MAIN GRID -->
        <div class="dash-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">

          <!-- WIDGET: WEEKLY RESULTS -->
          <div class="widget w-events" style="grid-column: 1;">
            <div class="widget-header">
              <div class="widget-title">Risultati della Settimana</div>
              <i class="ph ph-trophy" style="color:var(--color-pink);"></i>
            </div>
            ${matchesHtml}
          </div>

          <!-- WIDGET: DEADLINES -->
          <div class="widget w-deadlines" style="grid-column: 2;">
            <div class="widget-header">
              <div class="widget-title" style="display:flex;align-items:center;gap:8px;">
                <i class="ph-fill ph-clock-countdown" style="color:var(--color-warning);"></i> Scadenze Imminenti
              </div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('federation')">Vedi tutte</button>
            </div>
            ${deadlinesHtml}
          </div>

        </div> <!-- END MAIN GRID -->
      </div>
    `;
    }

    return {
        destroy: function () {
            _abortController.abort();
            _abortController = new AbortController();
        },

        init: async function () {
            const container = document.getElementById("app");
            if (!container) return;

            const mainContent = document.getElementById("main-content");
            if (mainContent) {
                mainContent.style.padding = "0";
                mainContent.style.backgroundColor = "#0a0a0c";
            }

            container.innerHTML = UI.skeletonPage();

            try {
                const [kpis, deadlines] = await Promise.all([
                    Store.get("weeklyKpis", "dashboard").catch(e => {
                        console.error("[Dashboard] Error fetching weeklyKpis", e);
                        return null;
                    }),
                    Store.get("deadlines", "dashboard").catch(e => {
                        console.error("[Dashboard] Error fetching deadlines", e);
                        return [];
                    })
                ]);

                // Initial render with placeholders for matches
                render(kpis, null, deadlines);

                // Fetch matches separately to avoid blocking initial render
                try {
                    const res = await Store.get("recentResults", "results", { limit: 8 }).catch(e => {
                        console.warn("[Dashboard] recentResults error:", e);
                        return null;
                    });
                    const matches = res?.matches || [];
                    render(kpis, matches, deadlines);
                } catch (matchErr) {
                    if (matchErr.name === "AbortError") return;
                    console.warn("[Dashboard] fetchResults error:", matchErr);
                    render(kpis, [], deadlines);
                }

            } catch (err) {
                console.error("[Dashboard] Init error:", err);
                render(null, [], []);
            }
        }
    };
})();

window.Dashboard = Dashboard;