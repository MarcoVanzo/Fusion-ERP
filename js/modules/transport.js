/**
 * Transport Module — Events, Carpooling, Routes, Reimbursements
 * Fusion ERP v1.0
 */

'use strict';

const Transport = (() => {
    let _ac = new AbortController();

  let _events = [];
  let _currentEvent = null;

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
          ${canCreate ? `<button class="btn-dash primary" id="new-event-btn" type="button"><i class="ph ph-plus-circle" style="font-size:20px;"></i> NEW EVENT</button>` : ''}
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
    _attachEventListeners();
  }

function renderEventListContent(events, typeLabels) {
    if (events.length === 0) return Utils.emptyState('Nessun evento programmato');
    
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

    const timeStr = new Date(ev.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
      const dateStr = isNaN(evtDate) ? 'TBD' : evtDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' }).toUpperCase();
      
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
              <div class="route-driver-name">${Utils.escapeHtml(r.driver_name)} ${isFull? '<span style="font-size:10px; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; color:#fff; margin-left:8px;">COMPLETO</span>' : ''}</div>
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
                  <div>${isUnmatched ? 'IN SOSPESO' : m.passenger_status||'ASSEGNATO'}</div>
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

  function destroy() {
        _ac.abort();
        _ac = new AbortController();
    }

    return { destroy, init };
})();
window.Transport = Transport;