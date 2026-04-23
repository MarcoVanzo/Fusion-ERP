/**
 * Teams View Module — HTML Templates
 * Fusion ERP v1.1
 */

const TeamsView = {
    /** Main structural skeleton */
    skeleton: (currentTab) => `
        <link rel="stylesheet" href="css/squadre_premium.css">
        <div class="module-wrapper">
            <div class="module-header dash-header" style="background:var(--bg-dark);border-bottom:1px solid var(--color-border);padding:24px 32px;display:flex;align-items:center;justify-content:space-between;margin-bottom:0;">
                <div style="display:flex;align-items:center;gap:16px;">
                    <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--color-pink),var(--accent-primary));display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;box-shadow:var(--glow-pink);">
                        <i class="ph ph-users-three"></i>
                    </div>
                    <div>
                        <h1 class="dash-title" style="margin:0;font-size:1.5rem;font-family:var(--font-display);text-transform:uppercase;">${currentTab === 'presenze' ? 'Registro Presenze' : 'Area Sportiva'}</h1>
                        <p style="margin:4px 0 0;font-size:0.875rem;color:var(--text-muted);font-family:var(--font-body);">${currentTab === 'presenze' ? 'Gestione presenze mensili atleti' : 'Gestione Categorie, Squadre e Stagioni'}</p>
                    </div>
                </div>
                ${currentTab !== 'presenze' ? `
                <div style="display:flex;gap:12px;" id="teams-header-actions">
                    <button class="btn btn-primary" id="btn-new-team" style="padding:10px 20px;border-radius:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:12px;">
                        <i class="ph ph-plus" style="font-size:16px;"></i> NUOVA SQUADRA
                    </button>
                    <button class="btn btn-ghost" id="btn-new-season-bulk" style="padding:10px 20px;border-radius:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:12px;border:1px solid var(--color-border);">
                        <i class="ph ph-calendar-plus" style="font-size:16px;"></i> NUOVA STAGIONE
                    </button>
                </div>
                ` : ''}
            </div>

            <div class="module-body" style="padding:0;display:flex;flex-direction:column;height:calc(100vh - 72px);overflow:hidden;">
                <!-- Internal Navigation Tabs -->
                ${currentTab !== 'presenze' ? `
                <nav class="squadre-tabs-nav">
                    <button class="squadre-tab-btn active" data-tab="squadre">
                        <i class="ph ph-users-four"></i> SQUADRE
                    </button>
                    <button class="squadre-tab-btn" data-tab="stagioni">
                        <i class="ph ph-calendar-blank"></i> STAGIONI
                    </button>
                </nav>
                ` : ''}

                <!-- Tab Content area -->
                <div id="squadre-list-container" style="flex:1;overflow-y:auto;padding:32px;background:var(--bg-darker);">
                    <!-- Content will be injected here -->
                </div>
            </div>
        </div>
    `,

    /** Teams grouped by category / basic list */
    teamsList: (teams, isAdmin) => {
        if (!teams || teams.length === 0) {
            return Utils.emptyState("Nessuna squadra", "Aggiungi la prima squadra per iniziare a gestire le stagioni.");
        }

        let html = '<div class="teams-list" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(400px, 1fr));gap:28px;">';
        teams.forEach(team => {
            const activeSeasons = team.seasons ? team.seasons.filter(s => parseInt(s.is_active) === 1) : [];
            const teamColor = team.color_hex || 'var(--color-pink)';

            html += `
                <div class="dash-card team-item-card" style="--team-color: ${teamColor}">
                    <!-- Team Identity -->
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;position:relative;z-index:2;">
                        <div>
                            <div style="display:flex;align-items:center;gap:16px;margin-bottom:10px;">
                                <h3 style="margin:0;font-size:24px;font-weight:900;font-family:var(--font-display);letter-spacing:0.5px;color:#fff;">${Utils.escapeHtml(team.name)}</h3>
                                ${team.gender === 'M' ? '<span class="badge" style="background:rgba(0,242,254,0.1);color:var(--accent-primary);border:1px solid rgba(0,242,254,0.3);padding:4px 8px;border-radius:6px;font-weight:800;">M</span>' : team.gender === 'F' ? '<span class="badge" style="background:rgba(255,0,122,0.1);color:var(--color-pink);border:1px solid rgba(255,0,122,0.3);padding:4px 8px;border-radius:6px;font-weight:800;">F</span>' : ''}
                            </div>
                            <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">
                                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${teamColor};box-shadow:0 0 8px ${teamColor};"></span>
                                ${Utils.escapeHtml(team.category || 'Categoria non definita')}
                            </div>
                        </div>
                        
                        <!-- Actions -->
                        ${isAdmin ? `
                        <div style="display:flex;gap:8px;background:rgba(0,0,0,0.3);padding:6px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);backdrop-filter:blur(10px);">
                            <button class="icon-btn" data-edit-team-profile="${team.id}" title="Modifica Squadra" style="width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,0.02);transition:all 0.2s;"><i class="ph ph-pencil-simple" style="font-size:16px;"></i></button>
                            <button class="icon-btn" data-delete-team-full="${team.id}" title="Elimina Squadra" style="width:34px;height:34px;border-radius:8px;color:var(--color-danger);background:rgba(255,255,255,0.02);transition:all 0.2s;"><i class="ph ph-trash" style="font-size:16px;"></i></button>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Seasons Info -->
                    <div style="background:rgba(0,0,0,0.25);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.05);position:relative;z-index:2;box-shadow:inset 0 2px 10px rgba(0,0,0,0.2);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                            <div class="section-label" style="display:flex;align-items:center;gap:8px;color:var(--color-text-dim);font-size:11px;">
                                <i class="ph ph-calendar-blank" style="font-size:14px;color:var(--text-muted)"></i> STAGIONI ATTIVE
                            </div>
                            ${isAdmin ? `<button class="icon-btn" data-add-season-to-team="${team.id}" style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.05);color:#fff;" title="Aggiungi Stagione"><i class="ph ph-plus" style="font-size:14px;"></i></button>` : ''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:10px">
                            ${activeSeasons.length > 0 ? activeSeasons.map(s => `
                                <div class="season-pill">
                                    <div style="font-weight:800;font-size:15px;display:flex;align-items:center;gap:12px;font-family:var(--font-mono);color:var(--success);text-shadow:0 0 10px rgba(16, 185, 129, 0.2);">
                                        <div style="width:32px;height:32px;border-radius:8px;background:rgba(16, 185, 129, 0.1);display:flex;align-items:center;justify-content:center;border:1px solid rgba(16, 185, 129, 0.2);">
                                            <i class="ph ph-calendar-check" style="color:var(--success);font-size:16px;"></i>
                                        </div>
                                        ${Utils.escapeHtml(s.season)}
                                    </div>
                                    ${isAdmin ? `<button class="icon-btn" data-toggle-season-status="${s.id}" data-action="0" title="Disattiva" style="color:var(--warning);width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.03);"><i class="ph ph-eye-slash" style="font-size:16px;"></i></button>` : ''}
                                </div>
                            `).join('') : '<div style="font-size:13px;color:var(--text-muted);font-style:italic;text-align:center;padding:12px;background:rgba(255,255,255,0.02);border-radius:10px;">Nessuna stagione attiva</div>'}
                        </div>
                    </div>
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

        let html = '<div style="display:flex;flex-direction:column;gap:32px;">';
        seasonNames.forEach(seasonName => {
            const entries = seasonMap[seasonName];
            const activeEntries = entries.filter(e => e.is_active === 1);
            const associatedTeamIds = new Set(entries.map(e => e.teamId));
            const unassociatedTeams = allTeams.filter(t => !associatedTeamIds.has(t.id));

            html += `
                <div class="dash-card" style="padding:0;overflow:hidden;background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:20px;">
                    <div style="padding:28px; background:linear-gradient(135deg,rgba(0,242,254,0.05),rgba(255,0,122,0.05));border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;">
                        <div style="display:flex;align-items:center;gap:16px;">
                            <div style="width:40px;height:40px;border-radius:10px;background:var(--accent-primary);display:flex;align-items:center;justify-content:center;color:#000;">
                                <i class="ph-fill ph-calendar-blank" style="font-size:20px;"></i>
                            </div>
                            <div>
                                <h3 style="margin:0;font-size:22px;font-family:var(--font-display);">STAGIONE ${Utils.escapeHtml(seasonName)}</h3>
                                <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:1px;">${entries.length} SQUADR${entries.length === 1 ? 'A' : 'E'} ASSOCIAT${entries.length === 1 ? 'A' : 'e'}</div>
                            </div>
                        </div>
                        ${isAdmin && unassociatedTeams.length > 0 ? `
                        <button class="btn btn-ghost" data-assoc-team-to-season="${Utils.escapeHtml(seasonName)}" style="padding:8px 16px;border-radius:10px;font-size:11px;font-weight:700;">
                            <i class="ph ph-plus-circle"></i> AGGIUNGI SQUADRA
                        </button>
                        ` : ''}
                    </div>

                    <div style="padding:28px;">
                        ${activeEntries.length > 0 ? `
                        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px;">
                            ${activeEntries.map(entry => `
                                <div class="season-team-badge" style="border-left:4px solid ${entry.teamColorHex || 'var(--color-pink)'}">
                                    <div style="flex:1">
                                        <div style="font-weight:800;font-size:15px;margin-bottom:2px;font-family:var(--font-display);">${Utils.escapeHtml(entry.teamName)}</div>
                                        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:700;">${Utils.escapeHtml(entry.teamCategory || 'Senza categoria')}</div>
                                    </div>
                                    ${isAdmin ? `
                                    <div style="display:flex;gap:4px;">
                                        <button class="icon-btn" data-toggle-season-status="${entry.teamSeasonId}" data-action="0" title="Disattiva" style="color:var(--warning);width:28px;height:28px;border-radius:6px;"><i class="ph ph-eye-slash" style="font-size:14px;"></i></button>
                                        <button class="icon-btn" data-remove-season-mapping="${entry.teamSeasonId}" data-team-name="${Utils.escapeHtml(entry.teamName)}" data-season-name="${Utils.escapeHtml(seasonName)}" title="Rimuovi" style="color:var(--color-danger);width:28px;height:28px;border-radius:6px;"><i class="ph ph-trash" style="font-size:14px;"></i></button>
                                    </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                        ` : '<div style="font-size:13px;color:var(--text-muted);font-style:italic;text-align:center;">Nessuna squadra attiva per questa stagione.</div>'}
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
                        \${categories.map(c => \`<option value="\${Utils.escapeHtml(c)}"></option>\`).join('')}
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

    /** Attendances (Presenze) View */
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
            return html + Utils.emptyState("Nessuna squadra selezionata", "Seleziona una squadra dal menu a tendina per visualizzare il registro rpesenze.");
        }

        if (athletes.length === 0) {
            return html + Utils.emptyState("Nessun atleta", "Non ci sono atleti attivi associati a questa squadra.");
        }

        // Generate days in month
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
                
                // Default to Present (even if null/empty)
                let icon = 'V';
                let bgColor = 'rgba(16, 185, 129, 0.15)'; // emerald
                let color = '#10b981';

                if (att.status === 'absent') {
                    icon = 'X';
                    bgColor = 'rgba(239, 68, 68, 0.15)'; // red
                    color = '#ef4444';
                } else if (att.status === 'injured') {
                    icon = 'I';
                    bgColor = 'rgba(234, 179, 8, 0.15)'; // yellow
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
