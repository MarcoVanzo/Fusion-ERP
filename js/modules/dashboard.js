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
      const [teams, athletes, events, deadlines] = await Promise.all([
        Store.get('teams', 'athletes').catch(() => []),
        Store.get('list', 'athletes').catch(() => []),
        Store.get('listEvents', 'transport').catch(() => []),
        Store.get('deadlines', 'dashboard').catch(() => []),
      ]);
      render(athletes, teams, events, deadlines);
    } catch {
      render([], [], [], []);
    }
  }

  function render(athletes = [], teams = [], events = [], deadlines = []) {
    const app = document.getElementById('app');

    // Calculate real KPIs
    const totalAthletes = athletes.length;
    const totalTeams = teams.length;
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).length;

    // Calculate athletes per team
    const athletesByTeam = {};
    teams.forEach(t => { athletesByTeam[t.name || t.category] = 0; });
    athletes.forEach(a => {
      const key = a.team_name || a.category || 'Senza squadra';
      athletesByTeam[key] = (athletesByTeam[key] || 0) + 1;
    });

    // Calculate data completeness
    const withRole = athletes.filter(a => a.role).length;
    const withPhone = athletes.filter(a => a.phone).length;
    const withEmail = athletes.filter(a => a.email).length;
    const withFiscalCode = athletes.filter(a => a.fiscal_code).length;
    const withMedCert = athletes.filter(a => a.medical_cert_expires_at).length;
    const withAddress = athletes.filter(a => a.residence_address).length;
    const withCity = athletes.filter(a => a.residence_city).length;
    const withParent = athletes.filter(a => a.parent_contact).length;
    const withParentPh = athletes.filter(a => a.parent_phone).length;

    const pct = (n) => totalAthletes ? Math.round((n / totalAthletes) * 100) : 0;

    const pctRole = pct(withRole);
    const pctPhone = pct(withPhone);
    const pctEmail = pct(withEmail);
    const pctFiscal = pct(withFiscalCode);
    const pctMedCert = pct(withMedCert);
    const pctAddress = pct(withAddress);
    const pctCity = pct(withCity);
    const pctParent = pct(withParent);
    const pctParentPh = pct(withParentPh);

    // Overall completeness average
    const allPcts = [pctRole, pctPhone, pctEmail, pctFiscal, pctMedCert, pctAddress, pctCity, pctParent, pctParentPh];
    const pctAvg = Math.round(allPcts.reduce((s, v) => s + v, 0) / allPcts.length);

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

    // Upcoming events HTML
    const eventsHtml = upcoming.length > 0
      ? upcoming.map(e => `
        <div class="fixture-card">
          <div class="team-logo" style="color:#FF00FF; text-shadow: 0 0 8px rgba(255, 0, 255, 0.5);"><i class="ph ph-bus" style="font-size:18px;"></i></div>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:700;">${Utils.escapeHtml(e.title || e.opponent || 'Evento')}</div>
            <div style="font-size:11px; color:var(--color-text-muted); margin-top:2px;">${Utils.escapeHtml(e.date || '')} ${e.time ? '• ' + Utils.escapeHtml(e.time) : ''}</div>
          </div>
          <div style="font-size:11px; color:var(--color-text-muted);">${Utils.escapeHtml(e.type || '')}</div>
        </div>`).join('')
      : `<div style="text-align:center; padding:var(--sp-4); color:var(--color-text-muted); font-size:13px;">
          <i class="ph ph-calendar-blank" style="font-size:32px; display:block; margin-bottom:var(--sp-1);"></i>
          Nessun evento in programma
          <div style="margin-top:var(--sp-2);"><button class="btn btn-ghost btn-sm" onclick="Router.navigate('transport')">Crea evento</button></div>
        </div>`;

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
      <style>
        .dash-container {
          padding: 32px;
          color: var(--color-text);
          background: transparent;
          min-height: 100%;
          font-family: var(--font-body), sans-serif;
        }

        /* KPI Row */
        .dash-kpi-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          border-bottom: 1px solid #1c1c1e;
          padding-bottom: 24px;
        }

        .kpi-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 24px;
          border-right: 1px solid #1c1c1e;
        }
        .kpi-item:last-child {
          border-right: none;
          padding-right: 0;
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          color: var(--color-text-muted);
        }

        .kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .kpi-val {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 42px;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .kpi-trend {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
        }

        /* Main Grid */
        .dash-grid {
          display: grid;
          grid-template-columns: 1.6fr 1.2fr 1.2fr;
          grid-auto-rows: min-content;
          gap: 20px;
        }

        .widget {
          background: var(--color-bg-card);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-base);
        }
        .widget:hover {
          border-color: rgba(255, 0, 255, 0.4);
          box-shadow: var(--shadow-lg), var(--glow-card-hover);
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .widget-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* Grid placement */
        .w-team-dist { grid-column: 1 / 2; grid-row: 1 / 2; }
        .w-events { grid-column: 2 / 3; grid-row: 1 / 2; }
        .w-completeness { grid-column: 3 / 4; grid-row: 1 / 2; }
        .w-deadlines { grid-column: 1 / 4; grid-row: 2 / 3; }
        .w-quick-links { grid-column: 1 / 4; grid-row: 3 / 4; }

        /* Deadlines widget */
        .deadline-list { display: flex; flex-direction: column; gap: 2px; }
        .deadline-row {
          display: flex; align-items: center; gap: 14px;
          padding: 10px 14px; border-radius: 6px;
          transition: all var(--transition-base);
        }
        .deadline-row:hover { background: rgba(255, 255, 255, 0.05); }
        .deadline-row.urgent { border-left: 3px solid #FF3B30; }
        .deadline-row.warning { border-left: 3px solid #FF9500; }
        .deadline-row.ok { border-left: 3px solid #FFD600; }
        .deadline-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .deadline-info { flex: 1; min-width: 0; }
        .deadline-name { font-size: 14px; font-weight: 600; }
        .deadline-label { font-size: 12px; color: var(--color-text-muted); }
        .deadline-days { font-size: 13px; font-weight: 700; text-align: right; min-width: 70px; }
        .deadline-days.urgent { color: #FF3B30; }
        .deadline-days.warning { color: #FF9500; }
        .deadline-days.ok { color: #FFD600; }

        /* Bar Chart */
        .bar-row { display: grid; grid-template-columns: 120px 1fr 40px; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 13px; font-weight: 600; }
        .bar-track { background: #1c1c1e; height: 8px; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }

        /* Fixture Cards */
        .fixture-card { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--color-border); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: all var(--transition-base); }
        .fixture-card:hover { border-color: rgba(255, 0, 255, 0.3); box-shadow: var(--shadow-md), inset 0 0 10px rgba(255, 0, 255, 0.1); }
        .fixture-card:last-child { margin-bottom: 0; }
        .team-logo { width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: white; }

        /* Quick Link Card */
        .quick-link { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: var(--sp-3); background: rgba(255, 255, 255, 0.03); border: 1px solid var(--color-border); border-radius: var(--radius); cursor: pointer; transition: all var(--transition-base); text-align: center; }
        .quick-link:hover { background: rgba(255, 0, 255, 0.05); transform: translateY(-2px); border-color: rgba(255, 0, 255, 0.4); box-shadow: var(--shadow-md), var(--glow-card-hover); }
        .quick-link i { font-size: 28px; color: var(--color-pink); text-shadow: 0 0 8px rgba(255,0,255,0.4); }
        .quick-link span { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        /* Responsive */
        @media (max-width: 960px) {
          .dash-grid { grid-template-columns: 1fr !important; }
          .w-team-dist, .w-events, .w-completeness { grid-column: auto; grid-row: auto; }
          .w-quick-links { grid-column: auto; grid-row: auto; }
        }
        @media (max-width: 768px) {
          .dash-container { padding: 16px; }
          .dash-kpi-row { flex-wrap: wrap; gap: 16px; }
          .kpi-item { flex: 0 0 calc(50% - 8px); border-right: none !important; padding-right: 0 !important; }
          .kpi-val { font-size: 32px; }
        }
        @media (max-width: 480px) {
          .kpi-item { flex: 0 0 100%; }
        }
      </style>

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

          <!-- WIDGET 2: UPCOMING EVENTS -->
          <div class="widget w-events">
            <div class="widget-header">
              <div class="widget-title">Prossimi Eventi</div>
            </div>
            ${eventsHtml}
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
              <div class="widget-title">⏰ Scadenze Imminenti</div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('compliance')">Vedi tutte</button>
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
              <div class="quick-link" onclick="Router.navigate('social')">
                <i class="ph ph-share-network"></i>
                <span>Social</span>
              </div>
            </div>
          </div>

        </div> <!-- END MAIN GRID -->
      </div>
    `;
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
