/**
 * Athletes Module — List, Hero Profile, Metrics, ACWR, AI Report
 * Fusion ERP v1.0
 */

'use strict';

const Athletes = (() => {
  let _state = [];
  let _teams = [];
  let _currentTeam = '';

  async function init() {
    const app = document.getElementById('app');
    if (!app) return;

    UI.loading(true);
    app.innerHTML = UI.skeletonPage();

    try {
      [_teams, _state] = await Promise.all([
        Store.get('teams', 'athletes'),
        Store.get('list', 'athletes'),
      ]);
      renderList();
    } catch (err) {
      app.innerHTML = Utils.emptyState('Errore nel caricamento atleti', err.message);
      UI.toast('Errore caricamento atleti', 'error');
    } finally {
      UI.loading(false);
    }
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  function renderList() {
    const app = document.getElementById('app');
    const filtered = _currentTeam ? _state.filter(a => a.team_id === _currentTeam || a.team_name === _currentTeam) : _state;
    const user = App.getUser();
    const canEdit = ['admin', 'manager', 'operator'].includes(user?.role);

    app.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Atleti</h1>
          <p class="page-subtitle">${filtered.length} atleti${_currentTeam ? ' in squadra selezionata' : ' totali'}</p>
        </div>
        ${canEdit ? `<button class="btn btn-primary" id="new-athlete-btn" type="button">+ NUOVO ATLETA</button>` : ''}
      </div>

      <div class="page-body">
        <!-- Team filter chips -->
        <div class="filter-bar" id="team-filter">
          <button class="filter-chip ${!_currentTeam ? 'active' : ''}" data-team="" type="button">Tutti</button>
          ${_teams.map(t =>
      `<button class="filter-chip ${_currentTeam === t.id ? 'active' : ''}" data-team="${Utils.escapeHtml(t.id)}" type="button">${Utils.escapeHtml(t.category)} — ${Utils.escapeHtml(t.name)}</button>`
    ).join('')}
        </div>

        ${filtered.length === 0
        ? Utils.emptyState('Nessun atleta trovato', 'Aggiunge il primo atleta con il pulsante in alto.')
        : `<div class="grid-3" id="athletes-grid">
              ${filtered.map(a => athleteCard(a)).join('')}
            </div>`}
      </div>`;

    // Events
    Utils.qsa('[data-team]').forEach(btn => btn.addEventListener('click', () => {
      _currentTeam = btn.dataset.team;
      renderList();
    }));

    Utils.qsa('[data-athlete-id]').forEach(card => card.addEventListener('click', () => {
      showProfile(card.dataset.athleteId);
    }));

    document.getElementById('new-athlete-btn')?.addEventListener('click', () => showCreateModal());
  }

  function athleteCard(a) {
    const acwrColor = a.acwr_risk ? Utils.acwrRiskColor(a.acwr_risk) : 'transparent';
    return `
      <div class="card" style="cursor:pointer;position:relative;overflow:hidden;" data-athlete-id="${Utils.escapeHtml(a.id)}">
        ${a.acwr_risk && a.acwr_risk !== 'moderate' && a.acwr_risk !== 'low' ? `<div style="position:absolute;top:var(--sp-2);right:var(--sp-2);width:24px;height:24px;border-radius:50%;background:${acwrColor};display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 0 8px ${acwrColor};">⚠️</div>` : ''}
        <div style="display:flex;align-items:flex-start;gap:var(--sp-2);">
          <div style="width:48px;height:48px;background:var(--color-pink);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:#000;">
            ${a.jersey_number != null ? Utils.escapeHtml(String(a.jersey_number)) : Utils.initials(a.full_name)}
          </div>
          <div style="overflow:hidden;flex:1;">
            <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;">${Utils.escapeHtml(a.full_name)}</div>
            <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(a.role || '—')}</div>
            <div style="margin-top:4px;">${Utils.badge(a.category + ' — ' + a.team_name, 'muted')}</div>
          </div>
        </div>
      </div>`;
  }

  // ─── HERO PROFILE VIEW ────────────────────────────────────────────────────
  async function showProfile(athleteId) {
    const app = document.getElementById('app');
    app.innerHTML = UI.skeletonPage();

    try {
      const a = await Store.get('get', 'athletes', { id: athleteId });
      const user = App.getUser();
      const canEdit = ['admin', 'manager', 'operator'].includes(user?.role);

      app.innerHTML = `
        <!-- HERO SECTION -->
        <div class="athlete-hero" style="position:relative; min-height:400px; display:flex; align-items:flex-end; overflow:hidden; border-bottom:1px solid var(--color-border); background:var(--color-black);">
          <img class="athlete-hero-photo duotone-img" style="position:absolute; right:0; bottom:0; height:100%; width:auto; object-fit:cover; object-position:top; opacity:0.6;" src="assets/media/player_hero_bg.png" alt="Athlete Silhouette">
          <div class="athlete-hero-overlay" style="position:relative; z-index:2; padding:var(--sp-4); background:linear-gradient(to right, rgba(0,0,0,0.95) 30%, transparent 100%); width:80%;">
            <div class="athlete-jersey" style="font-family:var(--font-display); font-size:96px; font-weight:800; color:var(--color-pink); line-height:1; letter-spacing:-0.04em; margin-bottom:var(--sp-2);">#${a.jersey_number != null ? Utils.escapeHtml(String(a.jersey_number)) : '—'}</div>
            <div class="athlete-name-hero" style="font-family:var(--font-display); font-size:56px; font-weight:700; text-transform:uppercase; letter-spacing:-0.02em; line-height:1; color:var(--color-white);">${Utils.escapeHtml(a.full_name)}</div>
          </div>
        </div>

        <div class="page-body" style="display:flex;flex-direction:column;gap:var(--sp-4); background:var(--color-black);">
          <div style="display:flex;align-items:center;gap:var(--sp-2);">
            <button class="btn btn-ghost btn-sm" id="back-to-list" style="color:var(--color-white); border:none; padding:0; display:flex; align-items:center; gap:8px;" type="button">
                <i class="ph ph-arrow-left" style="font-size:24px;"></i> TORNA ALLA LISTA
            </button>
            <div style="flex:1;"></div>
            ${['admin', 'manager'].includes(user?.role) ? `<button class="btn btn-default btn-sm" id="ai-report-btn" type="button">⚡ REPORT AI</button>` : ''}
          </div>
          
          <!-- Basic Stats -->
          <div class="grid-2" style="margin-bottom: var(--sp-2);">
              <div style="display:flex; flex-direction:column;">
                  <span style="font-family:var(--font-display); font-size:48px; font-weight:700; line-height:1;">${Utils.escapeHtml(a.role || '—')}</span>
                  <span style="font-size:12px; color:var(--color-silver); text-transform:uppercase; font-weight:500;">RUOLO</span>
              </div>
              <div style="display:flex; flex-direction:column;">
                  <span style="font-family:var(--font-display); font-size:48px; font-weight:700; line-height:1;">${a.height_cm || '—'}</span>
                  <span style="font-size:12px; color:var(--color-silver); text-transform:uppercase; font-weight:500;">ALTEZZA (CM)</span>
              </div>
              <div style="display:flex; flex-direction:column;">
                  <span style="font-family:var(--font-display); font-size:48px; font-weight:700; line-height:1;">${a.weight_kg || '—'}</span>
                  <span style="font-size:12px; color:var(--color-silver); text-transform:uppercase; font-weight:500;">PESO (KG)</span>
              </div>
              <div style="display:flex; flex-direction:column;">
                  <span style="font-family:var(--font-display); font-size:48px; font-weight:700; line-height:1;">${a.birth_date ? new Date().getFullYear() - new Date(a.birth_date).getFullYear() : '—'}</span>
                  <span style="font-size:12px; color:var(--color-silver); text-transform:uppercase; font-weight:500;">ETÀ</span>
              </div>
          </div>

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

          <!-- AI Summary section -->
          <div id="ai-summary-section"></div>
        </div>
        
        <!-- Bottom Action Bar per Carico Allenamento -->
        ${canEdit ? `
        <div style="position:sticky; bottom:0; left:0; width:100%; padding:var(--sp-2); background:var(--color-bg-card); border-top:1px solid var(--color-border); z-index:100;">
            <button class="btn btn-primary" id="log-metric-btn" type="button" style="width:100%; font-size:16px; padding:16px; letter-spacing:0.02em;">
                <i class="ph ph-plus" style="font-size:24px; margin-right:8px;"></i> CARICO ALLENAMENTO
            </button>
        </div>` : ''}`;

      document.getElementById('back-to-list')?.addEventListener('click', () => renderList());
      document.getElementById('log-metric-btn')?.addEventListener('click', () => showMetricModal(athleteId));
      document.getElementById('ai-report-btn')?.addEventListener('click', () => requestAiReport(athleteId));

      // Load existing AI summary
      loadAiSummary(athleteId);

    } catch (err) {
      app.innerHTML = Utils.emptyState('Atleta non trovato', err.message);
    }
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

    document.getElementById('metric-cancel')?.addEventListener('click', () => m.close());
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
        showProfile(athleteId); // Refresh profile
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'SALVA';
      }
    });
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

  // ─── CREATE ATHLETE MODAL ─────────────────────────────────────────────────
  function showCreateModal() {
    const teamOptions = _teams.map(t =>
      `<option value="${Utils.escapeHtml(t.id)}">${Utils.escapeHtml(t.category)} — ${Utils.escapeHtml(t.name)}</option>`
    ).join('');

    const m = UI.modal({
      title: 'Nuovo Atleta',
      body: `
        <div class="form-group">
          <label class="form-label" for="na-name">Nome Completo *</label>
          <input id="na-name" class="form-input" type="text" placeholder="Marco Rossi" required>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="na-team">Squadra *</label>
            <select id="na-team" class="form-select"><option value="">Seleziona...</option>${teamOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label" for="na-jersey">N° Maglia</label>
            <input id="na-jersey" class="form-input" type="number" min="1" max="99" placeholder="10">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="na-role">Ruolo</label>
            <input id="na-role" class="form-input" type="text" placeholder="Playmaker">
          </div>
          <div class="form-group">
            <label class="form-label" for="na-birth">Data di nascita</label>
            <input id="na-birth" class="form-input" type="date">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="na-height">Altezza (cm)</label>
            <input id="na-height" class="form-input" type="number" placeholder="180">
          </div>
          <div class="form-group">
            <label class="form-label" for="na-weight">Peso (kg)</label>
            <input id="na-weight" class="form-input" type="number" placeholder="75">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="na-parent">Contatto genitore</label>
          <input id="na-parent" class="form-input" type="text" placeholder="Nome cognome genitore">
        </div>
        <div id="na-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="na-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="na-save" type="button">CREA ATLETA</button>`,
    });

    document.getElementById('na-cancel')?.addEventListener('click', () => m.close());
    document.getElementById('na-save')?.addEventListener('click', async () => {
      const name = document.getElementById('na-name').value.trim();
      const team = document.getElementById('na-team').value;
      const errEl = document.getElementById('na-error');

      if (!name || !team) {
        errEl.textContent = 'Nome e squadra sono obbligatori';
        errEl.classList.remove('hidden');
        return;
      }

      const btn = document.getElementById('na-save');
      btn.disabled = true; btn.textContent = 'Creazione...';

      try {
        await Store.api('create', 'athletes', {
          full_name: name,
          team_id: team,
          jersey_number: document.getElementById('na-jersey').value || null,
          role: document.getElementById('na-role').value || null,
          birth_date: document.getElementById('na-birth').value || null,
          height_cm: document.getElementById('na-height').value || null,
          weight_kg: document.getElementById('na-weight').value || null,
          parent_contact: document.getElementById('na-parent').value || null,
        });
        m.close();
        UI.toast('Atleta creato', 'success');
        init(); // Refresh
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'CREA ATLETA';
      }
    });
  }

  return { init };
})();
window.Athletes = Athletes;
