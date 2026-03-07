/**
 * Tournaments Module
 * Fusion ERP v1.0
 */

'use strict';

const Tournaments = (() => {
    let _ac = new AbortController();
    let _tournaments = [];
    let _currentTournament = null;

    /* ── LIFECYCLE ───────────────────────────────────────────────────────── */
    async function init() {
        _ac.abort();
        _ac = new AbortController();
        _renderSkeleton();
        await _loadTournaments();
    }

    function destroy() {
        _ac.abort();
    }

    /* ── RENDER ROOT ─────────────────────────────────────────────────────── */
    function _renderSkeleton() {
        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = `
        <style>
            .trm-page { padding: 24px; max-width: 1400px; margin: 0 auto; animation: trmFadeIn .3s ease; }
            @keyframes trmFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            
            .trm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
            .trm-header h1 { font-size: 1.8rem; font-weight: 700; color: #f59e0b; display: flex; align-items: center; gap: 12px; }
            
            .trm-btn {
                padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;
                cursor: pointer; transition: all .2s; border: none; display: inline-flex; align-items: center; gap: 8px;
            }
            .trm-btn-primary { background: #f59e0b; color: #fff; }
            .trm-btn-primary:hover { background: #d97706; transform: translateY(-1px); }
            .trm-btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
            .trm-btn-secondary:hover { background: rgba(255,255,255,0.2); }

            .trm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
            .trm-card {
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px; padding: 20px; cursor: pointer; transition: all .2s;
            }
            .trm-card:hover { transform: translateY(-3px); border-color: #f59e0b; background: rgba(245,158,11,0.05); }
            
            .trm-detail-view { display: none; }
            .trm-tabs { display: flex; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; }
            .trm-tab { padding: 12px 20px; cursor: pointer; color: rgba(255,255,255,0.5); font-weight: 600; }
            .trm-tab.active { color: #f59e0b; border-bottom: 2px solid #f59e0b; }
            
            .trm-panel { display: none; }
            .trm-panel.active { display: block; animation: trmFadeIn .3s ease; }
            
            .trm-roster-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .trm-match-item { background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; margin-bottom: 12px; }
        </style>

        <div class="trm-page">
            <div id="trm-list-view">
                <div class="trm-header">
                    <h1><i class="ph ph-trophy"></i> Tornei</h1>
                    <button class="trm-btn trm-btn-primary" id="btn-new-tournament">
                        <i class="ph ph-plus"></i> Nuovo Torneo
                    </button>
                </div>
                <div id="trm-list-content" class="trm-grid">
                    <div style="opacity:0.5; text-align:center; grid-column: 1/-1; padding: 40px;">Caricamento...</div>
                </div>
            </div>
            
            <div id="trm-detail-view" class="trm-detail-view">
                <!-- Populated dynamically -->
            </div>
        </div>
        `;

        document.getElementById('btn-new-tournament')?.addEventListener('click', () => _showCreateModal(), { signal: _ac.signal });
    }

    /* ── DATA LOADING ────────────────────────────────────────────────────── */
    async function _loadTournaments() {
        try {
            const resp = await fetch('api/router.php?module=tournaments&action=getTournaments');
            const json = await resp.json();
            if (!json.success) throw new Error(json.error);
            _tournaments = json.data.tournaments;
            _renderList();
        } catch (err) {
            UI.toast('Errore caricamento tornei: ' + err.message, 'error');
        }
    }

    /* ── LIST VIEW ───────────────────────────────────────────────────────── */
    function _renderList() {
        const container = document.getElementById('trm-list-content');
        if (!container) return;

        if (_tournaments.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.5;">
                <i class="ph ph-trophy" style="font-size: 32px; margin-bottom: 12px;"></i>
                <p>Nessun torneo programmato. Clicca su "Nuovo Torneo" per iniziare.</p>
            </div>`;
            return;
        }

        container.innerHTML = _tournaments.map(t => {
            const d = new Date(t.event_date).toLocaleDateString('it-IT');
            return `
            <div class="trm-card" data-id="${t.id}">
                <div style="font-size: 11px; opacity: 0.6; margin-bottom: 8px; text-transform: uppercase;">${t.team_name}</div>
                <h3 style="font-size: 1.2rem; margin-bottom: 8px;">${t.title}</h3>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.8;">
                    <i class="ph ph-calendar"></i> ${d}
                </div>
                ${t.location_name ? `<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.8; margin-top: 4px;">
                    <i class="ph ph-map-pin"></i> ${t.location_name}
                </div>` : ''}
            </div>`;
        }).join('');

        container.querySelectorAll('.trm-card').forEach(c => {
            c.addEventListener('click', () => _openTournament(c.dataset.id), { signal: _ac.signal });
        });
    }

    /* ── DETAIL VIEW ─────────────────────────────────────────────────────── */
    async function _openTournament(id) {
        document.getElementById('trm-list-view').style.display = 'none';
        const detailView = document.getElementById('trm-detail-view');
        detailView.style.display = 'block';
        detailView.innerHTML = `<div style="padding: 40px; text-align: center; opacity: 0.5;">Caricamento dettagli...</div>`;

        try {
            const resp = await fetch(`api/router.php?module=tournaments&action=getTournament&id=${id}`);
            const json = await resp.json();
            if (!json.success) throw new Error(json.error);

            _currentTournament = json.data;
            _renderDetail();
        } catch (err) {
            UI.toast('Errore: ' + err.message, 'error');
            _closeDetail();
        }
    }

    function _closeDetail() {
        document.getElementById('trm-detail-view').style.display = 'none';
        document.getElementById('trm-list-view').style.display = 'block';
        _currentTournament = null;
        _loadTournaments(); // refresh list
    }

    function _renderDetail() {
        const t = _currentTournament.tournament;
        const view = document.getElementById('trm-detail-view');

        const d = new Date(t.event_date).toLocaleDateString('it-IT');

        view.innerHTML = `
        <div class="trm-header">
            <div>
                <button class="trm-btn trm-btn-secondary" id="btn-back-trm" style="margin-bottom: 12px; padding: 6px 12px;">
                    <i class="ph ph-arrow-left"></i> Torna ai Tornei
                </button>
                <h1>${t.title}</h1>
                <div style="opacity: 0.7; margin-top: 4px;">${t.team_name} • ${d}</div>
            </div>
            <button class="trm-btn trm-btn-secondary" id="btn-edit-trm">
                <i class="ph ph-pencil"></i> Modifica
            </button>
        </div>

        <div class="trm-tabs">
            <div class="trm-tab active" data-target="panel-overview">Overview</div>
            <div class="trm-tab" data-target="panel-roster">Roster (${_currentTournament.roster.filter(r => r.attendance_status === 'confirmed').length}/${_currentTournament.roster.length})</div>
            <div class="trm-tab" data-target="panel-matches">Partite (${_currentTournament.matches.length})</div>
        </div>

        <!-- OVERVIEW PANEL -->
        <div id="panel-overview" class="trm-panel active" style="background: rgba(255,255,255,0.03); padding: 24px; border-radius: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div>
                    <h4 style="color: #f59e0b; margin-bottom: 12px;">Dettagli Logistici</h4>
                    <p><strong>Luogo:</strong> ${t.location_name || 'Non specificato'}</p>
                    <p><strong>Quota:</strong> ${t.fee_per_athlete > 0 ? t.fee_per_athlete + ' €' : 'Gratuito'}</p>
                    ${t.website_url ? `<p><strong>Sito Web:</strong> <a href="${t.website_url}" target="_blank" style="color:#60a5fa;">${t.website_url}</a></p>` : ''}
                </div>
                <div>
                    <h4 style="color: #f59e0b; margin-bottom: 12px;">Alloggio / Note</h4>
                    <div style="white-space: pre-wrap; opacity: 0.8; font-size: 14px;">${t.accommodation_info || 'Nessuna informazione aggiuntiva.'}</div>
                </div>
            </div>
        </div>

        <!-- ROSTER PANEL -->
        <div id="panel-roster" class="trm-panel">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
                <h3>Atlete Convocate</h3>
                <button class="trm-btn trm-btn-primary" id="btn-save-roster">Salva Roster</button>
            </div>
            <div style="background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                ${_currentTournament.roster.map(r => `
                    <div class="trm-roster-item">
                        <div>
                            <span style="display:inline-block; width: 24px; opacity:0.5;">${r.jersey_number || '-'}</span>
                            <strong>${r.full_name}</strong>
                            <span style="font-size: 11px; opacity: 0.6; margin-left: 8px;">${r.role || ''}</span>
                        </div>
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" class="trm-roster-cb" data-id="${r.id}" ${r.attendance_status === 'confirmed' ? 'checked' : ''}>
                            <span style="font-size:13px;">Convocata</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- MATCHES PANEL -->
        <div id="panel-matches" class="trm-panel">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
                <h3>Partite del Torneo</h3>
                <button class="trm-btn trm-btn-primary" id="btn-add-match">Aggiungi Partita</button>
            </div>
            <div id="trm-matches-list">
                ${_currentTournament.matches.length === 0 ? '<div style="opacity:0.5; padding:20px;">Nessuna partita aggiunta.</div>' : ''}
                ${_currentTournament.matches.map(m => {
            const md = new Date(m.match_time).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            return `
                    <div class="trm-match-item" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-size: 12px; opacity:0.6; margin-bottom: 4px;">${md} ${m.court_name ? '• ' + m.court_name : ''}</div>
                            <div style="font-size: 16px;"><strong>${t.team_name}</strong> vs <strong>${m.opponent_name}</strong></div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 24px; font-weight: 700; color: ${m.our_score > m.opponent_score ? '#10b981' : (m.our_score < m.opponent_score ? '#ef4444' : '#fff')};">
                                ${m.our_score} - ${m.opponent_score}
                            </div>
                            <button class="trm-btn trm-btn-secondary btn-edit-match" style="padding: 4px 8px; font-size:11px; margin-top: 4px;" data-match='${JSON.stringify(m)}'>Modifica</button>
                        </div>
                    </div>
                    `;
        }).join('')}
            </div>
        </div>
        `;

        // Bindings
        document.getElementById('btn-back-trm').addEventListener('click', _closeDetail, { signal: _ac.signal });
        document.getElementById('btn-edit-trm').addEventListener('click', () => _showCreateModal(t), { signal: _ac.signal });
        document.getElementById('btn-save-roster').addEventListener('click', _saveRoster, { signal: _ac.signal });
        document.getElementById('btn-add-match').addEventListener('click', () => _showMatchModal(), { signal: _ac.signal });

        view.querySelectorAll('.btn-edit-match').forEach(b => {
            b.addEventListener('click', (e) => {
                const matchData = JSON.parse(e.target.dataset.match);
                _showMatchModal(matchData);
            }, { signal: _ac.signal });
        });

        // Tabs
        view.querySelectorAll('.trm-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                view.querySelectorAll('.trm-tab').forEach(t => t.classList.remove('active'));
                view.querySelectorAll('.trm-panel').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.target).classList.add('active');
            }, { signal: _ac.signal });
        });
    }

    /* ── ROSTER LOGIC ────────────────────────────────────────────────────── */
    async function _saveRoster() {
        if (!_currentTournament) return;
        const btn = document.getElementById('btn-save-roster');
        btn.disabled = true;
        btn.textContent = 'Salvataggio...';

        const attendees = [];
        document.querySelectorAll('.trm-roster-cb').forEach(cb => {
            attendees.push({
                athlete_id: cb.dataset.id,
                status: cb.checked ? 'confirmed' : 'absent'
            });
        });

        try {
            const resp = await fetch('api/router.php?module=tournaments&action=updateRoster', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: _currentTournament.tournament.id,
                    attendees: attendees
                })
            });
            const json = await resp.json();
            if (!json.success) throw new Error(json.error);
            UI.toast('Roster salvato', 'success');
            // Refresh detail to get updated numbers
            _openTournament(_currentTournament.tournament.id);
        } catch (err) {
            UI.toast(err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Salva Roster';
        }
    }

    /* ── MODALS (Tournament & Match) ─────────────────────────────────────── */
    function _showCreateModal(data = null) {
        // Fetch teams to populate select
        fetch('api/router.php?module=athletes&action=teams')
            .then(r => r.json())
            .then(res => {
                const teams = Array.isArray(res.data) ? res.data : (res.data?.teams || []);
                const teamOpts = teams.map(t => `<option value="${t.id}" ${data && data.team_id === t.id ? 'selected' : ''}>${t.name}</option>`).join('');

                const formatDateTimeLocal = (d) => {
                    if (!d) return '';
                    const date = new Date(d);
                    const pad = (n) => n.toString().padStart(2, '0');
                    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
                };

                const bodyHtml = `
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <input type="hidden" id="tm-id" value="${data ? data.id : ''}">
                    
                    <label style="font-size:12px; opacity:0.7;">Squadra *</label>
                    <select id="tm-team" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                        <option value="">Seleziona...</option>
                        ${teamOpts}
                    </select>

                    <label style="font-size:12px; opacity:0.7;">Titolo Torneo *</label>
                    <input type="text" id="tm-title" value="${data ? data.title : ''}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                    
                    <label style="font-size:12px; opacity:0.7;">Inizio *</label>
                    <input type="datetime-local" id="tm-start" value="${formatDateTimeLocal(data ? data.event_date : null)}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                    
                    <label style="font-size:12px; opacity:0.7;">Fine</label>
                    <input type="datetime-local" id="tm-end" value="${formatDateTimeLocal(data ? data.event_end : null)}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                    
                    <label style="font-size:12px; opacity:0.7;">Luogo (Città / Impianto)</label>
                    <input type="text" id="tm-loc" value="${data ? data.location_name || '' : ''}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                    
                    <label style="font-size:12px; opacity:0.7;">Sito Web</label>
                    <input type="url" id="tm-url" value="${data ? data.website_url || '' : ''}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                    
                    <label style="font-size:12px; opacity:0.7;">Quota Atleta (€)</label>
                    <input type="number" step="0.01" id="tm-fee" value="${data ? data.fee_per_athlete || 0 : 0}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                    
                    <label style="font-size:12px; opacity:0.7;">Note / Alloggio</label>
                    <textarea id="tm-notes" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff; min-height:80px;">${data ? data.accommodation_info || '' : ''}</textarea>
                </div>`;

                const footerHtml = `
                    <button class="btn btn-ghost btn-sm" id="btn-cancel-trm-modal">Annulla</button>
                    <button class="btn btn-primary btn-sm" id="btn-save-trm-modal">Salva</button>
                `;

                const m = UI.modal({
                    title: `${data ? 'Modifica' : 'Nuovo'} Torneo`,
                    body: bodyHtml,
                    footer: footerHtml
                });

                document.getElementById('btn-cancel-trm-modal')?.addEventListener('click', () => m.close());
                document.getElementById('btn-save-trm-modal').addEventListener('click', async () => {
                    const payload = {
                        id: document.getElementById('tm-id').value,
                        team_id: document.getElementById('tm-team').value,
                        title: document.getElementById('tm-title').value,
                        event_date: document.getElementById('tm-start').value,
                        event_end: document.getElementById('tm-end').value || null,
                        location_name: document.getElementById('tm-loc').value,
                        website_url: document.getElementById('tm-url').value,
                        fee_per_athlete: parseFloat(document.getElementById('tm-fee').value) || 0,
                        accommodation_info: document.getElementById('tm-notes').value
                    };

                    if (!payload.team_id || !payload.title || !payload.event_date) {
                        UI.toast('I campi contrassegnati con * sono obbligatori.', 'warning');
                        return;
                    }

                    try {
                        const r = await fetch('api/router.php?module=tournaments&action=saveTournament', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const j = await r.json();
                        if (!j.success) throw new Error(j.error);
                        m.close();
                        UI.toast('Torneo salvato', 'success');

                        if (_currentTournament) {
                            _openTournament(j.data.id || _currentTournament.tournament.id);
                        } else {
                            _loadTournaments();
                        }
                    } catch (e) {
                        UI.toast(e.message, 'error');
                    }
                });
            })
            .catch(err => {
                UI.toast('Errore caricamento squadre: ' + err.message, 'error');
            });
    }

    function _showMatchModal(data = null) {
        if (!_currentTournament) return;

        const formatDateTimeLocal = (d) => {
            if (!d) return '';
            const date = new Date(d);
            const pad = (n) => n.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        const bodyHtml = `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <input type="hidden" id="mm-id" value="${data ? data.id : ''}">
                
                <label style="font-size:12px; opacity:0.7;">Avversario *</label>
                <input type="text" id="mm-opp" value="${data ? data.opponent_name : ''}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                
                <label style="font-size:12px; opacity:0.7;">Data e Ora *</label>
                <input type="datetime-local" id="mm-time" value="${formatDateTimeLocal(data ? data.match_time : null)}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                
                <label style="font-size:12px; opacity:0.7;">Campo / Palestra</label>
                <input type="text" id="mm-court" value="${data ? data.court_name || '' : ''}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                
                <div style="display:flex; gap:16px;">
                    <div style="flex:1;">
                        <label style="font-size:12px; opacity:0.7;">Ns. Punteggio</label>
                        <input type="number" id="mm-our" value="${data ? data.our_score : 0}" style="padding:10px; width:100%; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:12px; opacity:0.7;">Pt. Avversario</label>
                        <input type="number" id="mm-opps" value="${data ? data.opponent_score : 0}" style="padding:10px; width:100%; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">
                    </div>
                </div>
            </div>`;

        const footerHtml = `
            <button class="btn btn-ghost btn-sm" id="btn-cancel-match-modal">Annulla</button>
            <button class="btn btn-primary btn-sm" id="btn-save-match-modal">Salva Partita</button>
        `;

        const m = UI.modal({
            title: `${data ? 'Modifica' : 'Aggiungi'} Partita`,
            body: bodyHtml,
            footer: footerHtml
        });

        document.getElementById('btn-cancel-match-modal')?.addEventListener('click', () => m.close());
        document.getElementById('btn-save-match-modal').addEventListener('click', async () => {
            const payload = {
                id: document.getElementById('mm-id').value,
                event_id: _currentTournament.tournament.id,
                opponent_name: document.getElementById('mm-opp').value,
                match_time: document.getElementById('mm-time').value,
                court_name: document.getElementById('mm-court').value,
                our_score: parseInt(document.getElementById('mm-our').value) || 0,
                opponent_score: parseInt(document.getElementById('mm-opps').value) || 0
            };

            if (!payload.opponent_name || !payload.match_time) {
                UI.toast('Avversario e Data sono obbligatori.', 'warning');
                return;
            }

            try {
                const r = await fetch('api/router.php?module=tournaments&action=saveMatch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const j = await r.json();
                if (!j.success) throw new Error(j.error);
                m.close();
                UI.toast('Partita salvata', 'success');
                _openTournament(_currentTournament.tournament.id); // Refresh data
            } catch (e) {
                UI.toast(e.message, 'error');
            }
        });
    }

    return { init, destroy };
})();
window.Tournaments = Tournaments;
