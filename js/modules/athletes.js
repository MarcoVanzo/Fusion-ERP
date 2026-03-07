/**
 * Athletes Module — List, Hero Profile, Metrics, ACWR, AI Report
 * Fusion ERP v1.0
 */

'use strict';

const Athletes = (() => {
  let _ac = new AbortController();

  let _state = [];
  let _teams = [];
  let _currentTeam = '';
  let _activeMainTab = 'anagrafica'; // active main tab (anagrafica|pagamenti|metrics|documenti)
  let _selectedAthleteId = null;     // set when athlete detail view is open

  function formatTeamLabel(category, name) {
    let cat = (category || '').toUpperCase();
    if (cat.match(/^U\d+$/)) {
      return cat.replace('U', 'Under ');
    }
    return cat ? category + ' — ' + name : name || '';
  }

  async function init() {
    const app = document.getElementById('app');
    if (!app) return;

    UI.loading(true);
    app.innerHTML = UI.skeletonPage();

    const user = App.getUser();
    const route = Router.getCurrentRoute();

    // Sidebar sub-routes map to main tabs
    const routeToTab = {
      'athlete-profile': 'anagrafica',
      'athlete-payments': 'pagamenti',
      'athlete-metrics': 'metrics',
      'athlete-documents': 'documenti',
    };

    try {
      // Athletes always see only their own profile
      if (user?.role === 'atleta' && user.athleteId) {
        _teams = await Store.get('teams', 'athletes');
        _selectedAthleteId = user.athleteId;
        await _renderAthleteDetail(user.athleteId, 'anagrafica');
        return;
      }

      [_teams, _state] = await Promise.all([
        Store.get('teams', 'athletes'),
        Store.get('list', 'athletes'),
      ]);

      // Sidebar sub-route → show main view with that tab active
      if (routeToTab[route]) {
        _activeMainTab = routeToTab[route];
        _selectedAthleteId = null;
        _renderMainView();
        return;
      }

      // Direct URL with athlete ID param (e.g. from bookmark)
      const params = Router.getParams();
      if (params.id) {
        _selectedAthleteId = params.id;
        await _renderAthleteDetail(params.id, 'anagrafica');
      } else {
        _selectedAthleteId = null;
        _activeMainTab = 'anagrafica';
        _renderMainView();
      }
    } catch (err) {
      app.innerHTML = Utils.emptyState('Errore nel caricamento atleti', err.message);
      UI.toast('Errore caricamento atleti', 'error');
    } finally {
      UI.loading(false);
    }
  }

  // ─── ANAGRAFICA PANEL (athlete list within the main 4-tab view) ─────────────
  function _renderAnagraficaPanel() {
    const container = document.getElementById('main-tab-content');
    if (!container) return;
    const filtered = _currentTeam ? _state.filter(a => a.team_id === _currentTeam || a.team_name === _currentTeam) : _state;
    const user = App.getUser();
    const canEdit = ['admin', 'manager', 'operator'].includes(user?.role);

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap;">
        <p class="page-subtitle">${filtered.length} atleti${_currentTeam ? ' in squadra selezionata' : ' totali'}</p>
        <div style="display:flex;align-items:center;gap:var(--sp-2);">
          <div class="input-wrapper" style="position:relative;min-width:220px;">
            <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px;"></i>
            <input type="text" id="athlete-search" class="form-input" placeholder="Cerca atleta..." style="padding-left:36px;height:42px;font-size:13px;">
          </div>
          ${canEdit ? `<button class="btn btn-primary" id="new-athlete-btn" type="button">+ NUOVO ATLETA</button>` : ''}
        </div>
      </div>
      <div class="filter-bar" id="team-filter">
        <button class="filter-chip ${!_currentTeam ? 'active' : ''}" data-team="" type="button">Tutti</button>
        ${_teams.map(t => `<button class="filter-chip ${_currentTeam === t.id ? 'active' : ''}" data-team="${Utils.escapeHtml(t.id)}" type="button">${Utils.escapeHtml(formatTeamLabel(t.category, t.name))}</button>`).join('')}
      </div>
      ${filtered.length === 0
        ? Utils.emptyState('Nessun atleta trovato', 'Aggiungi il primo atleta con il pulsante in alto.')
        : `<div class="grid-3" id="athletes-grid">${filtered.map(a => athleteCard(a)).join('')}</div>`}
    `;

    container.querySelectorAll('[data-team]').forEach(btn => btn.addEventListener('click', () => {
      _currentTeam = btn.dataset.team;
      _renderAnagraficaPanel();
    }, { signal: _ac.signal }));

    container.querySelectorAll('[data-athlete-id]').forEach(card => card.addEventListener('click', () => {
      _openAthleteDetail(card.dataset.athleteId);
    }, { signal: _ac.signal }));

    document.getElementById('new-athlete-btn')?.addEventListener('click', () => showCreateModal(), { signal: _ac.signal });

    const searchInput = document.getElementById('athlete-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        let count = 0;
        container.querySelectorAll('[data-athlete-id]').forEach(card => {
          const match = (card.dataset.name || '').includes(q) || (card.dataset.role || '').includes(q) || (card.dataset.team || '').includes(q);
          card.style.display = match ? '' : 'none';
          if (match) count++;
        });
        const grid = document.getElementById('athletes-grid');
        let emptyMatch = document.getElementById('search-empty-state');
        const countAll = container.querySelectorAll('[data-athlete-id]').length;
        if (count === 0 && countAll > 0) {
          if (!emptyMatch && grid) grid.insertAdjacentHTML('afterend', `<div id="search-empty-state">${Utils.emptyState('Nessun atleta trovato', 'Nessun risultato corrisponde alla tua ricerca.')}</div>`);
          else if (emptyMatch) emptyMatch.style.display = 'block';
          if (grid) grid.style.display = 'none';
        } else {
          if (emptyMatch) emptyMatch.style.display = 'none';
          if (grid) grid.style.display = '';
        }
      }, { signal: _ac.signal });
    }
  }

  function getAvatarColor(name) {
    const colors = ['#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function athleteCard(a) {
    const acwrColor = a.acwr_risk ? Utils.acwrRiskColor(a.acwr_risk) : 'transparent';
    const avatarBg = getAvatarColor(a.full_name);
    return `
      <div class="card" style="cursor:pointer;position:relative;overflow:hidden;" data-athlete-id="${Utils.escapeHtml(a.id)}" data-name="${Utils.escapeHtml((a.full_name || '').toLowerCase())}" data-role="${Utils.escapeHtml((a.role || '').toLowerCase())}" data-team="${Utils.escapeHtml((a.team_name || '').toLowerCase())}">
        ${a.acwr_risk && a.acwr_risk !== 'moderate' && a.acwr_risk !== 'low' ? `<div style="position:absolute;top:var(--sp-2);right:var(--sp-2);width:24px;height:24px;border-radius:50%;background:${acwrColor};display:flex;align-items:center;justify-content:center;font-size:14px;color:#000;box-shadow:0 0 8px ${acwrColor};"><i class="ph-fill ph-warning-circle"></i></div>` : ''}
        <div style="display:flex;align-items:flex-start;gap:var(--sp-2);">
          <div style="width:48px;height:48px;background:${avatarBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:#000;border-radius:8px;">
            ${a.jersey_number != null ? Utils.escapeHtml(String(a.jersey_number)) : Utils.initials(a.full_name)}
          </div>
          <div style="overflow:hidden;flex:1;">
            <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;">${Utils.escapeHtml(a.full_name)}</div>
            <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(a.role || '—')}</div>
            <div style="margin-top:4px;">${Utils.badge(formatTeamLabel(a.category, a.team_name), 'muted')}</div>
          </div>
        </div>
      </div>`;
  }

  // ─── MAIN VIEW — 4-tab shell ───────────────────────────────────────
  const _MAIN_TABS = [
    { id: 'anagrafica', label: 'Anagrafica', icon: 'identification-card' },
    { id: 'pagamenti', label: 'Pagamenti', icon: 'credit-card' },
    { id: 'metrics', label: 'Metrics', icon: 'trend-up' },
    { id: 'documenti', label: 'Documenti', icon: 'file-text' },
  ];

  function _renderMainView() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="page-header" style="border-bottom:1px solid var(--color-border);padding-bottom:0;margin-bottom:0;">
        <div>
          <h1 class="page-title">Atleti</h1>
          <p class="page-subtitle">${_state.length} atleti nel sistema</p>
        </div>
      </div>
      <div style="display:flex;gap:0;border-bottom:1px solid var(--color-border);overflow-x:auto;scrollbar-width:none;" id="athletes-main-tabbar">
        ${_MAIN_TABS.map(t => `
          <button class="athlete-tab-btn" id="main-tab-btn-${t.id}" data-maintab="${t.id}" type="button"
            style="flex-shrink:0;padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;
                   border:none;background:none;cursor:pointer;color:var(--color-text-muted);border-bottom:2px solid transparent;
                   transition:all 0.2s;white-space:nowrap;display:flex;align-items:center;gap:8px;">
            <i class="ph ph-${t.icon}"></i>${t.label}
          </button>`).join('')}
      </div>
      <div id="main-tab-content" style="flex:1;padding:var(--sp-4) 0;"></div>
    `;
    document.querySelectorAll('[data-maintab]').forEach(btn =>
      btn.addEventListener('click', () => _switchMainTab(btn.dataset.maintab), { signal: _ac.signal })
    );
    _switchMainTab(_activeMainTab);
  }

  function _switchMainTab(tabId) {
    _activeMainTab = tabId;
    document.querySelectorAll('[data-maintab]').forEach(btn => {
      const active = btn.dataset.maintab === tabId;
      btn.style.borderBottomColor = active ? 'var(--color-pink)' : 'transparent';
      btn.style.color = active ? 'var(--color-white)' : 'var(--color-text-muted)';
      btn.style.opacity = active ? '1' : '0.65';
    });
    const content = document.getElementById('main-tab-content');
    if (!content) return;
    switch (tabId) {
      case 'anagrafica': _renderAnagraficaPanel(); break;
      case 'pagamenti': _renderSquadPayments(content); break;
      case 'metrics': _renderSquadMetrics(content); break;
      case 'documenti': _renderSquadDocuments(content); break;
    }
  }

  // ─── SQUAD-LEVEL TAB: PAGAMENTI ──────────────────────────────────
  async function _renderSquadPayments(container) {
    container.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${[1, 2, 3].map(() => '<div class="skeleton skeleton-text"></div>').join('')}</div>`;
    try {
      const allPayments = (await Promise.all(
        _state.map(a => Store.get('payments', 'athletes', { id: a.id }).catch(() => []))
      )).flat();
      const total = allPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      const paid = allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      const overdue = allPayments.filter(p => p.status === 'overdue').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      const pending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      container.innerHTML = `
        <p class="section-label">Riepilogo Pagamenti Squadra</p>
        <div class="grid-3" style="margin-bottom:var(--sp-3);">
          <div class="stat-card"><span class="stat-label">Totale</span><span class="stat-value">€ ${Utils.formatNum(total, 2)}</span></div>
          <div class="stat-card"><span class="stat-label">Incassato</span><span class="stat-value" style="color:var(--color-success)">€ ${Utils.formatNum(paid, 2)}</span></div>
          <div class="stat-card"><span class="stat-label">Scaduto</span><span class="stat-value" style="color:var(--color-pink)">€ ${Utils.formatNum(overdue, 2)}</span></div>
        </div>
        ${allPayments.length > 0 ? `
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Atleta</th><th>Scadenza</th><th>Importo</th><th>Stato</th><th>Metodo</th></tr></thead>
            <tbody>
              ${allPayments.slice(0, 50).map(p => `<tr>
                <td>${Utils.escapeHtml(p.athlete_name || p.payer_name || '—')}</td>
                <td>${Utils.formatDate(p.due_date)}</td>
                <td><strong>€ ${Utils.formatNum(p.amount, 2)}</strong></td>
                <td>${p.status === 'paid' ? '<span class="badge badge-success">Pagato</span>' : p.status === 'overdue' ? '<span class="badge badge-danger">Scaduto</span>' : '<span class="badge badge-warning">In attesa</span>'}</td>
                <td>${Utils.escapeHtml(p.payment_method || '—')}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : Utils.emptyState('Nessun pagamento registrato')}
      `;
    } catch (err) {
      container.innerHTML = Utils.emptyState('Errore caricamento pagamenti', err.message);
    }
  }

  // ─── SQUAD-LEVEL TAB: METRICS ─────────────────────────────────────
  function _renderSquadMetrics(container) {
    const withAcwr = _state.filter(a => a.acwr);
    const avgAcwr = withAcwr.length ? (withAcwr.reduce((s, a) => s + parseFloat(a.acwr?.score || 0), 0) / withAcwr.length).toFixed(2) : '—';
    const riskMap = { low: 0, moderate: 0, high: 0, extreme: 0 };
    _state.forEach(a => { if (a.acwr?.risk && riskMap[a.acwr.risk] !== undefined) riskMap[a.acwr.risk]++; });
    container.innerHTML = `
      <p class="section-label">Overview Metriche Squadra</p>
      <div class="grid-3" style="margin-bottom:var(--sp-3);">
        <div class="stat-card"><span class="stat-label">ACWR Medio</span><span class="stat-value">${avgAcwr}</span></div>
        <div class="stat-card"><span class="stat-label">Nel range ottimale</span><span class="stat-value" style="color:var(--color-success)">${riskMap.moderate}</span></div>
        <div class="stat-card"><span class="stat-label">A rischio</span><span class="stat-value" style="color:var(--color-pink)">${riskMap.high + riskMap.extreme}</span></div>
      </div>
      <p class="section-label">Semaforo ACWR per Atleta</p>
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Atleta</th><th>Squadra</th><th>Score ACWR</th><th>Rischio</th><th>Azione</th></tr></thead>
          <tbody>
            ${_state.map(a => `<tr>
              <td><strong>${Utils.escapeHtml(a.full_name)}</strong></td>
              <td>${Utils.escapeHtml(formatTeamLabel(a.category, a.team_name))}</td>
              <td>${Utils.formatNum(a.acwr?.score, 2)}</td>
              <td>${a.acwr?.risk ? Utils.riskBadge(a.acwr.risk) : '<span style="color:var(--color-text-muted)">—</span>'}</td>
              <td><button class="btn btn-ghost btn-sm" type="button" data-open-athlete="${Utils.escapeHtml(a.id)}">Vedi profilo</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.querySelectorAll('[data-open-athlete]').forEach(btn =>
      btn.addEventListener('click', () => _openAthleteDetail(btn.dataset.openAthlete), { signal: _ac.signal })
    );
  }

  // ─── SQUAD-LEVEL TAB: DOCUMENTI ─────────────────────────────────
  function _renderSquadDocuments(container) {
    const now = new Date();
    const soon = new Date(now.getTime() + 60 * 24 * 3600 * 1000); // 60 days
    const rows = _state.map(a => {
      const certDate = a.medical_cert_expires_at ? new Date(a.medical_cert_expires_at) : null;
      const expired = certDate && certDate < now;
      const expiring = certDate && !expired && certDate < soon;
      return { a, certDate, expired, expiring };
    });
    const expiredCount = rows.filter(r => r.expired).length;
    const expiringCount = rows.filter(r => r.expiring).length;
    const okCount = _state.length - expiredCount - expiringCount;
    container.innerHTML = `
      <p class="section-label">Stato Documenti Squadra</p>
      <div class="grid-3" style="margin-bottom:var(--sp-3);">
        <div class="stat-card"><span class="stat-label">Completati</span><span class="stat-value" style="color:var(--color-success)">${okCount}</span></div>
        <div class="stat-card"><span class="stat-label">In scadenza (60gg)</span><span class="stat-value" style="color:var(--color-warning)">${expiringCount}</span></div>
        <div class="stat-card"><span class="stat-label">Scaduti</span><span class="stat-value" style="color:var(--color-pink)">${expiredCount}</span></div>
      </div>
      <p class="section-label">Certificati Medici</p>
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Atleta</th><th>Squadra</th><th>Scadenza Cert. Medico</th><th>Stato</th><th>Matricola FIPAV</th></tr></thead>
          <tbody>
            ${rows.map(({ a, certDate, expired, expiring }) => `<tr>
              <td><strong>${Utils.escapeHtml(a.full_name)}</strong></td>
              <td>${Utils.escapeHtml(formatTeamLabel(a.category, a.team_name))}</td>
              <td style="color:${expired ? 'var(--color-pink)' : expiring ? 'var(--color-warning)' : 'var(--color-text)'}">
                ${certDate ? Utils.formatDate(a.medical_cert_expires_at) : '<span style="color:var(--color-text-muted)">—</span>'}
              </td>
              <td>${expired ? '<span class="badge badge-danger">Scaduto</span>' : expiring ? '<span class="badge badge-warning">In scadenza</span>' : certDate ? '<span class="badge badge-success">Valido</span>' : '<span class="badge">Mancante</span>'}</td>
              <td>${Utils.escapeHtml(a.federal_id || '—')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ─── ATHLETE DETAIL NAVIGATION ────────────────────────────────────
  function _openAthleteDetail(athleteId) {
    _selectedAthleteId = athleteId;
    sessionStorage.setItem('last_athlete_id', athleteId);
    _renderAthleteDetail(athleteId, 'anagrafica');
  }

  function _closeAthleteDetail() {
    _selectedAthleteId = null;
    sessionStorage.removeItem('last_athlete_id');
    _activeMainTab = 'anagrafica';
    _renderMainView();
  }

  // ─── ATHLETE DETAIL VIEW ───────────────────────────────────────────
  async function _renderAthleteDetail(athleteId, startTab = 'anagrafica') {
    const app = document.getElementById('app');
    if (!athleteId) { _closeAthleteDetail(); return; }

    // Persist state
    sessionStorage.setItem('last_athlete_id', athleteId);

    // Update URL hash without triggering re-navigation
    Router.updateHash(Router.getCurrentRoute(), { id: athleteId });

    app.innerHTML = UI.skeletonPage();

    try {
      const [a, payments] = await Promise.all([
        Store.get('get', 'athletes', { id: athleteId }),
        Store.get('payments', 'athletes', { id: athleteId }).catch(() => [])
      ]);
      const user = App.getUser();
      const canEdit = ['admin', 'manager', 'operator'].includes(user?.role);

      app.innerHTML = `
        <!-- BREADCRUMB NAV -->
        <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-4);border-bottom:1px solid var(--color-border);background:var(--color-bg);position:sticky;top:72px;z-index:50;">
          <button class="btn btn-ghost btn-sm" id="back-to-list" style="color:var(--color-text-muted);border:none;padding:0;display:flex;align-items:center;gap:6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;" type="button">
            <i class="ph ph-arrow-left" style="font-size:16px;"></i> Atleti
          </button>
          <i class="ph ph-caret-right" style="font-size:12px;color:var(--color-text-muted);opacity:0.5;"></i>
          <span style="font-size:12px;font-weight:600;color:var(--color-white);text-transform:uppercase;letter-spacing:0.06em;">${Utils.escapeHtml(a.full_name)}</span>
          <div style="flex:1;"></div>
          ${canEdit ? `<button class="btn btn-primary btn-sm" id="edit-athlete-btn" type="button" style="margin-right:8px;"><i class="ph ph-pencil-simple"></i> MODIFICA</button>` : ''}
          ${['admin', 'manager'].includes(user?.role) ? `<button class="btn btn-default btn-sm" id="ai-report-btn" type="button">⚡ REPORT AI</button>` : ''}
        </div>

        <!-- HERO SECTION -->
        <div class="athlete-hero" style="position:relative; min-height:400px; display:flex; align-items:flex-end; overflow:hidden; border-bottom:1px solid var(--color-border); background:var(--color-black);">
          <img class="athlete-hero-photo duotone-img" style="position:absolute; right:0; bottom:0; height:100%; width:auto; object-fit:cover; object-position:top; opacity:0.6;" src="assets/media/player_hero_bg.png" alt="Athlete Silhouette">
          <div class="athlete-hero-overlay" style="position:relative; z-index:2; padding:var(--sp-4); background:linear-gradient(to right, rgba(0,0,0,0.95) 30%, transparent 100%); width:100%; display:flex; flex-direction:column; gap:16px;">
            <div>
              <div class="athlete-jersey" style="font-family:var(--font-display); font-size:clamp(3rem, 8vw, 6rem); font-weight:800; color:var(--color-pink); line-height:1; letter-spacing:-0.04em;">#${a.jersey_number != null ? Utils.escapeHtml(String(a.jersey_number)) : '—'}</div>
              <div class="athlete-name-hero" style="font-family:var(--font-display); font-size:clamp(2.5rem, 6vw, 4rem); font-weight:700; text-transform:uppercase; letter-spacing:-0.02em; line-height:1; color:var(--color-white);">${Utils.escapeHtml(a.full_name)}</div>
            </div>

            <!-- Basic Stats compattate sotto il nome nella Hero -->
            <div style="display:flex; flex-wrap:wrap; gap:24px; margin-top:8px;">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-family:var(--font-display); font-size:clamp(1.2rem, 3vw, 1.8rem); font-weight:700; line-height:1;">${Utils.escapeHtml(a.role || '—')}</span>
                    <span style="font-size:10px; color:var(--color-text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.05em;">RUOLO</span>
                </div>
                <div style="display:flex; flex-direction:column;">
                    <span style="font-family:var(--font-display); font-size:clamp(1.2rem, 3vw, 1.8rem); font-weight:700; line-height:1;">${a.height_cm || '—'}</span>
                    <span style="font-size:10px; color:var(--color-text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.05em;">ALTEZZA (CM)</span>
                </div>
                <div style="display:flex; flex-direction:column;">
                    <span style="font-family:var(--font-display); font-size:clamp(1.2rem, 3vw, 1.8rem); font-weight:700; line-height:1;">${a.weight_kg || '—'}</span>
                    <span style="font-size:10px; color:var(--color-text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.05em;">PESO (KG)</span>
                </div>
                <div style="display:flex; flex-direction:column;">
                    <span style="font-family:var(--font-display); font-size:clamp(1.2rem, 3vw, 1.8rem); font-weight:700; line-height:1;">${a.birth_date ? new Date().getFullYear() - new Date(a.birth_date).getFullYear() : '—'}</span>
                    <span style="font-size:10px; color:var(--color-text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.05em;">ETÀ</span>
                </div>
            </div>
          </div>
        </div>

        <div class="page-body" style="display:flex;flex-direction:column;gap:var(--sp-4); background:var(--color-black);">

          <!-- TAB BAR -->
          <div style="position:relative; margin: 0 calc(-1 * var(--sp-4)); padding: 0 var(--sp-4);">
            <div id="athlete-tab-bar" style="display:flex;gap:0;border-bottom:1px solid var(--color-border);overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;position:relative;z-index:2;">
              ${[
          { id: 'anagrafica', label: 'Anagrafica' },
          { id: 'metrics', label: 'Metrics', pink: true },
          { id: 'pagamenti', label: 'Pagamenti' },
          { id: 'documenti', label: 'Documenti' }
        ].map(t => `<button class="athlete-tab-btn" data-tab="${t.id}" type="button" style="flex-shrink:0;padding:12px 16px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;border:none;background:none;cursor:pointer;color:${t.pink ? 'var(--color-pink)' : 'var(--color-text-muted)'};border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;">${t.label}</button>`).join('')}
            </div>
            <!-- Shadow gradient for scroll indication -->
            <div id="tab-scroll-indicator" style="position:absolute;top:0;right:0;bottom:0;width:48px;background:linear-gradient(to left, var(--color-black) 20%, transparent 100%);pointer-events:none;z-index:3;transition:opacity 0.3s;opacity:0.8;"></div>
          </div>

          <!-- ANAGRAFICA TAB -->
          <div id="tab-panel-anagrafica" class="athlete-tab-panel" style="display:flex;flex-direction:column;gap:var(--sp-4);">
            <!-- FOTO PERSONALE -->
            <div>
              <p class="section-label">Foto Personale</p>
              <div class="card" style="padding:var(--sp-3);">
                <div style="display:flex;align-items:center;gap:var(--sp-3);">
                  <div id="athlete-photo-preview" style="width:96px;height:96px;border-radius:12px;overflow:hidden;flex-shrink:0;border:2px solid var(--color-border);background:${getAvatarColor(a.full_name)};display:flex;align-items:center;justify-content:center;">
                    ${a.photo_path
          ? `<img src="/${Utils.escapeHtml(a.photo_path)}" alt="Foto atleta" style="width:100%;height:100%;object-fit:cover;">`
          : `<span style="font-family:var(--font-display);font-size:2rem;font-weight:700;color:#000;">${Utils.initials(a.full_name)}</span>`
        }
                  </div>
                  <div style="display:flex;flex-direction:column;gap:8px;">
                    <div style="font-size:13px;color:var(--color-text-muted);">
                      ${a.photo_path ? 'Foto caricata' : 'Nessuna foto caricata'}
                    </div>
                    ${canEdit ? `
                    <label for="athlete-photo-upload" class="btn btn-default btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                      <i class="ph ph-camera"></i> ${a.photo_path ? 'Cambia foto' : 'Carica foto'}
                    </label>
                    <input id="athlete-photo-upload" type="file" accept="image/jpeg,image/png,image/webp" style="display:none;">
                    <div id="athlete-photo-status" style="font-size:12px;color:var(--color-text-muted);"></div>` : ''}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p class="section-label">Dati Anagrafici e Contatti</p>
              <div class="card" style="padding:var(--sp-3);">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3);">
                  ${registryField('Nome', a.first_name)}
                  ${registryField('Cognome', a.last_name)}
                  ${registryField('Data di Nascita', a.birth_date ? Utils.formatDate(a.birth_date) : null)}
                  ${registryField('Luogo di Nascita', a.birth_place)}
                  ${registryField('Via di Residenza', a.residence_address)}
                  ${registryField('Città di Residenza', a.residence_city)}
                  ${registryField('Cellulare', a.phone)}
                  ${registryField('E-Mail', a.email)}
                  ${registryField('Documento d\'Identità', a.identity_document)}
                  ${registryField('Codice Fiscale', a.fiscal_code)}
                  ${registryField('Scadenza Cert. Medico', a.medical_cert_expires_at ? Utils.formatDate(a.medical_cert_expires_at) : null, a.medical_cert_expires_at && new Date(a.medical_cert_expires_at) < new Date() ? 'var(--color-pink)' : null)}
                  ${registryField('Matricola FIPAV', a.federal_id)}
                </div>
              </div>
            </div>
          </div>


          <!-- METRICS TAB -->
          <div id="tab-panel-metrics" class="athlete-tab-panel" style="display:none;flex-direction:column;gap:var(--sp-4);">

            <!-- ACWR Section -->
            <div>
              <p class="section-label">Athlete Load — ACWR</p>
              <div class="grid-3">
                ${acwrCard(a.acwr)}
                <div class="stat-card">
                  <span class="stat-label">Carico Acuto (7g)</span>
                  <span class="stat-value">${Utils.formatNum(a.acwr?.acute, 0)}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Carico Cronico (28g)</span>
                  <span class="stat-value">${Utils.formatNum(a.acwr?.chronic, 0)}</span>
                </div>
              </div>
            </div>

            <!-- AI Summary section -->
            <div id="ai-summary-section"></div>

            <!-- VALD Performance Tracking -->
            <div>
              <p class="section-label" style="display:flex;align-items:center;gap:8px;">
                <span style="color:var(--color-pink);">⚡</span> VALD Performance Tracking
              </p>
              <div id="vald-tab-content">
                <div style="display:flex;flex-direction:column;gap:8px;">
                  <div class="skeleton skeleton-title"></div>
                  <div class="skeleton skeleton-text" style="width:60%;"></div>
                </div>
              </div>
            </div>

            <!-- Metrics history -->
            <div>
              <p class="section-label">Storico Metriche (30 giorni)</p>
              ${a.metrics?.length ? `
              <div class="table-wrapper">
                <table class="table">
                  <thead><tr><th>Data</th><th>Durata (min)</th><th>RPE</th><th>Carico</th><th>ACWR</th><th>Note</th></tr></thead>
                  <tbody>
                    ${a.metrics.map(m => `<tr>
                      <td>${Utils.formatDate(m.log_date)}</td>
                      <td>${Utils.escapeHtml(String(m.duration_min))}</td>
                      <td>${Utils.escapeHtml(String(m.rpe))}/10</td>
                      <td><strong>${Utils.formatNum(m.load_value, 0)}</strong></td>
                      <td>${m.acwr_score ? Utils.riskBadge(acwrRisk(m.acwr_score)) : '—'}</td>
                      <td style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(m.notes || '')}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>` : Utils.emptyState('Nessuna metrica registrata')}
            </div>
          </div>

          <!-- PAGAMENTI -->
          <div id="tab-panel-pagamenti" class="athlete-tab-panel" style="display:none;">
            <p class="section-label">Storico Pagamenti</p>
            ${payments && payments.length > 0 ? `
              <div class="table-wrapper">
                <table class="table">
                  <thead><tr><th>Scadenza</th><th>Importo</th><th>Stato</th><th>Pagante</th><th>Metodo</th><th>Data Pagamento</th></tr></thead>
                  <tbody>
                    ${payments.map(p => `<tr>
                      <td>${Utils.formatDate(p.due_date)}</td>
                      <td><strong>€ ${Utils.formatNum(p.amount, 2)}</strong></td>
                      <td>${p.status === 'paid' ? '<span class="badge badge-success">Pagato</span>' : p.status === 'overdue' ? '<span class="badge badge-danger">Scaduto</span>' : '<span class="badge badge-warning">In attesa</span>'}</td>
                      <td>${Utils.escapeHtml(p.payer_name || '—')}</td>
                      <td>${Utils.escapeHtml(p.payment_method || '—')}</td>
                      <td style="font-size:12px;color:var(--color-text-muted);">${p.paid_at ? Utils.formatDate(p.paid_at) : '—'}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>` : Utils.emptyState('Nessun pagamento registrato')}
          <!-- DOCUMENTI TAB -->
          <div id="tab-panel-documenti" class="athlete-tab-panel" style="display:none;flex-direction:column;gap:var(--sp-4);">
            <p class="section-label">Documenti Atleta</p>
            <div class="card" style="padding:var(--sp-3);">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
                ${registryField("Documento d'Identit\u00e0", a.identity_document)}
                ${registryField('Codice Fiscale', a.fiscal_code)}
                ${registryField('Matricola FIPAV', a.federal_id)}
                ${registryField('Scadenza Cert. Medico', a.medical_cert_expires_at ? Utils.formatDate(a.medical_cert_expires_at) : null, a.medical_cert_expires_at && new Date(a.medical_cert_expires_at) < new Date() ? 'var(--color-pink)' : null)}
              </div>
            </div>
          </div>
        </div>
        
        `;

      document.getElementById('back-to-list')?.addEventListener('click', () => _closeAthleteDetail(), { signal: _ac.signal });

      document.getElementById('edit-athlete-btn')?.addEventListener('click', () => showEditModal(a), { signal: _ac.signal });
      document.getElementById('ai-report-btn')?.addEventListener('click', () => requestAiReport(athleteId), { signal: _ac.signal });

      // ─── Photo Upload ──────────────────────────────────────────────────────
      const photoInput = document.getElementById('athlete-photo-upload');
      if (photoInput) {
        photoInput.addEventListener('change', async () => {
          const file = photoInput.files?.[0];
          if (!file) return;

          const statusEl = document.getElementById('athlete-photo-status');
          const previewEl = document.getElementById('athlete-photo-preview');
          const uploadLabel = document.querySelector('label[for="athlete-photo-upload"]');

          // Local preview
          const localUrl = URL.createObjectURL(file);
          previewEl.innerHTML = `<img src="${localUrl}" alt="Foto atleta" style="width:100%;height:100%;object-fit:cover;">`;

          if (statusEl) statusEl.textContent = 'Caricamento in corso...';
          if (uploadLabel) { uploadLabel.style.opacity = '0.5'; uploadLabel.style.pointerEvents = 'none'; }

          try {
            const formData = new FormData();
            formData.append('id', athleteId);
            formData.append('photo', file);

            const res = await fetch('api/router.php?module=athletes&action=uploadPhoto', {
              method: 'POST',
              credentials: 'same-origin',
              body: formData,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Errore upload');

            if (statusEl) {
              statusEl.textContent = '✓ Foto salvata';
              statusEl.style.color = 'var(--color-success)';
            }
            UI.toast('Foto caricata', 'success');
          } catch (err) {
            previewEl.innerHTML = a.photo_path
              ? `<img src="/${Utils.escapeHtml(a.photo_path)}" alt="Foto atleta" style="width:100%;height:100%;object-fit:cover;">`
              : `<span style="font-family:var(--font-display);font-size:2rem;font-weight:700;color:#000;">${Utils.initials(a.full_name)}</span>`;
            if (statusEl) { statusEl.textContent = 'Errore: ' + err.message; statusEl.style.color = 'var(--color-pink)'; }
            UI.toast('Errore upload foto: ' + err.message, 'error');
          } finally {
            if (uploadLabel) { uploadLabel.style.opacity = ''; uploadLabel.style.pointerEvents = ''; }
            URL.revokeObjectURL(localUrl);
          }
        }, { signal: _ac.signal });
      }



      // ─── Tab Switching ────────────────────────────────────────────────────
      let _valdLoaded = false;
      const _switchTab = (tabId) => {
        document.querySelectorAll('.athlete-tab-panel').forEach(p => { p.style.display = 'none'; });
        document.querySelectorAll('.athlete-tab-btn').forEach(b => {
          const active = b.dataset.tab === tabId;
          b.style.borderBottomColor = active ? (b.dataset.tab === 'metrics' ? 'var(--color-pink)' : 'var(--color-white)') : 'transparent';
          b.style.color = active
            ? (b.dataset.tab === 'metrics' ? 'var(--color-pink)' : 'var(--color-white)')
            : (b.dataset.tab === 'metrics' ? 'var(--color-pink)' : 'var(--color-text-muted)');
          b.style.opacity = active ? '1' : '0.65';
        });
        const panel = document.getElementById('tab-panel-' + tabId);
        if (panel) panel.style.display = 'flex';

        if (tabId === 'metrics' && !_valdLoaded) {
          _valdLoaded = true;
          renderValdTab(athleteId, a);
        }
      };

      document.querySelectorAll('.athlete-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => _switchTab(btn.dataset.tab), { signal: _ac.signal });
      });

      const tabBar = document.getElementById('athlete-tab-bar');
      const scrollInd = document.getElementById('tab-scroll-indicator');
      if (tabBar && scrollInd) {
        const updateScrollInd = () => {
          const isAtEnd = tabBar.scrollLeft + tabBar.clientWidth >= tabBar.scrollWidth - 10;
          scrollInd.style.opacity = isAtEnd ? '0' : '0.8';
        };
        tabBar.addEventListener('scroll', updateScrollInd, { signal: _ac.signal });
        // Initial check
        setTimeout(updateScrollInd, 100);
      }

      // Default to anagrafica or requested tab
      _switchTab(startTab);

      // Load existing AI summary
      loadAiSummary(athleteId);

    } catch (err) {
      app.innerHTML = Utils.emptyState('Atleta non trovato', err.message);
    }
  }

  // ─── REGISTRY FIELD HELPER ───────────────────────────────────────────────
  function registryField(label, value, accentColor) {
    const color = accentColor || 'var(--color-white)';
    return `
      <div style="display:flex; flex-direction:column; gap:2px;">
        <span style="font-size:11px; color:var(--color-silver); text-transform:uppercase; font-weight:600; letter-spacing:0.04em;">${Utils.escapeHtml(label)}</span>
        <span style="font-size:14px; font-weight:500; color:${color};">${value ? Utils.escapeHtml(String(value)) : '<span style="color:var(--color-text-muted);">—</span>'}</span>
      </div>`;
  }

  function acwrCard(acwr) {
    if (!acwr) return `<div class="stat-card"><span class="stat-label">ACWR</span><span class="stat-value">—</span></div>`;
    const pct = Math.min(100, (acwr.score / 2) * 100);
    const color = Utils.acwrRiskColor(acwr.risk);
    return `
      <div class="stat-card">
        <span class="stat-label">ACWR Score</span>
        <span class="stat-value" style="color:${color};">${Utils.formatNum(acwr.score, 2)}</span>
        <div class="acwr-gauge" style="margin-top:8px;">
          <div class="acwr-bar-track">
            <div class="acwr-bar-fill" style="width:${pct}%;background:${color};"></div>
          </div>
          <div class="acwr-zones">
            <span>BASSO</span><span>OTTIMALE</span><span>CAUTO</span><span>PERICOLO</span>
          </div>
        </div>
        <span class="stat-meta">${Utils.acwrRiskLabel(acwr.risk)}</span>
      </div>`;
  }

  function acwrRisk(score) {
    if (score < 0.8) return 'low';
    if (score <= 1.3) return 'moderate';
    if (score <= 1.5) return 'high';
    return 'extreme';
  }

  async function loadAiSummary(athleteId) {
    const section = document.getElementById('ai-summary-section');
    if (!section) return;
    try {
      const s = await Store.get('aiSummary', 'athletes', { id: athleteId });
      if (s) {
        section.innerHTML = `
          <div>
            <p class="section-label">Report AI Prestazioni</p>
            <div class="card" style="padding:var(--sp-3);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--sp-2);margin-bottom:var(--sp-2);">
                <span style="font-size:12px;color:var(--color-text-muted);">Periodo: ${Utils.formatDate(s.period_start)} → ${Utils.formatDate(s.period_end)}</span>
                <span class="badge badge-pink">AI</span>
              </div>
              <p style="font-size:14px;line-height:1.7;white-space:pre-line;">${Utils.escapeHtml(s.summary_text)}</p>
            </div>
          </div>`;
      }
    } catch { /* No summary yet, that's fine */ }
  }

  // ─── VALD PERFORMANCE TAB ─────────────────────────────────────────────────
  async function renderValdTab(athleteId, athlete) {
    const container = document.getElementById('vald-tab-content');
    if (!container) return;

    container.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;padding:8px 0;">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text" style="width:60%;"></div>
    </div>`;

    try {
      const d = await Store.get('analytics', 'vald', { athleteId });

      if (!d || !d.hasData) {
        container.innerHTML = `
          <div style="text-align:center;padding:var(--sp-4);background:rgba(255,0,255,0.04);border:1px solid rgba(255,0,255,0.1);border-radius:var(--radius);margin-top:8px;">
            <i class="ph ph-lightning-slash" style="font-size:40px;color:var(--color-pink);opacity:0.4;display:block;margin-bottom:12px;"></i>
            <p style="font-size:14px;font-weight:700;color:var(--color-text);margin-bottom:4px;">Nessun dato VALD disponibile</p>
            <p style="font-size:12px;color:var(--color-text-muted);">Nessuna sessione ForceDeck o NordBord trovata per questo atleta.<br>Sincronizza i dati da VALD Hub per visualizzare le performance.</p>
          </div>`;
        return;
      }

      const { semaphore, asymmetry, profile, ranking, coachMessage, testDate, testType } = d;

      // Semaphore colors
      const semColor = { GREEN: '#00E676', YELLOW: '#FFD600', RED: '#FF3B30' }[semaphore?.status] || 'var(--color-text-muted)';
      const semBg = { GREEN: 'rgba(0,230,118,0.08)', YELLOW: 'rgba(255,214,0,0.08)', RED: 'rgba(255,59,48,0.08)' }[semaphore?.status] || 'rgba(255,255,255,0.04)';

      container.innerHTML = `
        <!-- Coach Message -->
        <div style="padding:var(--sp-2);background:rgba(255,255,255,0.04);border-radius:var(--radius);border-left:3px solid ${semColor};font-size:13px;color:var(--color-text-muted);font-style:italic;">
          ${Utils.escapeHtml(coachMessage || '')}
        </div>

        <!-- Semaphore Card -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
          <div style="padding:var(--sp-3);background:${semBg};border:1px solid ${semColor}33;border-radius:var(--radius);text-align:center;">
            <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Stato Neuromuscolare</div>
            <div style="font-size:28px;font-family:var(--font-display);font-weight:800;color:${semColor};">${Utils.escapeHtml(semaphore?.label || '—')}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:8px;">Test: ${Utils.escapeHtml(testDate || '—')} • ${Utils.escapeHtml(testType || '—')}</div>
          </div>

          <!-- RSImod & TimeToTakeoff -->
          <div style="padding:var(--sp-3);background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:var(--radius);">
            <div style="font-size:11px;color:var(--color-pink);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">ForceDecks — RSImod</div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;">
              <div>
                <span style="font-size:28px;font-family:var(--font-display);font-weight:700;line-height:1;">${semaphore?.rsimod?.current ?? '—'}</span>
                <span style="font-size:11px;color:var(--color-text-muted);"> attuale</span>
              </div>
              <div style="text-align:right;">
                <span style="display:block;font-size:14px;font-family:var(--font-display);font-weight:700;color:var(--color-text-muted);">${semaphore?.rsimod?.baseline ?? '—'}</span>
                <span style="font-size:10px;color:var(--color-text-muted);text-transform:uppercase;">Baseline</span>
              </div>
            </div>
            ${semaphore?.rsimod?.variation != null ? `
            <div style="margin-top:8px;font-size:11px;color:${semaphore.rsimod.variation > 5 ? '#FF9500' : '#00E676'};">
              Δ ${semaphore.rsimod.variation.toFixed(1)}% vs baseline
            </div>` : ''}
          </div>
        </div>

        <!-- Asymmetry -->
        <div style="padding:var(--sp-3);background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:var(--radius);">
          <p style="font-size:11px;color:var(--color-cyan);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Asimmetria Forza (Sinistra / Destra)</p>
          ${asymmetry?.criticalRisk ? `<div style="padding:8px 12px;background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.3);border-radius:6px;font-size:12px;color:#FF3B30;margin-bottom:10px;">${Utils.escapeHtml(asymmetry.riskMessage || '')}</div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
            <div>
              <div style="font-size:10px;color:var(--color-text-muted);margin-bottom:4px;text-transform:uppercase;">Atterraggio</div>
              <div style="font-size:22px;font-family:var(--font-display);font-weight:700;color:${(asymmetry?.landing?.asymmetry || 0) > 15 ? '#FF3B30' : (asymmetry?.landing?.asymmetry || 0) > 10 ? '#FFD600' : '#00E676'};">${asymmetry?.landing?.asymmetry ?? '—'}%</div>
              <div style="font-size:11px;color:var(--color-text-muted);">Dom: ${asymmetry?.landing?.dominant ?? '—'} · Deb: ${asymmetry?.landing?.weaker ?? '—'}</div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--color-text-muted);margin-bottom:4px;text-transform:uppercase;">Forza Picco</div>
              <div style="font-size:22px;font-family:var(--font-display);font-weight:700;color:${(asymmetry?.peak?.asymmetry || 0) > 15 ? '#FF3B30' : (asymmetry?.peak?.asymmetry || 0) > 10 ? '#FFD600' : '#00E676'};">${asymmetry?.peak?.asymmetry ?? '—'}%</div>
              <div style="font-size:11px;color:var(--color-text-muted);">Dom: ${asymmetry?.peak?.dominant ?? '—'} · Deb: ${asymmetry?.peak?.weaker ?? '—'}</div>
            </div>
          </div>
        </div>

        <!-- Force-Velocity Profile -->
        <div style="padding:var(--sp-3);background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:var(--radius);">
          <p style="font-size:11px;color:var(--color-yellow, #FFD600);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Profilo Forza-Velocità</p>
          <div style="display:flex;align-items:center;gap:var(--sp-3);">
            <div style="flex:0 0 auto;text-align:center;padding:12px 16px;background:rgba(255,214,0,0.08);border:1px solid rgba(255,214,0,0.2);border-radius:var(--radius);">
              <div style="font-size:20px;font-family:var(--font-display);font-weight:800;color:#FFD600;">${Utils.escapeHtml(profile?.classification || '—')}</div>
              <div style="font-size:10px;color:var(--color-text-muted);margin-top:4px;">Classificazione</div>
            </div>
            <div style="flex:1;">
              <div style="font-size:12px;color:var(--color-text-muted);line-height:1.5;">${Utils.escapeHtml(profile?.recommendation || '')}</div>
              <div style="margin-top:8px;display:flex;gap:16px;">
                <div><span style="font-size:16px;font-weight:700;">${profile?.jumpHeight ?? '—'} cm</span><br><span style="font-size:10px;color:var(--color-text-muted);">Altezza Salto</span></div>
                <div><span style="font-size:16px;font-weight:700;">${profile?.peakForceBW ?? '—'} BW</span><br><span style="font-size:10px;color:var(--color-text-muted);">Forza / Peso</span></div>
              </div>
            </div>
          </div>
        </div>

        ${ranking && ranking.length > 0 ? `
        <!-- Team Ranking -->
        <div style="padding:var(--sp-3);background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:var(--radius);">
          <p style="font-size:11px;color:var(--color-text-muted);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Classifica Squadra (RSImod)</p>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${ranking.map((r, i) => `
              <div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:6px;background:${r.athlete_id === athleteId ? 'rgba(255,0,255,0.08)' : 'transparent'};">
                <span style="font-size:13px;font-weight:700;color:var(--color-text-muted);width:20px;">#${i + 1}</span>
                <span style="flex:1;font-size:13px;">${Utils.escapeHtml(r.full_name || '—')}</span>
                <span style="font-size:13px;font-weight:700;color:${r.athlete_id === athleteId ? 'var(--color-pink)' : 'var(--color-text)'};">${r.rsimod ?? '—'}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="text-align:center;padding:var(--sp-4);background:rgba(255,59,48,0.04);border:1px solid rgba(255,59,48,0.2);border-radius:var(--radius);">
          <i class="ph ph-warning" style="font-size:36px;color:#FF3B30;opacity:0.6;display:block;margin-bottom:8px;"></i>
          <p style="font-size:13px;font-weight:700;color:var(--color-text);">Errore caricamento VALD</p>
          <p style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">${Utils.escapeHtml(err.message)}</p>
        </div>`;
    }
  }


  // ─── METRIC LOG MODAL ─────────────────────────────────────────────────────
  function showMetricModal(athleteId) {
    const m = UI.modal({
      title: 'Registra Carico',
      body: `
        <div class="form-group">
          <label class="form-label" for="metric-date">Data</label>
          <input id="metric-date" class="form-input" type="date" value="${Utils.isoDate()}" required>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="metric-duration">Durata (minuti)</label>
            <input id="metric-duration" class="form-input" type="number" min="1" max="300" placeholder="90">
          </div>
          <div class="form-group">
            <label class="form-label" for="metric-rpe">RPE (1–10)</label>
            <input id="metric-rpe" class="form-input" type="number" min="1" max="10" placeholder="7">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="metric-notes">Note allenatore</label>
          <textarea id="metric-notes" class="form-textarea" placeholder="Osservazioni sul rendimento..." style="min-height:80px;"></textarea>
        </div>
        <div id="metric-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="metric-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="metric-save" type="button">SALVA</button>`,
    });

    document.getElementById('metric-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal });
    document.getElementById('metric-save')?.addEventListener('click', async () => {
      const date = document.getElementById('metric-date').value;
      const dur = parseInt(document.getElementById('metric-duration').value) || 0;
      const rpe = parseInt(document.getElementById('metric-rpe').value) || 0;
      const notes = document.getElementById('metric-notes').value;
      const errEl = document.getElementById('metric-error');

      if (!date || dur < 1 || rpe < 1 || rpe > 10) {
        errEl.textContent = 'Compila tutti i campi correttamente';
        errEl.classList.remove('hidden');
        return;
      }

      const btn = document.getElementById('metric-save');
      btn.disabled = true; btn.textContent = 'Salvataggio...';

      try {
        const res = await Store.api('logMetric', 'athletes', { athlete_id: athleteId, log_date: date, duration_min: dur, rpe, notes });
        m.close();
        UI.toast(`Carico salvato. ACWR: ${res.acwr?.score ?? '—'}`, 'success');
        _renderAthleteDetail(athleteId); // Refresh profile
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'SALVA';
      }
    }, { signal: _ac.signal });
  }

  // ─── AI REPORT ────────────────────────────────────────────────────────────
  async function requestAiReport(athleteId) {
    const btn = document.getElementById('ai-report-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generazione...'; }

    try {
      const res = await Store.api('aiReport', 'athletes', { athlete_id: athleteId });
      UI.toast('Report AI generato con successo', 'success');
      loadAiSummary(athleteId);
    } catch (err) {
      UI.toast('Errore generazione report: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '⚡ REPORT AI'; }
    }
  }

  // ─── CREATE ATHLETE MODAL (Multi-Step Wizard) ──────────────────────────────
  function showCreateModal() {
    const teamOptions = _teams.map(t =>
      `<option value="${Utils.escapeHtml(t.id)}">${Utils.escapeHtml(formatTeamLabel(t.category, t.name))}</option>`
    ).join('');

    let _wizardStep = 1;
    const TOTAL_STEPS = 4;

    const stepTitles = ['Dati Obbligatori', 'Dati Sportivi', 'Contatti', 'Documenti'];

    const progressBar = () => `
      <div style="display:flex;align-items:center;gap:0;margin-bottom:20px;">
        ${[1, 2, 3, 4].map(s => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
              ${s < _wizardStep ? 'background:var(--color-success);color:#000;' : s === _wizardStep ? 'background:var(--color-pink);color:#fff;' : 'background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);'}">${s < _wizardStep ? '✓' : s}</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;color:${s === _wizardStep ? 'var(--color-white)' : 'rgba(255,255,255,0.35)'};">${stepTitles[s - 1]}</div>
          </div>
          ${s < 4 ? `<div style="flex:0.5;height:2px;background:${s < _wizardStep ? 'var(--color-success)' : 'rgba(255,255,255,0.1)'};margin-bottom:20px;"></div>` : ''}
        `).join('')}
      </div>`;

    const step1 = `
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-fname">Nome *</label><input id="na-fname" class="form-input" type="text" placeholder="Marco" required></div>
        <div class="form-group"><label class="form-label" for="na-lname">Cognome *</label><input id="na-lname" class="form-input" type="text" placeholder="Rossi" required></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-team">Squadra *</label><select id="na-team" class="form-select"><option value="">Seleziona...</option>${teamOptions}</select></div>
        <div class="form-group"><label class="form-label" for="na-birth">Data di Nascita</label><input id="na-birth" class="form-input" type="date"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-birthplace">Luogo di Nascita</label><input id="na-birthplace" class="form-input" type="text" placeholder="Roma"></div>
        <div class="form-group"><label class="form-label" for="na-rescity">Città di Residenza</label><input id="na-rescity" class="form-input" type="text" placeholder="Milano"></div>
      </div>`;

    const step2 = `
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-role">Ruolo</label><input id="na-role" class="form-input" type="text" placeholder="Palleggiatrice"></div>
        <div class="form-group"><label class="form-label" for="na-jersey">N° Maglia</label><input id="na-jersey" class="form-input" type="number" min="1" max="99" placeholder="10"></div>
      </div>
  <div class="form-grid">
    <div class="form-group"><label class="form-label" for="na-height">Altezza (cm)</label><input id="na-height" class="form-input" type="number" placeholder="180"></div>
    <div class="form-group"><label class="form-label" for="na-weight">Peso (kg)</label><input id="na-weight" class="form-input" type="number" placeholder="75"></div>
  </div>`;

    const step3 = `
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-phone">Cellulare</label><input id="na-phone" class="form-input" type="tel" placeholder="+39 333 1234567"></div>
        <div class="form-group"><label class="form-label" for="na-email">E-Mail</label><input id="na-email" class="form-input" type="email" placeholder="atleta@email.com"></div>
      </div>
  <div class="form-group">
    <label class="form-label" for="na-resaddr" style="display:flex;align-items:center;gap:8px;">
      Via di Residenza
      <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);border-radius:6px;padding:2px 8px;font-size:10px;color:#4285F4;font-weight:700;letter-spacing:0.5px;">
        <i class="ph ph-google-logo"></i> Google Maps
      </span>
    </label>
    <div style="position:relative;">
      <i class="ph ph-magnifying-glass" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.35);font-size:16px;pointer-events:none;"></i>
      <input id="na-resaddr" class="form-input" type="text" placeholder="Via Roma 1, Milano" autocomplete="off" style="padding-left:40px;">
    </div>
  </div>`;

    const step4 = `
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-fiscal">Codice Fiscale</label><input id="na-fiscal" class="form-input" type="text" placeholder="RSSMRC90A01H501Z" maxlength="16" style="text-transform:uppercase;"></div>
        <div class="form-group"><label class="form-label" for="na-doc">Documento d'Identità</label><input id="na-doc" class="form-input" type="text" placeholder="CI / Passaporto"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-medcert">Scadenza Cert. Medico</label><input id="na-medcert" class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label" for="na-fipav">Matricola FIPAV</label><input id="na-fipav" class="form-input" type="text" placeholder="FI-123456"></div>
      </div>
      <div class="form-group"><label class="form-label" for="na-parent">Contatto genitore (per minori)</label><input id="na-parent" class="form-input" type="text" placeholder="Nome cognome genitore"></div>`;

    const steps = [step1, step2, step3, step4];

    // Store field values across steps
    const _vals = {};
    const _saveCurrentFields = () => {
      document.querySelectorAll('#wizard-step-content input, #wizard-step-content select').forEach(el => {
        _vals[el.id] = el.value;
      });
    };
    const _restoreFields = () => {
      requestAnimationFrame(() => {
        Object.entries(_vals).forEach(([id, val]) => {
          const el = document.getElementById(id);
          if (el) el.value = val;
        });
      });
    };

    const _renderStep = () => {
      const body = document.getElementById('wizard-body');
      if (!body) return;
      body.innerHTML = progressBar() + `<div id="wizard-step-content">${steps[_wizardStep - 1]}</div><div id="na-error" class="form-error hidden"></div>`;
      _restoreFields();

      // Update footer buttons
      const prevBtn = document.getElementById('na-prev');
      const nextBtn = document.getElementById('na-next');
      const saveBtn = document.getElementById('na-save');
      if (prevBtn) prevBtn.style.display = _wizardStep === 1 ? 'none' : '';
      if (nextBtn) nextBtn.style.display = _wizardStep === TOTAL_STEPS ? 'none' : '';
      if (saveBtn) saveBtn.style.display = _wizardStep === TOTAL_STEPS ? '' : 'none';

      // Google autocomplete on step 3
      if (_wizardStep === 3) {
        _loadPlacesLib(() => _attachGoogleAutocomplete(
          document.getElementById('na-resaddr'),
          ({ address, city }) => {
            if (city) {
              const cityEl = document.getElementById('na-rescity');
              if (cityEl) {
                cityEl.value = city;
                _vals['na-rescity'] = city;
              }
            }
          }
        ));
      }
    };

    const m = UI.modal({
      title: 'Nuovo Atleta',
      body: `<div id="wizard-body"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="na-cancel" type="button">Annulla</button>
        <button class="btn btn-default btn-sm" id="na-prev" type="button" style="display:none;"><i class="ph ph-arrow-left"></i> Indietro</button>
        <button class="btn btn-primary btn-sm" id="na-next" type="button">Avanti <i class="ph ph-arrow-right"></i></button>
        <button class="btn btn-primary btn-sm" id="na-save" type="button" style="display:none;">CREA ATLETA</button>`,
    });

    _renderStep();

    document.getElementById('na-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal });

    document.getElementById('na-prev')?.addEventListener('click', () => {
      _saveCurrentFields();
      if (_wizardStep > 1) { _wizardStep--; _renderStep(); }
    }, { signal: _ac.signal });

    document.getElementById('na-next')?.addEventListener('click', () => {
      // Validate step 1
      if (_wizardStep === 1) {
        const fname = document.getElementById('na-fname')?.value.trim();
        const lname = document.getElementById('na-lname')?.value.trim();
        const team = document.getElementById('na-team')?.value;
        const errEl = document.getElementById('na-error');
        if (!fname || !lname || !team) {
          errEl.textContent = 'Nome, cognome e squadra sono obbligatori';
          errEl.classList.remove('hidden');
          return;
        }
      }
      _saveCurrentFields();
      if (_wizardStep < TOTAL_STEPS) { _wizardStep++; _renderStep(); }
    }, { signal: _ac.signal });

    document.getElementById('na-save')?.addEventListener('click', async () => {
      _saveCurrentFields();
      const errEl = document.getElementById('na-error');
      const btn = document.getElementById('na-save');
      btn.disabled = true; btn.textContent = 'Creazione...';

      try {
        await Store.api('create', 'athletes', {
          first_name: _vals['na-fname'] || '',
          last_name: _vals['na-lname'] || '',
          team_id: _vals['na-team'] || '',
          jersey_number: _vals['na-jersey'] || null,
          role: _vals['na-role'] || null,
          birth_date: _vals['na-birth'] || null,
          birth_place: _vals['na-birthplace'] || null,
          residence_address: _vals['na-resaddr'] || null,
          residence_city: _vals['na-rescity'] || null,
          phone: _vals['na-phone'] || null,
          email: _vals['na-email'] || null,
          identity_document: _vals['na-doc'] || null,
          fiscal_code: (_vals['na-fiscal'] || '').toUpperCase() || null,
          medical_cert_expires_at: _vals['na-medcert'] || null,
          federal_id: _vals['na-fipav'] || null,
          height_cm: _vals['na-height'] || null,
          weight_kg: _vals['na-weight'] || null,
          parent_contact: _vals['na-parent'] || null,
        });
        m.close();
        UI.toast('Atleta creato', 'success');
        // Reload list and return to Anagrafica tab
        _state = await Store.get('list', 'athletes').catch(() => _state);
        _activeMainTab = 'anagrafica';
        _renderMainView();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'CREA ATLETA';
      }
    }, { signal: _ac.signal });
  }

  // ─── EDIT ATHLETE MODAL ───────────────────────────────────────────────────
  function showEditModal(a) {
    const teamOptions = _teams.map(t =>
      `<option value="${Utils.escapeHtml(t.id)}" ${a.team_id === t.id ? 'selected' : ''}>${Utils.escapeHtml(formatTeamLabel(t.category, t.name))}</option>`
    ).join('');

    const m = UI.modal({
      title: 'Modifica Atleta',
      body: `
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-fname">Nome *</label>
            <input id="ea-fname" class="form-input" type="text" value="${Utils.escapeHtml(a.first_name || '')}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-lname">Cognome *</label>
            <input id="ea-lname" class="form-input" type="text" value="${Utils.escapeHtml(a.last_name || '')}" required>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-team">Squadra *</label>
            <select id="ea-team" class="form-select">${teamOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-jersey">N° Maglia</label>
            <input id="ea-jersey" class="form-input" type="number" min="1" max="99" value="${a.jersey_number || ''}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-role">Ruolo</label>
            <input id="ea-role" class="form-input" type="text" value="${Utils.escapeHtml(a.role || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-birth">Data di Nascita</label>
            <input id="ea-birth" class="form-input" type="date" value="${a.birth_date ? a.birth_date.substring(0, 10) : ''}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-birthplace">Luogo di Nascita</label>
            <input id="ea-birthplace" class="form-input" type="text" value="${Utils.escapeHtml(a.birth_place || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-rescity">Città di Residenza</label>
            <input id="ea-rescity" class="form-input" type="text" value="${Utils.escapeHtml(a.residence_city || '')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ea-resaddr" style="display:flex;align-items:center;gap:8px;">
            Via di Residenza
            <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);border-radius:6px;padding:2px 8px;font-size:10px;color:#4285F4;font-weight:700;letter-spacing:0.5px;">
              <i class="ph ph-google-logo"></i> Google Maps
            </span>
          </label>
          <div style="position:relative;">
            <i class="ph ph-magnifying-glass" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.35);font-size:16px;pointer-events:none;"></i>
            <input id="ea-resaddr" class="form-input" type="text" value="${Utils.escapeHtml(a.residence_address || '')}" autocomplete="off" style="padding-left:40px;">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-phone">Cellulare</label>
            <input id="ea-phone" class="form-input" type="tel" value="${Utils.escapeHtml(a.phone || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-email">E-Mail</label>
            <input id="ea-email" class="form-input" type="email" value="${Utils.escapeHtml(a.email || '')}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-doc">Documento d'Identità</label>
            <input id="ea-doc" class="form-input" type="text" value="${Utils.escapeHtml(a.identity_document || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-fiscal">Codice Fiscale</label>
            <input id="ea-fiscal" class="form-input" type="text" value="${Utils.escapeHtml(a.fiscal_code || '')}" maxlength="16" style="text-transform:uppercase;">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-medcert">Scadenza Certificato Medico</label>
            <input id="ea-medcert" class="form-input" type="date" value="${a.medical_cert_expires_at ? a.medical_cert_expires_at.substring(0, 10) : ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-fipav">Matricola FIPAV</label>
            <input id="ea-fipav" class="form-input" type="text" value="${Utils.escapeHtml(a.federal_id || '')}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-height">Altezza (cm)</label>
            <input id="ea-height" class="form-input" type="number" value="${a.height_cm || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-weight">Peso (kg)</label>
            <input id="ea-weight" class="form-input" type="number" value="${a.weight_kg || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ea-parent">Contatto genitore (per minori)</label>
          <input id="ea-parent" class="form-input" type="text" value="${Utils.escapeHtml(a.parent_contact || '')}">
        </div>
        <div id="ea-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="ea-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="ea-save" type="button">SALVA MODIFICHE</button>`,
    });

    document.getElementById('ea-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal });
    document.getElementById('ea-save')?.addEventListener('click', async () => {
      const fname = document.getElementById('ea-fname').value.trim();
      const lname = document.getElementById('ea-lname').value.trim();
      const team = document.getElementById('ea-team').value;
      const errEl = document.getElementById('ea-error');

      if (!fname || !lname || !team) {
        errEl.textContent = 'Nome, cognome e squadra sono obbligatori';
        errEl.classList.remove('hidden');
        return;
      }

      const btn = document.getElementById('ea-save');
      btn.disabled = true; btn.textContent = 'Salvataggio...';

      try {
        await Store.api('update', 'athletes', {
          id: a.id,
          first_name: fname,
          last_name: lname,
          team_id: team,
          jersey_number: document.getElementById('ea-jersey').value || null,
          role: document.getElementById('ea-role').value || null,
          birth_date: document.getElementById('ea-birth').value || null,
          birth_place: document.getElementById('ea-birthplace').value || null,
          residence_address: document.getElementById('ea-resaddr').value || null,
          residence_city: document.getElementById('ea-rescity').value || null,
          phone: document.getElementById('ea-phone').value || null,
          email: document.getElementById('ea-email').value || null,
          identity_document: document.getElementById('ea-doc').value || null,
          fiscal_code: document.getElementById('ea-fiscal').value?.toUpperCase() || null,
          medical_cert_expires_at: document.getElementById('ea-medcert').value || null,
          federal_id: document.getElementById('ea-fipav').value || null,
          height_cm: document.getElementById('ea-height').value || null,
          weight_kg: document.getElementById('ea-weight').value || null,
          parent_contact: document.getElementById('ea-parent').value || null,
        });

        m.close();
        UI.toast('Atleta aggiornato', 'success');
        // Refresh data and re-open detail view
        Store.get('list', 'athletes').then(list => { _state = list; }).catch(() => { });
        _renderAthleteDetail(a.id);
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'SALVA MODIFICHE';
      }
    }, { signal: _ac.signal });

    // Google Maps Autocomplete
    _loadPlacesLib(() => _attachGoogleAutocomplete(
      document.getElementById('ea-resaddr'),
      ({ address, city }) => {
        if (city) {
          const cityEl = document.getElementById('ea-rescity');
          if (cityEl) cityEl.value = city;
        }
      }
    ));
  }

  // ─── GOOGLE MAPS HELPERS ──────────────────────────────────────────────────
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
        z-index: 100000 !important;
      }
      .pac-container::after { display: none !important; }
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
      .pac-icon { display: none !important; }
      .pac-secondary-text { color: rgba(255,255,255,0.45) !important; font-size: 12px !important; }
    `;
    document.head.appendChild(style);
  }

  function _attachGoogleAutocomplete(input, onPlace) {
    if (!input || typeof google === 'undefined' || !google.maps?.places) return;
    const ac = new google.maps.places.Autocomplete(input, {
      types: ['establishment', 'geocode'],
      fields: ['formatted_address', 'geometry', 'name', 'address_components'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || input.value;
      input.value = address;

      // Estrai città
      let city = '';
      if (place.address_components) {
        const cityComp = place.address_components.find(c =>
          c.types.includes('locality') || c.types.includes('postal_town')
        );
        if (cityComp) city = cityComp.long_name;
      }

      if (onPlace) onPlace({ lat, lng, address, city, place });
    });
  }

  function destroy() {
    _ac.abort();
    _ac = new AbortController();
  }

  return { destroy, init };
})();
window.Athletes = Athletes;
