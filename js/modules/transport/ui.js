/**
 * Transport UI Module
 * Fusion ERP v1.0
 */

'use strict';

const TransportUI = (() => {
  // ─── STYLES ───────────────────────────────────────────────────────────────
  const DASHBOARD_STYLES = `
    <style>
      .transport-dashboard {
        padding: 24px;
        --dash-bg: #030305;
        --card-bg: rgba(255, 255, 255, 0.03);
        --card-border: rgba(255, 255, 255, 0.08);
        --card-radius: 20px;
        --accent-cyan: #00e5ff;
        --accent-pink: #FF00FF;
        --glass-bg: rgba(20, 20, 25, 0.6);
        --glass-blur: blur(16px);
        --shadow-soft: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        --shadow-glow-pink: 0 0 20px rgba(255, 0, 255,0.2);
        --shadow-glow-cyan: 0 0 20px rgba(0,229,255,0.2);
        animation: fade-in 0.5s ease-out;
      }

      @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
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
      
      .dash-stat-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px; display: flex; justify-content: space-between; align-items: center; }
      .dash-stat-icon { font-size: 20px; color: rgba(255,255,255,0.4); padding: 8px; background: rgba(255,255,255,0.03); border-radius: 12px; }
      .dash-stat-value { font-family: var(--font-display); font-size: 42px; font-weight: 800; margin-top: 16px; line-height: 1; display: flex; align-items: baseline; gap: 12px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
      
      .dash-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 28px; }
      @media(max-width: 960px) { .dash-grid { grid-template-columns: 1fr; } }
      
      .dash-card { background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--card-radius); padding: 28px; box-shadow: var(--shadow-soft); transition: border-color 0.3s; }
      .dash-card:hover { border-color: rgba(255,255,255,0.12); }
      .dash-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 16px; }
      .dash-card-title { font-family: var(--font-display); font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 10px; }
      .dash-card-title::before { content: ''; display: inline-block; width: 4px; height: 18px; background: var(--accent-cyan); border-radius: 4px; }
      
      .dash-filters { display: flex; gap: 10px; margin-bottom: 28px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
      .dash-filters::-webkit-scrollbar { display: none; }
      .dash-filter {
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 30px;
        padding: 8px 20px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7); cursor: pointer;
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); white-space: nowrap; backdrop-filter: blur(8px);
      }
      .dash-filter:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); color: #fff; }
      .dash-filter.active { 
        background: linear-gradient(135deg, rgba(255, 0, 255,0.15), rgba(0,229,255,0.15)); 
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
      .dash-fixture.pink-line:hover::before { background: var(--accent-pink); box-shadow: 0 0 15px var(--accent-pink); }
      .dash-fixture.cyan-line:hover::before { background: var(--accent-cyan); box-shadow: 0 0 15px var(--accent-cyan); }
      .dash-fixture.yellow-line:hover::before { background: #FFD600; box-shadow: 0 0 15px #FFD600; }
      .dash-fixture.green-line:hover::before { background: #00E676; box-shadow: 0 0 15px #00E676; }

      .fixture-icon {
        width: 52px; height: 52px; border-radius: 14px; background: rgba(30,30,35,0.8); display: flex; align-items: center; justify-content: center;
        font-family: var(--font-display); font-weight: 800; font-size: 22px; color: #fff; border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;
        box-shadow: inset 0 2px 10px rgba(255,255,255,0.05); transition: transform 0.3s;
      }
      .dash-fixture:hover .fixture-icon { transform: scale(1.1) rotate(5deg); }
      .fixture-icon.pink { color: var(--accent-pink); border-color: rgba(255, 0, 255,0.3); background: rgba(255, 0, 255,0.1); text-shadow: 0 0 10px rgba(255, 0, 255,0.5); }
      .fixture-icon.cyan { color: var(--accent-cyan); border-color: rgba(0,229,255,0.3); background: rgba(0,229,255,0.1); text-shadow: 0 0 10px rgba(0,229,255,0.5); }
      .fixture-icon.yellow { color: #FFD600; border-color: rgba(255,214,0,0.3); background: rgba(255,214,0,0.1); text-shadow: 0 0 10px rgba(255,214,0,0.5); }
      .fixture-icon.green { color: #00E676; border-color: rgba(0,230,118,0.3); background: rgba(0,230,118,0.1); text-shadow: 0 0 10px rgba(0,230,118,0.5); }
      
      .fixture-details { flex: 1; min-width: 0; }
      .fixture-title { font-weight: 800; font-size: 16px; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; letter-spacing: 0.5px; }
      .fixture-sub { font-size: 13px; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 8px; }
      .fixture-sub span.pink { color: var(--accent-pink); font-weight: 600; }
      .fixture-sub span.cyan { color: var(--accent-cyan); font-weight: 600; }
      .fixture-sub span.yellow { color: #FFD600; font-weight: 600; }
      .fixture-sub span.green { color: #00E676; font-weight: 600; }
      
      .fixture-time-wrapper { text-align: right; margin-right: 16px; display: flex; flex-direction: column; align-items: flex-end; }
      .fixture-type-label { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; margin-bottom: 6px; }
      .fixture-time { font-size: 15px; font-weight: 800; font-family: var(--font-display); color: #fff; }

      .btn-dash { 
        background: rgba(255,255,255,0.04); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; 
        padding: 12px 24px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.3s; 
        text-transform: uppercase; letter-spacing: 1.5px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        backdrop-filter: blur(8px);
      }
      .btn-dash:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
      .btn-dash.primary { 
        background: linear-gradient(135deg, var(--accent-pink), #ff1a9a); color: #fff; border: none; 
        box-shadow: 0 4px 20px rgba(255, 0, 255,0.4); text-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
    </style>
  `;

  // ─── RENDERING FUNCTIONS ──────────────────────────────────────────────────
  function renderEventRow(ev, typeLabels) {
    let iconClass = 'pink';
    let iconLetter = 'E';
    let lineClass = 'pink-line';

    if (ev.type === 'away_game') { iconClass = 'cyan'; iconLetter = 'A'; lineClass = 'cyan-line'; }
    else if (ev.type === 'home_game') { iconClass = 'pink'; iconLetter = 'H'; lineClass = 'pink-line'; }
    else if (ev.type === 'training') { iconClass = 'yellow'; iconLetter = 'T'; lineClass = 'yellow-line'; }
    else if (ev.type === 'tournament') { iconClass = 'green'; iconLetter = 'T'; lineClass = 'green-line'; }

    const d = new Date(ev.event_date);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dayName = isNaN(d) ? '' : d.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();

    return `
      <div class="dash-fixture ${lineClass}" data-event-id="${Utils.escapeHtml(ev.id)}">
        <div class="fixture-icon ${iconClass}">${iconLetter}</div>
        <div class="fixture-details">
          <div class="fixture-title">${Utils.escapeHtml(ev.title)}</div>
          <div class="fixture-sub">
            <span class="${iconClass}"><i class="ph ph-map-pin"></i> ${Utils.escapeHtml(ev.location_name || 'TBD')}</span> 
            <span style="opacity:0.3; margin:0 4px;">•</span> 
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

  function renderEventListContent(events, typeLabels) {
    if (events.length === 0) return Utils.emptyState('Nessun evento programmato');

    const grouped = {};
    events.forEach(ev => {
      const d = new Date(ev.event_date);
      const key = isNaN(d) ? 'Da definire' : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).toUpperCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ev);
    });

    let html = '';
    for (const [dateToken, evs] of Object.entries(grouped)) {
      html += `<div class="dash-date-header">${dateToken}</div>`;
      evs.forEach(ev => html += renderEventRow(ev, typeLabels));
    }
    return html;
  }

  return { DASHBOARD_STYLES, renderEventRow, renderEventListContent };
})();

window.TransportUI = TransportUI;
