/**
 * Transport Module — Events, Carpooling, Routes, Reimbursements
 * Fusion ERP v1.0
 */

'use strict';

const Transport = (() => {
  let _ac = new AbortController();

  let _events = [];
  let _currentEvent = null;

  // Nuovo Trasporto state
  let _gyms = [];
  let _teams = [];
  let _athletes = [];
  let _selectedGym = null;
  let _selectedTeam = null;
  let _selectedAthletes = [];
  let _currentTransportResult = null;
  let _verifiedCoords = new Map(); // address string → {lat, lng} verificato via Google Places

  const GEMINI_API_KEY = 'AIzaSyAGqiwUIpK7fe9vYsQbxNMIPvARWuFW5Lc';
  const GEMINI_MODEL = 'gemini-2.5-flash';

  async function init() {
    const app = document.getElementById('app');
    if (!app) return;

    UI.loading(true);
    app.innerHTML = UI.skeletonPage();

    try {
      _events = await Store.get('listEvents', 'transport');
      renderEventList();
    } catch (err) {
      app.innerHTML = Utils.emptyState('Errore nel caricamento eventi', err.message);
      UI.toast('Errore caricamento eventi', 'error');
    } finally {
      UI.loading(false);
    }
  }

  // ─── EVENT LIST ───────────────────────────────────────────────────────────
  function renderEventList() {
    const app = document.getElementById('app');
    const user = App.getUser();
    const canCreate = ['admin', 'manager', 'operator'].includes(user?.role);

    const typeLabels = { training: 'Allenamento', away_game: 'Trasferta', home_game: 'Gara Casa', tournament: 'Torneo' };

    const totalEvents = _events.length;
    const futureEvents = _events.filter(e => new Date(e.event_date) >= new Date()).length;
    const awayGames = _events.filter(e => e.type === 'away_game').length;

    const styles = `
      <style>
        .transport-dashboard {
          padding: 24px;
          --dash-bg: #030305;
          --card-bg: rgba(255, 255, 255, 0.03);
          --card-border: rgba(255, 255, 255, 0.08);
          --card-radius: 20px;
          --accent-cyan: #00e5ff;
          --accent-pink: #E6007E;
          --glass-bg: rgba(20, 20, 25, 0.6);
          --glass-blur: blur(16px);
          --shadow-soft: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          --shadow-glow-pink: 0 0 20px rgba(230,0,126,0.2);
          --shadow-glow-cyan: 0 0 20px rgba(0,229,255,0.2);
          animation: fade-in 0.5s ease-out;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(230,0,126,0.4); }
          70% { box-shadow: 0 0 0 10px rgba(230,0,126,0); }
          100% { box-shadow: 0 0 0 0 rgba(230,0,126,0); }
        }

        .dash-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        .dash-title { 
          font-family: var(--font-display); font-size: 32px; font-weight: 800; text-transform: uppercase; margin: 0; line-height: 1.1; 
          background: linear-gradient(90deg, #fff, rgba(255,255,255,0.6)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .dash-subtitle { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 6px; font-weight: 500; }

        .dash-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 40px; perspective: 1000px; }
        .dash-stat-card {
          background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--card-border); border-radius: var(--card-radius);
          padding: 24px; position: relative; overflow: hidden; box-shadow: var(--shadow-soft);
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;
        }
        .dash-stat-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 16px 40px rgba(0,0,0,0.4), var(--shadow-glow-pink); border-color: rgba(255,255,255,0.2); z-index: 2; }
        .dash-stat-card::before {
          content: ''; position: absolute; top:0; left:0; width: 100%; height: 3px;
          background: linear-gradient(90deg, var(--accent-pink), transparent); opacity: 0.9;
        }
        .dash-stat-card.cyan::before { background: linear-gradient(90deg, var(--accent-cyan), transparent); }
        .dash-stat-card.cyan:hover { box-shadow: 0 16px 40px rgba(0,0,0,0.4), var(--shadow-glow-cyan); }
        
        .dash-stat-card::after {
          content: ''; position: absolute; bottom: -50px; right: -50px; width: 100px; height: 100px;
          background: var(--accent-pink); filter: blur(60px); opacity: 0.15; border-radius: 50%;
        }
        .dash-stat-card.cyan::after { background: var(--accent-cyan); }

        .dash-stat-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px; display: flex; justify-content: space-between; align-items: center; }
        .dash-stat-icon { font-size: 20px; color: rgba(255,255,255,0.4); padding: 8px; background: rgba(255,255,255,0.03); border-radius: 12px; }
        .dash-stat-value { font-family: var(--font-display); font-size: 42px; font-weight: 800; margin-top: 16px; line-height: 1; display: flex; align-items: baseline; gap: 12px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        .dash-stat-trend { font-size: 14px; font-weight: 700; padding: 4px 10px; border-radius: 20px; background: rgba(0,230,118,0.1); color: #00E676; letter-spacing: 0; }
        
        .dash-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 28px; }
        @media(max-width: 960px) { .dash-grid { grid-template-columns: 1fr; } }
        
        .dash-card { background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--card-radius); padding: 28px; box-shadow: var(--shadow-soft); transition: border-color 0.3s; }
        .dash-card:hover { border-color: rgba(255,255,255,0.12); }
        .dash-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 16px; }
        .dash-card-title { font-family: var(--font-display); font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 10px; }
        .dash-card-title::before { content: ''; display: inline-block; width: 4px; height: 18px; background: var(--accent-cyan); border-radius: 4px; }
        .dash-card-dots { color: rgba(255,255,255,0.4); letter-spacing: 2px; font-weight: bold; cursor: pointer; transition: color 0.2s; padding: 4px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); }
        .dash-card-dots:hover { color: #fff; background: rgba(255,255,255,0.1); }
        
        .dash-filters { display: flex; gap: 10px; margin-bottom: 28px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
        .dash-filters::-webkit-scrollbar { display: none; }
        .dash-filter {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 30px;
          padding: 8px 20px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7); cursor: pointer;
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); white-space: nowrap; backdrop-filter: blur(8px);
        }
        .dash-filter:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); color: #fff; }
        .dash-filter.active { 
          background: linear-gradient(135deg, rgba(230,0,126,0.15), rgba(0,229,255,0.15)); 
          color: #fff; border-color: rgba(255,255,255,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
        }

        .dash-date-header { font-size: 13px; color: var(--accent-cyan); text-transform: uppercase; font-weight: 700; margin: 32px 0 16px; letter-spacing: 1.5px; display: flex; align-items: center; gap: 12px; }
        .dash-date-header::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(0,229,255,0.3), transparent); }
        
        .dash-fixture {
          background: linear-gradient(145deg, rgba(25,25,30,0.6), rgba(15,15,20,0.8)); 
          border: 1px solid rgba(255,255,255,0.04); border-radius: 16px;
          padding: 18px 20px; display: flex; align-items: center; gap: 20px; margin-bottom: 16px; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative; overflow: hidden;
        }
        .dash-fixture::before {
          content: ''; position: absolute; top:0; left:0; width: 4px; height: 100%; background: transparent; transition: background 0.3s;
        }
        .dash-fixture:hover { 
          background: linear-gradient(145deg, rgba(35,35,42,0.8), rgba(20,20,25,0.9));
          transform: translateY(-4px) scale(1.01); border-color: rgba(255,255,255,0.15); box-shadow: 0 12px 30px rgba(0,0,0,0.4); 
        }
        .dash-fixture:hover.pink-line::before { background: var(--accent-pink); box-shadow: 0 0 15px var(--accent-pink); }
        .dash-fixture:hover.cyan-line::before { background: var(--accent-cyan); box-shadow: 0 0 15px var(--accent-cyan); }
        .dash-fixture:hover.yellow-line::before { background: #FFD600; box-shadow: 0 0 15px #FFD600; }
        .dash-fixture:hover.green-line::before { background: #00E676; box-shadow: 0 0 15px #00E676; }

        .fixture-icon {
          width: 52px; height: 52px; border-radius: 14px; background: rgba(30,30,35,0.8); display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 800; font-size: 22px; color: #fff; border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;
          box-shadow: inset 0 2px 10px rgba(255,255,255,0.05); transition: transform 0.3s;
        }
        .dash-fixture:hover .fixture-icon { transform: scale(1.1) rotate(5deg); }
        .fixture-icon.pink { color: var(--accent-pink); border-color: rgba(230,0,126,0.3); background: rgba(230,0,126,0.1); text-shadow: 0 0 10px rgba(230,0,126,0.5); }
        .fixture-icon.cyan { color: var(--accent-cyan); border-color: rgba(0,229,255,0.3); background: rgba(0,229,255,0.1); text-shadow: 0 0 10px rgba(0,229,255,0.5); }
        .fixture-icon.yellow { color: #FFD600; border-color: rgba(255,214,0,0.3); background: rgba(255,214,0,0.1); text-shadow: 0 0 10px rgba(255,214,0,0.5); }
        .fixture-icon.green { color: #00E676; border-color: rgba(0,230,118,0.3); background: rgba(0,230,118,0.1); text-shadow: 0 0 10px rgba(0,230,118,0.5); }
        
        .fixture-details { flex: 1; min-width: 0; }
        .fixture-title { font-weight: 800; font-size: 16px; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; letter-spacing: 0.5px; }
        .fixture-sub { font-size: 13px; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 8px; }
        .fixture-sub i { opacity: 0.7; }
        .fixture-sub span.pink { color: var(--accent-pink); font-weight: 600; }
        .fixture-sub span.cyan { color: var(--accent-cyan); font-weight: 600; }
        .fixture-sub span.yellow { color: #FFD600; font-weight: 600; }
        .fixture-sub span.green { color: #00E676; font-weight: 600; }
        
        .fixture-time-wrapper { text-align: right; margin-right: 16px; display: flex; flex-direction: column; align-items: flex-end; }
        .fixture-type-label { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; margin-bottom: 6px; }
        .fixture-time { font-size: 15px; font-weight: 800; font-family: var(--font-display); color: #fff; }

        .fixture-status { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; font-size: 16px; color: rgba(255,255,255,0.8); border: 1px dashed rgba(255,255,255,0.1); transition: all 0.3s; }
        .dash-fixture:hover .fixture-status { background: #fff; color: #000; transform: translateX(4px); box-shadow: 0 4px 12px rgba(255,255,255,0.3); border-style: solid; }

        .btn-dash { 
          background: rgba(255,255,255,0.04); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; 
          padding: 12px 24px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); 
          text-transform: uppercase; letter-spacing: 1.5px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          backdrop-filter: blur(8px);
        }
        .btn-dash:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
        .btn-dash:active { transform: translateY(0); }
        .btn-dash.primary { 
          background: linear-gradient(135deg, var(--accent-pink), #ff1a9a); color: #fff; border: none; 
          box-shadow: 0 4px 20px rgba(230,0,126,0.4); text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .btn-dash.primary:hover { background: linear-gradient(135deg, #ff1a9a, #ff4db8); box-shadow: 0 8px 30px rgba(230,0,126,0.6); animation: pulse-glow 1.5s infinite; }
        
        .action-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); 
          border: 1px dashed rgba(255,255,255,0.15); border-radius: 16px; padding: 30px 24px; 
          text-align: center; transition: all 0.3s; position: relative; overflow: hidden;
        }
        .action-card:hover { border-color: var(--accent-cyan); background: rgba(0,229,255,0.03); transform: translateY(-4px); }
        .action-icon-wrap { 
          width: 64px; height: 64px; border-radius: 50%; background: rgba(0,229,255,0.1); 
          display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
          border: 1px solid rgba(0,229,255,0.3); box-shadow: 0 0 20px rgba(0,229,255,0.2);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .action-card:hover .action-icon-wrap { transform: scale(1.1); box-shadow: 0 0 30px rgba(0,229,255,0.4); }
        .action-icon { font-size: 32px; color: var(--accent-cyan); }
        .action-title { font-weight: 800; font-size: 16px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .action-desc { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 24px; line-height: 1.5; }
      </style>
    `;

    app.innerHTML = styles + `
      <div class="transport-dashboard">
        <div class="dash-top-bar">
          <div>
            <h1 class="dash-title">Transport <span style="color:var(--accent-pink);">Hub</span></h1>
            <p class="dash-subtitle">${totalEvents} events tracked in system</p>
          </div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <button class="btn-dash" id="storico-btn" type="button"><i class="ph ph-clock-counter-clockwise" style="font-size:18px;"></i> STORICO</button>
            <button class="btn-dash pink" id="nuovo-trasporto-btn" type="button"><i class="ph ph-van" style="font-size:18px;"></i> NUOVO TRASPORTO</button>
            ${canCreate ? `<button class="btn-dash primary" id="new-event-btn" type="button"><i class="ph ph-plus-circle" style="font-size:20px;"></i> NEW EVENT</button>` : ''}
          </div>
        </div>

        <div class="dash-stat-grid">
          <div class="dash-stat-card">
            <div class="dash-stat-title">Total Events <div class="dash-stat-icon"><i class="ph ph-calendar-blank"></i></div></div>
            <div class="dash-stat-value">${totalEvents} <span class="dash-stat-trend trend-up"><i class="ph ph-trend-up"></i> +24%</span></div>
          </div>
          <div class="dash-stat-card cyan">
            <div class="dash-stat-title">Upcoming <div class="dash-stat-icon"><i class="ph ph-clock"></i></div></div>
            <div class="dash-stat-value">${futureEvents}</div>
          </div>
          <div class="dash-stat-card">
            <div class="dash-stat-title">Away Games <div class="dash-stat-icon"><i class="ph ph-bus"></i></div></div>
            <div class="dash-stat-value">${awayGames}</div>
          </div>
          <div class="dash-stat-card cyan">
            <div class="dash-stat-title">Active Routes <div class="dash-stat-icon"><i class="ph ph-car"></i></div></div>
            <div class="dash-stat-value">...</div>
          </div>
        </div>

        <div class="dash-grid">
          <div class="dash-card">
            <div class="dash-card-header">
              <div class="dash-card-title">UPCOMING FIXTURES</div>
              <div class="dash-card-dots"><i class="ph ph-dots-three-bold"></i></div>
            </div>
            
            <div class="dash-filters">
              <button class="dash-filter active" data-type-filter="" type="button">All Events</button>
              <button class="dash-filter" data-type-filter="away_game" type="button">Away Games</button>
              <button class="dash-filter" data-type-filter="home_game" type="button">Home Games</button>
              <button class="dash-filter" data-type-filter="training" type="button">Training</button>
              <button class="dash-filter" data-type-filter="tournament" type="button">Tournaments</button>
            </div>

            <div id="events-list">
              ${renderEventListContent(_events, typeLabels)}
            </div>
          </div>
          
          <div class="dash-card" style="display:flex; flex-direction:column; gap:20px;">
             <div class="dash-card-header" style="margin-bottom:0;">
              <div class="dash-card-title">QUICK ACTIONS</div>
              <div class="dash-card-dots"><i class="ph ph-dots-three-bold"></i></div>
            </div>
            
            <div class="action-card">
              <div class="action-icon-wrap">
                <i class="ph ph-git-merge action-icon"></i>
              </div>
              <div class="action-title">Carpooling AI</div>
              <p class="action-desc">Automatically match drivers and passengers based on availability and proximity.</p>
              <button class="btn-dash" style="width: 100%; border-color: rgba(0,229,255,0.3); color: var(--accent-cyan);"><i class="ph ph-lightning"></i> Auto-Match</button>
            </div>
            
             <div class="action-card" style="margin-top: -10px;">
              <div class="action-icon-wrap" style="background: rgba(230,0,126,0.1); border-color: rgba(230,0,126,0.3); box-shadow: 0 0 20px rgba(230,0,126,0.2);">
                <i class="ph ph-envelope-simple-open action-icon" style="color: var(--accent-pink);"></i>
              </div>
              <div class="action-title">Convocations</div>
              <p class="action-desc">Send automated email notices to all selected athletes for an upcoming event.</p>
              <button class="btn-dash" style="width: 100%;"><i class="ph ph-paper-plane-right"></i> Send All</button>
            </div>
          </div>
        </div>
      </div>`;

    // Filter chips
    Utils.qsa('[data-type-filter]').forEach(btn => btn.addEventListener('click', () => {
      Utils.qsa('[data-type-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.typeFilter;
      const filtered = type ? _events.filter(e => e.type === type) : _events;
      document.getElementById('events-list').innerHTML = renderEventListContent(filtered, typeLabels);
      _attachEventListeners();
    }, { signal: _ac.signal }));

    document.getElementById('new-event-btn')?.addEventListener('click', () => showCreateEventModal(), { signal: _ac.signal });
    document.getElementById('nuovo-trasporto-btn')?.addEventListener('click', () => showNuovoTrasporto(), { signal: _ac.signal });
    document.getElementById('storico-btn')?.addEventListener('click', () => showStorico(), { signal: _ac.signal });
    _attachEventListeners();
  }

  function renderEventListContent(events, typeLabels) {
    if (events.length === 0) return Utils.emptyState('Nessun evento programmato', 'Crea il primo evento per iniziare a gestire le trasferte.');

    // Group by date
    const grouped = {};
    events.forEach(ev => {
      const d = new Date(ev.event_date);
      const key = isNaN(d) ? 'TBD' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ev);
    });

    let html = '';
    for (const [dateToken, evs] of Object.entries(grouped)) {
      html += `<div class="dash-date-header">${dateToken}</div>`;
      evs.forEach(ev => {
        html += eventRow(ev, typeLabels);
      });
    }
    return html;
  }

  function _attachEventListeners() {
    Utils.qsa('[data-event-id]').forEach(row => row.addEventListener('click', () => showCarpoolView(row.dataset.eventId), { signal: _ac.signal }), { signal: _ac.signal });
  }

  function eventRow(ev, typeLabels) {
    let iconClass = 'pink';
    let iconLetter = 'E';
    let lineClass = 'pink-line';

    if (ev.type === 'away_game') { iconClass = 'cyan'; iconLetter = 'A'; lineClass = 'cyan-line'; }
    else if (ev.type === 'home_game') { iconClass = 'pink'; iconLetter = 'H'; lineClass = 'pink-line'; }
    else if (ev.type === 'training') { iconClass = 'yellow'; iconLetter = 'T'; lineClass = 'yellow-line'; }
    else if (ev.type === 'tournament') { iconClass = 'green'; iconLetter = 'C'; lineClass = 'green-line'; }

    const timeStr = new Date(ev.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateObj = new Date(ev.event_date);
    const dayName = isNaN(dateObj) ? '' : dateObj.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();

    return `
      <div class="dash-fixture ${lineClass}" data-event-id="${Utils.escapeHtml(ev.id)}">
        <div class="fixture-icon ${iconClass}">${iconLetter}</div>
        <div class="fixture-details">
          <div class="fixture-title">${Utils.escapeHtml(ev.title)}</div>
          <div class="fixture-sub">
            <span class="${iconClass}"><i class="ph ph-map-pin"></i> ${Utils.escapeHtml(ev.location_name || 'TBD')}</span> 
            <span style="opacity:0.5; margin:0 4px;">•</span> 
            <span><i class="ph ph-users"></i> ${Utils.escapeHtml(ev.team_name)}</span>
          </div>
        </div>
        <div class="fixture-time-wrapper">
           <div class="fixture-type-label">${Utils.escapeHtml(typeLabels[ev.type] || ev.type)}</div>
           <div class="fixture-time">${dayName} ${timeStr}</div>
        </div>
        <div class="fixture-status"><i class="ph ph-caret-right"></i></div>
      </div>`;
  }
  // ─── CARPOOL VIEW ─────────────────────────────────────────────────────────
  async function showCarpoolView(eventId) {
    const app = document.getElementById('app');
    app.innerHTML = UI.skeletonPage();

    try {
      const [event, routes] = await Promise.all([
        Store.get('listEvents', 'transport').then(evs => evs.find(e => e.id === eventId)),
        Store.get('listRoutes', 'transport', { eventId }),
      ]);

      const user = App.getUser();
      const canManage = ['admin', 'manager', 'operator'].includes(user?.role);

      const evtDate = new Date(event?.event_date);
      const dateStr = isNaN(evtDate) ? 'TBD' : evtDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).toUpperCase();

      const totalSeats = routes.reduce((acc, r) => acc + r.seats_total, 0);
      const availSeats = routes.reduce((acc, r) => acc + r.seats_available, 0);
      const occSeats = totalSeats - availSeats;
      const occPct = totalSeats > 0 ? Math.round((occSeats / totalSeats) * 100) : 0;

      const styles = `
      <style>
        .transport-dashboard {
          padding: 24px;
          --dash-bg: #030305;
          --card-bg: rgba(255, 255, 255, 0.03);
          --card-border: rgba(255, 255, 255, 0.06);
          --card-radius: 20px;
          --accent-cyan: #00e5ff;
          --accent-pink: #E6007E;
          --glass-bg: rgba(20, 20, 25, 0.6);
          --glass-blur: blur(16px);
          --shadow-soft: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          animation: fade-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.98) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .dash-top-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; }
        .dash-title-wrap { display: flex; align-items: center; gap: 16px; margin-bottom: 8px;}
        .dash-title { font-family: var(--font-display); font-size: 32px; font-weight: 800; text-transform: uppercase; margin: 0; line-height: 1; background: linear-gradient(90deg, #fff, #aaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;}
        .dash-subtitle { font-size: 15px; color: rgba(255,255,255,0.6); display:flex; align-items:center; gap:8px; font-weight:500;}
        
        .dash-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 28px; }
        @media(max-width: 960px) { .dash-grid { grid-template-columns: 1fr; } }
        
        .dash-card { background: var(--glass-bg); backdrop-filter: var(--glass-blur); border: 1px solid var(--card-border); border-radius: var(--card-radius); padding: 28px; position:relative; overflow:hidden; box-shadow: var(--shadow-soft); transition: border-color 0.3s;}
        .dash-card:hover { border-color: rgba(255,255,255,0.12); }
        .dash-card::before { content: ''; position: absolute; top:0; left:0; width: 100%; height: 4px; background: linear-gradient(90deg, var(--accent-cyan), transparent); opacity: 0.8; }
        .dash-card.pink::before { background: linear-gradient(90deg, var(--accent-pink), transparent); }
        .dash-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .dash-card-title { font-family: var(--font-display); font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display:flex; align-items:center; gap:10px; }
        .dash-card-title i { font-size: 22px; }

        .btn-dash { 
          background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; 
          padding: 12px 24px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.3s; 
          text-transform: uppercase; letter-spacing: 1px; display:inline-flex; align-items:center; gap:8px;
          backdrop-filter: blur(8px);
        }
        .btn-dash:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
        .btn-dash.primary { background: linear-gradient(135deg, var(--accent-cyan), #00b3cc); color: #000; border: none; box-shadow: 0 4px 20px rgba(0,229,255,0.4); }
        .btn-dash.primary:hover { box-shadow: 0 8px 30px rgba(0,229,255,0.6); }
        .btn-dash.pink { background: linear-gradient(135deg, var(--accent-pink), #cc0070); color: #fff; border: none; box-shadow: 0 4px 20px rgba(230,0,126,0.4); }
        .btn-dash.pink:hover { box-shadow: 0 8px 30px rgba(230,0,126,0.6); }
        .btn-dash.icon-only { padding: 12px; border-radius: 50%; }
        
        .route-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04)); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px;
          padding: 20px; margin-bottom: 16px; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); position: relative; overflow: hidden;
        }
        .route-card:hover { border-color: rgba(0,229,255,0.4); box-shadow: 0 8px 25px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,229,255,0.2); transform: translateY(-3px); }
        .route-card::before { content:''; position:absolute; left:0; top:0; width:4px; height:100%; background: var(--accent-cyan); opacity: 0; transition: opacity 0.3s; }
        .route-card:hover::before { opacity: 1; }
        
        .gmap-container { background: #0a0a0c; border: 1px solid var(--card-border); border-radius: 16px; height: 320px; display: flex; align-items: center; justify-content: center; overflow:hidden; position:relative; box-shadow: inset 0 4px 20px rgba(0,0,0,0.5); }
        
        /* Circular Chart Overlay */
        .pie-chart-wrapper { position: relative; width: 180px; height: 180px; margin: 32px auto; }
        .pie-chart-wrapper::after { content:''; position:absolute; inset:-10px; background:radial-gradient(circle, rgba(230,0,126,0.1), transparent 70%); border-radius:50%; z-index:-1;}
        .pie-chart { width: 100%; height: 100%; border-radius: 50%; background: conic-gradient(var(--accent-pink) ${occPct}%, rgba(255,255,255,0.05) 0); display:flex; align-items:center; justify-content:center; box-shadow: inset 0 0 30px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.3); transition: background 1s ease-out; }
        .pie-chart-inner { width: 140px; height: 140px; background: #121216; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.05); }
        .pie-val { font-family: var(--font-display); font-size: 42px; font-weight: 800; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        .pie-lbl { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-top: 6px; letter-spacing: 2px; font-weight: 700; }
        
        .route-driver-name { font-family:var(--font-display); font-weight:800; font-size:18px; text-transform:uppercase; color:var(--accent-cyan); display:flex; align-items:center; gap:8px;}
      </style>
      `;

      app.innerHTML = styles + `
        <div class="transport-dashboard">
          <div class="dash-top-bar">
            <div>
              <div class="dash-title-wrap">
                 <button class="btn-dash icon-only" id="back-events" type="button" title="Torna Indietro"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>
                 <h1 class="dash-title">${Utils.escapeHtml(event?.title || 'Evento')}</h1>
              </div>
              <p class="dash-subtitle"><i class="ph ph-calendar-blank"></i> ${dateStr} <span style="opacity:0.3;margin:0 8px;">|</span> <i class="ph ph-map-pin"></i> ${Utils.escapeHtml(event?.location_name || 'TBD')}</p>
            </div>
            <div style="display:flex;gap:12px; flex-wrap:wrap;">
              <button class="btn-dash pink" id="add-route-btn" type="button"><i class="ph ph-plus-circle" style="font-size:18px;"></i> OFFRI PASSAGGIO</button>
              ${canManage ? `<button class="btn-dash primary" id="match-carpool-btn" type="button"><i class="ph ph-magic-wand" style="font-size:18px;"></i> AUTO-MATCH</button>
                             <button class="btn-dash" id="send-convocations-btn" type="button"><i class="ph ph-paper-plane-tilt" style="font-size:18px;"></i> CONVOCAZIONI</button>` : ''}
            </div>
          </div>

          <div class="dash-grid">
            <!-- Left Column: Map & Routes -->
            <div style="display:flex; flex-direction:column; gap:28px;">
              <div class="dash-card">
                 <div class="dash-card-header" style="margin-bottom: 20px;">
                   <div class="dash-card-title"><i class="ph ph-map-trifold" style="color:var(--accent-cyan);"></i> LOCATION & ROUTING</div>
                   <div style="color: rgba(255,255,255,0.3); letter-spacing: 2px; cursor:pointer;"><i class="ph ph-dots-three-bold"></i></div>
                 </div>
                 <div class="gmap-container" id="map-container">
                    ${event?.location_lat && event?.location_lng
          ? `<div id="gmap" style="width:100%;height:100%;"></div>`
          : `<div style="text-align:center;"><i class="ph ph-map-pin-line" style="font-size:48px;color:rgba(255,255,255,0.1);margin-bottom:12px;display:block;"></i><p style="color:rgba(255,255,255,0.4);font-size:14px; font-family:var(--font-display); letter-spacing:1px; text-transform:uppercase; font-weight:700;">Coordinate GPS assenti</p></div>`}
                 </div>
              </div>

              <div class="dash-card cyan">
                 <div class="dash-card-header">
                   <div class="dash-card-title"><i class="ph ph-car" style="color:var(--accent-cyan);"></i> AVAILABLE ROUTES <span style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:20px; font-size:14px; margin-left:8px;">${routes.length}</span></div>
                 </div>
                 <div>
                    ${routes.length === 0
          ? Utils.emptyState('Nessuna tratta offerta', 'Aggiungi la tua auto per iniziare.')
          : routes.map(r => routeCard(r, eventId)).join('')}
                 </div>
              </div>
            </div>

            <!-- Right Column: Stats & Status -->
            <div style="display:flex; flex-direction:column; gap:28px;">
              <div class="dash-card pink">
                 <div class="dash-card-header" style="margin-bottom:0px;">
                    <div class="dash-card-title"><i class="ph ph-chart-pie-slice" style="color:var(--accent-pink);"></i> CAPACITY OVERVIEW</div>
                 </div>
                 
                 <div class="pie-chart-wrapper">
                    <div class="pie-chart">
                       <div class="pie-chart-inner">
                          <div class="pie-val">${occPct}%</div>
                          <div class="pie-lbl">Occupato</div>
                       </div>
                    </div>
                 </div>
                 
                 <div style="background: rgba(0,0,0,0.2); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.03);">
                   <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px; padding-bottom:12px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
                      <div style="display:flex; align-items:center; gap:8px; font-weight:600;"><div style="width:12px; height:12px; border-radius:50%; background:var(--accent-pink); box-shadow:0 0 10px var(--accent-pink);"></div> Posti Occupati</div>
                      <div style="font-weight:800; font-size:18px;">${occSeats}</div>
                   </div>
                   <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px; padding:12px 0; border-bottom: 1px dashed rgba(255,255,255,0.1);">
                      <div style="display:flex; align-items:center; gap:8px; font-weight:600;"><div style="width:12px; height:12px; border-radius:50%; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3);"></div> Posti Liberi</div>
                      <div style="font-weight:800; font-size:18px;">${availSeats}</div>
                   </div>
                   <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px; color:rgba(255,255,255,0.5); padding-top:12px;">
                      <div style="font-weight:600; text-transform:uppercase; letter-spacing:1px; font-size:12px;">Totale Posti Auto</div>
                      <div style="font-weight:800; font-size:16px;">${totalSeats}</div>
                   </div>
                 </div>
              </div>

              <div class="dash-card" id="match-result-card" style="display:none; animation: fade-in 0.3s ease-out;">
                 <div class="dash-card-header">
                    <div class="dash-card-title"><i class="ph ph-check-circle" style="color:#00E676;"></i> MATCH RESULTS</div>
                 </div>
                 <div id="match-result" style="font-size:14px;"></div>
              </div>
            </div>
            
          </div>
        </div>`;

      document.getElementById('back-events')?.addEventListener('click', () => renderEventList(), { signal: _ac.signal });
      document.getElementById('add-route-btn')?.addEventListener('click', () => showAddRouteModal(eventId), { signal: _ac.signal });
      document.getElementById('match-carpool-btn')?.addEventListener('click', () => runCarpoolMatch(eventId), { signal: _ac.signal });
      document.getElementById('send-convocations-btn')?.addEventListener('click', () => sendConvocations(eventId), { signal: _ac.signal });

      if (event?.location_lat && event?.location_lng) {
        _initGoogleMap(event.location_lat, event.location_lng, event.location_name);
      }

    } catch (err) {
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = `<div style="padding:40px;text-align:center;">
          <p style="color:rgba(255,255,255,0.5);margin-bottom:24px;">Errore nel caricamento: ${Utils.escapeHtml(err.message)}</p>
          <button class="btn btn-ghost" id="err-back-btn" type="button"><i class="ph ph-arrow-left"></i> Torna indietro</button>
        </div>`;
        document.getElementById('err-back-btn')?.addEventListener('click', () => renderEventList(), { signal: _ac.signal });
      }
      UI.toast('Errore: ' + err.message, 'error');
    }
  }

  function routeCard(r, eventId) {
    const pct = r.seats_total > 0 ? Math.round((1 - r.seats_available / r.seats_total) * 100) : 0;
    const isFull = r.seats_available === 0;

    return `
      <div class="route-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
          <div style="display:flex; gap:16px; align-items:center;">
            <div style="width:48px; height:48px; border-radius:12px; background:rgba(0,229,255,0.1); border:1px solid rgba(0,229,255,0.3); display:flex; align-items:center; justify-content:center; color:var(--accent-cyan); font-size:24px; box-shadow:0 0 15px rgba(0,229,255,0.1);">
                <i class="ph ph-steering-wheel"></i>
            </div>
            <div>
              <div class="route-driver-name">${Utils.escapeHtml(r.driver_name)} ${isFull ? '<span style="font-size:10px; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; color:#fff; margin-left:8px;">COMPLETO</span>' : ''}</div>
              ${r.driver_phone ? `<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px; font-weight:500;"><i class="ph ph-phone"></i> ${Utils.escapeHtml(r.driver_phone)}</div>` : ''}
            </div>
          </div>
          <div style="text-align:right; background: rgba(0,0,0,0.3); padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-family:var(--font-display);font-size:24px;font-weight:800;line-height:1;margin-bottom:4px;color:${isFull ? 'rgba(255,255,255,0.3)' : '#fff'}">${r.seats_available}<span style="font-size:16px; opacity:0.5;">/${r.seats_total}</span></div>
            <div style="font-size:10px;text-transform:uppercase;color:rgba(255,255,255,0.4);letter-spacing:1px;font-weight:700;">Liberi</div>
          </div>
        </div>
        
        <div style="margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:13px; color:rgba(255,255,255,0.7); font-weight:500; background:rgba(255,255,255,0.02); padding:12px; border-radius:10px;">
           ${r.meeting_point_name ? `<div><i class="ph ph-map-pin" style="color:var(--accent-pink); margin-right:4px;"></i> ${Utils.escapeHtml(r.meeting_point_name)}</div>` : '<div></div>'}
           ${r.departure_time ? `<div style="text-align:right;"><i class="ph ph-clock" style="color:var(--accent-cyan); margin-right:4px;"></i> ${Utils.formatDateTime(r.departure_time)}</div>` : '<div></div>'}
        </div>

        <div style="margin-top:20px;height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden; position:relative;">
          <div style="position:absolute; left:0; top:0; height:100%; width:${pct}%; background:linear-gradient(90deg, #00b3cc, var(--accent-cyan)); transition:width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow:0 0 10px var(--accent-cyan); ${isFull ? 'background:rgba(255,255,255,0.2); box-shadow:none;' : ''}"></div>
        </div>
        
        ${r.reimbursement_eur ? `
          <div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between; border-top:1px dashed rgba(255,255,255,0.1); padding-top:16px;">
            <div style="font-size:13px;color:rgba(255,255,255,0.5); font-weight:500;">
                <i class="ph ph-navigation-arrow"></i> ${Utils.formatNum(r.distance_km, 1)} km  <span style="opacity:0.3; margin:0 8px;">|</span>  <i class="ph ph-coins"></i> <span style="color:#00e676;font-weight:700;">${Utils.formatCurrency(r.reimbursement_eur)}</span>
            </div>
            <button class="btn-dash" style="padding:6px 14px; font-size:11px; border-color:rgba(255,255,255,0.2);" data-carpool-id="${Utils.escapeHtml(r.id)}" data-km="${Utils.escapeHtml(String(r.distance_km || 0))}" id="gen-reimb-${Utils.escapeHtml(r.id)}" type="button"><i class="ph ph-file-pdf" style="color:#ff1a1a;"></i> PDF RIMBORSO</button>
          </div>` : ''}
      </div>`;
  }

  async function runCarpoolMatch(eventId) {
    document.getElementById('match-result-card').style.display = 'block';
    const resultDiv = document.getElementById('match-result');
    if (resultDiv) resultDiv.innerHTML = '<div style="text-align:center; padding: 20px;"><div class="spinner"></div><p style="color:var(--accent-cyan); margin-top:12px;">Calcolo abbinamenti...</p></div>';
    try {
      const matches = await Store.get('matchCarpool', 'transport', { eventId });
      if (!resultDiv) return;
      if (!matches.length) { resultDiv.innerHTML = Utils.emptyState('Nessun abbinamento possibile'); return; }
      resultDiv.innerHTML = `
        <div style="max-height: 400px; overflow-y: auto; padding-right:8px;">
          ${matches.map(m => {
        const isUnmatched = !m.driver_name;
        return `
            <div style="background:rgba(255,255,255,0.02); border-left: 2px solid ${isUnmatched ? 'var(--accent-pink)' : 'var(--accent-cyan)'}; padding: 12px; margin-bottom: 8px; border-radius: 4px;">
               <div style="font-weight:600; font-size:14px;">${Utils.escapeHtml(m.athlete_name)}</div>
               <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:11px; color:rgba(255,255,255,0.4);">
                  <div>${isUnmatched ? '<span style="color:var(--accent-pink);">Nessun autista</span>' : '<i class="ph ph-car"></i> ' + Utils.escapeHtml(m.driver_name)}</div>
                  <div>${isUnmatched ? 'IN SOSPESO' : m.passenger_status || 'ASSEGNATO'}</div>
               </div>
            </div>`;
      }).join('')}
        </div>`;
    } catch (err) {
      document.getElementById('match-result-card').style.display = 'block';
      document.getElementById('match-result').innerHTML = `<div style="color:var(--accent-pink); padding: 12px; background: rgba(230,0,126,0.1); border-radius: 8px;">Errore: ${err.message}</div>`;
    }
  }

  async function sendConvocations(eventId) {
    UI.confirm('Inviare le convocazioni a tutti gli atleti convocati per questo evento?', async () => {
      try {
        const res = await Store.api('sendConvocations', 'transport', { eventId });
        UI.toast(`Convocazioni inviate: ${res.sent} successi, ${res.failed} errori`, res.failed > 0 ? 'info' : 'success');
      } catch (err) {
        UI.toast('Errore invio email: ' + err.message, 'error');
      }
    });
  }

  // ─── ADD ROUTE MODAL ─────────────────────────────────────────────────────
  function showAddRouteModal(eventId) {
    const m = UI.modal({
      title: 'Offri Passaggio',
      body: `
        <div class="form-group">
          <label class="form-label" for="route-seats">Posti disponibili (escluso guidatore)</label>
          <input id="route-seats" class="form-input" type="number" min="1" max="8" placeholder="3" value="3">
        </div>
        <div class="form-group">
          <label class="form-label" for="route-meeting">Punto di ritrovo</label>
          <input id="route-meeting" class="form-input" type="text" placeholder="Via Roma 10, Milano">
        </div>
        <div class="form-group">
          <label class="form-label" for="route-departure">Orario di partenza</label>
          <input id="route-departure" class="form-input" type="datetime-local">
        </div>
        <div class="form-group">
          <label class="form-label" for="route-notes">Note</label>
          <textarea id="route-notes" class="form-textarea" placeholder="Info aggiuntive..." style="min-height:60px;"></textarea>
        </div>
        <div id="route-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="route-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="route-save" type="button">OFFRI PASSAGGIO</button>`,
    });

    document.getElementById('route-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal }, { signal: _ac.signal });
    document.getElementById('route-save')?.addEventListener('click', async () => {
      const seats = parseInt(document.getElementById('route-seats').value) || 0;
      if (seats < 1) { document.getElementById('route-error').textContent = 'Inserisci almeno 1 posto'; document.getElementById('route-error').classList.remove('hidden'); return; }
      const btn = document.getElementById('route-save');
      btn.disabled = true; btn.textContent = 'Salvataggio...';
      try {
        await Store.api('createRoute', 'transport', {
          event_id: eventId,
          seats_total: seats + 1,
          meeting_point_name: document.getElementById('route-meeting').value || null,
          departure_time: document.getElementById('route-departure').value || null,
          notes: document.getElementById('route-notes').value || null,
        });
        m.close();
        UI.toast('Tratta aggiunta!', 'success');
        showCarpoolView(eventId);
      } catch (err) {
        document.getElementById('route-error').textContent = err.message;
        document.getElementById('route-error').classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'OFFRI PASSAGGIO';
      }
    }, { signal: _ac.signal });
  }

  // ─── CREATE EVENT MODAL ───────────────────────────────────────────────────
  function showCreateEventModal() {
    const m = UI.modal({
      title: 'Nuovo Evento',
      body: `
        <div class="form-group">
          <label class="form-label" for="ev-title">Titolo *</label>
          <input id="ev-title" class="form-input" type="text" placeholder="Partita vs Team ABC" required>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ev-date">Data e ora *</label>
            <input id="ev-date" class="form-input" type="datetime-local" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="ev-type">Tipo *</label>
            <select id="ev-type" class="form-select">
              <option value="training">Allenamento</option>
              <option value="away_game">Trasferta</option>
              <option value="home_game">Gara in Casa</option>
              <option value="tournament">Torneo</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ev-location">Luogo</label>
          <input id="ev-location" class="form-input" type="text" placeholder="PalaXxx, Via Roma 1, Milano">
        </div>
        <div class="form-group">
          <label class="form-label" for="ev-team">ID Squadra *</label>
          <input id="ev-team" class="form-input" type="text" placeholder="TEAM_xxxx (da lista atleti)">
        </div>
        <div id="ev-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="ev-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="ev-save" type="button">CREA EVENTO</button>`,
    });

    document.getElementById('ev-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal }, { signal: _ac.signal });
    document.getElementById('ev-save')?.addEventListener('click', async () => {
      const title = document.getElementById('ev-title').value.trim();
      const date = document.getElementById('ev-date').value;
      const team = document.getElementById('ev-team').value.trim();
      const errEl = document.getElementById('ev-error');
      if (!title || !date || !team) { errEl.textContent = 'Titolo, data e ID squadra sono obbligatori'; errEl.classList.remove('hidden'); return; }
      const btn = document.getElementById('ev-save');
      btn.disabled = true; btn.textContent = 'Creazione...';
      try {
        await Store.api('createEvent', 'transport', {
          title, event_date: date, team_id: team,
          type: document.getElementById('ev-type').value,
          location_name: document.getElementById('ev-location').value || null,
        });
        m.close(); UI.toast('Evento creato', 'success'); init();
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'CREA EVENTO';
      }
    }, { signal: _ac.signal });
  }

  // ─── GOOGLE MAPS ─────────────────────────────────────────────────────────
  function _initGoogleMap(lat, lng, label) {
    const apiKey = window.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=_gmapInitCallback`;
    script.async = true;
    script.defer = true;

    window._gmapInitCallback = function () {
      const mapEl = document.getElementById('gmap');
      if (!mapEl) return;
      const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
      const map = new google.maps.Map(mapEl, { center: coords, zoom: 14, styles: _darkMapStyles() });
      new google.maps.Marker({ position: coords, map, title: label || 'Destinazione' });
    };

    document.head.appendChild(script);
  }

  function _darkMapStyles() {
    return [
      { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
      { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#E6007E', lightness: -80 }] },
    ];
  }

  // ═══ NUOVO TRASPORTO ═══════════════════════════════════════════════════════
  async function showNuovoTrasporto() {
    const app = document.getElementById('app');
    app.innerHTML = UI.skeletonPage();
    _selectedGym = null; _selectedAthletes = []; _currentTransportResult = null; _verifiedCoords.clear();

    try {
      [_gyms, _teams] = await Promise.all([
        Store.get('listGyms', 'transport'),
        Store.get('listTeams', 'transport'),
      ]);
    } catch (e) { _gyms = []; _teams = []; }

    const ntStyles = `
    <style>
      .nt-page { padding:24px; animation: fade-in 0.4s ease-out; }
      @keyframes fade-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      .nt-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
      .nt-title { font-family:var(--font-display); font-size:28px; font-weight:800; text-transform:uppercase; background:linear-gradient(90deg,#fff,rgba(255,255,255,0.6)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; display:flex; align-items:center; gap:14px; }
      .nt-subtitle { font-size:14px; color:rgba(255,255,255,0.5); margin-top:4px; }
      .nt-step { background:rgba(20,20,25,0.6); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.06); border-radius:20px; padding:28px; margin-bottom:24px; position:relative; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.3); }
      .nt-step::before { content:''; position:absolute; top:0; left:0; width:100%; height:3px; background:linear-gradient(90deg,#E6007E,transparent); opacity:0.8; }
      .nt-step.cyan::before { background:linear-gradient(90deg,#00e5ff,transparent); }
      .nt-step.green::before { background:linear-gradient(90deg,#00E676,transparent); }
      .nt-step-num { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:50%; background:rgba(230,0,126,0.15); color:#E6007E; font-family:var(--font-display); font-weight:800; font-size:15px; margin-right:12px; border:1px solid rgba(230,0,126,0.3); }
      .nt-step.cyan .nt-step-num { background:rgba(0,229,255,0.15); color:#00e5ff; border-color:rgba(0,229,255,0.3); }
      .nt-step.green .nt-step-num { background:rgba(0,230,118,0.15); color:#00E676; border-color:rgba(0,230,118,0.3); }
      .nt-step-title { font-family:var(--font-display); font-size:17px; font-weight:800; text-transform:uppercase; letter-spacing:1px; display:inline; }
      .nt-form-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
      @media(max-width:700px){ .nt-form-row{grid-template-columns:1fr;} }
      .nt-label { font-size:12px; font-weight:700; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; display:block; }
      .nt-input, .nt-select { width:100%; padding:12px 16px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#fff; font-size:14px; font-weight:500; outline:none; transition:border-color 0.3s, box-shadow 0.3s; }
      .nt-input:focus, .nt-select:focus { border-color:rgba(0,229,255,0.5); box-shadow:0 0 0 3px rgba(0,229,255,0.1); }
      .nt-select option { background:#1a1a1e; color:#fff; }
      .nt-btn-add { background:rgba(0,229,255,0.1); border:1px dashed rgba(0,229,255,0.4); border-radius:12px; padding:12px; color:#00e5ff; font-weight:700; font-size:13px; cursor:pointer; transition:all 0.3s; display:flex; align-items:center; gap:6px; text-transform:uppercase; letter-spacing:1px; }
      .nt-btn-add:hover { background:rgba(0,229,255,0.2); border-color:#00e5ff; transform:translateY(-2px); }
      .nt-athletes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; margin-top:20px; }
      .nt-athlete-card { background:linear-gradient(145deg,rgba(25,25,30,0.6),rgba(15,15,20,0.8)); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:16px; display:flex; align-items:center; gap:14px; cursor:pointer; transition:all 0.3s cubic-bezier(0.2,0.8,0.2,1); position:relative; }
      .nt-athlete-card:hover { border-color:rgba(255,255,255,0.15); transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.4); }
      .nt-athlete-card.selected { border-color:rgba(0,229,255,0.5); background:linear-gradient(145deg,rgba(0,229,255,0.05),rgba(0,229,255,0.02)); box-shadow:0 0 20px rgba(0,229,255,0.1); }
      .nt-athlete-card.selected::after { content:'✓'; position:absolute; top:8px; right:10px; color:#00e5ff; font-weight:800; font-size:18px; }
      .nt-avatar { width:44px; height:44px; border-radius:12px; background:rgba(230,0,126,0.1); border:1px solid rgba(230,0,126,0.3); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:800; font-size:16px; color:#E6007E; flex-shrink:0; }
      .nt-athlete-card.selected .nt-avatar { background:rgba(0,229,255,0.1); border-color:rgba(0,229,255,0.3); color:#00e5ff; }
      .nt-athlete-name { font-weight:700; font-size:14px; }
      .nt-athlete-addr { font-size:12px; color:rgba(255,255,255,0.5); margin-top:4px; }
      .nt-athlete-addr.missing { color:#E6007E; font-style:italic; }
      .nt-addr-input { margin-top:8px; width:100%; padding:8px 12px; background:rgba(255,255,255,0.04); border:1px solid rgba(230,0,126,0.4); border-radius:8px; color:#fff; font-size:12px; outline:none; }
      .nt-addr-input:focus { border-color:#00e5ff; }
      .nt-calc-btn { background:linear-gradient(135deg,#E6007E,#ff1a9a); color:#fff; border:none; border-radius:14px; padding:16px 32px; font-weight:800; font-size:15px; cursor:pointer; display:flex; align-items:center; gap:10px; text-transform:uppercase; letter-spacing:1.5px; box-shadow:0 4px 20px rgba(230,0,126,0.4); transition:all 0.3s; margin-top:28px; }
      .nt-calc-btn:hover { box-shadow:0 8px 30px rgba(230,0,126,0.6); transform:translateY(-2px); }
      .nt-calc-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
      .nt-results { margin-top:32px; animation:fade-in 0.5s ease-out; }
      .nt-stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:28px; }
      @media(max-width:600px){ .nt-stats-grid{grid-template-columns:1fr;} }
      .nt-stat { background:rgba(20,20,25,0.6); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:20px; text-align:center; }
      .nt-stat-val { font-family:var(--font-display); font-size:32px; font-weight:800; color:#fff; }
      .nt-stat-lbl { font-size:11px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:1.5px; margin-top:6px; font-weight:700; }
      .nt-timeline { position:relative; padding-left:32px; }
      .nt-timeline::before { content:''; position:absolute; left:14px; top:0; bottom:0; width:2px; background:linear-gradient(180deg,#E6007E,#00e5ff,#00E676); border-radius:2px; }
      .nt-tl-item { position:relative; padding:16px 20px; margin-bottom:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; transition:all 0.3s; }
      .nt-tl-item:hover { border-color:rgba(255,255,255,0.15); background:rgba(255,255,255,0.04); }
      .nt-tl-item::before { content:''; position:absolute; left:-24px; top:20px; width:12px; height:12px; border-radius:50%; background:#E6007E; border:2px solid rgba(20,20,25,0.8); box-shadow:0 0 8px rgba(230,0,126,0.5); }
      .nt-tl-item.raccolta::before { background:#00e5ff; box-shadow:0 0 8px rgba(0,229,255,0.5); }
      .nt-tl-item.arrivo::before { background:#00E676; box-shadow:0 0 8px rgba(0,230,118,0.5); }
      .nt-tl-time { font-family:var(--font-display); font-weight:800; font-size:18px; color:#fff; }
      .nt-tl-note { font-size:14px; font-weight:600; margin-top:4px; }
      .nt-tl-place { font-size:12px; color:rgba(255,255,255,0.5); margin-top:4px; }
      .nt-ai-card { background:linear-gradient(145deg,rgba(0,229,255,0.05),rgba(230,0,126,0.03)); border:1px solid rgba(0,229,255,0.2); border-radius:16px; padding:20px; margin-bottom:20px; }
      .nt-ai-title { font-family:var(--font-display); font-weight:800; font-size:14px; text-transform:uppercase; letter-spacing:1px; color:#00e5ff; display:flex; align-items:center; gap:8px; margin-bottom:12px; }
      .nt-save-btn { background:linear-gradient(135deg,#00e5ff,#00b3cc); color:#000; border:none; border-radius:14px; padding:16px 32px; font-weight:800; font-size:15px; cursor:pointer; display:flex; align-items:center; gap:10px; text-transform:uppercase; letter-spacing:1.5px; box-shadow:0 4px 20px rgba(0,229,255,0.4); transition:all 0.3s; margin-top:20px; }
      .nt-save-btn:hover { box-shadow:0 8px 30px rgba(0,229,255,0.6); transform:translateY(-2px); }
      .btn-dash.ghost { background:transparent; border:1px solid rgba(255,255,255,0.15); }
      .btn-dash.ghost:hover { background:rgba(255,255,255,0.05); }
    </style>`;

    const gymOptions = _gyms.map(g => `<option value="${Utils.escapeHtml(g.id)}" data-address="${Utils.escapeHtml(g.address || '')}" data-lat="${g.lat || ''}" data-lng="${g.lng || ''}">${Utils.escapeHtml(g.name)}</option>`).join('');
    const teamOptions = _teams.map(t => `<option value="${Utils.escapeHtml(t.id)}">${Utils.escapeHtml(t.name)} (${Utils.escapeHtml(t.category)})</option>`).join('');

    app.innerHTML = ntStyles + `
    <div class="nt-page">
      <div class="nt-top">
        <div>
          <div class="nt-title"><button class="btn-dash ghost" id="nt-back" type="button" style="padding:10px;"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button> Nuovo <span style="color:#E6007E;">Trasporto</span></div>
          <p class="nt-subtitle">Pianifica il percorso di raccolta atlete con backward planning</p>
        </div>
      </div>

      <!-- Step 1: Destinazione -->
      <div class="nt-step">
        <span class="nt-step-num">1</span><h3 class="nt-step-title">Destinazione</h3>
        <div class="nt-form-row">
          <div>
            <label class="nt-label">Palestra / Impianto</label>
            <select class="nt-select" id="nt-gym-select">
              <option value="">— Seleziona destinazione —</option>
              ${gymOptions}
            </select>
          </div>
          <div style="display:flex;align-items:flex-end;gap:10px;">
            <button class="nt-btn-add" id="nt-add-gym-btn" type="button"><i class="ph ph-plus"></i> Nuova Palestra</button>
            <button class="nt-btn-add" id="nt-del-gym-btn" type="button" style="background:rgba(230,0,126,0.1);border-color:rgba(230,0,126,0.4);color:#E6007E;" title="Elimina palestra selezionata"><i class="ph ph-trash"></i> Elimina</button>
          </div>
        </div>
      </div>

      <!-- Step 2: Dati Viaggio -->
      <div class="nt-step cyan">
        <span class="nt-step-num">2</span><h3 class="nt-step-title">Dati Viaggio</h3>
        <div class="nt-form-row">
          <div>
            <label class="nt-label">Squadra</label>
            <select class="nt-select" id="nt-team-select">
              <option value="">— Seleziona squadra —</option>
              ${teamOptions}
            </select>
          </div>
          <div>
            <label class="nt-label">Orario Arrivo Desiderato</label>
            <input class="nt-input" type="time" id="nt-arrival-time" value="18:00">
          </div>
        </div>
        <div style="margin-top:16px;">
          <label class="nt-label" style="display:flex;align-items:center;gap:8px;">
            Indirizzo di Partenza del Mezzo
            <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);border-radius:6px;padding:2px 8px;font-size:10px;color:#4285F4;font-weight:700;letter-spacing:0.5px;">
              <i class="ph ph-google-logo"></i> Google Maps
            </span>
          </label>
          <div style="position:relative;">
            <i class="ph ph-magnifying-glass" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.35);font-size:16px;pointer-events:none;"></i>
            <input class="nt-input" type="text" id="nt-departure-addr" autocomplete="off"
              placeholder="Cerca indirizzo di partenza..."
              value="Via Bazzera, 16, 30030 Martellago VE, Italia"
              style="padding-left:40px;">
          </div>
          <div id="nt-departure-map" style="display:none;margin-top:10px;border-radius:12px;overflow:hidden;height:160px;border:1px solid rgba(66,133,244,0.25);"></div>
        </div>
        <div style="margin-top:16px;">
          <label class="nt-label">Data Trasporto</label>
          <input class="nt-input" type="date" id="nt-transport-date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
      </div>

      <!-- Step 3: Atlete -->
      <div class="nt-step green">
        <span class="nt-step-num">3</span><h3 class="nt-step-title">Seleziona Atlete</h3>
        <p style="font-size:13px; color:rgba(255,255,255,0.5); margin-top:8px;">Seleziona una squadra per caricare le atlete. Clicca su una card per selezionare/deselezionare.</p>
        <div class="nt-athletes-grid" id="nt-athletes-grid">
          <div style="grid-column:1/-1; text-align:center; padding:40px; color:rgba(255,255,255,0.4);">
            <i class="ph ph-users" style="font-size:48px; display:block; margin-bottom:12px; opacity:0.3;"></i>
            Seleziona una squadra per visualizzare le atlete
          </div>
        </div>
      </div>

      <!-- Action -->
      <div style="display:flex; gap:16px; flex-wrap:wrap;">
        <button class="nt-calc-btn" id="nt-calc-btn" type="button"><i class="ph ph-route" style="font-size:22px;"></i> Calcola Percorso</button>
      </div>

      <!-- Results -->
      <div class="nt-results" id="nt-results" style="display:none;"></div>
    </div>`;

    // Wire events
    document.getElementById('nt-back')?.addEventListener('click', () => renderEventList(), { signal: _ac.signal });
    document.getElementById('nt-gym-select')?.addEventListener('change', _onGymSelect, { signal: _ac.signal });
    document.getElementById('nt-team-select')?.addEventListener('change', _onTeamSelect, { signal: _ac.signal });
    document.getElementById('nt-add-gym-btn')?.addEventListener('click', _showAddGymModal, { signal: _ac.signal });
    document.getElementById('nt-del-gym-btn')?.addEventListener('click', _deleteGym, { signal: _ac.signal });
    document.getElementById('nt-calc-btn')?.addEventListener('click', _handleCalcolaPercorso, { signal: _ac.signal });

    // Google Places Autocomplete sull'indirizzo di partenza del mezzo
    _loadPlacesLib(() => _attachGoogleAutocomplete(
      document.getElementById('nt-departure-addr'),
      ({ lat, lng, address }) => {
        _verifiedCoords.set(address, { lat, lng });
        // Mini-mappa preview
        const previewEl = document.getElementById('nt-departure-map');
        if (previewEl && typeof google !== 'undefined') {
          previewEl.style.display = 'block';
          const map = new google.maps.Map(previewEl, {
            center: { lat, lng }, zoom: 15, disableDefaultUI: true, styles: _darkMapStyles(),
          });
          new google.maps.Marker({ position: { lat, lng }, map, title: address });
        }
      }
    ));
  }

  function _onGymSelect(e) {
    const opt = e.target.selectedOptions[0];
    if (!opt || !opt.value) { _selectedGym = null; return; }
    _selectedGym = {
      id: opt.value,
      name: opt.textContent,
      address: opt.dataset.address || '',
      lat: parseFloat(opt.dataset.lat) || null,
      lng: parseFloat(opt.dataset.lng) || null,
    };
  }

  async function _onTeamSelect(e) {
    const teamId = e.target.value;
    _selectedTeam = teamId;
    _selectedAthletes = [];
    const grid = document.getElementById('nt-athletes-grid');
    if (!teamId) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:rgba(255,255,255,0.4);"><i class="ph ph-users" style="font-size:48px; display:block; margin-bottom:12px; opacity:0.3;"></i>Seleziona una squadra per visualizzare le atlete</div>';
      return;
    }
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:30px;"><div class="spinner"></div></div>';
    try {
      _athletes = await Store.get('listTeamAthletes', 'transport', { teamId });
      _renderAthleteGrid();
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#E6007E;">Errore: ${Utils.escapeHtml(err.message)}</div>`;
    }
  }

  function _renderAthleteGrid() {
    const grid = document.getElementById('nt-athletes-grid');
    if (!_athletes.length) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:rgba(255,255,255,0.4);">Nessuna atleta trovata per questa squadra</div>';
      return;
    }
    grid.innerHTML = _athletes.map(a => {
      const initials = (a.full_name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      // Combina via + città se il backend non l'ha già fatto
      const fullAddr = [a.residence_address, a.residence_city].filter(v => v && v.trim()).join(', ');
      if (fullAddr && !a.residence_address?.includes(a.residence_city || '~~~')) {
        a.residence_address = fullAddr;
      }
      const hasAddr = a.residence_address && a.residence_address.trim();
      const isSelected = _selectedAthletes.some(s => s.id === a.id);
      return `
        <div class="nt-athlete-card ${isSelected ? 'selected' : ''}" data-athlete-id="${Utils.escapeHtml(a.id)}">
          <div class="nt-avatar">${initials}</div>
          <div style="flex:1; min-width:0;">
            <div class="nt-athlete-name">${Utils.escapeHtml(a.full_name)}</div>
            <div class="nt-athlete-addr ${hasAddr ? '' : 'missing'}">
              ${hasAddr ? '<i class="ph ph-map-pin"></i> ' + Utils.escapeHtml(a.residence_address) : '<i class="ph ph-warning"></i> Indirizzo mancante'}
            </div>
            ${!hasAddr && isSelected ? `<input class="nt-addr-input" type="text" data-addr-for="${Utils.escapeHtml(a.id)}" placeholder="Inserisci indirizzo..." onclick="event.stopPropagation()">` : ''}
          </div>
        </div>`;
    }).join('');

    // Attach click handlers
    grid.querySelectorAll('.nt-athlete-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('nt-addr-input')) return;
        const id = card.dataset.athleteId;
        const athlete = _athletes.find(a => a.id === id);
        if (!athlete) return;
        const idx = _selectedAthletes.findIndex(s => s.id === id);
        if (idx >= 0) {
          _selectedAthletes.splice(idx, 1);
        } else {
          _selectedAthletes.push({ ...athlete });
        }
        _renderAthleteGrid();
      }, { signal: _ac.signal });
    });

    // Address inputs: blur fallback + Google Places Autocomplete
    grid.querySelectorAll('.nt-addr-input').forEach(input => {
      input.addEventListener('blur', () => {
        const id = input.dataset.addrFor;
        const val = input.value.trim();
        if (val.length > 3) {
          const sa = _selectedAthletes.find(s => s.id === id);
          const orig = _athletes.find(a => a.id === id);
          if (sa) sa.residence_address = val;
          if (orig) orig.residence_address = val;
          _renderAthleteGrid();
        }
      }, { signal: _ac.signal });

      // Autocomplete Google per geocodifica precisa
      _loadPlacesLib(() => _attachGoogleAutocomplete(input, ({ lat, lng, address }) => {
        const id = input.dataset.addrFor;
        _verifiedCoords.set(address, { lat, lng });
        const sa = _selectedAthletes.find(s => s.id === id);
        const orig = _athletes.find(a => a.id === id);
        if (sa) sa.residence_address = address;
        if (orig) orig.residence_address = address;
        _renderAthleteGrid();
      }));
    });
  }

  // ── Helpers condivisi: Google Maps Places Library ───────────────────────────
  function _loadPlacesLib(cb) {
    if (typeof google !== 'undefined' && google.maps && google.maps.places) { _injectPacStyles(); cb(); return; }
    const apiKey = window.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return; // nessuna API key — salta silenziosamente
    if (document.querySelector('script[data-gmaps-places]')) {
      // Script già iniettato, aspetta che carichi
      const poll = setInterval(() => { if (typeof google !== 'undefined' && google.maps?.places) { clearInterval(poll); _injectPacStyles(); cb(); } }, 100);
      return;
    }
    const cbName = '__gmPlaces_' + Date.now();
    window[cbName] = () => { delete window[cbName]; _injectPacStyles(); cb(); };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=${cbName}`;
    s.async = true; s.defer = true; s.dataset.gmapsPlaces = '1';
    document.head.appendChild(s);
  }

  // Inietta i CSS del dropdown Places (tema scuro + fix icone "?")
  function _injectPacStyles() {
    if (document.getElementById('gm-pac-styles')) return; // già iniettato
    const style = document.createElement('style');
    style.id = 'gm-pac-styles';
    style.textContent = `
      .pac-container {
        background: #18181c !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 12px !important;
        box-shadow: 0 12px 40px rgba(0,0,0,0.6) !important;
        font-family: inherit !important;
        overflow: hidden !important;
        margin-top: 4px !important;
      }
      .pac-container::after { display: none !important; } /* rimuove logo Google */
      .pac-item {
        color: rgba(255,255,255,0.8) !important;
        border-top: 1px solid rgba(255,255,255,0.06) !important;
        padding: 10px 14px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
      }
      .pac-item:first-child { border-top: none !important; }
      .pac-item:hover, .pac-item-selected { background: rgba(0,229,255,0.08) !important; }
      .pac-item-query { color: #fff !important; font-weight: 600 !important; font-size: 13px !important; }
      .pac-matched { color: #00e5ff !important; font-weight: 700 !important; }
      .pac-icon { display: none !important; } /* nasconde le icone pin che appaiono come "?" */
      .pac-secondary-text { color: rgba(255,255,255,0.45) !important; font-size: 12px !important; }
    `;
    document.head.appendChild(style);
  }

  // Attacca Places Autocomplete a un <input>; chiama onPlace({lat, lng, address})
  function _attachGoogleAutocomplete(input, onPlace) {
    if (!input || typeof google === 'undefined' || !google.maps?.places) return;
    const ac = new google.maps.places.Autocomplete(input, {
      types: ['establishment', 'geocode'],
      fields: ['formatted_address', 'geometry', 'name'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || input.value;
      input.value = address;
      if (onPlace) onPlace({ lat, lng, address, place });
    });
  }

  function _showAddGymModal() {
    // Stores lat/lng obtained from Places Autocomplete (if available)
    let _gymLat = null, _gymLng = null;

    const m = UI.modal({
      title: 'Nuova Palestra',
      body: `
        <div class="form-group"><label class="form-label" for="gym-name">Nome *</label><input id="gym-name" class="form-input" type="text" placeholder="Palazzetto dello Sport" autocomplete="off"></div>
        <div class="form-group">
          <label class="form-label" for="gym-address">Indirizzo <span style="font-size:11px; opacity:0.5;">(verifica con Google Maps)</span></label>
          <input id="gym-address" class="form-input" type="text" placeholder="Via Roma 1, Milano" autocomplete="off">
          <div id="gym-map-preview" style="display:none; margin-top:10px; border-radius:10px; overflow:hidden; height:180px; border:1px solid rgba(255,255,255,0.1);"></div>
        </div>
        <div id="gym-error" class="form-error hidden"></div>`,
      footer: `<button class="btn btn-ghost btn-sm" id="gym-cancel" type="button">Annulla</button><button class="btn btn-primary btn-sm" id="gym-save" type="button">SALVA</button>`,
    });

    // NOTE: These listeners do NOT use _ac.signal — they belong to the modal
    // lifecycle, not the module lifecycle. Using _ac.signal would abort them
    // if the module's AbortController is reset while the modal is still open.
    document.getElementById('gym-cancel')?.addEventListener('click', () => m.close());
    document.getElementById('gym-save')?.addEventListener('click', async () => {
      const name = document.getElementById('gym-name').value.trim();
      const address = document.getElementById('gym-address').value.trim();
      const errEl = document.getElementById('gym-error');
      if (!name) { errEl.textContent = 'Nome obbligatorio'; errEl.classList.remove('hidden'); return; }
      const btn = document.getElementById('gym-save');
      btn.disabled = true; btn.textContent = 'Salvataggio...';
      try {
        const res = await Store.api('createGym', 'transport', {
          name,
          address: address || null,
          lat: _gymLat,
          lng: _gymLng,
        });
        const newGym = { id: res.id, name, address, lat: _gymLat, lng: _gymLng };
        _gyms.push(newGym);
        // Update dropdown
        const select = document.getElementById('nt-gym-select');
        if (select) {
          const opt = document.createElement('option');
          opt.value = res.id;
          opt.textContent = name;
          opt.dataset.address = address;
          opt.dataset.lat = _gymLat || '';
          opt.dataset.lng = _gymLng || '';
          select.appendChild(opt);
          select.value = res.id;
          _selectedGym = newGym;
        }
        m.close(); UI.toast('Palestra aggiunta!', 'success');
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'SALVA';
      }
    });

    // ── Google Places Autocomplete sull'indirizzo palestra ────────────────────
    _loadPlacesLib(() => _attachGoogleAutocomplete(
      document.getElementById('gym-address'),
      ({ lat, lng, place }) => {
        _gymLat = lat; _gymLng = lng;
        // Mini-mappa preview
        const previewEl = document.getElementById('gym-map-preview');
        if (previewEl && typeof google !== 'undefined') {
          previewEl.style.display = 'block';
          const map = new google.maps.Map(previewEl, {
            center: { lat, lng }, zoom: 15, disableDefaultUI: true, styles: _darkMapStyles(),
          });
          const addr = document.getElementById('gym-address')?.value || '';
          new google.maps.Marker({ position: { lat, lng }, map, title: addr });
        }
      }
    ));
  }

  async function _deleteGym() {
    if (!_selectedGym) {
      UI.toast('Seleziona prima una palestra da eliminare', 'error');
      return;
    }
    const gymName = _selectedGym.name;
    UI.confirm(`Eliminare la palestra "${gymName}"? L'operazione non può essere annullata.`, async () => {
      try {
        await Store.api('deleteGym', 'transport', { id: _selectedGym.id });
        // Remove from local array
        _gyms = _gyms.filter(g => g.id !== _selectedGym.id);
        // Remove option from select
        const select = document.getElementById('nt-gym-select');
        if (select) {
          const opt = select.querySelector(`option[value="${_selectedGym.id}"]`);
          if (opt) opt.remove();
          select.value = '';
        }
        _selectedGym = null;
        UI.toast(`Palestra "${gymName}" eliminata`, 'success');
      } catch (err) {
        UI.toast('Errore: ' + err.message, 'error');
      }
    });
  }

  // ── Helpers per Drag & Drop e Google Directions ──
  function _loadSortableJS(cb) {
    if (window.Sortable) { cb(); return; }
    if (!document.getElementById('sortable-js')) {
      const script = document.createElement('script');
      script.id = 'sortable-js';
      script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js';
      script.onload = cb;
      document.head.appendChild(script);
    } else {
      const poll = setInterval(() => { if (window.Sortable) { clearInterval(poll); cb(); } }, 100);
    }
  }

  async function _getGoogleDirections(origin, destination, waypoints, optimize = true) {
    return new Promise((resolve, reject) => {
      _loadPlacesLib(() => {
        if (typeof google === 'undefined' || !google.maps || !google.maps.DirectionsService) {
          return reject(new Error("Google Maps API non accessibile."));
        }
        const directionsService = new google.maps.DirectionsService();
        const req = {
          origin: origin,
          destination: destination,
          waypoints: waypoints.map(w => ({ location: w, stopover: true })),
          optimizeWaypoints: optimize,
          travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(req, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) resolve(result);
          else reject(new Error(status));
        });
      });
    });
  }

  async function _recalculateTimelineTimes() {
    const timelineCont = document.querySelector('.nt-timeline');
    if (!timelineCont || !_currentTransportResult) return;
    const items = Array.from(timelineCont.children);
    const newAthletesOrder = [];

    items.forEach(el => {
      if (!el.classList.contains('partenza') && !el.classList.contains('arrivo')) {
        const atletaName = el.querySelector('.nt-tl-note').textContent.replace('Raccolta ', '');
        const atleta = _selectedAthletes.find(a => a.full_name === atletaName);
        if (atleta) newAthletesOrder.push(atleta);
      }
    });

    if (newAthletesOrder.length !== _selectedAthletes.length) return; // Mismatch o caricamento in corso
    UI.toast('Ricalcolo percorso manuale...', 'info');

    try {
      const departureAddr = document.getElementById('nt-departure-addr')?.value;
      const destination = _selectedGym.address || _selectedGym.name;
      const arrivalTime = document.getElementById('nt-arrival-time')?.value;
      const waypointAddrs = newAthletesOrder.map(a => a.residence_address);

      const res = await _getGoogleDirections(departureAddr, destination, waypointAddrs, false);
      const route = res.routes[0];

      let totalDistanceM = 0; let totalDurationSec = 0;
      const legDurations = []; const routePoints = [];

      routePoints.push({ lat: route.legs[0].start_location.lat(), lng: route.legs[0].start_location.lng(), label: departureAddr });

      for (let i = 0; i < route.legs.length; i++) {
        const leg = route.legs[i];
        const distM = leg.distance.value;
        const driveSec = leg.duration.value;
        const stopSec = (i > 0 && i < route.legs.length - 1) ? 180 : 0; // 3 min stop
        totalDistanceM += distM;
        totalDurationSec += driveSec + stopSec;
        legDurations.push(driveSec + stopSec);
        routePoints.push({ lat: leg.end_location.lat(), lng: leg.end_location.lng(), label: leg.end_address });
      }

      const stats = {
        durata: Math.round(totalDurationSec / 60) + ' min',
        distanza: (totalDistanceM / 1000).toFixed(1) + ' km',
        tappe: newAthletesOrder.length,
      };

      const [hh, mm] = arrivalTime.split(':').map(Number);
      const targetDate = new Date(); targetDate.setHours(hh, mm, 0, 0);
      const partenzaDate = new Date(targetDate.getTime() - (totalDurationSec * 1000));

      const timeline = [];
      let currentDate = new Date(partenzaDate);
      timeline.push({ tipo: 'partenza', luogo: departureAddr, orario: currentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), nota: 'Partenza Mezzo', coord: routePoints[0] });

      legDurations.forEach((dur, i) => {
        currentDate = new Date(currentDate.getTime() + dur * 1000);
        if (i < newAthletesOrder.length) {
          const atleta = newAthletesOrder[i];
          timeline.push({ tipo: 'raccolta', luogo: atleta.residence_address, orario: currentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), nota: `Raccolta ${atleta.full_name}`, atleta_id: atleta.id, atleta_name: atleta.full_name, coord: routePoints[i + 1] });
        } else {
          timeline.push({ tipo: 'arrivo', luogo: _selectedGym.name, orario: currentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), nota: `Arrivo — Target: ${arrivalTime}`, coord: routePoints[routePoints.length - 1] });
        }
      });

      _currentTransportResult.timeline = timeline;
      _currentTransportResult.stats = stats;
      _currentTransportResult.departureTime = partenzaDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

      _renderResults(timeline, stats, _currentTransportResult.ai, routePoints);

    } catch (err) {
      UI.toast('Errore nel ricalcolo: ' + err.message, 'error');
    }
  }

  async function _handleCalcolaPercorso() {
    // Validate
    if (!_selectedGym) { UI.toast('Seleziona una palestra di destinazione', 'error'); return; }
    const arrivalTime = document.getElementById('nt-arrival-time')?.value;
    if (!arrivalTime) { UI.toast("Inserisci l'orario di arrivo", 'error'); return; }
    const departureAddr = document.getElementById('nt-departure-addr')?.value;
    if (!departureAddr) { UI.toast("Inserisci l'indirizzo di partenza", 'error'); return; }
    if (_selectedAthletes.length === 0) { UI.toast("Seleziona almeno un'atleta", 'error'); return; }

    const missingAddr = _selectedAthletes.filter(a => !a.residence_address || !a.residence_address.trim());
    if (missingAddr.length > 0) {
      UI.toast(`${missingAddr.length} atlete senza indirizzo. Compilare prima di procedere.`, 'error');
      return;
    }

    const btn = document.getElementById('nt-calc-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;"></div> Calcolo in corso...';

    try {
      const destination = _selectedGym.address || _selectedGym.name;

      // ── Step 1: Calcola e ottimizza il percorso con Google Maps Directions ──
      btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;"></div> Calcolo percorso Google...';
      const waypointAddrs = _selectedAthletes.map(a => a.residence_address);
      let directionsResult = null;
      try {
        directionsResult = await _getGoogleDirections(departureAddr, destination, waypointAddrs, true);
      } catch (err) {
        throw new Error('Impossibile calcolare il percorso con Google Maps: ' + err.message);
      }

      const route = directionsResult.routes[0];
      const waypointOrder = route.waypoint_order;
      const orderedAthletes = waypointOrder.map(i => _selectedAthletes[i]);

      let totalDistanceM = 0; let totalDurationSec = 0;
      const legDurations = []; const routePoints = []; const legDetails = [];

      routePoints.push({ lat: route.legs[0].start_location.lat(), lng: route.legs[0].start_location.lng(), label: departureAddr });

      for (let i = 0; i < route.legs.length; i++) {
        const leg = route.legs[i];
        const distM = leg.distance.value;
        const driveSec = leg.duration.value;
        const stopSec = (i > 0 && i < route.legs.length - 1) ? 180 : 0; // 3 min stop per atleta elaborata

        totalDistanceM += distM;
        totalDurationSec += driveSec + stopSec;
        legDurations.push(driveSec + stopSec);
        legDetails.push({ durata: leg.duration.text, distanza: leg.distance.text });

        routePoints.push({ lat: leg.end_location.lat(), lng: leg.end_location.lng(), label: leg.end_address });
      }

      const stats = {
        durata: Math.round(totalDurationSec / 60) + ' min',
        distanza: (totalDistanceM / 1000).toFixed(1) + ' km',
        tappe: _selectedAthletes.length,
      };

      // ── Step 2: Costruisci timeline ──
      const [hh, mm] = arrivalTime.split(':').map(Number);
      const targetDate = new Date(); targetDate.setHours(hh, mm, 0, 0);
      const partenzaDate = new Date(targetDate.getTime() - (totalDurationSec * 1000));

      const timeline = [];
      let currentDate = new Date(partenzaDate);
      timeline.push({ tipo: 'partenza', luogo: departureAddr, orario: currentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), nota: 'Partenza Mezzo', coord: routePoints[0] });

      legDurations.forEach((dur, i) => {
        currentDate = new Date(currentDate.getTime() + dur * 1000);
        if (i < orderedAthletes.length) {
          const atleta = orderedAthletes[i];
          timeline.push({ tipo: 'raccolta', luogo: atleta.residence_address, orario: currentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), nota: `Raccolta ${atleta.full_name}`, atleta_id: atleta.id, atleta_name: atleta.full_name, coord: routePoints[i + 1] });
        } else {
          timeline.push({ tipo: 'arrivo', luogo: _selectedGym.name, orario: currentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), nota: `Arrivo — Target: ${arrivalTime}`, coord: routePoints[routePoints.length - 1] });
        }
      });

      _currentTransportResult = { timeline, stats, ai: null, departureTime: partenzaDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) };

      // ── Step 3: Mostra risultati parziali mappa ──
      _renderResults(timeline, stats, null, routePoints);

      // ── Step 4: AI analizza i tempi e le tappe ──
      btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;"></div> AI analizza...';
      try {
        const aiData = await _askGeminiRouteGoogle(departureAddr, destination, orderedAthletes, stats, legDetails);
        _currentTransportResult.ai = aiData;
        _updateAiCard(aiData);
      } catch (e) {
        console.warn('AI analysis failed:', e);
        _updateAiCard({ consigli: 'Analisi AI non disponibile al momento.', fuori_percorso: [], punti_raccolta: [] });
      }

    } catch (err) {
      UI.toast('Errore calcolo percorso: ' + err.message, 'error');
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-route" style="font-size:22px;"></i> Ricalcola Percorso';
    }
  }

  async function _askGeminiRouteGoogle(partenza, destinazione, orderedAthletes, stats, legDetails) {
    if (!GEMINI_API_KEY) return null;
    let desc = `Partenza mezzo: ${partenza}\nDestinazione (palestra): ${destinazione}\nDistanza totale: ${stats.distanza}\nDurata totale: ${stats.durata}\n\n`;
    desc += `Ordine tappe (ottimizzato dal navigatore):\n`;
    for (let i = 0; i < orderedAthletes.length; i++) {
      desc += `Tratta ${i + 1}: fino a ${orderedAthletes[i].full_name} a ${orderedAthletes[i].residence_address} -> ${legDetails[i].durata}, ${legDetails[i].distanza}\n`;
    }
    desc += `Ultima tratta fino a destinazione -> ${legDetails[orderedAthletes.length].durata}, ${legDetails[orderedAthletes.length].distanza}\n`;

    const prompt = `Sei l'AI analista dei trasporti sportivi. Analizza questo percorso già ottimizzato e fornisci preziose intuizioni sui tempi e su come si potrebbe ulteriormente ridurre il viaggio.
Dati viaggio:
${desc}

Compito:
1. Controlla i tempi delle singole tratte. Un tempo eccessivo indica un "fuori percorso".
2. Identifica atlete che generano deviazioni troppo grandi.
3. Se necessario, suggerisci punti di raccolta intermedi (es. "Ci troveremo al casello autostradale di ...") per evitare di entrare in zone non ottimali.
4. "consigli" DEVE essere una stringa breve (1 o 2 frasi) e discorsiva (es. "Il percorso è ottimale" o "Ci sono troppe deviazioni").
4. Rispondi SEMPRE in italiano.
5. Usa ESATTAMENTE le chiavi JSON indicate nell'esempio. NON AGGIUNGERE NESSUNA FORMA DI MARKDOWN (NO \`\`\`json).

Restituisci SOLO un oggetto JSON come questo:
{
  "consigli": "Il percorso è ottimale, ma Maria Rossi aggiunge 15 minuti di deviazione.",
  "fuori_percorso": [
    {"nome": "Maria Rossi", "motivo": "Aggiunge 15 minuti di deviazione rispetto alla rotta principale"}
  ],
  "punti_raccolta": [
    {"nome": "Casello Autostradale Est", "indirizzo": "Via Roma 100"}
  ]
}
`;
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!resp.ok) throw new Error('Gemini API status: ' + resp.status);
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      try {
        const m = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        return m ? JSON.parse(m[1]) : JSON.parse(text);
      } catch { return { consigli: text, fuori_percorso: [], punti_raccolta: [] }; }
    } catch (e) {
      console.warn('Gemini call failed:', e);
      throw e;
    }
  }

  function _renderResults(timeline, stats, aiData, routeData) {
    const container = document.getElementById('nt-results');
    container.style.display = 'block';
    container.innerHTML = `
      <div class="nt-stats-grid">
        <div class="nt-stat"><div class="nt-stat-val">${Utils.escapeHtml(stats.durata)}</div><div class="nt-stat-lbl">Durata Stimata</div></div>
        <div class="nt-stat"><div class="nt-stat-val">${Utils.escapeHtml(stats.distanza)}</div><div class="nt-stat-lbl">Distanza</div></div>
        <div class="nt-stat"><div class="nt-stat-val">${stats.tappe}</div><div class="nt-stat-lbl">Tappe</div></div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 24px; align-items: stretch;">
        
        <!-- Left Column: Route map & AI -->
        <div style="display:flex; flex-direction:column; gap:24px;">
          <!-- Route map -->
          <div class="nt-step" style="padding:0; overflow:hidden; margin:0; flex: 1; display:flex; flex-direction:column;">
            <div id="nt-route-map" style="width:100%; flex:1; min-height: 320px; background:#0a0a0c; display:flex; align-items:center; justify-content:center;">
              <div style="text-align:center; color:rgba(255,255,255,0.3);">
                <div class="spinner" style="margin:0 auto 12px;"></div>
                <p style="font-size:13px; font-family:var(--font-display); text-transform:uppercase; letter-spacing:1px;">Caricamento mappa...</p>
              </div>
            </div>
          </div>

          <!-- AI Analysis card — loading state initially -->
          <div class="nt-ai-card" id="nt-ai-card" style="margin:0; flex-shrink: 0;">
            <div class="nt-ai-title"><i class="ph ph-robot" style="font-size:20px;"></i> Analisi AI (Gemini)</div>
            <div id="nt-ai-body" style="display:flex; align-items:center; gap:12px; color:rgba(255,255,255,0.5); font-size:14px;">
              <div class="spinner" style="width:18px; height:18px; flex-shrink:0;"></div>
              <span>Gemini sta analizzando il percorso...</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Timeline -->
        <div class="nt-step" style="margin:0; height: 100%; display:flex; flex-direction:column;">
          <span class="nt-step-num" style="background:rgba(255,255,255,0.1); color:#fff; border-color:rgba(255,255,255,0.2);"><i class="ph ph-clock"></i></span>
          <h3 class="nt-step-title">Timeline Percorso</h3>
          <div class="nt-timeline" style="margin-top:24px; flex: 1; overflow-y: auto;">
            ${timeline.map(t => `
              <div class="nt-tl-item ${t.tipo}">
                <div class="nt-tl-time">${Utils.escapeHtml(t.orario)}</div>
                <div class="nt-tl-note">${Utils.escapeHtml(t.nota)}</div>
                <div class="nt-tl-place"><i class="ph ph-map-pin"></i> ${Utils.escapeHtml(t.luogo)}</div>
              </div>`).join('')}
          </div>
        </div>

      </div>

      <div style="display:flex; gap:16px; flex-wrap:wrap;">
        <button class="nt-save-btn" id="nt-save-btn" type="button"><i class="ph ph-floppy-disk" style="font-size:20px;"></i> Salva Trasporto</button>
        <button class="btn-dash ghost" onclick="window.print()" type="button"><i class="ph ph-printer"></i> Stampa</button>
      </div>`;

    document.getElementById('nt-save-btn')?.addEventListener('click', _saveTransport, { signal: _ac.signal });
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Render route map after DOM is ready
    if (routeData) {
      _renderRouteMap(routeData);
    } else {
      const mapEl = document.getElementById('nt-route-map');
      if (mapEl) mapEl.innerHTML = '<div style="text-align:center; color:rgba(255,255,255,0.3); padding:40px;"><i class="ph ph-map-pin-line" style="font-size:48px; display:block; margin-bottom:12px;"></i><p style="font-size:13px; font-family:var(--font-display); text-transform:uppercase; letter-spacing:1px;">Nessuna coordinata disponibile</p></div>';
    }

    // Update AI card — always called AFTER the DOM is ready
    // (even if aiData is null, shows the fallback state)
    if (aiData) {
      _updateAiCard(aiData);
    }

    // Inizializza Drag & Drop sulla timeline
    _loadSortableJS(() => {
      const timelineCont = document.querySelector('.nt-timeline');
      if (timelineCont && !timelineCont.dataset.sortable) {
        timelineCont.dataset.sortable = '1';
        window.Sortable.create(timelineCont, {
          animation: 150,
          filter: '.partenza, .arrivo',
          onEnd: function (evt) {
            if (evt.oldIndex === evt.newIndex) return;
            _recalculateTimelineTimes();
          }
        });
      }
    });
  }

  function _updateAiCard(aiData) {
    const bodyEl = document.getElementById('nt-ai-body');
    if (!bodyEl) return;
    if (!aiData || !aiData.consigli) {
      bodyEl.innerHTML = '<span style="color:rgba(255,255,255,0.4); font-size:14px;">Analisi AI non disponibile al momento.</span>';
      return;
    }
    bodyEl.innerHTML = `
      <div style="width:100%;">
        <p style="font-size:14px; line-height:1.6; color:rgba(255,255,255,0.85); margin:0;">${Utils.escapeHtml(aiData.consigli)}</p>
        ${aiData.fuori_percorso && aiData.fuori_percorso.length ? `
          <div style="margin-top:12px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.1);">
            <p style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#E6007E; font-weight:700; margin-bottom:8px;"><i class="ph ph-warning"></i> Atlete Fuori Percorso</p>
            ${aiData.fuori_percorso.map(fp => `<div style="font-size:13px; margin-bottom:4px;"><strong>${Utils.escapeHtml(fp.nome)}</strong>: ${Utils.escapeHtml(fp.motivo)}</div>`).join('')}
          </div>` : ''}
        ${aiData.punti_raccolta && aiData.punti_raccolta.length ? `
          <div style="margin-top:12px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.1);">
            <p style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#00e5ff; font-weight:700; margin-bottom:8px;"><i class="ph ph-map-pin"></i> Punti di Raccolta Suggeriti</p>
            ${aiData.punti_raccolta.map(pr => `<div style="font-size:13px; margin-bottom:4px;"><strong>${Utils.escapeHtml(pr.nome)}</strong>: ${Utils.escapeHtml(pr.indirizzo)}</div>`).join('')}
          </div>` : ''}
      </div>`;
  }

  // ─── Mappa percorso con Leaflet.js (tutti i waypoint + polyline) ─────────────
  function _renderRouteMap(routePoints) {
    const mapEl = document.getElementById('nt-route-map');
    if (!mapEl || !routePoints || !routePoints.length) return;

    const validPts = routePoints.filter(p => p && p.lat && p.lng);
    if (!validPts.length) {
      mapEl.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px;"><i class="ph ph-map-pin-line" style="font-size:48px;display:block;margin-bottom:12px;"></i><p>Coordinate non disponibili</p></div>';
      return;
    }

    // Crea container mappa + legenda
    mapEl.style.display = 'flex';
    mapEl.style.flexDirection = 'column';
    mapEl.style.height = '100%';
    const mapDivId = 'leaflet-map-' + Date.now();
    mapEl.innerHTML = `
      <div id="${mapDivId}" style="width:100%; flex:1; min-height:300px;"></div>
      <div id="${mapDivId}-legend" style="padding:8px 16px; background:rgba(0,0,0,0.5); font-size:11px; color:rgba(255,255,255,0.5); display:flex; gap:16px; flex-wrap:wrap;">
        ${validPts.map((p, i) => {
      const isFirst = i === 0;
      const isLast = i === validPts.length - 1;
      const color = isFirst ? '#00e5ff' : isLast ? '#00E676' : '#E6007E';
      const label = isFirst ? '🔵 Partenza' : isLast ? '🟢 Palestra' : `🔴 Tappa ${i}`;
      const addr = (p.label || '').split(',')[0] || '...';
      return `<span style="display:flex;align-items:center;gap:4px;"><span style="color:${color};font-weight:700;">${label}</span><span style="opacity:0.7;">${Utils.escapeHtml(addr)}</span></span>`;
    }).join('')}
      </div>`;

    function _initLeafletMap() {
      const L = window.L;
      // Stile scuro per OSM tiles
      const map = L.map(mapDivId, { zoomControl: true, scrollWheelZoom: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Polyline percorso
      const latlngs = validPts.map(p => [p.lat, p.lng]);
      L.polyline(latlngs, { color: '#00e5ff', weight: 3, opacity: 0.8, dashArray: '8, 4' }).addTo(map);

      // Marker per ogni tappa con icona SVG colorata e numero
      validPts.forEach((p, i) => {
        const isFirst = i === 0;
        const isLast = i === validPts.length - 1;
        const bg = isFirst ? '#00e5ff' : isLast ? '#00E676' : '#E6007E';
        const textC = isFirst || isLast ? '#000' : '#fff';
        const stepLabel = isFirst ? '🚐' : isLast ? '🏟' : String(i);
        const iconHtml = `<div style="width:32px;height:32px;border-radius:50%;background:${bg};color:${textC};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.6);">${stepLabel}</div>`;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
        const addr = p.label || '—';
        L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`<b style="color:${bg}">${isFirst ? 'Partenza' : isLast ? 'Palestra' : 'Tappa ' + i}</b><br><small>${addr}</small>`);
      });

      // Adatta la vista a tutti i punti
      map.fitBounds(latlngs, { padding: [24, 24] });

      // Forza il ricalcolo delle dimensioni quando la mappa viene caricata in un contenitore flex
      setTimeout(() => map.invalidateSize(), 300);
    }

    // Carica Leaflet CSS+JS solo se non già caricato
    function _loadLeaflet(cb) {
      if (window.L) { cb(); return; }
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = cb;
        document.head.appendChild(script);
      } else {
        // Script già nel DOM ma ancora in caricamento
        const poll = setInterval(() => { if (window.L) { clearInterval(poll); cb(); } }, 100);
      }
    }

    _loadLeaflet(_initLeafletMap);
  }

  async function _saveTransport() {
    if (!_currentTransportResult || !_selectedGym || !_selectedTeam) { UI.toast('Dati incompleti', 'error'); return; }
    const btn = document.getElementById('nt-save-btn');
    btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;"></div> Salvataggio...';
    try {
      await Store.api('saveTransport', 'transport', {
        team_id: _selectedTeam,
        destination_name: _selectedGym.name,
        destination_address: _selectedGym.address || null,
        destination_lat: _selectedGym.lat || null,
        destination_lng: _selectedGym.lng || null,
        departure_address: document.getElementById('nt-departure-addr')?.value || null,
        arrival_time: document.getElementById('nt-arrival-time')?.value,
        departure_time: _currentTransportResult.departureTime || null,
        transport_date: document.getElementById('nt-transport-date')?.value || new Date().toISOString().slice(0, 10),
        athletes_json: _selectedAthletes.map(a => ({ id: a.id, name: a.full_name, address: a.residence_address })),
        timeline_json: _currentTransportResult.timeline,
        stats_json: _currentTransportResult.stats,
        ai_response: _currentTransportResult.ai || null,
      });
      UI.toast('Trasporto salvato con successo!', 'success');
      showStorico();
    } catch (err) {
      UI.toast('Errore: ' + err.message, 'error');
      btn.disabled = false; btn.innerHTML = '<i class="ph ph-floppy-disk" style="font-size:20px;"></i> Salva Trasporto';
    }
  }

  // ═══ STORICO TRASPORTI ═════════════════════════════════════════════════════
  async function showStorico() {
    const app = document.getElementById('app');
    app.innerHTML = UI.skeletonPage();
    try {
      const transports = await Store.get('listTransports', 'transport');

      const stStyles = `
      <style>
        .st-page { padding:24px; animation:fade-in 0.4s ease-out; }
        @keyframes fade-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .st-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
        .st-title { font-family:var(--font-display); font-size:28px; font-weight:800; text-transform:uppercase; background:linear-gradient(90deg,#fff,rgba(255,255,255,0.6)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; display:flex; align-items:center; gap:14px; }
        .st-card { background:rgba(20,20,25,0.6); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.06); border-radius:20px; padding:24px; margin-bottom:16px; transition:all 0.3s; position:relative; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.3); }
        .st-card:hover { border-color:rgba(255,255,255,0.15); transform:translateY(-3px); }
        .st-card::before { content:''; position:absolute; top:0; left:0; width:100%; height:3px; background:linear-gradient(90deg,#00e5ff,transparent); }
        .st-card-title { font-family:var(--font-display); font-size:18px; font-weight:800; text-transform:uppercase; color:#00e5ff; }
        .st-card-meta { font-size:13px; color:rgba(255,255,255,0.5); margin-top:8px; display:flex; gap:16px; flex-wrap:wrap; }
        .st-card-athletes { font-size:13px; color:rgba(255,255,255,0.7); margin-top:12px; }
      </style>`;

      app.innerHTML = stStyles + `
      <div class="st-page">
        <div class="st-top">
          <div class="st-title">
            <button class="btn-dash ghost" id="st-back" type="button" style="padding:10px;"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>
            Storico <span style="color:#00e5ff;">Trasporti</span>
          </div>
          <button class="btn-dash primary" id="st-nuovo-btn" type="button"><i class="ph ph-plus-circle" style="font-size:18px;"></i> NUOVO TRASPORTO</button>
        </div>
        ${transports.length === 0 ? `
          <div style="text-align:center; padding:80px 20px; color:rgba(255,255,255,0.4);">
            <i class="ph ph-van" style="font-size:64px; display:block; margin-bottom:16px; opacity:0.3;"></i>
            <p style="font-family:var(--font-display); font-size:18px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Nessun Trasporto Salvato</p>
            <p style="margin-top:8px; font-size:14px;">Crea il tuo primo trasporto per vederlo qui.</p>
          </div>` : transports.map(trp => {
        let athletes = [];
        try { athletes = typeof trp.athletes_json === 'string' ? JSON.parse(trp.athletes_json) : (trp.athletes_json || []); } catch { athletes = []; }
        let stats = {};
        try { stats = typeof trp.stats_json === 'string' ? JSON.parse(trp.stats_json) : (trp.stats_json || {}); } catch { stats = {}; }
        const dateStr = trp.transport_date ? new Date(trp.transport_date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
        return `
            <div class="st-card">
              <div class="st-card-title"><i class="ph ph-map-pin" style="margin-right:8px;"></i>${Utils.escapeHtml(trp.destination_name)}</div>
              <div class="st-card-meta">
                <span><i class="ph ph-calendar-blank"></i> ${Utils.escapeHtml(dateStr)}</span>
                <span><i class="ph ph-clock"></i> Arrivo: ${Utils.escapeHtml(trp.arrival_time || '')}</span>
                ${trp.departure_time ? `<span><i class="ph ph-van"></i> Partenza: ${Utils.escapeHtml(trp.departure_time)}</span>` : ''}
                ${stats.durata ? `<span><i class="ph ph-timer"></i> ${Utils.escapeHtml(stats.durata)}</span>` : ''}
                ${stats.distanza ? `<span><i class="ph ph-navigation-arrow"></i> ${Utils.escapeHtml(stats.distanza)}</span>` : ''}
              </div>
              <div class="st-card-athletes">
                <i class="ph ph-users" style="margin-right:4px;"></i>
                ${athletes.map(a => Utils.escapeHtml(a.name || a.full_name || '')).join(', ') || 'Nessuna atleta'}
              </div>
            </div>`;
      }).join('')}
      </div>`;

      document.getElementById('st-back')?.addEventListener('click', () => renderEventList(), { signal: _ac.signal });
      document.getElementById('st-nuovo-btn')?.addEventListener('click', () => showNuovoTrasporto(), { signal: _ac.signal });
    } catch (err) {
      app.innerHTML = `<div style="padding:40px;text-align:center;"><p style="color:rgba(255,255,255,0.5);margin-bottom:24px;">Errore: ${Utils.escapeHtml(err.message)}</p><button class="btn btn-ghost" id="st-err-back" type="button"><i class="ph ph-arrow-left"></i> Torna indietro</button></div>`;
      document.getElementById('st-err-back')?.addEventListener('click', () => renderEventList(), { signal: _ac.signal });
    }
  }

  function destroy() {
    _ac.abort();
    _ac = new AbortController();
  }

  return { destroy, init };
})();
window.Transport = Transport;