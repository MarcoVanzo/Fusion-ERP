/**
 * Teams View Module — HTML Templates v2.0
 * Fusion ERP — Premium Compact Redesign
 */

const TeamsView = {
    /** Main structural skeleton */
    skeleton: (currentTab) => `
        <link rel="stylesheet" href="css/squadre_premium.css">
        <div class="sq-module">
            <div class="sq-header">
                <div class="sq-header__left">
                    <div class="sq-header__icon">
                        <i class="ph ph-users-three"></i>
                    </div>
                    <div>
                        <h1 class="sq-header__title">${currentTab === 'presenze' ? 'Registro Presenze' : 'Area Sportiva'}</h1>
                        <p class="sq-header__subtitle">${currentTab === 'presenze' ? 'Gestione presenze mensili atleti' : 'Gestione Squadre e Stagioni'}</p>
                    </div>
                </div>
                ${currentTab !== 'presenze' ? `
                <div class="sq-header__actions" id="teams-header-actions">
                    <button class="btn btn-primary sq-header__actions .btn" id="btn-new-team">
                        <i class="ph ph-plus" style="font-size:15px;"></i> NUOVA SQUADRA
                    </button>
                    <button class="btn btn-ghost sq-header__actions .btn" id="btn-new-season-bulk" style="border:1px solid var(--color-border);">
                        <i class="ph ph-calendar-plus" style="font-size:15px;"></i> NUOVA STAGIONE
                    </button>
                </div>
                ` : ''}
            </div>

            <div class="sq-body">
                ${currentTab !== 'presenze' ? `
                <nav class="sq-tabs">
                    <button class="squadre-tab-btn ${currentTab === 'squadre' ? 'active' : ''}" data-tab="squadre">
                        <i class="ph ph-users-four"></i> SQUADRE
                    </button>
                    <button class="squadre-tab-btn ${currentTab === 'stagioni' ? 'active' : ''}" data-tab="stagioni">
                        <i class="ph ph-calendar-blank"></i> STAGIONI
                    </button>
                </nav>
                ` : ''}

                <div id="squadre-list-container" class="sq-content">
                    <!-- Content injected here -->
                </div>
            </div>
        </div>
    `,

    /** KPI summary row */
    _kpiRow: (teams) => {
        const totalTeams = teams.length;
        const allSeasons = new Set();
        let activeSeasonCount = 0;
        teams.forEach(t => {
            (t.seasons || []).forEach(s => {
                allSeasons.add(s.season);
                if (parseInt(s.is_active) === 1) activeSeasonCount++;
            });
        });

        return `
            <div class="sq-kpi-row">
                <div class="sq-kpi" style="--kpi-color: #ff007a;">
                    <div class="sq-kpi__icon sq-kpi__icon--pink"><i class="ph-fill ph-users-three"></i></div>
                    <div>
                        <div class="sq-kpi__value">${totalTeams}</div>
                        <div class="sq-kpi__label">Squadre Totali</div>
                    </div>
                </div>
                <div class="sq-kpi" style="--kpi-color: #10b981;">
                    <div class="sq-kpi__icon sq-kpi__icon--success"><i class="ph-fill ph-calendar-check"></i></div>
                    <div>
                        <div class="sq-kpi__value">${activeSeasonCount}</div>
                        <div class="sq-kpi__label">Associazioni Attive</div>
                    </div>
                </div>
                <div class="sq-kpi" style="--kpi-color: #00f2fe;">
                    <div class="sq-kpi__icon sq-kpi__icon--info"><i class="ph-fill ph-calendar-blank"></i></div>
                    <div>
                        <div class="sq-kpi__value">${allSeasons.size}</div>
                        <div class="sq-kpi__label">Stagioni Definite</div>
                    </div>
                </div>
            </div>
        `;
    },

    /** Helper: get initials from team name */
    _initials: (name) => {
        if (!name) return '?';
        const words = name.trim().split(/\s+/);
        if (words.length === 1) return words[0].substring(0, 2);
        return (words[0][0] + words[1][0]);
    },

    /** Teams list — compact rows */
    teamsList: (teams, isAdmin) => {
        if (!teams || teams.length === 0) {
            return Utils.emptyState("Nessuna squadra", "Aggiungi la prima squadra per iniziare a gestire le stagioni.");
        }

        let html = TeamsView._kpiRow(teams);

        html += '<div class="sq-section-label"><i class="ph ph-list-dashes" style="font-size:14px;"></i> ELENCO SQUADRE</div>';
        html += '<div class="sq-team-list">';

        teams.forEach(team => {
            const activeSeasons = (team.seasons || []).filter(s => parseInt(s.is_active) === 1);
            const inactiveSeasons = (team.seasons || []).filter(s => parseInt(s.is_active) !== 1);
            const teamColor = team.color_hex || 'var(--color-pink)';
            const initials = TeamsView._initials(team.name);

            const genderBadge = team.gender === 'M'
                ? '<span class="sq-gender-badge sq-gender-badge--m">M</span>'
                : team.gender === 'F'
                ? '<span class="sq-gender-badge sq-gender-badge--f">F</span>'
                : '';

            const seasonBadges = activeSeasons.length > 0
                ? activeSeasons.map(s => `
                    <span class="sq-season-badge sq-season-badge--active">
                        <i class="ph ph-calendar-check sq-season-badge__icon"></i>
                        ${Utils.escapeHtml(s.season)}
                        ${isAdmin ? `<button class="sq-action-btn sq-action-btn--warning" data-toggle-season-status="${s.id}" data-action="0" title="Disattiva" style="width:22px;height:22px;font-size:12px;margin-left:2px;border:none;background:transparent;color:inherit;opacity:0.5;"><i class="ph ph-eye-slash"></i></button>` : ''}
                    </span>
                `).join('')
                : '<span class="sq-season-no">Nessuna stagione attiva</span>';

            html += `
                <div class="sq-team-row" style="--team-color: ${teamColor}">
                    <div class="sq-team-identity">
                        <div class="sq-team-avatar" style="background:${teamColor};">${Utils.escapeHtml(initials)}</div>
                        <div>
                            <div class="sq-team-name">${Utils.escapeHtml(team.name)}</div>
                        </div>
                    </div>
                    <div class="sq-team-category">
                        <span class="sq-team-category__dot" style="background:${teamColor};box-shadow:0 0 6px ${teamColor};"></span>
                        ${Utils.escapeHtml(team.category || '—')}
                        ${genderBadge}
                    </div>
                    <div class="sq-seasons-cell">
                        ${seasonBadges}
                    </div>
                    ${isAdmin ? `
                    <div class="sq-actions">
                        <button class="sq-action-btn sq-action-btn--success" data-add-season-to-team="${team.id}" title="Aggiungi Stagione"><i class="ph ph-calendar-plus"></i></button>
                        <button class="sq-action-btn" data-edit-team-profile="${team.id}" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                        <button class="sq-action-btn sq-action-btn--danger" data-delete-team-full="${team.id}" title="Elimina"><i class="ph ph-trash"></i></button>
                    </div>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';
        return html;
    },

    /** Seasons grouped view */
    seasonsList: (seasonNames, seasonMap, isAdmin, allTeams) => {
        if (seasonNames.length === 0) {
            return Utils.emptyState("Nessuna stagione", 'Crea la prima stagione con il pulsante "Nuova Stagione" in alto.');
        }

        let html = TeamsView._kpiRow(allTeams);

        html += '<div class="sq-section-label"><i class="ph ph-calendar-dots" style="font-size:14px;"></i> STAGIONI PER ANNO</div>';
        html += '<div class="sq-seasons-list">';

        seasonNames.forEach(seasonName => {
            const entries = seasonMap[seasonName];
            const activeEntries = entries.filter(e => e.is_active === 1);
            const associatedTeamIds = new Set(entries.map(e => e.teamId));
            const unassociatedTeams = allTeams.filter(t => !associatedTeamIds.has(t.id));

            html += `
                <div class="sq-season-group">
                    <div class="sq-season-group__header">
                        <div class="sq-season-group__left">
                            <div class="sq-season-group__icon">
                                <i class="ph-fill ph-calendar-blank"></i>
                            </div>
                            <div>
                                <h3 class="sq-season-group__name">STAGIONE ${Utils.escapeHtml(seasonName)}</h3>
                                <div class="sq-season-group__count">${entries.length} SQUADR${entries.length === 1 ? 'A' : 'E'} ASSOCIAT${entries.length === 1 ? 'A' : 'E'}</div>
                            </div>
                        </div>
                        ${isAdmin && unassociatedTeams.length > 0 ? `
                        <button class="btn btn-ghost" data-assoc-team-to-season="${Utils.escapeHtml(seasonName)}" style="padding:7px 14px;border-radius:8px;font-size:11px;font-weight:700;border:1px solid var(--color-border);">
                            <i class="ph ph-plus-circle"></i> AGGIUNGI
                        </button>
                        ` : ''}
                    </div>

                    <div class="sq-season-group__body">
                        ${activeEntries.length > 0 ? activeEntries.map(entry => `
                            <div class="sq-season-team" style="--team-color: ${entry.teamColorHex || 'var(--color-pink)'}">
                                <div class="sq-season-team__info">
                                    <div class="sq-season-team__name">${Utils.escapeHtml(entry.teamName)}</div>
                                    <div class="sq-season-team__cat">${Utils.escapeHtml(entry.teamCategory || 'Senza categoria')}</div>
                                </div>
                                ${isAdmin ? `
                                <div class="sq-season-team__actions">
                                    <button class="sq-action-btn sq-action-btn--warning" data-toggle-season-status="${entry.teamSeasonId}" data-action="0" title="Disattiva"><i class="ph ph-eye-slash" style="font-size:14px;"></i></button>
                                    <button class="sq-action-btn sq-action-btn--danger" data-remove-season-mapping="${entry.teamSeasonId}" data-team-name="${Utils.escapeHtml(entry.teamName)}" data-season-name="${Utils.escapeHtml(seasonName)}" title="Rimuovi"><i class="ph ph-trash" style="font-size:14px;"></i></button>
                                </div>
                                ` : ''}
                            </div>
                        `).join('') : '<div style="font-size:13px;color:var(--text-muted);font-style:italic;text-align:center;padding:16px;grid-column:1/-1;">Nessuna squadra attiva per questa stagione.</div>'}
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
        
        const categories = [...new Set(allTeams.map(t => t.category).filter(Boolean))];
        if (!categories.includes("Prova")) categories.push("Prova");
        categories.sort((a, b) => a.localeCompare(b));
        
        return `
            <div class="form-group">
                <label class="form-label">Nome Squadra *</label>
                <input type="text" id="team-name" class="form-input" placeholder="es. Under 16, Serie C..." value="${Utils.escapeHtml(team?.name || '')}">
            </div>
            <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
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
                    <input type="text" id="team-category" class="form-input" list="team-category-list" placeholder="es. Giovanile" value="${Utils.escapeHtml(team?.category || '')}">
                    <datalist id="team-category-list">
                        ${categories.map(c => `<option value="${Utils.escapeHtml(c)}"></option>`).join('')}
                    </datalist>
                </div>
            </div>
            
            ${!isEdit ? `
            <div class="form-group" style="padding-top:20px;border-top:1px solid var(--color-border);margin-top:20px">
                <label class="form-label">Stagione Iniziale *</label>
                <select id="team-initial-season" class="form-select">
                    <option value="">— Seleziona stagione —</option>
                    ${existingSeasons.map(s => `<option value="${Utils.escapeHtml(s)}">${Utils.escapeHtml(s)}</option>`).join('')}
                    <option value="__new__">+ Nuova stagione...</option>
                </select>
                <div id="team-new-season-wrap" class="hidden" style="margin-top:12px;padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--color-border);">
                    <label class="form-label" style="font-size:11px;color:var(--accent-primary);">Nome Nuova Stagione</label>
                    <input type="text" id="team-new-season-name" class="form-input" placeholder="es. 2025/2026">
                </div>
            </div>` : ''}
            
            <div id="team-error" class="form-error hidden" style="margin-top:16px;color:var(--color-danger);font-size:13px;font-weight:600;"></div>
        `;
    },

    /** Modal Body for adding a season to a single team */
    seasonMappingModal: (_team) => `
        <div class="form-group">
            <label class="form-label">Nome Stagione *</label>
            <input type="text" id="season-name" class="form-input" placeholder="es. 2025/2026">
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:10px;margin-top:20px;padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;">
            <input type="checkbox" id="season-active" checked style="width:20px;height:20px;cursor:pointer;">
            <label for="season-active" style="margin:0;cursor:pointer;font-weight:600;">Attiva subito questa stagione</label>
        </div>
        <div id="season-error" class="form-error hidden" style="margin-top:16px;color:var(--color-danger);"></div>
    `,

    /** Modal Body for bulk season creation */
    bulkSeasonModal: (teams) => {
        const teamCheckboxes = teams.map(t => `
            <label style="display:flex;align-items:center;gap:14px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid var(--color-border);border-radius:12px;cursor:pointer;transition:all 0.2s;">
                <input type="checkbox" class="bulk-team-cb" value="${Utils.escapeHtml(t.id)}" checked style="width:20px;height:20px;accent-color:var(--color-pink);">
                <div style="flex:1">
                    <div style="font-weight:700;font-size:14px;font-family:var(--font-display);">${Utils.escapeHtml(t.name)}</div>
                    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">${Utils.escapeHtml(t.category || '')}</div>
                </div>
            </label>
        `).join('');

        return `
            <div class="form-group">
                <label class="form-label">Nome Stagione *</label>
                <input type="text" id="bulk-season-name" class="form-input" placeholder="es. 2025/2026">
                <p style="font-size:11px;color:var(--text-muted);margin-top:8px;">La stagione verrà creata per tutte le squadre selezionate sotto.</p>
            </div>
            <div class="form-group" style="display:flex;align-items:center;gap:10px;margin:20px 0;padding:14px;background:rgba(25,25,30,0.4);border-radius:12px;border:1px solid var(--color-border);">
                <input type="checkbox" id="bulk-season-active" checked style="width:20px;height:20px;cursor:pointer;">
                <label for="bulk-season-active" style="margin:0;cursor:pointer;font-weight:700;color:var(--success);">ATTIVA GLOBALMENTE</label>
            </div>
            <div style="margin-top:28px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <label class="form-label" style="margin:0;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Squadre da associare</label>
                    <div style="display:flex;gap:8px;">
                        <button type="button" class="btn btn-ghost" id="bulk-select-all" style="font-size:9px;padding:4px 10px;border-radius:6px;">TUTTE</button>
                        <button type="button" class="btn btn-ghost" id="bulk-deselect-all" style="font-size:9px;padding:4px 10px;border-radius:6px;">NESSUNA</button>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:300px;overflow-y:auto;padding-right:8px;" id="bulk-teams-list">
                    ${teamCheckboxes || '<div style="font-size:13px;color:var(--text-muted);">Nessuna squadra disponibile.</div>'}
                </div>
            </div>
            <div id="bulk-season-error" class="form-error hidden" style="margin-top:16px;color:var(--color-danger);"></div>
        `;
    },

    /** Attendances (Presenze) View — unchanged */
    attendancesView: (teams, selectedTeamId, currentMonthStr, athletes, attendancesMap) => {
        const teamOptions = teams.map(t => `<option value="${t.id}" ${t.id === selectedTeamId ? 'selected' : ''}>${Utils.escapeHtml(t.name)}</option>`).join('');
        
        let html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;background:var(--bg-card);padding:16px 24px;border-radius:12px;border:1px solid var(--color-border);">
                <div style="display:flex;align-items:center;gap:16px;">
                    <select id="presenze-team-select" class="form-select" style="width:250px;">
                        <option value="">-- Seleziona Squadra --</option>
                        ${teamOptions}
                    </select>
                </div>
                <div style="display:flex;align-items:center;gap:16px;">
                    <button class="icon-btn" id="presenze-prev-month" title="Mese precedente" style="width:36px;height:36px;border-radius:8px;"><i class="ph ph-caret-left"></i></button>
                    <div style="font-weight:700;font-size:16px;min-width:140px;text-align:center;text-transform:capitalize;" id="presenze-current-month" data-month="${currentMonthStr}">
                        ${new Date(currentMonthStr + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                    </div>
                    <button class="icon-btn" id="presenze-next-month" title="Mese successivo" style="width:36px;height:36px;border-radius:8px;"><i class="ph ph-caret-right"></i></button>
                </div>
            </div>
        `;

        if (!selectedTeamId) {
            return html + Utils.emptyState("Nessuna squadra selezionata", "Seleziona una squadra dal menu a tendina per visualizzare il registro presenze.");
        }

        if (athletes.length === 0) {
            return html + Utils.emptyState("Nessun atleta", "Non ci sono atleti attivi associati a questa squadra.");
        }

        const [year, month] = currentMonthStr.split('-');
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        
        let daysHeader = '';
        for(let d=1; d<=daysInMonth; d++) {
            const dateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(dateStr);
            const dayName = dateObj.toLocaleDateString('it-IT', { weekday: 'short' }).charAt(0);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            
            daysHeader += `<div style="width:32px;text-align:center;font-size:11px;font-weight:700;color:${isWeekend ? 'var(--color-pink)' : 'var(--text-muted)'};padding-bottom:8px;border-bottom:1px solid var(--color-border);">${dayName}<br>${d}</div>`;
        }

        let rowsHTML = '';
        athletes.forEach(athlete => {
            let cells = '';
            for(let d=1; d<=daysInMonth; d++) {
                const dateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
                const att = attendancesMap[athlete.id]?.[dateStr] || { status: null };
                
                let icon = 'V';
                let bgColor = 'rgba(16, 185, 129, 0.15)';
                let color = '#10b981';

                if (att.status === 'absent') {
                    icon = 'X';
                    bgColor = 'rgba(239, 68, 68, 0.15)';
                    color = '#ef4444';
                } else if (att.status === 'injured') {
                    icon = 'I';
                    bgColor = 'rgba(234, 179, 8, 0.15)';
                    color = '#eab308';
                }

                cells += `
                    <div class="attendance-cell" data-athlete="${athlete.id}" data-date="${dateStr}" data-status="${att.status || ''}" style="width:32px;height:32px;border-radius:6px;background:${bgColor};color:${color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;cursor:pointer;user-select:none;border:1px solid rgba(255,255,255,0.05);transition:all 0.15s;">
                        ${icon}
                    </div>
                `;
            }

            rowsHTML += `
                <div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <div style="width:200px;min-width:200px;font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:16px;">
                        ${Utils.escapeHtml(athlete.full_name)}
                    </div>
                    <div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:4px;" class="hide-scrollbar">
                        ${cells}
                    </div>
                </div>
            `;
        });

        html += `
            <div style="background:var(--bg-card);border:1px solid var(--color-border);border-radius:12px;padding:24px;overflow-x:auto;">
                <div style="display:flex;align-items:flex-end;margin-bottom:12px;">
                    <div style="width:200px;min-width:200px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Atleta</div>
                    <div style="display:flex;gap:4px;">
                        ${daysHeader}
                    </div>
                </div>
                <div>
                    ${rowsHTML}
                </div>
                <div style="margin-top:24px;display:flex;gap:24px;font-size:12px;color:var(--text-muted);">
                    <strong>Legenda:</strong>
                    <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:rgba(16, 185, 129, 0.15);color:#10b981;text-align:center;font-weight:bold;line-height:16px;">V</span> Presente</span>
                    <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:rgba(239, 68, 68, 0.15);color:#ef4444;text-align:center;font-weight:bold;line-height:16px;">X</span> Assente</span>
                    <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:rgba(234, 179, 8, 0.15);color:#eab308;text-align:center;font-weight:bold;line-height:16px;">I</span> Infortunato/a</span>
                </div>
            </div>
            
            <style>
            .attendance-cell:hover { opacity: 0.8; transform: scale(1.05); }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            </style>
        `;

        return html;
    }
};

export default TeamsView;
