/**
 * Transport Module — Events, Carpooling, Routes, Reimbursements
 * Fusion ERP v1.0
 */

'use strict';

const Transport = (() => {
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

    app.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Trasporti & Logistica</h1>
          <p class="page-subtitle">${_events.length} eventi programmati</p>
        </div>
        ${canCreate ? `<button class="btn btn-primary" id="new-event-btn" type="button">+ NUOVO EVENTO</button>` : ''}
      </div>

      <div class="page-body">
        <div class="filter-bar">
          <button class="filter-chip active" data-type-filter="" type="button">Tutti</button>
          <button class="filter-chip" data-type-filter="training" type="button">Allenamenti</button>
          <button class="filter-chip" data-type-filter="away_game" type="button">Trasferte</button>
          <button class="filter-chip" data-type-filter="tournament" type="button">Tornei</button>
        </div>

        <div id="events-list">
          ${_events.length === 0
        ? Utils.emptyState('Nessun evento programmato')
        : _events.map(ev => eventRow(ev, typeLabels)).join('')}
        </div>
      </div>`;

    // Filter chips
    Utils.qsa('[data-type-filter]').forEach(btn => btn.addEventListener('click', () => {
      Utils.qsa('[data-type-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.typeFilter;
      const filtered = type ? _events.filter(e => e.type === type) : _events;
      document.getElementById('events-list').innerHTML = filtered.length === 0
        ? Utils.emptyState('Nessun evento trovato')
        : filtered.map(ev => eventRow(ev, typeLabels)).join('');
      _attachEventListeners();
    }));

    document.getElementById('new-event-btn')?.addEventListener('click', () => showCreateEventModal());
    _attachEventListeners();
  }

  function _attachEventListeners() {
    Utils.qsa('[data-event-id]').forEach(row => row.addEventListener('click', () => showCarpoolView(row.dataset.eventId)));
  }

  function eventRow(ev, typeLabels) {
    const statusColors = { scheduled: 'muted', confirmed: 'green', cancelled: 'red' };
    const typeIcons = {
      training: '🏃', away_game: '🚌', home_game: '🏠', tournament: '🏆',
    };
    return `
      <div class="card" style="cursor:pointer;display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-2) var(--sp-3);margin-bottom:8px;" data-event-id="${Utils.escapeHtml(ev.id)}">
        <div style="font-size:1.5rem;flex-shrink:0;">${typeIcons[ev.type] || '📅'}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-family:var(--font-display);font-weight:700;">${Utils.escapeHtml(ev.title)}</div>
          <div style="font-size:12px;color:var(--color-text-muted);">
            ${Utils.escapeHtml(ev.team_name)} (${Utils.escapeHtml(ev.category)}) — ${Utils.escapeHtml(ev.location_name || 'Luogo TBD')}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:13px;">${Utils.formatDateTime(ev.event_date)}</div>
          ${Utils.badge(typeLabels[ev.type] || ev.type, statusColors[ev.status] || 'muted')}
        </div>
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

      app.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">${Utils.escapeHtml(event?.title || 'Evento')}</h1>
            <p class="page-subtitle">${Utils.formatDateTime(event?.event_date)} — ${Utils.escapeHtml(event?.location_name || '—')}</p>
          </div>
          <div style="display:flex;gap:var(--sp-1);">
            <button class="btn btn-ghost btn-sm" id="back-events" type="button">← EVENTI</button>
            ${canManage ? `<button class="btn btn-default btn-sm" id="match-carpool-btn" type="button">🔗 ABBINA CARPOOLING</button>` : ''}
            <button class="btn btn-default btn-sm" id="add-route-btn" type="button">+ OFFRI PASSAGGIO</button>
            ${canManage ? `<button class="btn btn-primary btn-sm" id="send-convocations-btn" type="button">✉ INVIA CONVOCAZIONI</button>` : ''}
          </div>
        </div>

        <div class="page-body" style="display:flex;flex-direction:column;gap:var(--sp-3);">

          <!-- Google Maps preview placeholder -->
          <div style="background:#0a0a0a;border:1px solid var(--color-border);height:200px;display:flex;align-items:center;justify-content:center;position:relative;" id="map-container">
            ${event?.location_lat && event?.location_lng
          ? `<div id="gmap" style="width:100%;height:100%;"></div>`
          : `<p style="color:var(--color-text-muted);font-size:13px;">Coordinate GPS non disponibili per questo evento.</p>`}
          </div>

          <!-- Routes / Carpool -->
          <div>
            <p class="section-label">Tratte disponibili (${routes.length})</p>
            ${routes.length === 0
          ? Utils.emptyState('Nessuna tratta offerta ancora', 'Clicca "+ Offri Passaggio" per aggiungere la tua auto.')
          : routes.map(r => routeCard(r, eventId)).join('')}
          </div>

          <!-- Carpool match result -->
          <div id="match-result"></div>
        </div>`;

      document.getElementById('back-events')?.addEventListener('click', () => renderEventList());
      document.getElementById('add-route-btn')?.addEventListener('click', () => showAddRouteModal(eventId));
      document.getElementById('match-carpool-btn')?.addEventListener('click', () => runCarpoolMatch(eventId));
      document.getElementById('send-convocations-btn')?.addEventListener('click', () => sendConvocations(eventId));

      // Init Google Map if coords available
      if (event?.location_lat && event?.location_lng) {
        _initGoogleMap(event.location_lat, event.location_lng, event.location_name);
      }

    } catch (err) {
      UI.toast('Errore: ' + err.message, 'error');
    }
  }

  function routeCard(r, eventId) {
    const pct = r.seats_total > 0 ? Math.round((1 - r.seats_available / r.seats_total) * 100) : 0;
    return `
      <div class="card" style="padding:var(--sp-2) var(--sp-3);margin-bottom:8px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);">
          <div>
            <span style="font-family:var(--font-display);font-weight:700;">🚗 ${Utils.escapeHtml(r.driver_name)}</span>
            ${r.driver_phone ? `<span style="font-size:12px;color:var(--color-text-muted);margin-left:8px;">${Utils.escapeHtml(r.driver_phone)}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-1);">
            ${Utils.badge(r.seats_available + '/' + r.seats_total + ' posti', r.seats_available > 0 ? 'green' : 'red')}
            ${r.distance_km ? `<span style="font-size:12px;">${Utils.formatNum(r.distance_km, 1)} km</span>` : ''}
          </div>
        </div>
        ${r.meeting_point_name ? `<p style="font-size:12px;color:var(--color-text-muted);margin-top:6px;">📍 ${Utils.escapeHtml(r.meeting_point_name)}</p>` : ''}
        ${r.departure_time ? `<p style="font-size:12px;color:var(--color-text-muted);">🕐 Partenza: ${Utils.formatDateTime(r.departure_time)}</p>` : ''}
        <!-- Seat fill bar -->
        <div style="margin-top:10px;height:3px;background:rgba(255,255,255,0.1);">
          <div style="height:100%;width:${pct}%;background:var(--color-pink);transition:width 0.3s ease;"></div>
        </div>
        ${r.reimbursement_eur ? `
          <div style="margin-top:8px;display:flex;align-items:center;gap:var(--sp-1);">
            <span style="font-size:12px;color:var(--color-text-muted);">Rimborso: ${Utils.formatCurrency(r.reimbursement_eur)}</span>
            <button class="btn btn-ghost btn-sm" data-carpool-id="${Utils.escapeHtml(r.id)}" data-km="${Utils.escapeHtml(String(r.distance_km || 0))}" id="gen-reimb-${Utils.escapeHtml(r.id)}" type="button">PDF</button>
          </div>` : ''}
      </div>`;
  }

  async function runCarpoolMatch(eventId) {
    const resultDiv = document.getElementById('match-result');
    if (resultDiv) resultDiv.innerHTML = '<p style="color:var(--color-text-muted);">Calcolo abbinamenti...</p>';
    try {
      const matches = await Store.get('matchCarpool', 'transport', { eventId });
      if (!resultDiv) return;
      if (!matches.length) { resultDiv.innerHTML = Utils.emptyState('Nessun abbinamento possibile'); return; }
      resultDiv.innerHTML = `
        <p class="section-label">Abbinamenti Carpooling</p>
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Tratta / Autista</th><th>Atleta</th><th>Posti liberi</th><th>Stato</th></tr></thead>
            <tbody>
              ${matches.map(m => {
        const isUnmatched = !m.driver_name;
        return `<tr style="${isUnmatched ? 'background:rgba(230, 0, 126, 0.15); border-left:4px solid var(--color-pink);' : ''}">
                <td>${isUnmatched ? '<span style="color:var(--color-pink);font-weight:700;">NESSUN PASSAGGIO</span>' : Utils.escapeHtml(m.driver_name)}<br><span style="font-size:11px;color:var(--color-text-muted);">${m.departure_time ? Utils.formatDateTime(m.departure_time) : ''}</span></td>
                <td>${Utils.escapeHtml(m.athlete_name)}<br><span style="font-size:11px;color:var(--color-text-muted);">${Utils.escapeHtml(m.parent_phone || '')}</span></td>
                <td>${isUnmatched ? '—' : Utils.escapeHtml(String(m.seats_available))}</td>
                <td>${isUnmatched ? Utils.badge('SENZA POSTO', 'red') : m.passenger_status ? Utils.badge(m.passenger_status, 'muted') : Utils.badge('Disponibile', 'green')}</td>
              </tr>`}).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (err) {
      UI.toast('Errore abbinamento: ' + err.message, 'error');
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

    document.getElementById('route-cancel')?.addEventListener('click', () => m.close());
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
    });
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

    document.getElementById('ev-cancel')?.addEventListener('click', () => m.close());
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
    });
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

  return { init };
})();
window.Transport = Transport;
