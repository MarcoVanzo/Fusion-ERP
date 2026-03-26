"use strict";
const Dashboard = (() => {
  let _abort = new AbortController();
  function sig() {
    return { signal: _abort.signal };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function weekdayShort(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  }
  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  function alertColor(days) {
    if (days <= 7)
      return {
        bg: "rgba(255,59,48,0.12)",
        border: "#FF3B30",
        text: "#FF3B30",
        badge: "#FF3B30",
      };
    if (days <= 15)
      return {
        bg: "rgba(255,149,0,0.12)",
        border: "#FF9500",
        text: "#FF9500",
        badge: "#FF9500",
      };
    return {
      bg: "rgba(255,214,0,0.10)",
      border: "#FFD600",
      text: "#FFD600",
      badge: "#FFD600",
    };
  }
  function outcomeColor(outcome) {
    return outcome === "W"
      ? "#00E676"
      : outcome === "L"
        ? "#FF3B30"
        : "#FFD600";
  }
  function outcomeLabel(outcome) {
    return outcome === "W" ? "V" : outcome === "L" ? "P" : "D";
  }

  // ── Render KPI card ───────────────────────────────────────────────────────
  function kpiCard({ icon, label, value, color, route, sub }) {
    const nav = route
      ? `onclick="Router.navigate('${route}')" style="cursor:pointer;"`
      : "";
    return `
      <div class="dash-kpi-card" ${nav}>
        <div class="dash-kpi-icon" style="color:${color}">${icon}</div>
        <div class="dash-kpi-body">
          <div class="dash-kpi-val" style="color:${color}">${value}</div>
          <div class="dash-kpi-label">${label}</div>
          ${sub ? `<div class="dash-kpi-sub">${sub}</div>` : ""}
        </div>
      </div>`;
  }

  // ── Render: partite in arrivo ─────────────────────────────────────────────
  function renderMatches(matches) {
    if (!matches || matches.length === 0)
      return `
      <div class="dash-empty">
        <i class="ph ph-calendar-blank"></i>
        <span>Nessuna partita questa settimana</span>
      </div>`;
    return matches
      .map(
        (m) => `
      <div class="dash-match-row">
        <div class="dash-match-date">${weekdayShort(m.match_date)}</div>
        <div class="dash-match-teams">
          <span class="dash-match-home">${Utils.escapeHtml(m.home_team || "—")}</span>
          <span class="dash-match-vs">vs</span>
          <span class="dash-match-away">${Utils.escapeHtml(m.away_team || "—")}</span>
        </div>
        ${m.location ? `<div class="dash-match-loc"><i class="ph ph-map-pin"></i> ${Utils.escapeHtml(m.location)}</div>` : ""}
      </div>`,
      )
      .join("");
  }

  // ── Render: risultati settimana scorsa ────────────────────────────────────
  function renderResults(results) {
    if (!results || results.length === 0)
      return `
      <div class="dash-empty">
        <i class="ph ph-check-square-offset"></i>
        <span>Nessun risultato la settimana scorsa</span>
      </div>`;
    return results
      .map((r) => {
        const col = outcomeColor(r.outcome);
        const lbl = outcomeLabel(r.outcome);
        return `
        <div class="dash-result-row">
          <div class="dash-result-badge" style="background:${col}22;color:${col};border-color:${col}">${lbl}</div>
          <div class="dash-result-teams">
            <span>${Utils.escapeHtml(r.home_team || "—")}</span>
            <strong style="color:${col}">${r.home_score ?? "—"}–${r.away_score ?? "—"}</strong>
            <span>${Utils.escapeHtml(r.away_team || "—")}</span>
          </div>
          <div class="dash-result-date">${weekdayShort(r.match_date)}</div>
        </div>`;
      })
      .join("");
  }

  // ── Render: alert scadenze ────────────────────────────────────────────────
  function renderAlerts(alerts) {
    if (!alerts || alerts.length === 0)
      return `
      <div class="dash-empty" style="color:#00E676">
        <i class="ph ph-check-circle"></i>
        <span>Nessuna scadenza urgente 🎉</span>
      </div>`;
    return alerts
      .map((a) => {
        const c = alertColor(a.days_left);
        const when =
          a.days_left === 0
            ? "OGGI"
            : a.days_left === 1
              ? "domani"
              : `${a.days_left} giorni`;
        return `
        <div class="dash-alert-row" style="border-left-color:${c.border};background:${c.bg}">
          <i class="ph ph-${Utils.escapeHtml(a.icon)}" style="font-size:18px;color:${c.text};flex-shrink:0"></i>
          <div class="dash-alert-body">
            <div class="dash-alert-name">${Utils.escapeHtml(a.name)}</div>
            <div class="dash-alert-label">${Utils.escapeHtml(a.label)} · scade ${formatDate(a.expiry_date)}</div>
          </div>
          <div class="dash-alert-days" style="color:${c.badge}">${when}</div>
        </div>`;
      })
      .join("");
  }

  // ── Render full page ──────────────────────────────────────────────────────
  function render(data) {
    const el = document.getElementById("app");
    if (!el) return;

    const kpi = data?.kpi ?? {};
    const matches = data?.upcoming_matches ?? [];
    const results = data?.last_week_results ?? [];
    const alerts = data?.alerts ?? [];

    el.innerHTML = `
      <div class="dash-wrap">

        <div class="dash-header">
          <div>
            <h1 class="dash-title">Dashboard</h1>
            <p class="dash-subtitle">${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <!-- KPI Row -->
        <div class="dash-kpi-row">
          ${kpiCard({ icon: '<i class="ph-fill ph-users"></i>', label: "Atleti Attivi", value: kpi.total_athletes ?? "—", color: "#7C3AED", route: "athlete-profile" })}
          ${kpiCard({ icon: '<i class="ph-fill ph-users-four"></i>', label: "Squadre", value: kpi.total_teams ?? "—", color: "#2563EB", route: "squadre" })}
          ${kpiCard({ icon: '<i class="ph-fill ph-shopping-cart"></i>', label: "Ordini eCommerce", value: kpi.new_orders ?? 0, color: "#FF00FF", route: "ecommerce-orders", sub: "ultimi 7 giorni" })}
          ${kpiCard({ icon: '<i class="ph-fill ph-tent"></i>', label: "Iscritti OutSeason", value: kpi.new_outseason ?? 0, color: "#10B981", route: "outseason-camps", sub: "ultimi 7 giorni" })}
        </div>

        <!-- Main grid: 2 col on wide, 1 col on narrow -->
        <div class="dash-grid">

          <!-- Partite questa settimana -->
          <div class="dash-widget">
            <div class="dash-widget-header">
              <span class="dash-widget-title"><i class="ph-fill ph-calendar-check" style="color:#2563EB"></i> Partite questa settimana</span>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('results-matches')">Vedi tutte</button>
            </div>
            <div class="dash-widget-body">${renderMatches(matches)}</div>
          </div>

          <!-- Risultati settimana scorsa -->
          <div class="dash-widget">
            <div class="dash-widget-header">
              <span class="dash-widget-title"><i class="ph-fill ph-trophy" style="color:#FFD600"></i> Risultati settimana scorsa</span>
            </div>
            <div class="dash-widget-body">${renderResults(results)}</div>
          </div>

          <!-- Alert scadenze urgenti (full width) -->
          <div class="dash-widget dash-widget--full">
            <div class="dash-widget-header">
              <span class="dash-widget-title"><i class="ph-fill ph-warning-circle" style="color:#FF3B30"></i> Alert Scadenze</span>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('athlete-profile')">Vedi atleti</button>
            </div>
            <div class="dash-widget-body dash-alert-list">${renderAlerts(alerts)}</div>
          </div>

        </div>

      </div>

      <style>
        /* ── Dashboard layout ── */
        .dash-wrap { padding: 24px; max-width: 1200px; margin: 0 auto; }
        .dash-header { margin-bottom: 24px; }
        .dash-title  { font-size: 26px; font-weight: 800; margin: 0; }
        .dash-subtitle { font-size: 13px; color: var(--color-text-muted); margin: 4px 0 0; text-transform: capitalize; }

        /* KPI */
        .dash-kpi-row { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
        .dash-kpi-card {
          flex: 1; min-width: 160px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 20px 18px;
          display: flex; align-items: center; gap: 14px;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .dash-kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        .dash-kpi-icon { font-size: 28px; line-height: 1; }
        .dash-kpi-val  { font-size: 32px; font-weight: 900; line-height: 1; }
        .dash-kpi-label{ font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color:var(--color-text-muted); margin-top: 2px; }
        .dash-kpi-sub  { font-size: 11px; color: var(--color-text-muted); margin-top: 1px; }

        /* Grid */
        .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .dash-grid { grid-template-columns: 1fr; } }

        /* Widget */
        .dash-widget {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          overflow: hidden;
        }
        .dash-widget--full { grid-column: 1 / -1; }
        .dash-widget-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border-bottom: 1px solid var(--color-border);
        }
        .dash-widget-title { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .dash-widget-body  { padding: 12px 18px; }

        /* Match rows */
        .dash-match-row { display:flex; align-items:center; gap:12px; padding: 10px 0; border-bottom: 1px solid var(--color-border); }
        .dash-match-row:last-child { border-bottom: none; }
        .dash-match-date  { font-size:11px; color:var(--color-text-muted); white-space:nowrap; width:80px; }
        .dash-match-teams { flex:1; display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; }
        .dash-match-vs    { font-size:11px; color:var(--color-text-muted); font-weight:400; }
        .dash-match-loc   { font-size:11px; color:var(--color-text-muted); white-space:nowrap; display:flex; align-items:center; gap:4px; }

        /* Result rows */
        .dash-result-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom: 1px solid var(--color-border); }
        .dash-result-row:last-child { border-bottom: none; }
        .dash-result-badge { width:28px; height:28px; border-radius:8px; border:2px solid; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:900; flex-shrink:0; }
        .dash-result-teams { flex:1; display:flex; align-items:center; gap:10px; font-size:13px; }
        .dash-result-date  { font-size:11px; color:var(--color-text-muted); white-space:nowrap; }

        /* Alert rows */
        .dash-alert-list   { display:flex; flex-direction:column; gap:8px; }
        .dash-alert-row    { display:flex; align-items:center; gap:12px; padding:12px 14px; border-left:3px solid; border-radius:10px; }
        .dash-alert-body   { flex:1; }
        .dash-alert-name   { font-size:13px; font-weight:700; }
        .dash-alert-label  { font-size:11px; color:var(--color-text-muted); margin-top:2px; }
        .dash-alert-days   { font-size:12px; font-weight:800; white-space:nowrap; }

        /* Empty state */
        .dash-empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:28px 0; color:var(--color-text-muted); font-size:13px; }
        .dash-empty i { font-size:32px; }
      </style>
    `;
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
        const data = await Store.get("weeklyFull", "dashboard").catch(
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
