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
    // Se arriviamo dalla route results-standings, apri direttamente la classifica
    const route = Router.getCurrentRoute();
    _currentView = (route === 'results-standings') ? 'standings' : 'matches';
    _renderShell();
    // Aggiusta i bottoni di toggle subito dopo il rendering della shell
    _updateViewButtons();
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

    const _u = App.getUser();
    const isAdmin = _u?.role === 'admin' || !!_u?.permissions?.admin;

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
          min-width: 220px;
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

        .res-icon-btn {
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
        .res-icon-btn:hover { color: white; border-color: #444; }
        .res-icon-btn.loading i { animation: res-spin 0.7s linear infinite; }

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
          border-color: rgba(255, 0, 255,0.5);
          background: linear-gradient(135deg, #121214 0%, #1a0a10 100%);
        }
        .res-card.our-team:hover { border-color: rgba(255, 0, 255,0.85); }

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
        .res-badge.unknown   { background: #2b2b1c; color: #ffc107; }
        .res-badge.live      { background: #2b1c1c; color: #ef5350; animation: pulse-badge 1.4s ease-in-out infinite; }
        .res-badge.our-match { background: rgba(255, 0, 255,0.15); color: var(--color-pink); margin-left: 4px; }
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
          font-size: 13px;
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
        .res-table tr.our-row td { background: rgba(255, 0, 255,0.07); }
        .res-table tr.our-row:hover td { background: rgba(255, 0, 255,0.12); }

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
        .res-empty-sub { font-size: 13px; opacity: 0.6; max-width: 360px; }

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

        /* ── Admin Modal ─── */
        .res-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 9000;
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        .res-modal {
          background: #121214;
          border: 1px solid #2c2c2e;
          border-radius: 14px;
          padding: 28px 32px;
          width: 520px;
          max-width: 95vw;
          max-height: 85vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .res-modal-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: white;
        }
        .res-modal-section { display: flex; flex-direction: column; gap: 12px; }
        .res-modal-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-muted);
        }
        .res-form-row { display: flex; flex-direction: column; gap: 6px; }
        .res-form-label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); }
        .res-form-input {
          background: #1c1c1e;
          border: 1px solid #2c2c2e;
          border-radius: 8px;
          color: white;
          font-size: 13px;
          padding: 9px 12px;
          width: 100%;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
          font-family: var(--font-body), sans-serif;
        }
        .res-form-input:focus { border-color: var(--color-pink); }
        .res-form-input::placeholder { color: #555; }

        .res-campionato-list { display: flex; flex-direction: column; gap: 8px; }
        .res-campionato-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1c1c1e;
          border-radius: 8px;
          padding: 10px 14px;
        }
        .res-campionato-item-label {
          flex: 1;
          font-size: 13px;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .res-campionato-item-url {
          font-size: 10px;
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
        .res-del-btn {
          background: none;
          border: 1px solid #3c1c1c;
          border-radius: 6px;
          color: #ef5350;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 13px;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .res-del-btn:hover { background: rgba(239,83,80,0.1); }

        .res-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
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
              <button class="res-view-btn active" id="res-btn-matches" onclick="Results._switchView('matches')">Partite</button>
              <button class="res-view-btn" id="res-btn-standings" onclick="Results._switchView('standings')">Classifica</button>
            </div>
            <button class="res-icon-btn" id="res-sync-btn" title="Sincronizza con portale" onclick="Results._sync()">
              <i class="ph ph-cloud-arrow-down"></i>
            </button>
            <button class="res-icon-btn" id="res-refresh-btn" title="Aggiorna" onclick="Results._refresh()">
              <i class="ph ph-arrows-clockwise"></i>
            </button>
            <button class="res-icon-btn" id="res-manage-btn" title="Gestisci campionati" onclick="Results._openManage()">
              <i class="ph ph-gear"></i>
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
        select.innerHTML = '<option value="">Nessun campionato configurato</option>';
        _renderEmpty(
          'Nessun campionato configurato',
          'Aggiungi almeno un campionato tramite il tasto ⚙️ in alto a destra (richiede accesso admin).'
        );
        return;
      }

      select.innerHTML = _campionati.map(c =>
        `<option value="${Utils.escapeHtml(c.id)}" data-url="${Utils.escapeHtml(c.url || '')}">${Utils.escapeHtml(c.label)}</option>`
      ).join('');

      select.addEventListener('change', () => {
        const opt = select.options[select.selectedIndex];
        _currentCampionato = {
          id: opt.value,
          url: opt.dataset.url,
          label: opt.textContent
        };
        _loadCurrentView();
      });

      // Auto-select first
      const firstOpt = select.options[0];
      _currentCampionato = {
        id: firstOpt.value,
        url: firstOpt.dataset.url,
        label: firstOpt.textContent
      };
      await _loadCurrentView();

    } catch (err) {
      console.error('[Results] getCampionati error:', err);
      _renderError('Impossibile caricare i campionati. ' + (err.message || ''));
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

    if (!_currentCampionato?.id && !_currentCampionato?.url) {
      _renderEmpty('Nessun campionato selezionato', 'Seleziona un campionato dal menu in alto.');
      return;
    }

    // Prefer campionato_id so the backend reads from the local DB table.
    // Fall back to campionato_url only when id is not available.
    const params = _currentCampionato.id
      ? { campionato_id: _currentCampionato.id }
      : { campionato_url: _currentCampionato.url };

    try {
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

    if (!_currentCampionato?.id && !_currentCampionato?.url) {
      _renderEmpty('Nessun campionato selezionato', 'Seleziona un campionato dal menu in alto.');
      return;
    }

    // Prefer campionato_id so the backend reads from the local DB table.
    const params = _currentCampionato.id
      ? { campionato_id: _currentCampionato.id }
      : { campionato_url: _currentCampionato.url };

    try {
      const data = await Store.get('getStandings', 'results', params);

      // Backend signals that standings haven't been synced yet or portal has no standings data.
      if (data.needs_sync) {
        if (data.already_synced) {
          // Sync was done but portal returned no standings — show informative message instead of asking to sync again
          _renderStandingsUnavailable(data.last_updated);
        } else {
          _renderNeedsSync();
        }
        return;
      }

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

    // Raggruppa per giornata
    const rounds = {};
    matches.forEach(m => {
      const r = m.round || 'Altre';
      if (!rounds[r]) rounds[r] = [];
      rounds[r].push(m);
    });

    const roundKeys = Object.keys(rounds).sort((a, b) => {
      if (a === 'Altre') return 1;
      if (b === 'Altre') return -1;
      return parseInt(a) - parseInt(b);
    });

    let html = '';

    roundKeys.forEach((r, idx) => {
      const gMatches = rounds[r];
      const title = r === 'Altre' ? 'Partite senza giornata' : `Giornata ${r}`;

      html += `
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:white;margin-top:${idx === 0 ? '20px' : '32px'};margin-bottom:12px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #1c1c1e;padding-bottom:8px;">
          <i class="ph ph-calendar-blank" style="color:var(--color-pink);"></i> ${title}
        </div>
        <div class="res-grid">${gMatches.map(_matchCard).join('')}</div>
      `;
    });

    if (lastUpdated) {
      html += `<div class="res-last-update">Aggiornato: ${lastUpdated} &nbsp;·&nbsp; Fonte: <a href="https://venezia.portalefipav.net" target="_blank" style="color:var(--color-text-muted);">portalefipav.net</a></div>`;
    }

    contentEl.innerHTML = html;
  }

  function _matchCard(match) {
    const isOurs = match.is_our_team;
    const isPlayed = match.status === 'played';
    const isLive = match.status === 'live';

    const statusBadge = isLive
      ? '<span class="res-badge live"><i class="ph ph-circle" style="font-size:8px;"></i> Live</span>'
      : isPlayed
        ? '<span class="res-badge played"><i class="ph ph-check-circle"></i> Giocata</span>'
        : match.status === 'unknown'
          ? '<span class="res-badge unknown"><i class="ph ph-question"></i> Da omologare</span>'
          : '<span class="res-badge scheduled"><i class="ph ph-clock"></i> In programma</span>';

    const ourBadge = isOurs
      ? '<span class="res-badge our-match"><i class="ph ph-star-four"></i> Noi</span>'
      : '';

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
      ? `<div class="res-score ${homeScoreClass}">${match.sets_home ?? ''}</div>
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
      const posDisplay = pos <= 3
        ? `<span class="pos-medal">${medals[pos - 1]}</span>`
        : `<span class="res-pos">${pos}</span>`;

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

  function _renderNeedsSync() {
    const contentEl = document.getElementById('res-content');
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="res-empty">
        <i class="ph ph-cloud-arrow-down" style="color:var(--color-pink);opacity:1;"></i>
        <div class="res-empty-title">Classifica non ancora sincronizzata</div>
        <div class="res-empty-sub">Premi il bottone <strong>☁ Sincronizza</strong> in alto a destra per caricare la classifica dal portale FIPAV.</div>
        <button class="btn btn-primary btn-sm" onclick="Results._sync()" style="margin-top:12px;">
          <i class="ph ph-cloud-arrow-down"></i> Sincronizza ora
        </button>
      </div>
    `;
  }

  function _renderStandingsUnavailable(lastSynced) {
    const contentEl = document.getElementById('res-content');
    if (!contentEl) return;
    const syncedAt = lastSynced ? new Date(lastSynced).toLocaleString('it-IT') : '';
    contentEl.innerHTML = `
      <div class="res-empty">
        <i class="ph ph-table" style="color:var(--color-text-muted);opacity:0.5;"></i>
        <div class="res-empty-title">Classifica non disponibile</div>
        <div class="res-empty-sub">
          La sincronizzazione è avvenuta${syncedAt ? ' il ' + Utils.escapeHtml(syncedAt) : ''}, ma il portale FIPAV non ha pubblicato la classifica per questo campionato.<br><br>
          Prova a risincronizzare tra qualche minuto, oppure verifica che l'URL del campionato supporti la classifica.
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Results._sync()" style="margin-top:12px;">
          <i class="ph ph-arrows-clockwise"></i> Riprova sincronizzazione
        </button>
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

  // ─── Admin: Manage Campionati ──────────────────────────────────────────────

  function _openManage() {
    // Remove existing overlay if any
    document.getElementById('res-manage-overlay')?.remove();

    const listHtml = _campionati.length === 0
      ? '<div style="font-size:13px;color:var(--color-text-muted);text-align:center;padding:10px 0;">Nessun campionato configurato.</div>'
      : _campionati.map(c => `
          <div class="res-campionato-item">
            <div style="flex:1;min-width:0;">
              <div class="res-campionato-item-label">${Utils.escapeHtml(c.label)}</div>
              <div class="res-campionato-item-url">${Utils.escapeHtml(c.url)}</div>
            </div>
            <button class="res-del-btn" onclick="Results._deleteCampionato('${Utils.escapeHtml(c.id)}', '${Utils.escapeHtml(c.label)}')">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        `).join('');

    const overlay = document.createElement('div');
    overlay.id = 'res-manage-overlay';
    overlay.className = 'res-modal-overlay';
    overlay.innerHTML = `
      <div class="res-modal">
        <div class="res-modal-title">⚙️ Gestisci Campionati</div>

        <div class="res-modal-section">
          <div class="res-modal-section-title">Aggiungi campionato</div>
          <div class="res-form-row">
            <label class="res-form-label" for="res-new-label">Nome campionato</label>
            <input type="text" id="res-new-label" class="res-form-input"
              placeholder="es. Under 16 Femminile Girone E Eccellenza">
          </div>
          <div class="res-form-row">
            <label class="res-form-label" for="res-new-url">URL del portale FIPAV</label>
            <input type="text" id="res-new-url" class="res-form-input"
              placeholder="https://venezia.portalefipav.net/risultati-classifiche.aspx?...">
          </div>
          <button class="btn btn-primary btn-sm" onclick="Results._addCampionato()" style="align-self:flex-start;">
            <i class="ph ph-plus"></i> Aggiungi
          </button>
        </div>

        <div class="res-modal-section">
          <div class="res-modal-section-title">Campionati configurati</div>
          <div class="res-campionato-list" id="res-campionato-list">
            ${listHtml}
          </div>
        </div>

        <div class="res-modal-footer">
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('res-manage-overlay')?.remove()">
            Chiudi
          </button>
        </div>
      </div>
    `;

    // Close on backdrop click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }

  async function _addCampionato() {
    const label = document.getElementById('res-new-label')?.value.trim();
    const url = document.getElementById('res-new-url')?.value.trim();

    if (!label || !url) {
      UI.toast('Compila nome e URL.', 'warning', 2500);
      return;
    }

    if (!url.toLowerCase().includes('fipav')) {
      UI.toast("L'URL deve appartenere al portale FIPAV.", 'error', 3000);
      return;
    }

    try {
      await Store.api('addCampionato', 'results', { label, url });

      UI.toast('Campionato aggiunto!', 'success', 2500);
      document.getElementById('res-manage-overlay')?.remove();

      // Reload campionati and re-render
      Store.invalidate?.('getCampionati', 'results');
      await _loadCampionati();
    } catch (err) {
      console.error('[Results] addCampionato error:', err);
      UI.toast('Errore: ' + err.message, 'error', 3000);
    }
  }

  async function _deleteCampionato(id, label) {
    if (!UI.confirm) {
      // Fallback if UI.confirm is not available (though it should be)
      if (!confirm(`Rimuovere il campionato "${label}"?`)) return;
    } else {
      UI.confirm(`Rimuovere il campionato "${label}"?`, async () => {
        try {
          await Store.api('deleteCampionato', 'results', { id });
          UI.toast('Campionato rimosso.', 'success', 2500);
          document.getElementById('res-manage-overlay')?.remove();
          Store.invalidate?.('getCampionati', 'results');
          await _loadCampionati();
        } catch (err) {
          console.error('[Results] deleteCampionato error:', err);
          UI.toast('Errore: ' + err.message, 'error', 3000);
        }
      });
      return;
    }

    // Fallback logic if UI.confirm wasn't used
    try {
      await Store.api('deleteCampionato', 'results', { id });
      UI.toast('Campionato rimosso.', 'success', 2500);
      document.getElementById('res-manage-overlay')?.remove();
      Store.invalidate?.('getCampionati', 'results');
      await _loadCampionati();
    } catch (err) {
      console.error('[Results] deleteCampionato error:', err);
      UI.toast('Errore: ' + err.message, 'error', 3000);
    }
  }

  // ─── Public Helpers ────────────────────────────────────────────────────────

  function _updateViewButtons() {
    document.querySelectorAll('.res-view-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`res-btn-${_currentView}`);
    if (btn) btn.classList.add('active');
  }

  function _switchView(view) {
    _currentView = view;
    _updateViewButtons();
    _loadCurrentView();
  }

  async function _refresh() {
    const btn = document.getElementById('res-refresh-btn');
    if (btn) btn.classList.add('loading');

    // Bust cache in Store if possible
    Store.invalidate?.('getResults', 'results');
    Store.invalidate?.('getStandings', 'results');

    await _loadCurrentView();
    if (btn) btn.classList.remove('loading');
    UI.toast('Risultati aggiornati', 'success', 2000);
  }

  async function _sync() {
    if (!_currentCampionato?.id) {
      UI.toast('Seleziona un campionato.', 'warning', 2000);
      return;
    }

    const btn = document.getElementById('res-sync-btn');
    if (btn) {
      btn.classList.add('loading');
      btn.disabled = true;
    }

    try {
      UI.toast('Sincronizzazione in corso...', 'info', 3000);
      const res = await Store.api('sync', 'results', { id: _currentCampionato.id });

      if (res.success) {
        if (res.standings > 0) {
          UI.toast(`Sincronizzazione completata: ${res.matches} partite, ${res.standings} squadre in classifica.`, 'success', 4000);
        } else {
          UI.toast(
            `Sincronizzazione parziale: ${res.matches} partite trovate, ma classifica non disponibile sul portale FIPAV.`,
            'warning', 5000
          );
          console.warn('[Results] Sync: no standings found. URLs tried:', res.standings_url ?? 'n/a');
        }
        // Invalidate and reload
        Store.invalidate?.('getResults', 'results');
        Store.invalidate?.('getStandings', 'results');
        await _loadCurrentView();
      } else {
        throw new Error(res.error || 'Errore sconosciuto');
      }
    } catch (err) {
      console.error('[Results] sync error:', err);
      UI.toast('Errore sync: ' + err.message, 'error', 4000);
    } finally {
      if (btn) {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    }
  }

  function _isOurTeam(name) {
    const lower = name.toLowerCase();
    // Robust exclusion for APV (matches apv, a.p.v., a. p. v. with spaces)
    if (/a\.?\s?p\.?\s?v\.?/i.test(lower)) return false;
    const keywords = ['fusion', 'team volley', 'fusionteam'];
    return keywords.some(k => lower.includes(k));
  }

  // ─── Public ───────────────────────────────────────────────────────────────

  return { init, destroy, _switchView, _refresh, _sync, _isOurTeam, _openManage, _addCampionato, _deleteCampionato };
})();

window.Results = Results;
