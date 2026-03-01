/**
 * Results Module — FIPAV Match Results & Standings
 * Fusion ERP v1.0
 */

'use strict';

const Results = (() => {
  let _ac = new AbortController();
  let _campionati = [];
  let _currentCampionato = null;
  let _currentView = 'matches'; // 'matches' | 'standings'

  // ─── Public API ───────────────────────────────────────────────────────────

  async function init() {
    _ac = new AbortController();
    _currentView = Router.getCurrentRoute() === 'results-standings' ? 'standings' : 'matches';

    _renderShell();
    await _loadCampionati();
  }

  function destroy() {
    _ac.abort();
    _ac = new AbortController();
  }

  // ─── Shell ─────────────────────────────────────────────────────────────────

  function _renderShell() {
    const app = document.getElementById('app');
    if (!app) return;

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.padding = '0';
      mainContent.style.backgroundColor = '#0a0a0c';
    }

    app.innerHTML = `
      <style>
        /* ── Results Module ────────────────────────────── */
        .res-container {
          padding: 28px 32px;
          color: white;
          background: #0a0a0c;
          min-height: 100%;
          font-family: var(--font-body), sans-serif;
        }

        .res-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .res-title-block { display: flex; flex-direction: column; gap: 4px; }
        .res-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .res-subtitle {
          font-size: 12px;
          color: var(--color-text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ── Toolbar ────────── */
        .res-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .res-select {
          background: #1c1c1e;
          border: 1px solid #2c2c2e;
          border-radius: 8px;
          color: white;
          font-size: 13px;
          font-family: var(--font-body), sans-serif;
          font-weight: 600;
          padding: 8px 12px;
          cursor: pointer;
          outline: none;
          min-width: 200px;
          transition: border-color 0.2s;
        }
        .res-select:hover, .res-select:focus { border-color: var(--color-pink); }

        .res-view-toggle {
          display: flex;
          background: #1c1c1e;
          border-radius: 8px;
          padding: 3px;
          gap: 3px;
        }
        .res-view-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }
        .res-view-btn.active {
          background: var(--color-pink);
          color: white;
        }

        .res-refresh-btn {
          background: #1c1c1e;
          border: 1px solid #2c2c2e;
          border-radius: 8px;
          color: var(--color-text-muted);
          padding: 8px 10px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .res-refresh-btn:hover { color: white; border-color: #444; }
        .res-refresh-btn.loading i { animation: res-spin 0.7s linear infinite; }

        @keyframes res-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Match Cards ─────── */
        .res-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 14px;
          margin-top: 20px;
        }

        .res-card {
          background: #121214;
          border: 1px solid #1c1c1e;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.2s, transform 0.15s;
          cursor: default;
        }
        .res-card:hover { border-color: #2c2c2e; transform: translateY(-1px); }
        .res-card.our-team {
          border-color: rgba(230,0,126,0.5);
          background: linear-gradient(135deg, #121214 0%, #1a0a10 100%);
        }
        .res-card.our-team:hover { border-color: rgba(230,0,126,0.85); }

        .res-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .res-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .res-badge.played    { background: #1c2b1c; color: #4caf50; }
        .res-badge.scheduled { background: #1c1f2e; color: #7986cb; }
        .res-badge.live      { background: #2b1c1c; color: #ef5350; animation: pulse-badge 1.4s ease-in-out infinite; }
        .res-badge.our-match { background: rgba(230,0,126,0.15); color: var(--color-pink); margin-left: 4px; }
        @keyframes pulse-badge { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

        .res-teams {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .res-team {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .res-team.away { align-items: flex-end; text-align: right; }
        .res-team-name {
          font-size: 14px;
          font-weight: 700;
          line-height: 1.2;
          color: white;
        }
        .res-team-name.our-name { color: var(--color-pink); }

        .res-score-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          min-width: 56px;
        }
        .res-score {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: white;
        }
        .res-score.win  { color: #4caf50; }
        .res-score.loss { color: #ef5350; }
        .res-score.vs   { font-size: 16px; color: var(--color-text-muted); font-weight: 600; }

        .res-time-label { font-size: 11px; color: var(--color-text-muted); font-weight: 600; }

        /* ── Standings Table ─── */
        .res-table-wrap {
          margin-top: 20px;
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #1c1c1e;
        }
        .res-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .res-table th {
          background: #0e0e10;
          color: var(--color-text-muted);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          padding: 10px 16px;
          text-align: left;
          border-bottom: 1px solid #1c1c1e;
        }
        .res-table th.center { text-align: center; }
        .res-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #111;
          color: white;
          font-weight: 500;
        }
        .res-table td.center { text-align: center; }
        .res-table tr:last-child td { border-bottom: none; }
        .res-table tr:hover td { background: #161618; }
        .res-table tr.our-row td { background: rgba(230,0,126,0.07); }
        .res-table tr.our-row:hover td { background: rgba(230,0,126,0.12); }

        .res-pos {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 15px;
          color: var(--color-text-muted);
          min-width: 28px;
        }
        .res-pos.top3 { color: white; }
        .pos-medal { font-size: 16px; }

        .res-team-cell { display: flex; align-items: center; gap: 8px; }
        .res-team-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--color-pink);
          flex-shrink: 0;
        }

        /* ── Empty / Loading ─── */
        .res-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--color-text-muted);
          gap: 12px;
          text-align: center;
        }
        .res-empty i { font-size: 48px; opacity: 0.4; }
        .res-empty-title { font-size: 16px; font-weight: 700; }
        .res-empty-sub { font-size: 13px; opacity: 0.6; max-width: 320px; }

        .res-loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 14px;
          margin-top: 20px;
        }
        .res-skel-card {
          background: #121214;
          border: 1px solid #1c1c1e;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .res-last-update {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 16px;
          text-align: right;
        }
      </style>

      <div class="res-container">
        <div class="res-header">
          <div class="res-title-block">
            <div class="res-title">🏐 Risultati</div>
            <div class="res-subtitle">FIPAV Venezia — Portale Federale</div>
          </div>
          <div class="res-toolbar">
            <select id="res-campionato-select" class="res-select">
              <option value="">Caricamento campionati...</option>
            </select>
            <div class="res-view-toggle">
              <button class="res-view-btn ${_currentView === 'matches' ? 'active' : ''}"
                id="res-btn-matches" onclick="Results._switchView('matches')">Partite</button>
              <button class="res-view-btn ${_currentView === 'standings' ? 'active' : ''}"
                id="res-btn-standings" onclick="Results._switchView('standings')">Classifica</button>
            </div>
            <button class="res-refresh-btn" id="res-refresh-btn" title="Aggiorna" onclick="Results._refresh()">
              <i class="ph ph-arrows-clockwise"></i>
            </button>
          </div>
        </div>

        <div id="res-content">
          ${_skeletonCards()}
        </div>
      </div>
    `;
  }

  // ─── Data Loading ─────────────────────────────────────────────────────────

  async function _loadCampionati() {
    try {
      const data = await Store.get('getCampionati', 'results');
      _campionati = data.campionati || [];

      const select = document.getElementById('res-campionato-select');
      if (!select) return;

      if (_campionati.length === 0) {
        select.innerHTML = '<option value="">Nessun campionato trovato</option>';
        _renderEmpty('Nessun campionato disponibile', 'Il portale FIPAV non ha restituito campionati. Riprovare più tardi.');
        return;
      }

      select.innerHTML = _campionati.map((c, i) =>
        `<option value="${Utils.escapeHtml(c.id)}" data-url="${Utils.escapeHtml(c.url || '')}" data-standings-url="${Utils.escapeHtml(c.standings_url || '')}">${Utils.escapeHtml(c.label)}</option>`
      ).join('');

      select.addEventListener('change', () => {
        const opt = select.options[select.selectedIndex];
        _currentCampionato = {
          id: opt.value,
          url: opt.dataset.url,
          standingsUrl: opt.dataset.standingsUrl,
          label: opt.textContent
        };
        _loadCurrentView();
      });

      // Auto-select first
      const firstOpt = select.options[0];
      _currentCampionato = {
        id: firstOpt.value,
        url: firstOpt.dataset.url,
        standingsUrl: firstOpt.dataset.standingsUrl,
        label: firstOpt.textContent
      };
      await _loadCurrentView();

    } catch (err) {
      console.error('[Results] getCampionati error:', err);
      _renderError('Impossibile caricare i campionati FIPAV. Controlla la connessione e riprova.');
    }
  }

  async function _loadCurrentView() {
    if (_currentView === 'matches') {
      await _loadMatches();
    } else {
      await _loadStandings();
    }
  }

  async function _loadMatches() {
    const contentEl = document.getElementById('res-content');
    if (contentEl) contentEl.innerHTML = _skeletonCards();

    try {
      const params = {};
      if (_currentCampionato?.url) {
        params.campionato_url = _currentCampionato.url;
      } else if (_currentCampionato?.id) {
        params.campionato_id = _currentCampionato.id;
      }

      const data = await Store.get('getResults', 'results', params);
      _renderMatches(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[Results] getResults error:', err);
      _renderError('Impossibile caricare i risultati. ' + (err.message || ''));
    }
  }

  async function _loadStandings() {
    const contentEl = document.getElementById('res-content');
    if (contentEl) contentEl.innerHTML = _skeletonCards();

    if (!_currentCampionato?.standingsUrl && !_currentCampionato?.url) {
      _renderEmpty('Classifica non disponibile', 'Seleziona un campionato per vedere la classifica.');
      return;
    }

    try {
      const standingsUrl = _currentCampionato.standingsUrl || (_currentCampionato.url + '&vis=classifica');
      const data = await Store.get('getStandings', 'results', { campionato_url: standingsUrl });
      _renderStandings(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[Results] getStandings error:', err);
      _renderError('Impossibile caricare la classifica. ' + (err.message || ''));
    }
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  function _renderMatches(data) {
    const contentEl = document.getElementById('res-content');
    if (!contentEl) return;

    const matches = data.matches || [];
    const lastUpdated = data.last_updated ? new Date(data.last_updated).toLocaleString('it-IT') : '';

    if (matches.length === 0) {
      _renderEmpty('Nessuna partita trovata', 'Non ci sono partite disponibili per questo campionato.');
      return;
    }

    // Separate: our team first, then others
    const ourMatches = matches.filter(m => m.is_our_team);
    const otherMatches = matches.filter(m => !m.is_our_team);

    let html = '';

    if (ourMatches.length > 0) {
      html += `
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:var(--color-pink); margin-top:20px; margin-bottom:8px;">
          <i class="ph ph-star-four"></i> Le nostre partite
        </div>
        <div class="res-grid">${ourMatches.map(_matchCard).join('')}</div>
      `;
    }

    if (otherMatches.length > 0) {
      html += `
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:var(--color-text-muted); margin-top:${ourMatches.length > 0 ? '28px' : '20px'}; margin-bottom:8px;">
          Tutte le partite
        </div>
        <div class="res-grid">${otherMatches.map(_matchCard).join('')}</div>
      `;
    }

    if (lastUpdated) {
      html += `<div class="res-last-update">Aggiornato: ${lastUpdated} &nbsp;·&nbsp; Fonte: <a href="https://venezia.portalefipav.net" target="_blank" style="color:var(--color-text-muted);">portalefipav.net</a></div>`;
    }

    contentEl.innerHTML = html;
  }

  function _matchCard(match) {
    const isOurs = match.is_our_team;
    const isPlayed = match.status === 'played';
    const isLive = match.status === 'live';
    const isScheduled = match.status === 'scheduled';

    const statusBadge = isLive
      ? '<span class="res-badge live"><i class="ph ph-circle" style="font-size:8px;"></i> Live</span>'
      : isPlayed
        ? '<span class="res-badge played"><i class="ph ph-check-circle"></i> Giocata</span>'
        : '<span class="res-badge scheduled"><i class="ph ph-clock"></i> In programma</span>';

    const ourBadge = isOurs
      ? '<span class="res-badge our-match"><i class="ph ph-star-four"></i> Noi</span>'
      : '';

    // Determine win/loss from our perspective
    let homeScoreClass = '';
    let awayScoreClass = '';
    if (isPlayed && isOurs) {
      const homeIsOurs = Results._isOurTeam(match.home || '');
      const awayIsOurs = Results._isOurTeam(match.away || '');
      if (homeIsOurs) {
        homeScoreClass = (match.sets_home || 0) > (match.sets_away || 0) ? 'win' : 'loss';
        awayScoreClass = homeScoreClass === 'win' ? 'loss' : 'win';
      } else if (awayIsOurs) {
        awayScoreClass = (match.sets_away || 0) > (match.sets_home || 0) ? 'win' : 'loss';
        homeScoreClass = awayScoreClass === 'win' ? 'loss' : 'win';
      }
    }

    const dateStr = match.date
      ? `${match.date}${match.time ? ' · ' + match.time : ''}`
      : (match.time || '—');

    const homeNameClass = Results._isOurTeam(match.home || '') ? 'res-team-name our-name' : 'res-team-name';
    const awayNameClass = Results._isOurTeam(match.away || '') ? 'res-team-name our-name' : 'res-team-name';

    const scoreHtml = isPlayed && match.score
      ? `<div class="res-score ${homeScoreClass.includes('win') || awayScoreClass.includes('win') ? '' : ''}">${match.sets_home ?? ''}</div>
         <div class="res-time-label">-</div>
         <div class="res-score ${awayScoreClass}">${match.sets_away ?? ''}</div>`
      : `<div class="res-score vs">vs</div>`;

    return `
      <div class="res-card${isOurs ? ' our-team' : ''}">
        <div class="res-card-top">
          <span>${Utils.escapeHtml(dateStr)}</span>
          <span>${statusBadge}${ourBadge}</span>
        </div>
        <div class="res-teams">
          <div class="res-team">
            <div class="${homeNameClass}">${Utils.escapeHtml(match.home || 'Casa')}</div>
          </div>
          <div class="res-score-block">
            ${scoreHtml}
          </div>
          <div class="res-team away">
            <div class="${awayNameClass}">${Utils.escapeHtml(match.away || 'Ospite')}</div>
          </div>
        </div>
        ${match.round ? `<div style="font-size:10px; color:var(--color-text-muted); font-weight:600;">Giornata ${match.round}</div>` : ''}
      </div>
    `;
  }

  function _renderStandings(data) {
    const contentEl = document.getElementById('res-content');
    if (!contentEl) return;

    const standings = data.standings || [];
    const lastUpdated = data.last_updated ? new Date(data.last_updated).toLocaleString('it-IT') : '';

    if (standings.length === 0) {
      _renderEmpty('Classifica non disponibile', 'Non è stato possibile estrarre la classifica per questo campionato.');
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];

    const rows = standings.map((row, i) => {
      const pos = row.position ?? (i + 1);
      const isOurs = row.is_our_team;
      const posDisplay = pos <= 3 ? `<span class="pos-medal">${medals[pos - 1]}</span>` : `<span class="res-pos${pos <= 3 ? ' top3' : ''}">${pos}</span>`;

      return `
        <tr class="${isOurs ? 'our-row' : ''}">
          <td class="center">${posDisplay}</td>
          <td>
            <div class="res-team-cell">
              ${isOurs ? '<div class="res-team-dot"></div>' : ''}
              <span style="${isOurs ? 'color:var(--color-pink);font-weight:700;' : ''}">${Utils.escapeHtml(row.team || '—')}</span>
            </div>
          </td>
          <td class="center">${row.played ?? '—'}</td>
          <td class="center" style="color:#4caf50;">${row.won ?? '—'}</td>
          <td class="center" style="color:#ef5350;">${row.lost ?? '—'}</td>
          <td class="center"><strong style="font-size:15px;">${row.points ?? '—'}</strong></td>
        </tr>
      `;
    }).join('');

    let html = `
      <div class="res-table-wrap">
        <table class="res-table">
          <thead>
            <tr>
              <th class="center" style="width:50px;">#</th>
              <th>Squadra</th>
              <th class="center">PG</th>
              <th class="center">V</th>
              <th class="center">P</th>
              <th class="center">Punti</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    if (lastUpdated) {
      html += `<div class="res-last-update">Aggiornato: ${lastUpdated} &nbsp;·&nbsp; Fonte: <a href="https://venezia.portalefipav.net" target="_blank" style="color:var(--color-text-muted);">portalefipav.net</a></div>`;
    }

    contentEl.innerHTML = html;
  }

  function _renderEmpty(title, sub) {
    const contentEl = document.getElementById('res-content');
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="res-empty">
        <i class="ph ph-volleyball"></i>
        <div class="res-empty-title">${Utils.escapeHtml(title)}</div>
        <div class="res-empty-sub">${Utils.escapeHtml(sub)}</div>
      </div>
    `;
  }

  function _renderError(msg) {
    const contentEl = document.getElementById('res-content');
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="res-empty">
        <i class="ph ph-warning-circle" style="color:#ef5350;opacity:1;"></i>
        <div class="res-empty-title">Errore di connessione</div>
        <div class="res-empty-sub">${Utils.escapeHtml(msg)}</div>
        <button class="btn btn-ghost btn-sm" onclick="Results._refresh()" style="margin-top:8px;">
          <i class="ph ph-arrows-clockwise"></i> Riprova
        </button>
      </div>
    `;
  }

  // ─── Skeleton ─────────────────────────────────────────────────────────────

  function _skeletonCards() {
    const cards = Array.from({ length: 6 }, () => `
      <div class="res-skel-card">
        <div class="skeleton skeleton-text" style="width:60%;"></div>
        <div style="display:flex;gap:12px;align-items:center;">
          <div class="skeleton skeleton-text" style="flex:1;width:auto;"></div>
          <div class="skeleton skeleton-title" style="width:50px;"></div>
          <div class="skeleton skeleton-text" style="flex:1;width:auto;"></div>
        </div>
      </div>
    `).join('');
    return `<div class="res-loading-grid">${cards}</div>`;
  }

  // ─── Public Helpers (called from inline onclick) ───────────────────────────

  function _switchView(view) {
    _currentView = view;
    document.querySelectorAll('.res-view-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`res-btn-${view}`);
    if (btn) btn.classList.add('active');
    _loadCurrentView();
  }

  async function _refresh() {
    const btn = document.getElementById('res-refresh-btn');
    if (btn) btn.classList.add('loading');
    await _loadCurrentView();
    if (btn) btn.classList.remove('loading');
    UI.toast('Risultati aggiornati', 'success', 2000);
  }

  function _isOurTeam(name) {
    const keywords = ['fusion', 'team volley', 'fusionteam'];
    const lower = name.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  // ─── Public ───────────────────────────────────────────────────────────────

  return { init, destroy, _switchView, _refresh, _isOurTeam };
})();

window.Results = Results;
