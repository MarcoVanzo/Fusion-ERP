/**
 * Teams View Module — HTML Templates
 * Fusion ERP v1.1
 */

const TeamsView = {
    /** Main structural skeleton */
    skeleton: () => `
        <div class="module-wrapper">
            <div class="module-header dash-header" style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:24px 32px;display:flex;align-items:center;justify-content:space-between;margin-bottom:0;">
                <div style="display:flex;align-items:center;gap:16px;">
                    <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--color-primary),var(--color-pink));display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;box-shadow:0 4px 12px rgba(99,102,241,0.3);">
                        <i class="ph-fill ph-users-three"></i>
                    </div>
                    <div>
                        <h1 class="dash-title" style="margin:0;font-size:1.5rem;">Squadre e Stagioni</h1>
                        <p style="margin:4px 0 0;font-size:0.875rem;color:var(--color-text-muted);">Gestisci le categorie e le formazioni societarie</p>
                    </div>
                </div>
                <div style="display:flex;gap:12px;" id="teams-header-actions">
                    <button class="btn-dash primary" id="btn-new-team" style="padding:10px 20px;">
                        <i class="ph ph-plus"></i> Nuova Squadra
                    </button>
                    <button class="btn-dash secondary" id="btn-new-season-bulk" style="padding:10px 20px;">
                        <i class="ph ph-calendar-plus"></i> Nuova Stagione
                    </button>
                </div>
            </div>

            <div class="module-body" style="padding:0;display:flex;flex-direction:column;height:calc(100vh - 100px);overflow:hidden;">
                <!-- Internal Navigation Tabs -->
                <div style="padding:0 32px;background:var(--color-surface);border-bottom:1px solid var(--color-border);display:flex;gap:24px;">
                    <button class="squadre-tab-btn active" data-tab="squadre" style="background:none;border:none;padding:16px 4px;font-size:14px;font-weight:600;color:var(--color-text-muted);cursor:pointer;position:relative;transition:color 0.2s;">
                        <i class="ph ph-users-four"></i> Squadre
                    </button>
                    <button class="squadre-tab-btn" data-tab="stagioni" style="background:none;border:none;padding:16px 4px;font-size:14px;font-weight:600;color:var(--color-text-muted);cursor:pointer;position:relative;transition:color 0.2s;">
                        <i class="ph ph-calendar-blank"></i> Stagioni
                    </button>
                </div>

                <!-- Tab Content area -->
                <div id="squadre-list-container" style="flex:1;overflow-y:auto;padding:32px;">
                    <!-- Content will be injected here -->
                </div>
            </div>
        </div>
        
        <style>
            .squadre-tab-btn.active { color: var(--color-text) !important; }
            .squadre-tab-btn.active::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                width: 100%;
                height: 2px;
                background: var(--color-primary);
                box-shadow: 0 -2px 8px rgba(99,102,241,0.4);
            }
            .squadre-tab-btn:hover { color: var(--color-text); }
        </style>
    `,

    /** Teams grouped by category / basic list */
    teamsList: (teams, isAdmin) => {
        if (!teams || teams.length === 0) {
            return Utils.emptyState("Nessuna squadra", "Aggiungi la prima squadra per iniziare a gestire le stagioni.");
        }

        let html = '<div class="teams-list" style="display:flex;flex-direction:column;gap:var(--sp-4);">';
        teams.forEach(team => {
            const activeSeasons = team.seasons ? team.seasons.filter(s => parseInt(s.is_active) === 1) : [];
            const inactiveSeasons = team.seasons ? team.seasons.filter(s => parseInt(s.is_active) === 0) : [];

            html += `
                <div class="dash-card team-item-card" style="padding:24px;display:flex;flex-direction:row;align-items:flex-start;gap:32px;flex-wrap:wrap;">
                    <!-- Team Identity -->
                    <div style="flex:1;min-width:280px;">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                            <div style="width:10px;height:24px;background:${team.color_hex || 'var(--color-primary)'};border-radius:4px;"></div>
                            <h3 style="margin:0;font-size:18px;font-weight:700;">${Utils.escapeHtml(team.name)}</h3>
                            ${team.gender === 'M' ? '<span class="badge" style="background:rgba(96,165,250,0.1);color:#60a5fa;border:1px solid rgba(96,165,250,0.2)">M</span>' : team.gender === 'F' ? '<span class="badge" style="background:rgba(244,114,182,0.1);color:#f472b6;border:1px solid rgba(244,114,182,0.2)">F</span>' : ''}
                        </div>
                        <div style="font-size:13px;color:var(--color-text-muted);display:flex;align-items:center;gap:6px;">
                            <i class="ph ph-tag"></i> ${team.category || 'Categoria non definita'}
                        </div>
                    </div>
                    
                    <!-- Seasons Stats / Active -->
                    <div style="flex:1;min-width:280px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--color-text-muted)">Stagioni Attive</div>
                            ${isAdmin ? `<button class="btn-dash ghost icon-only" data-add-season-to-team="${team.id}" style="padding:4px"><i class="ph ph-plus-circle"></i></button>` : ''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px">
                            ${activeSeasons.length > 0 ? activeSeasons.map(s => `
                                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--color-surface-elevated);border:1px solid var(--color-border);border-radius:10px;box-shadow:var(--shadow-sm);">
                                    <div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:8px;">
                                        <i class="ph ph-calendar" style="color:var(--color-success)"></i>
                                        ${Utils.escapeHtml(s.season)}
                                    </div>
                                    ${isAdmin ? `<button class="btn-dash ghost icon-only" data-toggle-season-status="${s.id}" data-action="0" title="Disattiva" style="color:var(--color-warning);padding:6px;"><i class="ph ph-eye-slash"></i></button>` : ''}
                                </div>
                            `).join('') : '<div style="font-size:13px;color:var(--color-text-muted);font-style:italic">Nessuna stagione attiva</div>'}
                        </div>
                    </div>

                    <!-- Actions -->
                    ${isAdmin ? `
                    <div style="display:flex;align-items:center;gap:8px;">
                        <button class="btn-dash ghost icon-only" data-edit-team-profile="${team.id}" title="Modifica Squadra"><i class="ph ph-pencil-simple" style="font-size:18px;"></i></button>
                        <button class="btn-dash ghost icon-only" data-delete-team-full="${team.id}" title="Elimina Squadra" style="color:var(--color-pink)"><i class="ph ph-trash" style="font-size:18px;"></i></button>
                    </div>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';
        return html;
    },

    /** Seasons grouped by name / detailed view */
    seasonsList: (seasonNames, seasonMap, isAdmin, allTeams) => {
        if (seasonNames.length === 0) {
            return Utils.emptyState("Nessuna stagione", 'Crea la prima stagione con il pulsante "Nuova Stagione" in alto.');
        }

        let html = '<div style="display:flex;flex-direction:column;gap:var(--sp-4);">';
        seasonNames.forEach(seasonName => {
            const entries = seasonMap[seasonName];
            const activeEntries = entries.filter(e => e.is_active === 1);
            const inactiveEntries = entries.filter(e => e.is_active === 0);
            const associatedTeamIds = new Set(entries.map(e => e.teamId));
            const unassociatedTeams = allTeams.filter(t => !associatedTeamIds.has(t.id));

            html += `
                <div class="dash-card" style="padding:0;overflow:hidden;">
                    <div class="dash-card-header" style="margin-bottom:0; padding:24px; background:linear-gradient(135deg,rgba(99,102,241,0.05),rgba(236,72,153,0.05));border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <i class="ph ph-calendar-blank" style="font-size:24px;color:var(--color-primary);"></i>
                            <div>
                                <div class="dash-card-title" style="margin:0;font-size:18px;">Stagione ${Utils.escapeHtml(seasonName)}</div>
                                <div style="font-size:12px;color:var(--color-text-muted);">${entries.length} squadr${entries.length === 1 ? 'a' : 'e'} associat${entries.length === 1 ? 'a' : 'e'}</div>
                            </div>
                        </div>
                        ${isAdmin && unassociatedTeams.length > 0 ? `
                        <button class="btn-dash ghost" data-assoc-team-to-season="${Utils.escapeHtml(seasonName)}" style="padding:8px 16px;">
                            <i class="ph ph-plus"></i> Aggiungi squadra
                        </button>
                        ` : ''}
                    </div>

                    <div style="padding:24px;">
                        ${activeEntries.length > 0 ? `
                        <div style="display:flex;flex-wrap:wrap;gap:12px;">
                            ${activeEntries.map(entry => `
                                <div style="display:flex;align-items:center;gap:12px;padding:12px 18px;background:var(--color-surface-elevated);border:1px solid var(--color-border);border-radius:12px;border-left:4px solid ${entry.teamColorHex || 'var(--color-primary)'};min-width:200px;box-shadow:var(--shadow-sm);">
                                    <div style="flex:1">
                                        <div style="font-weight:700;font-size:15px;margin-bottom:2px;">${Utils.escapeHtml(entry.teamName)}</div>
                                        <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.5px;">${Utils.escapeHtml(entry.teamCategory || 'Senza categoria')}</div>
                                    </div>
                                    ${isAdmin ? `
                                    <div style="display:flex;gap:4px;">
                                        <button class="btn-dash ghost icon-only" data-toggle-season-status="${entry.teamSeasonId}" data-action="0" title="Disattiva" style="color:var(--color-warning);padding:6px;"><i class="ph ph-eye-slash" style="font-size:14px;"></i></button>
                                        <button class="btn-dash ghost icon-only" data-remove-season-mapping="${entry.teamSeasonId}" data-team-name="${Utils.escapeHtml(entry.teamName)}" data-season-name="${Utils.escapeHtml(seasonName)}" title="Rimuovi" style="color:var(--color-pink);padding:6px;"><i class="ph ph-trash" style="font-size:14px;"></i></button>
                                    </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                        ` : '<div style="font-size:13px;color:var(--color-text-muted);font-style:italic;">Nessuna squadra attiva per questa stagione.</div>'}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    },

    /** Team Create/Edit Modal Body */
    teamModal: (team = null, allTeams = []) => {
        const isEdit = !!team;
        const existingSeasons = [...new Set(allTeams.flatMap(t => (t.seasons || []).map(s => s.season)))].sort((a, b) => b.localeCompare(a));
        
        return `
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
                <label class="form-label">Stagione Iniziale *</label>
                <select id="team-initial-season" class="form-select">
                    <option value="">— Seleziona stagione —</option>
                    ${existingSeasons.map(s => `<option value="${Utils.escapeHtml(s)}">${Utils.escapeHtml(s)}</option>`).join('')}
                    <option value="__new__">+ Nuova stagione...</option>
                </select>
                <div id="team-new-season-wrap" class="hidden" style="margin-top:12px;padding:12px;background:rgba(99,102,241,0.05);border-radius:8px;">
                    <label class="form-label" style="font-size:11px;">Nome Nuova Stagione</label>
                    <input type="text" id="team-new-season-name" class="form-input" placeholder="es. 2025/2026">
                </div>
            </div>` : ''}
            
            <div id="team-error" class="form-error hidden" style="margin-top:16px;"></div>
        `;
    },

    /** Modal Body for adding a season to a single team */
    seasonMappingModal: (team) => `
        <div class="form-group">
            <label class="form-label">Stagione *</label>
            <input type="text" id="season-name" class="form-input" placeholder="es. 2025/2026">
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-top:16px">
            <input type="checkbox" id="season-active" checked style="width:18px;height:18px">
            <label for="season-active" style="margin:0;cursor:pointer">Attiva subito questa stagione</label>
        </div>
        <div id="season-error" class="form-error hidden"></div>
    `,

    /** Modal Body for bulk season creation */
    bulkSeasonModal: (teams) => {
        const teamCheckboxes = teams.map(t => `
            <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--color-surface-elevated);border:1px solid var(--color-border);border-radius:10px;cursor:pointer;transition:background 0.2s;">
                <input type="checkbox" class="bulk-team-cb" value="${Utils.escapeHtml(t.id)}" checked style="width:20px;height:20px;">
                <div style="flex:1">
                    <div style="font-weight:600;font-size:14px;">${Utils.escapeHtml(t.name)}</div>
                    <div style="font-size:11px;color:var(--color-text-muted);">${Utils.escapeHtml(t.category || '')}</div>
                </div>
            </label>
        `).join('');

        return `
            <div class="form-group">
                <label class="form-label">Nome Stagione *</label>
                <input type="text" id="bulk-season-name" class="form-input" placeholder="es. 2025/2026">
                <p style="font-size:12px;color:var(--color-text-muted);margin-top:6px;">La stagione verrà creata per tutte le squadre selezionate.</p>
            </div>
            <div class="form-group" style="display:flex;align-items:center;gap:10px;margin:16px 0;">
                <input type="checkbox" id="bulk-season-active" checked style="width:20px;height:20px">
                <label for="bulk-season-active" style="margin:0;cursor:pointer;font-weight:600;">Attiva globalmente</label>
            </div>
            <div style="margin-top:24px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <label class="form-label" style="margin:0;">Squadre da associare</label>
                    <div style="display:flex;gap:8px;">
                        <button type="button" class="btn-dash ghost" id="bulk-select-all" style="font-size:10px;padding:4px 8px;">Tutte</button>
                        <button type="button" class="btn-dash ghost" id="bulk-deselect-all" style="font-size:10px;padding:4px 8px;">Nessuna</button>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;padding-right:8px;" id="bulk-teams-list">
                    ${teamCheckboxes || '<div style="font-size:13px;color:var(--color-text-muted);">Nessuna squadra disponibile.</div>'}
                </div>
            </div>
            <div id="bulk-season-error" class="form-error hidden" style="margin-top:16px;"></div>
        `;
    }
};

export default TeamsView;
