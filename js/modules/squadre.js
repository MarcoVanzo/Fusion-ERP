"use strict";

const Squadre = (() => {
    let _abortController = new AbortController();
    let _teams = [];
    let _currentTab = 'squadre'; // 'squadre' | 'stagioni'

    function _getSignal() {
        return { signal: _abortController.signal };
    }

    async function _loadData() {
        try {
            _teams = await Store.api('listGrouped', 'teams', {});
            if (_currentTab === 'squadre') {
                _renderTeams();
            } else {
                _renderSeasons();
            }
        } catch (err) {
            UI.toast('Errore caricamento squadre: ' + err.message, 'error');
        }
    }

    // ─── TAB SWITCHING ──────────────────────────────────────────────────────────

    function _switchTab(tab) {
        _currentTab = tab;
        // Update tab active state
        document.querySelectorAll('.squadre-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update route hash without full reload
        if (tab === 'stagioni') {
            Router.updateHash('squadre-stagioni');
        } else {
            Router.updateHash('squadre');
        }

        // Re-render content
        if (tab === 'squadre') {
            _renderTeams();
        } else {
            _renderSeasons();
        }
    }

    // ─── TEAMS VIEW (existing) ──────────────────────────────────────────────────

    function _renderTeams() {
        const container = document.getElementById('squadre-list-container');
        if (!container) return;

        if (_teams.length === 0) {
            container.innerHTML = Utils.emptyState('Nessuna squadra', 'Aggiungi la prima squadra per iniziare a gestire le stagioni.');
            return;
        }

        const isAdmin = ['admin', 'manager'].includes(App.getUser()?.role);

        let html = '<div class="teams-list" style="display:flex;flex-direction:column;gap:var(--sp-3);">';

        _teams.forEach(team => {
            const activeSeasons = team.seasons ? team.seasons.filter(s => parseInt(s.is_active) === 1) : [];
            const inactiveSeasons = team.seasons ? team.seasons.filter(s => parseInt(s.is_active) === 0) : [];
            
            html += `
                <div class="card" style="padding:var(--sp-4);display:flex;flex-direction:row;align-items:flex-start;gap:var(--sp-6);flex-wrap:wrap;">
                    <!-- Team Info -->
                    <div style="flex:1;min-width:250px;">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;">
                            <div>
                                <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:8px">
                                    ${Utils.escapeHtml(team.name)}
                                    ${team.gender === 'M' ? '<span class="badge" style="background:var(--color-primary-light);color:var(--color-primary)">M</span>' : team.gender === 'F' ? '<span class="badge" style="background:var(--color-pink-light);color:var(--color-pink)">F</span>' : ''}
                                </h3>
                                ${team.category ? `<div style="font-size:13px;color:var(--color-text-muted);margin-top:4px">${Utils.escapeHtml(team.category)}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Active Seasons -->
                    <div style="flex:1;min-width:250px;">
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
                    
                    <!-- Inactive Seasons -->
                    <div style="flex:1;min-width:250px;">
                        ${inactiveSeasons.length > 0 ? `
                        <div style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--sp-2)">Stagioni Precedenti</div>
                        <div style="display:flex;flex-direction:column;gap:8px">
                            ${inactiveSeasons.map(s => `
                                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px;opacity:0.6">
                                    <div>${Utils.escapeHtml(s.season)}</div>
                                    ${isAdmin ? `<button class="btn btn-ghost btn-sm" data-toggle-season="${s.id}" data-action="1" title="Riattiva"><i class="ph ph-eye"></i></button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>

                    <!-- Actions -->
                    ${isAdmin ? `
                    <div style="display:flex;align-items:flex-start;justify-content:flex-end;">
                        <button class="btn btn-ghost btn-sm" data-edit-team="${team.id}" title="Modifica Squadra Base"><i class="ph ph-pencil-simple"></i></button>
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
                    
                    const origHtml = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="ph ph-spinner" style="font-size:14px;animation:spin 1s linear infinite;"></i>';

                    try {
                        await Store.api('toggleSeason', 'teams', { id: seasonId, is_active: isActive });
                        UI.toast(isActive === '1' ? 'Stagione attivata' : 'Stagione disattivata', 'success');
                        await _loadData();
                    } catch (err) {
                        UI.toast('Errore: ' + err.message, 'error');
                        btn.disabled = false;
                        btn.innerHTML = origHtml;
                    }
                });
            });
        }
    }

    // ─── SEASONS VIEW (new) ─────────────────────────────────────────────────────

    function _renderSeasons() {
        const container = document.getElementById('squadre-list-container');
        if (!container) return;

        const isAdmin = ['admin', 'manager'].includes(App.getUser()?.role);

        // Build a map: seasonName → [{ team, teamSeasonId, is_active }]
        const seasonMap = {};
        _teams.forEach(team => {
            (team.seasons || []).forEach(s => {
                if (!seasonMap[s.season]) {
                    seasonMap[s.season] = [];
                }
                seasonMap[s.season].push({
                    teamId: team.id,
                    teamName: team.name,
                    teamCategory: team.category,
                    teamColorHex: team.color_hex,
                    teamSeasonId: s.id,
                    is_active: parseInt(s.is_active)
                });
            });
        });

        const seasonNames = Object.keys(seasonMap).sort((a, b) => b.localeCompare(a)); // newest first

        if (seasonNames.length === 0) {
            container.innerHTML = Utils.emptyState(
                'Nessuna stagione',
                'Crea la prima stagione con il pulsante "Nuova Stagione" in alto.'
            );
            return;
        }

        let html = '<div style="display:flex;flex-direction:column;gap:var(--sp-4);">';

        seasonNames.forEach(seasonName => {
            const entries = seasonMap[seasonName];
            const activeEntries = entries.filter(e => e.is_active === 1);
            const inactiveEntries = entries.filter(e => e.is_active === 0);
            // Teams not yet associated with this season
            const associatedTeamIds = new Set(entries.map(e => e.teamId));
            const unassociatedTeams = _teams.filter(t => !associatedTeamIds.has(t.id));

            html += `
                <div class="card" style="padding:0;overflow:hidden;">
                    <!-- Season header -->
                    <div style="padding:var(--sp-3) var(--sp-4);background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(236,72,153,0.06));border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <i class="ph ph-calendar-blank" style="font-size:22px;color:var(--color-primary);"></i>
                            <div>
                                <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">${Utils.escapeHtml(seasonName)}</div>
                                <div style="font-size:12px;color:var(--color-text-muted);">${entries.length} squadr${entries.length === 1 ? 'a' : 'e'} associate</div>
                            </div>
                        </div>
                        ${isAdmin && unassociatedTeams.length > 0 ? `
                        <button class="btn btn-ghost btn-sm" data-add-team-to-season="${Utils.escapeHtml(seasonName)}" title="Aggiungi squadra a questa stagione" style="display:flex;align-items:center;gap:4px;">
                            <i class="ph ph-plus"></i> Aggiungi squadra
                        </button>
                        ` : ''}
                    </div>

                    <!-- Teams in this season -->
                    <div style="padding:var(--sp-3) var(--sp-4);">
                        ${activeEntries.length > 0 ? `
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);margin-bottom:var(--sp-2);font-weight:600;">Attive</div>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:${inactiveEntries.length > 0 ? 'var(--sp-3)' : '0'};">
                            ${activeEntries.map(e => `
                                <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;border-left:3px solid ${e.teamColorHex || 'var(--color-primary)'};">
                                    <div>
                                        <div style="font-weight:600;font-size:14px;">${Utils.escapeHtml(e.teamName)}</div>
                                        ${e.teamCategory ? `<div style="font-size:11px;color:var(--color-text-muted);">${Utils.escapeHtml(e.teamCategory)}</div>` : ''}
                                    </div>
                                    ${isAdmin ? `
                                    <div style="display:flex;gap:2px;margin-left:8px;">
                                        <button class="btn btn-ghost btn-sm" data-toggle-season="${e.teamSeasonId}" data-action="0" title="Disattiva" style="padding:2px 4px;color:var(--color-warning);"><i class="ph ph-eye-slash" style="font-size:14px;"></i></button>
                                        <button class="btn btn-ghost btn-sm" data-del-season="${e.teamSeasonId}" data-team-name="${Utils.escapeHtml(e.teamName)}" data-season-name="${Utils.escapeHtml(seasonName)}" title="Rimuovi" style="padding:2px 4px;color:var(--color-pink);"><i class="ph ph-trash" style="font-size:14px;"></i></button>
                                    </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}

                        ${inactiveEntries.length > 0 ? `
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);margin-bottom:var(--sp-2);font-weight:600;">Inattive</div>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;opacity:0.6;">
                            ${inactiveEntries.map(e => `
                                <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;border-left:3px solid ${e.teamColorHex || 'var(--color-text-muted)'};">
                                    <div>
                                        <div style="font-weight:500;font-size:14px;">${Utils.escapeHtml(e.teamName)}</div>
                                        ${e.teamCategory ? `<div style="font-size:11px;color:var(--color-text-muted);">${Utils.escapeHtml(e.teamCategory)}</div>` : ''}
                                    </div>
                                    ${isAdmin ? `
                                    <div style="display:flex;gap:2px;margin-left:8px;">
                                        <button class="btn btn-ghost btn-sm" data-toggle-season="${e.teamSeasonId}" data-action="1" title="Riattiva" style="padding:2px 4px;"><i class="ph ph-eye" style="font-size:14px;"></i></button>
                                        <button class="btn btn-ghost btn-sm" data-del-season="${e.teamSeasonId}" data-team-name="${Utils.escapeHtml(e.teamName)}" data-season-name="${Utils.escapeHtml(seasonName)}" title="Rimuovi" style="padding:2px 4px;color:var(--color-pink);"><i class="ph ph-trash" style="font-size:14px;"></i></button>
                                    </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}

                        ${entries.length === 0 ? '<div style="font-size:13px;color:var(--color-text-muted);font-style:italic;">Nessuna squadra associata a questa stagione.</div>' : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Bind events
        if (isAdmin) {
            container.querySelectorAll('[data-toggle-season]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const seasonId = btn.dataset.toggleSeason;
                    const isActive = btn.dataset.action;
                    const origHtml = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="ph ph-spinner" style="font-size:14px;animation:spin 1s linear infinite;"></i>';

                    try {
                        await Store.api('toggleSeason', 'teams', { id: seasonId, is_active: isActive });
                        UI.toast(isActive === '1' ? 'Stagione attivata' : 'Stagione disattivata', 'success');
                        await _loadData();
                    } catch (err) {
                        UI.toast('Errore: ' + err.message, 'error');
                        btn.disabled = false;
                        btn.innerHTML = origHtml;
                    }
                });
            });

            container.querySelectorAll('[data-del-season]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const teamName = btn.dataset.teamName;
                    const seasonName = btn.dataset.seasonName;
                    if (!confirm(`Rimuovere "${teamName}" dalla stagione "${seasonName}"?\nGli atleti e lo staff associati a questa combinazione squadra-stagione verranno scollegati.`)) return;
                    const origHtml = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="ph ph-spinner" style="font-size:14px;animation:spin 1s linear infinite;"></i>';

                    try {
                        await Store.api('deleteSeason', 'teams', { team_season_id: btn.dataset.delSeason });
                        UI.toast('Stagione rimossa dalla squadra', 'success');
                        await _loadData();
                    } catch (err) {
                        UI.toast('Errore: ' + err.message, 'error');
                        btn.disabled = false;
                        btn.innerHTML = origHtml;
                    }
                });
            });

            container.querySelectorAll('[data-add-team-to-season]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const seasonName = btn.dataset.addTeamToSeason;
                    _openAddTeamToSeasonModal(seasonName);
                });
            });
        }
    }

    // ─── MODALS ─────────────────────────────────────────────────────────────────

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
                
                ${!isEdit ? (() => {
                    // Collect distinct season names from all teams
                    const existingSeasons = [...new Set(_teams.flatMap(t => (t.seasons || []).map(s => s.season)))].sort((a, b) => b.localeCompare(a));
                    const seasonOptions = existingSeasons.map(s => `<option value="${Utils.escapeHtml(s)}">${Utils.escapeHtml(s)}</option>`).join('');
                    return `
                <div class="form-group" style="padding-top:var(--sp-3);border-top:1px solid var(--color-border);margin-top:var(--sp-3)">
                    <label class="form-label">Stagione *</label>
                    <select id="team-initial-season" class="form-select">
                        <option value="">— Seleziona stagione —</option>
                        ${seasonOptions}
                        <option value="__new__">+ Nuova stagione...</option>
                    </select>
                    <div id="team-new-season-wrap" class="hidden" style="margin-top:var(--sp-2);">
                        <input type="text" id="team-new-season-name" class="form-input" placeholder="es. 2025/2026">
                    </div>
                </div>`;
                })() : ''}
                
                <div id="team-error" class="form-error hidden"></div>
            `,
            footer: `
                <button class="btn btn-ghost btn-sm" id="team-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="team-save" type="button">${isEdit ? 'SALVA' : 'CREA SQUADRA'}</button>
            `
        });

        document.getElementById('team-cancel')?.addEventListener('click', () => modal.close());

        // Toggle new season input when "+ Nuova stagione..." is selected
        if (!isEdit) {
            document.getElementById('team-initial-season')?.addEventListener('change', (e) => {
                const wrap = document.getElementById('team-new-season-wrap');
                if (wrap) {
                    wrap.classList.toggle('hidden', e.target.value !== '__new__');
                    if (e.target.value === '__new__') {
                        document.getElementById('team-new-season-name')?.focus();
                    }
                }
            });
        }
        
        document.getElementById('team-save')?.addEventListener('click', async () => {
            const name = document.getElementById('team-name').value.trim();
            const gender = document.getElementById('team-gender').value;
            const category = document.getElementById('team-category').value.trim();
            let initialSeasonStr = null;
            if (!isEdit) {
                const selectVal = document.getElementById('team-initial-season').value;
                if (selectVal === '__new__') {
                    initialSeasonStr = document.getElementById('team-new-season-name')?.value.trim() || '';
                } else {
                    initialSeasonStr = selectVal;
                }
            }
            
            const errEl = document.getElementById('team-error');
            errEl.classList.add('hidden');
            
            if (!name) {
                errEl.textContent = 'Il nome è obbligatorio.';
                errEl.classList.remove('hidden');
                return;
            }
            
            if (!isEdit && !initialSeasonStr) {
                errEl.textContent = 'Seleziona una stagione o creane una nuova.';
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
                    });
                    UI.toast('Squadra aggiornata', 'success');
                } else {
                    await Store.api('create', 'teams', {
                        name: name,
                        gender: gender || null,
                        category: category || null,
                        season: initialSeasonStr
                    });
                    UI.toast('Squadra creata', 'success');
                }
                
                await _loadData();
                modal.close();
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
                });
                
                UI.toast('Stagione aggiunta', 'success');
                await _loadData();
                modal.close();
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'AGGIUNGI STAGIONE';
            }
        });
    }

    // ─── NEW: Bulk create season for multiple teams ─────────────────────────────

    function _openNewSeasonBulkModal() {
        const teamCheckboxes = _teams.map(t => `
            <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px;cursor:pointer;">
                <input type="checkbox" class="bulk-team-cb" value="${Utils.escapeHtml(t.id)}" checked style="width:18px;height:18px;">
                <span style="font-weight:500;">${Utils.escapeHtml(t.name)}</span>
                ${t.category ? `<span style="font-size:11px;color:var(--color-text-muted);">(${Utils.escapeHtml(t.category)})</span>` : ''}
            </label>
        `).join('');

        const modal = UI.modal({
            title: 'Nuova Stagione',
            body: `
                <div class="form-group">
                    <label class="form-label">Nome Stagione *</label>
                    <input type="text" id="bulk-season-name" class="form-input" placeholder="es. 2025/2026">
                    <p style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">Inserisci il nome della stagione sportiva (es. 2025/2026).</p>
                </div>
                <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-top:var(--sp-2)">
                    <input type="checkbox" id="bulk-season-active" checked style="width:18px;height:18px">
                    <label for="bulk-season-active" style="margin:0;cursor:pointer">Attiva subito questa stagione</label>
                </div>
                <div style="margin-top:var(--sp-3);border-top:1px solid var(--color-border);padding-top:var(--sp-3);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2);">
                        <label class="form-label" style="margin:0;">Squadre da associare</label>
                        <div style="display:flex;gap:8px;">
                            <button type="button" class="btn btn-ghost btn-sm" id="bulk-select-all" style="font-size:11px;">Seleziona tutte</button>
                            <button type="button" class="btn btn-ghost btn-sm" id="bulk-deselect-all" style="font-size:11px;">Deseleziona tutte</button>
                        </div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;max-height:250px;overflow-y:auto;padding-right:6px;">
                        ${teamCheckboxes || '<div style="font-size:13px;color:var(--color-text-muted);">Nessuna squadra disponibile. Crea prima una squadra.</div>'}
                    </div>
                </div>
                <div id="bulk-season-error" class="form-error hidden" style="margin-top:var(--sp-2);"></div>
            `,
            footer: `
                <button class="btn btn-ghost btn-sm" id="bulk-season-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="bulk-season-save" type="button">CREA STAGIONE</button>
            `
        });

        // Select/deselect all
        document.getElementById('bulk-select-all')?.addEventListener('click', () => {
            document.querySelectorAll('.bulk-team-cb').forEach(cb => cb.checked = true);
        });
        document.getElementById('bulk-deselect-all')?.addEventListener('click', () => {
            document.querySelectorAll('.bulk-team-cb').forEach(cb => cb.checked = false);
        });

        document.getElementById('bulk-season-cancel')?.addEventListener('click', () => modal.close());

        document.getElementById('bulk-season-save')?.addEventListener('click', async () => {
            const seasonStr = document.getElementById('bulk-season-name').value.trim();
            const isActive = document.getElementById('bulk-season-active').checked ? 1 : 0;
            const selectedTeamIds = [...document.querySelectorAll('.bulk-team-cb:checked')].map(cb => cb.value);
            const errEl = document.getElementById('bulk-season-error');
            errEl.classList.add('hidden');

            if (!seasonStr) {
                errEl.textContent = 'Il nome della stagione è obbligatorio.';
                errEl.classList.remove('hidden');
                return;
            }

            if (selectedTeamIds.length === 0) {
                errEl.textContent = 'Seleziona almeno una squadra.';
                errEl.classList.remove('hidden');
                return;
            }

            const btn = document.getElementById('bulk-season-save');
            btn.disabled = true;
            btn.textContent = 'Creazione...';

            let successCount = 0;
            let errors = [];

            for (const teamId of selectedTeamIds) {
                try {
                    await Store.api('addSeason', 'teams', {
                        team_id: teamId,
                        season: seasonStr,
                        is_active: isActive
                    });
                    successCount++;
                } catch (err) {
                    const teamName = _teams.find(t => t.id === teamId)?.name || teamId;
                    errors.push(`${teamName}: ${err.message}`);
                }
            }

            if (successCount > 0) {
                UI.toast(`Stagione "${seasonStr}" creata per ${successCount} squadr${successCount === 1 ? 'a' : 'e'}`, 'success');
            }
            if (errors.length > 0) {
                UI.toast(`Errori: ${errors.join('; ')}`, 'error');
            }

            await _loadData();
            modal.close();
        });
    }

    // ─── NEW: Add existing team to an existing season ───────────────────────────

    function _openAddTeamToSeasonModal(seasonName) {
        // Find teams NOT yet associated with this season
        const associatedTeamIds = new Set();
        _teams.forEach(t => {
            (t.seasons || []).forEach(s => {
                if (s.season === seasonName) associatedTeamIds.add(t.id);
            });
        });
        const availableTeams = _teams.filter(t => !associatedTeamIds.has(t.id));

        if (availableTeams.length === 0) {
            UI.toast('Tutte le squadre sono già associate a questa stagione.', 'info');
            return;
        }

        const teamCheckboxes = availableTeams.map(t => `
            <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px;cursor:pointer;">
                <input type="checkbox" class="add-team-cb" value="${Utils.escapeHtml(t.id)}" checked style="width:18px;height:18px;">
                <span style="font-weight:500;">${Utils.escapeHtml(t.name)}</span>
                ${t.category ? `<span style="font-size:11px;color:var(--color-text-muted);">(${Utils.escapeHtml(t.category)})</span>` : ''}
            </label>
        `).join('');

        const modal = UI.modal({
            title: `Aggiungi squadre a "${seasonName}"`,
            body: `
                <div style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto;padding-right:6px;">
                    ${teamCheckboxes}
                </div>
                <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-top:var(--sp-3);">
                    <input type="checkbox" id="add-team-active" checked style="width:18px;height:18px">
                    <label for="add-team-active" style="margin:0;cursor:pointer">Attiva subito per queste squadre</label>
                </div>
                <div id="add-team-error" class="form-error hidden" style="margin-top:var(--sp-2);"></div>
            `,
            footer: `
                <button class="btn btn-ghost btn-sm" id="add-team-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="add-team-save" type="button">AGGIUNGI</button>
            `
        });

        document.getElementById('add-team-cancel')?.addEventListener('click', () => modal.close());

        document.getElementById('add-team-save')?.addEventListener('click', async () => {
            const selectedIds = [...document.querySelectorAll('.add-team-cb:checked')].map(cb => cb.value);
            const isActive = document.getElementById('add-team-active').checked ? 1 : 0;
            const errEl = document.getElementById('add-team-error');
            errEl.classList.add('hidden');

            if (selectedIds.length === 0) {
                errEl.textContent = 'Seleziona almeno una squadra.';
                errEl.classList.remove('hidden');
                return;
            }

            const btn = document.getElementById('add-team-save');
            btn.disabled = true;
            btn.textContent = 'Salvataggio...';

            let ok = 0;
            for (const teamId of selectedIds) {
                try {
                    await Store.api('addSeason', 'teams', { team_id: teamId, season: seasonName, is_active: isActive });
                    ok++;
                } catch (err) { /* skip duplicates */ }
            }

            UI.toast(`${ok} squadr${ok === 1 ? 'a' : 'e'} aggiunte alla stagione "${seasonName}"`, 'success');
            await _loadData();
            modal.close();
        });
    }

    // ─── PUBLIC INTERFACE ───────────────────────────────────────────────────────

    return {
        async init() {
            const container = document.getElementById('app');
            if (!container) return;

            const isAdmin = ['admin', 'manager'].includes(App.getUser()?.role);

            // Determine initial tab from route
            const currentRoute = Router.getCurrentRoute();
            _currentTab = (currentRoute === 'squadre-stagioni') ? 'stagioni' : 'squadre';

            container.innerHTML = `
                <div class="module-wrapper">
                    <div class="page-header" style="border-bottom:1px solid var(--color-border);padding:var(--sp-4);padding-bottom:0;display:flex;justify-content:space-between;align-items:flex-start">
                        <div>
                            <h1 class="page-title">Gestione Squadre</h1>
                            <p class="page-subtitle">Configura le squadre e le loro stagioni sportive</p>
                            <!-- Tab bar -->
                            <div style="display:flex;gap:0;margin-top:var(--sp-3);">
                                <button class="squadre-tab-btn ${_currentTab === 'squadre' ? 'active' : ''}" data-tab="squadre" style="padding:10px 20px;font-size:13px;font-weight:600;letter-spacing:.02em;background:none;border:none;border-bottom:2px solid ${_currentTab === 'squadre' ? 'var(--color-primary)' : 'transparent'};color:${_currentTab === 'squadre' ? 'var(--color-primary)' : 'var(--color-text-muted)'};cursor:pointer;transition:all .2s;">
                                    <i class="ph ph-shield-check" style="margin-right:6px;"></i>Squadre
                                </button>
                                <button class="squadre-tab-btn ${_currentTab === 'stagioni' ? 'active' : ''}" data-tab="stagioni" style="padding:10px 20px;font-size:13px;font-weight:600;letter-spacing:.02em;background:none;border:none;border-bottom:2px solid ${_currentTab === 'stagioni' ? 'var(--color-primary)' : 'transparent'};color:${_currentTab === 'stagioni' ? 'var(--color-primary)' : 'var(--color-text-muted)'};cursor:pointer;transition:all .2s;">
                                    <i class="ph ph-calendar-blank" style="margin-right:6px;"></i>Stagioni
                                </button>
                            </div>
                        </div>
                        ${isAdmin ? `
                        <div class="page-actions" style="display:flex;gap:8px;">
                            <button class="btn btn-primary" id="btn-add-team" style="${_currentTab === 'squadre' ? '' : 'display:none;'}">
                                <i class="ph ph-plus"></i> NUOVA SQUADRA
                            </button>
                            <button class="btn btn-primary" id="btn-add-season-bulk" style="${_currentTab === 'stagioni' ? '' : 'display:none;'}">
                                <i class="ph ph-plus"></i> NUOVA STAGIONE
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

            // Tab switching
            container.querySelectorAll('.squadre-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    _switchTab(btn.dataset.tab);
                    // Toggle action buttons
                    const addTeamBtn = document.getElementById('btn-add-team');
                    const addSeasonBtn = document.getElementById('btn-add-season-bulk');
                    if (addTeamBtn) addTeamBtn.style.display = btn.dataset.tab === 'squadre' ? '' : 'none';
                    if (addSeasonBtn) addSeasonBtn.style.display = btn.dataset.tab === 'stagioni' ? '' : 'none';
                    // Update tab visuals
                    container.querySelectorAll('.squadre-tab-btn').forEach(b => {
                        const isActive = b.dataset.tab === btn.dataset.tab;
                        b.style.borderBottomColor = isActive ? 'var(--color-primary)' : 'transparent';
                        b.style.color = isActive ? 'var(--color-primary)' : 'var(--color-text-muted)';
                    });
                });
            });

            if (isAdmin) {
                document.getElementById('btn-add-team')?.addEventListener('click', () => _openTeamModal());
                document.getElementById('btn-add-season-bulk')?.addEventListener('click', () => _openNewSeasonBulkModal());
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
