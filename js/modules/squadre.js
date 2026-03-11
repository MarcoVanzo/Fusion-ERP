"use strict";

const Squadre = (() => {
    let _abortController = new AbortController();
    let _teams = [];

    function _getSignal() {
        return { signal: _abortController.signal };
    }

    async function _loadData() {
        try {
            _teams = await Store.api('listGrouped', 'teams', {}, _getSignal());
            _renderTeams();
        } catch (err) {
            UI.toast('Errore caricamento squadre: ' + err.message, 'error');
        }
    }

    function _renderTeams() {
        const container = document.getElementById('squadre-list-container');
        if (!container) return;

        if (_teams.length === 0) {
            container.innerHTML = Utils.emptyState('Nessuna squadra', 'Aggiungi la prima squadra per iniziare a gestire le stagioni.');
            return;
        }

        const isAdmin = ['admin', 'manager'].includes(App.getUser()?.role);

        let html = '<div class="teams-grid" style="display:grid;gap:var(--sp-4);grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));">';

        _teams.forEach(team => {
            const activeSeasons = team.seasons ? team.seasons.filter(s => parseInt(s.is_active) === 1) : [];
            const inactiveSeasons = team.seasons ? team.seasons.filter(s => parseInt(s.is_active) === 0) : [];
            
            html += `
                <div class="card" style="padding:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-3)">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between">
                        <div>
                            <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:8px">
                                ${Utils.escapeHtml(team.name)}
                                ${team.gender === 'M' ? '<span class="badge" style="background:var(--color-primary-light);color:var(--color-primary)">M</span>' : team.gender === 'F' ? '<span class="badge" style="background:var(--color-pink-light);color:var(--color-pink)">F</span>' : ''}
                            </h3>
                            ${team.category ? `<div style="font-size:13px;color:var(--color-text-muted);margin-top:4px">${Utils.escapeHtml(team.category)}</div>` : ''}
                        </div>
                        ${isAdmin ? `
                        <div style="display:flex;gap:4px">
                            <button class="btn btn-ghost btn-sm" data-edit-team="${team.id}" title="Modifica Squadra Base"><i class="ph ph-pencil-simple"></i></button>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2)">
                            <div style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--color-text-muted)">Stagioni Attive</div>
                            ${isAdmin ? `<button class="btn btn-ghost btn-sm" data-add-season="${team.id}" style="padding:4px"><i class="ph ph-plus"></i></button>` : ''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px">
                            ${activeSeasons.length > 0 ? activeSeasons.map(s => `
                                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px">
                                    <div style="font-weight:500">${Utils.escapeHtml(s.season)}</div>
                                    ${isAdmin ? `<button class="btn btn-ghost btn-sm" data-toggle-season="${s.id}" data-action="0" title="Disattiva" style="color:var(--color-warning)"><i class="ph ph-eye-slash"></i></button>` : ''}
                                </div>
                            `).join('') : '<div style="font-size:13px;color:var(--color-text-muted);font-style:italic">Nessuna stagione attiva</div>'}
                        </div>
                    </div>
                    
                    ${inactiveSeasons.length > 0 ? `
                    <div style="margin-top:var(--sp-2)">
                        <div style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--sp-2)">Stagioni Precedenti</div>
                        <div style="display:flex;flex-direction:column;gap:8px">
                            ${inactiveSeasons.map(s => `
                                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px;opacity:0.6">
                                    <div>${Utils.escapeHtml(s.season)}</div>
                                    ${isAdmin ? `<button class="btn btn-ghost btn-sm" data-toggle-season="${s.id}" data-action="1" title="Riattiva"><i class="ph ph-eye"></i></button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Bind events
        if (isAdmin) {
            container.querySelectorAll('[data-edit-team]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const team = _teams.find(t => String(t.id) === btn.dataset.editTeam);
                    if (team) _openTeamModal(team);
                });
            });

            container.querySelectorAll('[data-add-season]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const team = _teams.find(t => String(t.id) === btn.dataset.addSeason);
                    if (team) _openSeasonModal(team);
                });
            });

            container.querySelectorAll('[data-toggle-season]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const seasonId = btn.dataset.toggleSeason;
                    const isActive = btn.dataset.action;
                    
                    try {
                        await Store.api('toggleSeason', 'teams', { id: seasonId, is_active: isActive }, _getSignal());
                        UI.toast(isActive === '1' ? 'Stagione attivata' : 'Stagione disattivata', 'success');
                        await _loadData();
                    } catch (err) {
                        UI.toast('Errore: ' + err.message, 'error');
                    }
                });
            });
        }
    }

    function _openTeamModal(team = null) {
        const isEdit = !!team;
        
        const modal = UI.modal({
            title: isEdit ? 'Modifica Squadra' : 'Nuova Squadra',
            body: `
                <div class="form-group">
                    <label class="form-label">Nome Squadra *</label>
                    <input type="text" id="team-name" class="form-input" placeholder="es. Under 16, Serie C..." value="${Utils.escapeHtml(team?.name || '')}">
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Genere</label>
                        <select id="team-gender" class="form-select">
                            <option value="">(Non specificato)</option>
                            <option value="F" ${team?.gender === 'F' ? 'selected' : ''}>Femminile</option>
                            <option value="M" ${team?.gender === 'M' ? 'selected' : ''}>Maschile</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoria</label>
                        <input type="text" id="team-category" class="form-input" placeholder="es. Giovanile" value="${Utils.escapeHtml(team?.category || '')}">
                    </div>
                </div>
                
                ${!isEdit ? `
                <div class="form-group" style="padding-top:var(--sp-3);border-top:1px solid var(--color-border);margin-top:var(--sp-3)">
                    <label class="form-label">Prima Stagione *</label>
                    <input type="text" id="team-initial-season" class="form-input" placeholder="es. 2024/2025">
                    <p style="font-size:12px;color:var(--color-text-muted);margin-top:4px">Verrà creata e attivata automaticamente.</p>
                </div>
                ` : ''}
                
                <div id="team-error" class="form-error hidden"></div>
            `,
            footer: `
                <button class="btn btn-ghost btn-sm" id="team-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="team-save" type="button">${isEdit ? 'SALVA' : 'CREA SQUADRA'}</button>
            `
        });

        document.getElementById('team-cancel')?.addEventListener('click', () => modal.close());
        
        document.getElementById('team-save')?.addEventListener('click', async () => {
            const name = document.getElementById('team-name').value.trim();
            const gender = document.getElementById('team-gender').value;
            const category = document.getElementById('team-category').value.trim();
            const initialSeasonStr = !isEdit ? document.getElementById('team-initial-season').value.trim() : null;
            
            const errEl = document.getElementById('team-error');
            errEl.classList.add('hidden');
            
            if (!name) {
                errEl.textContent = 'Il nome è obbligatorio.';
                errEl.classList.remove('hidden');
                return;
            }
            
            if (!isEdit && !initialSeasonStr) {
                errEl.textContent = 'La stagione iniziale è obbligatoria per le nuove squadre.';
                errEl.classList.remove('hidden');
                return;
            }
            
            const btn = document.getElementById('team-save');
            btn.disabled = true;
            btn.textContent = 'Salvataggio...';
            
            try {
                if (isEdit) {
                    await Store.api('update', 'teams', {
                        id: team.id,
                        name: name,
                        gender: gender || null,
                        category: category || null
                    }, _getSignal());
                    UI.toast('Squadra aggiornata', 'success');
                } else {
                    await Store.api('create', 'teams', {
                        name: name,
                        gender: gender || null,
                        category: category || null,
                        initial_season: initialSeasonStr
                    }, _getSignal());
                    UI.toast('Squadra creata', 'success');
                }
                
                modal.close();
                await _loadData();
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = isEdit ? 'SALVA' : 'CREA SQUADRA';
            }
        });
    }

    function _openSeasonModal(team) {
        const modal = UI.modal({
            title: `Nuova Stagione per ${team.name}`,
            body: `
                <div class="form-group">
                    <label class="form-label">Stagione *</label>
                    <input type="text" id="season-name" class="form-input" placeholder="es. 2025/2026">
                </div>
                <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-top:var(--sp-3)">
                    <input type="checkbox" id="season-active" checked style="width:18px;height:18px">
                    <label for="season-active" style="margin:0;cursor:pointer">Attiva subito questa stagione</label>
                </div>
                <div id="season-error" class="form-error hidden"></div>
            `,
            footer: `
                <button class="btn btn-ghost btn-sm" id="season-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="season-save" type="button">AGGIUNGI STAGIONE</button>
            `
        });

        document.getElementById('season-cancel')?.addEventListener('click', () => modal.close());

        document.getElementById('season-save')?.addEventListener('click', async () => {
            const seasonStr = document.getElementById('season-name').value.trim();
            const isActive = document.getElementById('season-active').checked ? 1 : 0;
            
            const errEl = document.getElementById('season-error');
            errEl.classList.add('hidden');
            
            if (!seasonStr) {
                errEl.textContent = 'Inserisci il nome della stagione.';
                errEl.classList.remove('hidden');
                return;
            }
            
            const btn = document.getElementById('season-save');
            btn.disabled = true;
            btn.textContent = 'Salvataggio...';
            
            try {
                await Store.api('addSeason', 'teams', {
                    team_id: team.id,
                    season: seasonStr,
                    is_active: isActive
                }, _getSignal());
                
                UI.toast('Stagione aggiunta', 'success');
                modal.close();
                await _loadData();
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'AGGIUNGI STAGIONE';
            }
        });
    }

    return {
        async init() {
            const container = document.getElementById('app');
            if (!container) return;

            const isAdmin = ['admin', 'manager'].includes(App.getUser()?.role);

            container.innerHTML = `
                <div class="module-wrapper">
                    <div class="page-header" style="border-bottom:1px solid var(--color-border);padding:var(--sp-4);padding-bottom:var(--sp-3);display:flex;justify-content:space-between;align-items:center">
                        <div>
                            <h1 class="page-title">Gestione Squadre</h1>
                            <p class="page-subtitle">Configura le squadre e le loro stagioni sportive</p>
                        </div>
                        ${isAdmin ? `
                        <div class="page-actions">
                            <button class="btn btn-primary" id="btn-add-team">
                                <i class="ph ph-plus"></i> NUOVA SQUADRA
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    <div class="module-body" style="padding:var(--sp-4)">
                        <div id="squadre-list-container">
                            <div class="skeleton skeleton-text" style="width:100%; height:150px;"></div>
                        </div>
                    </div>
                </div>
            `;

            if (isAdmin) {
                document.getElementById('btn-add-team')?.addEventListener('click', () => _openTeamModal());
            }

            await _loadData();
        },

        destroy() {
            _abortController.abort();
            _abortController = new AbortController();
        }
    };
})();

window.Squadre = Squadre;
