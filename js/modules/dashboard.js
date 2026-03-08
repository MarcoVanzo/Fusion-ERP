/**
 * Dashboard Module — Real Data from Fusion ERP API
 * Fusion ERP v1.0
 */

'use strict';

const Dashboard = (() => {
  let _ac = new AbortController();

  async function init() {
    const app = document.getElementById('app');
    if (!app) return;

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.padding = '0';
      mainContent.style.backgroundColor = '#0a0a0c';
    }

    app.innerHTML = UI.skeletonPage();

    try {
      // PHASE 1: Dati leggeri in parallelo
      // NOTA: athletes/list è stata RIMOSSA — caricava tutti i record atleta solo per conteggi.
      // I KPI vengono ora da dashboard/summary (unica query aggregata sul server).
      const [summary, teams, events, deadlines] = await Promise.all([
        Store.get('summary', 'dashboard').catch(() => null),
        Store.get('teams', 'athletes').catch(() => []),
        Store.get('listEvents', 'transport').catch(() => []),
        Store.get('deadlines', 'dashboard').catch(() => []),
      ]);

      // Initial render with placeholder for results
      render(summary, teams, events, deadlines, null);

      // PHASE 2: Risultati partite (async, non bloccante)
      fetchResults(summary, teams, events, deadlines);

    } catch (err) {
      console.error('[Dashboard] Init error:', err);
      render(null, [], [], [], []);
    }
  }

  async function fetchResults(summary, teams, events, deadlines) {
    try {
      // PERF: single API call → 1 SQL query across all championships
      // Rimpiazza il vecchio pattern N+1: getCampionati → N×getResults
      const payload = await Store.get('recentResults', 'results', { limit: 8 }).catch((e) => {
        console.warn('[Dashboard] recentResults error:', e);
        return null;
      });

      const weekResults = payload?.matches || [];
      console.log('[Dashboard] recentResults:', weekResults.length, 'match');

      render(summary, teams, events, deadlines, weekResults);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('[Dashboard] fetchResults error:', err);
      render(summary, teams, events, deadlines, []);
    }
  }

  function render(summary = null, teams = [], events = [], deadlines = [], weekResults = []) {
    const app = document.getElementById('app');

    // KPI da summary (endpoint aggregato leggero) — fallback a 0 se non disponibile
    const totalAthletes = summary?.total_athletes ?? 0;
    const totalTeams = summary?.total_teams ?? teams.length;
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).length;

    // Percentuali completezza dal server (pre-calcolate)
    const pctRole = summary?.pct_role ?? 0;
    const pctPhone = summary?.pct_phone ?? 0;
    const pctEmail = summary?.pct_email ?? 0;
    const pctFiscal = summary?.pct_fiscal ?? 0;
    const pctMedCert = summary?.pct_med_cert ?? 0;
    const pctAddress = summary?.pct_address ?? 0;
    const pctCity = summary?.pct_city ?? 0;
    const pctParent = summary?.pct_parent ?? 0;
    const pctParentPh = summary?.pct_parent_ph ?? 0;
    const pctAvg = summary?.pct_avg ?? 0;

    // Athletes per team from teams endpoint (already has player counts)
    const athletesByTeam = {};
    teams.forEach(t => {
      const key = t.name || t.category || 'Squadra';
      athletesByTeam[key] = t.athlete_count ?? 0;
    });

    // Upcoming events (next 5)
    const upcoming = events
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    // Team bars HTML

    const maxTeamCount = Math.max(...Object.values(athletesByTeam), 1);
    const teamBarsHtml = Object.entries(athletesByTeam).map(([name, count]) => {
      const pct2 = Math.round((count / maxTeamCount) * 100);
      return `<div class="bar-row">
        <div>${Utils.escapeHtml(name)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct2}%; background:#FF00FF; box-shadow:0 0 10px rgba(255,0,255,0.6);"></div></div>
        <div style="text-align:right;">${count}</div>
      </div>`;
    }).join('');

    // Weekly results HTML
    let weekResultsHtml = '';
    if (weekResults === null) {
      // Loading state
      weekResultsHtml = `
        <div style="display:flex; flex-direction:column; gap:12px; padding:var(--sp-2);">
          <div class="skeleton" style="height:60px; border-radius:var(--radius-sm);"></div>
          <div class="skeleton" style="height:60px; border-radius:var(--radius-sm); opacity:0.6;"></div>
          <div class="skeleton" style="height:60px; border-radius:var(--radius-sm); opacity:0.3;"></div>
        </div>`;
    } else if (weekResults.length > 0) {
      weekResultsHtml = weekResults.map(m => {
        const isHome = (m.home || '').toLowerCase().includes('fusion');
        const opponent = isHome ? (m.away || '—') : (m.home || '—');
        const scoreHome = m.sets_home ?? m.score_home ?? '—';
        const scoreAway = m.sets_away ?? m.score_away ?? '—';
        const fusionScore = isHome ? scoreHome : scoreAway;
        const oppScore = isHome ? scoreAway : scoreHome;
        const won = fusionScore > oppScore && fusionScore !== '—';
        const scoreColor = (fusionScore !== '—' && oppScore !== '—') ? (fusionScore > oppScore ? '#00E676' : fusionScore < oppScore ? '#FF3B30' : '#FFD600') : 'var(--color-text-muted)';
        return `
          <div class="fixture-card">
            <div class="team-logo" style="background:rgba(255,0,255,0.1);color:#FF00FF;"><i class="ph ph-volleyball" style="font-size:18px;"></i></div>
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:700;">Fusion Team vs ${Utils.escapeHtml(opponent)}</div>
              <div style="font-size:11px; color:var(--color-text-muted); margin-top:2px;">${Utils.escapeHtml(m.date || '')} ${m.time ? '• ' + Utils.escapeHtml(m.time) : ''}</div>
            </div>
            <div style="font-size:18px; font-weight:800; color:${scoreColor};">${fusionScore}–${oppScore}</div>
          </div>`;
      }).join('');
    } else {
      weekResultsHtml = `
        <div style="text-align:center; padding:var(--sp-4); color:var(--color-text-muted); font-size:13px;">
          <i class="ph ph-trophy" style="font-size:32px; display:block; margin-bottom:var(--sp-1);"></i>
          Nessuna partita questa settimana
        </div>`;
    }

    // Completeness bars
    const completenessItems = [
      { label: 'Ruolo', pct: pctRole },
      { label: 'Cellulare', pct: pctPhone },
      { label: 'Email', pct: pctEmail },
      { label: 'Codice Fiscale', pct: pctFiscal },
      { label: 'Cert. Medico', pct: pctMedCert },
      { label: 'Indirizzo', pct: pctAddress },
      { label: 'Città', pct: pctCity },
      { label: 'Contatto Gen.', pct: pctParent },
      { label: 'Tel. Genitore', pct: pctParentPh },
    ];

    const barColor = (v) => v >= 80 ? '#00E676' : v >= 50 ? '#FFD600' : '#FF3B30';

    const completenessHtml = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <span style="font-size:12px; color:var(--color-text-muted);">Media globale</span>
        <span style="font-size:20px; font-weight:800; color:${barColor(pctAvg)};">${pctAvg}%</span>
      </div>
      ${completenessItems.map(item => `
      <div class="bar-row">
        <div>${item.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${item.pct}%; background:${barColor(item.pct)};"></div></div>
        <div style="text-align:right;">${item.pct}%</div>
      </div>
    `).join('')}`;

    app.innerHTML = `
      <!-- PERF: gli stili .dash-* sono ora in css/style_v2.css (cachati dal browser) -->

      <div class="dash-container">

        <!-- KPI ROW -->
        <div class="dash-kpi-row">
          <div class="kpi-item">
            <div class="kpi-header">ATLETI ATTIVI <i class="ph-fill ph-users"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val">${totalAthletes}</div>
              <div class="kpi-trend">registrati</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-header">SQUADRE <i class="ph-fill ph-users-three"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val">${totalTeams}</div>
              <div class="kpi-trend">categorie</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-header">EVENTI TRASPORTI <i class="ph-fill ph-bus"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val">${totalEvents}</div>
              <div class="kpi-trend">${upcomingEvents} in programma</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-header">DATI COMPLETI <i class="ph-fill ph-check-circle"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val">${pctRole}%</div>
              <div class="kpi-trend">ruoli assegnati</div>
            </div>
          </div>
        </div>

        <!-- MAIN GRID -->
        <div class="dash-grid">

          <!-- WIDGET 1: ATHLETES PER TEAM -->
          <div class="widget w-team-dist">
            <div class="widget-header">
              <div class="widget-title">Atleti per Squadra</div>
            </div>
            ${teamBarsHtml || '<div style="color:var(--color-text-muted); font-size:13px;">Nessuna squadra configurata</div>'}
          </div>

          <!-- WIDGET 2: WEEKLY RESULTS -->
          <div class="widget w-events">
            <div class="widget-header">
              <div class="widget-title">Risultati Precedenti</div>
              <i class="ph ph-trophy" style="color:var(--color-pink);"></i>
            </div>
            ${weekResultsHtml}
          </div>

          <!-- WIDGET 3: DATA COMPLETENESS -->
          <div class="widget w-completeness">
            <div class="widget-header">
              <div class="widget-title">Stato Compilazione</div>
            </div>
            <div style="font-size:12px; color:var(--color-text-muted); margin-bottom:16px;">Completezza dati anagrafici</div>
            ${completenessHtml}
          </div>

          <!-- WIDGET 4: DEADLINES -->
          <div class="widget w-deadlines">
            <div class="widget-header">
              <div class="widget-title" style="display:flex;align-items:center;gap:8px;"><i class="ph-fill ph-clock-countdown" style="color:var(--color-warning);"></i> Scadenze Imminenti</div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('federation')">Vedi tutte</button>
            </div>
            ${_renderDeadlines(deadlines)}
          </div>

          <!-- WIDGET 5: QUICK LINKS -->
          <div class="widget w-quick-links">
            <div class="widget-header">
              <div class="widget-title">Accesso Rapido</div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:var(--sp-2);">
              <div class="quick-link" onclick="Router.navigate('athletes')">
                <i class="ph ph-user"></i>
                <span>Atleti</span>
              </div>
              <div class="quick-link" onclick="Router.navigate('transport')">
                <i class="ph ph-bus"></i>
                <span>Trasporti</span>
              </div>
              <div class="quick-link" onclick="Router.navigate('finance')">
                <i class="ph ph-calculator"></i>
                <span>Contabilità</span>
              </div>
              <div class="quick-link" onclick="Router.navigate('compliance')">
                <i class="ph ph-shield-check"></i>
                <span>Compliance</span>
              </div>
              <div class="quick-link" onclick="Router.navigate('tasks')">
                <i class="ph ph-check-square"></i>
                <span>Task</span>
              </div>
              <div class="quick-link" id="vald-quick-link">
                <i class="ph-fill ph-lightning" style="color:var(--color-pink);"></i>
                <span>VALD Perf.</span>
              </div>
              <div class="quick-link" onclick="Router.navigate('social')">
                <i class="ph ph-share-network"></i>
                <span>Social</span>
              </div>
            </div>
          </div>

        </div> <!-- END MAIN GRID -->
      </div>
    `;

    // Add event listener for VALD quick link
    document.getElementById('vald-quick-link')?.addEventListener('click', () => {
      const lastId = sessionStorage.getItem('last_athlete_id');
      if (lastId) {
        Router.navigate('athlete-metrics', { id: lastId });
      } else {
        Router.navigate('athletes');
        UI.toast('Seleziona un atleta per vedere i dati VALD', 'info');
      }
    });
  }

  function _renderDeadlines(items) {
    if (!items || items.length === 0) {
      return `<div style="text-align:center; padding:20px; color:var(--color-text-muted); font-size:13px;">
          <i class="ph ph-check-circle" style="font-size:32px; display:block; margin-bottom:8px; color:#00E676;"></i>
          Nessuna scadenza nei prossimi 60 giorni 🎉
        </div>`;
    }
    return `<div class="deadline-list">${items.map(d => {
      const urgency = d.days_left <= 7 ? 'urgent' : d.days_left <= 15 ? 'warning' : 'ok';
      const daysText = d.days_left === 0 ? 'OGGI' : d.days_left === 1 ? 'domani' : `${d.days_left} giorni`;
      const iconColor = urgency === 'urgent' ? '#FF3B30' : urgency === 'warning' ? '#FF9500' : '#FFD600';
      return `<div class="deadline-row ${urgency}">
          <div class="deadline-icon" style="color:${iconColor};"><i class="ph ph-${Utils.escapeHtml(d.icon)}"></i></div>
          <div class="deadline-info">
            <div class="deadline-name">${Utils.escapeHtml(d.name)}</div>
            <div class="deadline-label">${Utils.escapeHtml(d.label)} • scade ${Utils.escapeHtml(d.expiry_date)}</div>
          </div>
          <div class="deadline-days ${urgency}">${daysText}</div>
        </div>`;
    }).join('')}</div>`;
  }

  function destroy() {
    _ac.abort();
    _ac = new AbortController();
  }

  return { destroy, init };
})();
window.Dashboard = Dashboard;

