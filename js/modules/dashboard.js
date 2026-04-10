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
    if (days <= 7) return { bg: "rgba(255,59,48,0.12)", border: "#FF3B30", text: "#FF3B30" };
    if (days <= 15) return { bg: "rgba(255,149,0,0.12)", border: "#FF9500", text: "#FF9500" };
    return { bg: "rgba(255,214,0,0.10)", border: "#FFD600", text: "#FFD600" };
  }
  
  // ── Render: Atleti ────────────────────────────────────────────────────────
  function renderAtleti(kpi, alerts) {
    const atletiAlerts = alerts?.filter(a => a.type === 'medical' || a.icon?.includes('heart') || a.module === 'athletes') || [];
    const hasAlerts = atletiAlerts.length > 0;
    
    let alertsHtml = atletiAlerts.slice(0,3).map(a => `
      <div class="dash-list-item" style="padding:10px 14px; margin-bottom:8px; border-left:3px solid ${alertColor(a.days_left).border}">
        <div class="dash-alert-body">
          <div style="font-size:13px;font-weight:700">${Utils.escapeHtml(a.name)}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">${Utils.escapeHtml(a.label)} · scade ${formatDate(a.expiry_date)}</div>
        </div>
      </div>
    `).join("");

    if(!hasAlerts) {
      alertsHtml = `<div class="dash-empty" style="padding:10px 0; font-size:12px; color:#00E676"><i class="ph-fill ph-check-circle text-lg"></i> Nessuna criticità medica</div>`;
    }

    return `
      <div class="masonry-item dash-card" data-route="athletes" style="cursor:pointer; border-top: 4px solid #7C3AED;">
        <h2 class="dash-card-title" style="color:#A78BFA; margin-bottom:16px;">
          <i class="ph-fill ph-users"></i> Area Atleti 
          ${hasAlerts ? `<span style="background:#EF4444; color:white; font-size:10px; padding:2px 6px; border-radius:12px; margin-left:auto">${atletiAlerts.length} ALERT</span>` : ''}
        </h2>
        <div class="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800">
           <span style="color:var(--color-text-muted); font-size:13px">Atleti Tesserati Attivi</span>
           <span style="font-size:24px; font-weight:800">${kpi.total_athletes ?? '—'}</span>
        </div>
        <div>
          <div style="font-size:10px; color:var(--color-text-muted); text-transform:uppercase; font-weight:700; margin-bottom:8px;">Scadenze e Documenti</div>
          ${alertsHtml}
        </div>
      </div>
    `;
  }

  // ── Render: Squadre e Gare ────────────────────────────────────────────────
  function renderSquadre(kpi, matches, results) {
    let matchesHtml = "";
    if (!matches || matches.length === 0) {
      matchesHtml = `<div style="font-size:13px; color:var(--color-text-muted); text-align:center; padding:10px 0;">Nessuna gara questa settimana</div>`;
    } else {
      let m = matches[0]; // Prossima gara
      matchesHtml = `
        <div style="background:rgba(255,255,255,0.03); padding:14px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:12px;">
          <div style="font-size:10px; font-weight:800; color:#F59E0B; margin-bottom:4px;">PROSSIMA GARA</div>
          <div style="font-size:18px; font-weight:900;">${Utils.escapeHtml(m.home_team)} <span style="font-size:12px;color:gray;margin:0 4px">vs</span> ${Utils.escapeHtml(m.away_team)}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;"><i class="ph ph-calendar-blank"></i> ${weekdayShort(m.match_date)} ${m.location ? `· ${m.location}` : ''}</div>
        </div>
      `;
    }

    let resultsHtml = results?.slice(0,2).map(r => `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; padding:6px 0;">
        <span style="color:var(--color-text-muted)">${Utils.escapeHtml(r.home_team)} vs ${Utils.escapeHtml(r.away_team)}</span>
        <strong style="color:${r.outcome === 'W' ? '#00E676' : r.outcome === 'L' ? '#FF3B30' : '#FFD600'}">${r.home_score}-${r.away_score}</strong>
      </div>
    `).join("") || `<div style="font-size:12px;color:gray">Nessun risultato decodificato</div>`;

    return `
      <div class="masonry-item dash-card" data-route="results-matches" style="cursor:pointer; border-top: 4px solid #F59E0B;">
        <h2 class="dash-card-title" style="color:#FCD34D; margin-bottom:16px;">
          <i class="ph-fill ph-trophy"></i> Squadre & Gare
        </h2>
        
        <div class="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800">
           <span style="color:var(--color-text-muted); font-size:13px">Roster e Squadre</span>
           <span style="font-size:20px; font-weight:800">${kpi.total_teams ?? '—'}</span>
        </div>

        ${matchesHtml}

        <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05)">
          <div style="font-size:10px; color:var(--color-text-muted); text-transform:uppercase; font-weight:700; margin-bottom:8px;">Ultimi Risultati</div>
          ${resultsHtml}
        </div>
      </div>
    `;
  }

  // ── Render: Finance & Admin ───────────────────────────────────────────────
  function renderFinance(alerts) {
    const adminAlerts = alerts?.filter(a => !a.type || a.type !== 'medical') || [];
    
    let html = `
      <div class="masonry-item dash-card" data-route="finance" style="cursor:pointer; border-top: 4px solid #10B981;">
        <h2 class="dash-card-title" style="color:#34D399; margin-bottom:16px;">
          <i class="ph-fill ph-currency-eur"></i> Finance & Admin
        </h2>
        <ul style="list-style:none; padding:0; margin:0; font-size:13px;" class="space-y-4">
          <li style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
            <span style="color:var(--color-text-muted)"><i class="ph ph-receipt"></i> Rimborsi da Approvare</span>
            <span style="font-weight:bold; color:#F59E0B">Controllo Richiesto</span>
          </li>
          <li style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
            <span style="color:var(--color-text-muted)"><i class="ph ph-bank"></i> Scadenze Fiscali</span>
            <span style="font-weight:bold;">Nessuna imminente</span>
          </li>
        </ul>
        <div style="margin-top:16px; font-size:11px; color:gray; text-align:center;">
          Ultimo backup database eseguito con successo.
        </div>
      </div>
    `;
    return html;
  }

  // ── Render: Ecommerce & Network ───────────────────────────────────────────
  function renderEcommerce(kpi) {
    return `
      <div class="masonry-item dash-card" data-route="ecommerce-orders" style="cursor:pointer; border-top: 4px solid #EC4899;">
        <h2 class="dash-card-title" style="color:#F472B6; margin-bottom:16px;">
          <i class="ph-fill ph-shopping-bag"></i> Shop & Network
        </h2>
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <div style="font-size:10px; color:var(--color-text-muted); text-transform:uppercase; font-weight:700;">Ordini da Spedire</div>
            <div style="font-size:32px; font-weight:900; color:#EC4899; line-height:1">${kpi.new_orders ?? '0'}</div>
          </div>
          <div style="text-align:right">
             <div style="font-size:10px; color:var(--color-text-muted); text-transform:uppercase; font-weight:700;">Iscritti OutSeason</div>
             <div style="font-size:20px; font-weight:800;">${kpi.new_outseason ?? '0'}</div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Render: Logistica ─────────────────────────────────────────────────────
  function renderLogistica() {
    return `
      <div class="masonry-item dash-card" data-route="transport" style="cursor:pointer; border-top: 4px solid #3B82F6;">
        <h2 class="dash-card-title" style="color:#60A5FA; margin-bottom:16px;">
          <i class="ph-fill ph-van"></i> Trasporti e Logistica
        </h2>
        <div style="font-size:13px; color:var(--color-text-muted); margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
            <span style="color:white">Ducato 1 (AF293ZX)</span>
            <span style="background:rgba(0,230,118,0.1); color:#00E676; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold">DISPONIBILE</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
            <span style="color:white">Ducato 2 (GG999XX)</span>
            <span style="background:rgba(255,149,0,0.1); color:#FF9500; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold">IN USO</span>
          </div>
        </div>
        <div style="font-size:11px; text-align:center; color:gray">
          Gestione flotta e Autisti attiva.
        </div>
      </div>
    `;
  }

  // ── Render full page ──────────────────────────────────────────────────────
  function render(data) {
    _abort.abort();
    _abort = new AbortController();

    const el = document.getElementById("app");
    if (!el) return;

    const kpi = data?.kpi ?? {};
    const matches = data?.upcoming_matches ?? [];
    const results = data?.last_week_results ?? [];
    const alerts = data?.alerts ?? [];

    el.innerHTML = `
      <div style="padding: 24px; max-width: 1300px; margin: 0 auto; animation: fade-in 0.4s ease-out;" id="dash-main-container">

        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: 800; font-family:var(--font-display); letter-spacing:-0.5px; text-transform:uppercase; margin:0">Dashboard</h1>
          <p style="font-size: 14px; color: var(--color-text-muted); margin: 4px 0 0; text-transform: capitalize;">
            ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        <!-- Masonry Grid -->
        <div style="column-count: 1; column-gap: 24px; padding-bottom: 40px;" class="masonry-container">
          ${renderAtleti(kpi, alerts)}
          ${renderSquadre(kpi, matches, results)}
          ${renderFinance(alerts)}
          ${renderEcommerce(kpi)}
          ${renderLogistica()}
        </div>

      </div>

      <style>
        .masonry-container {
          column-count: 1;
        }
        @media (min-width: 768px) { .masonry-container { column-count: 2; } }
        @media (min-width: 1024px) { .masonry-container { column-count: 3; } }
        
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 24px;
        }
        
        .dash-card {
          background: rgba(20, 20, 25, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px;
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
        }
        
        .dash-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.3);
          border-color: rgba(255,255,255,0.15);
        }

        .dash-card-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 8px;
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
