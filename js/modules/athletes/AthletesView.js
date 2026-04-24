/**
 * AthletesView — Template e Rendering del modulo Atleti
 */

export const AthletesView = {
    /**
     * Template principale della Dashboard Atleti
     */
    dashboard: (teams, variant = 'anagrafica', athletes = []) => {
        let title = "Anagrafica Atleti";
        let subtitle = "Gestione dei tesserati, documenti e dati biometrici";
        let thRow

        const thStyle = `padding:16px; color:rgba(255,255,255,0.4); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid rgba(255,255,255,0.05);`;

        if (variant === 'documenti') {
            title = "Documenti Atlete";
            subtitle = "Stato dei documenti, contratti d'iscrizione e certificati medici";
            thRow = `
                <th style="${thStyle}">Atleta</th>
                <th style="${thStyle}">Squadra</th>
                <th style="${thStyle} text-align:center;">Doc. Identità</th>
                <th style="${thStyle} text-align:center;">Codice Fiscale</th>
                <th style="${thStyle} text-align:center;">Contratto Iscr.</th>
                <th style="${thStyle}">Certificato Medico</th>
                <th style="${thStyle} text-align:right;">Azioni</th>
            `;
        } else if (variant === 'metrics') {
            title = "Performance e Metriche";
            subtitle = "Altezza, peso, IMC e integrazione con test VALD";
            thRow = `
                <th style="${thStyle}">Atleta</th>
                <th style="${thStyle}">Squadra</th>
                <th style="${thStyle} text-align:center;">Jump Height (cm)</th>
                <th style="${thStyle} text-align:center;">RSImod</th>
                <th style="${thStyle} text-align:center;">Braking Imp.</th>
                <th style="${thStyle} text-align:center;">Ultimo Test VALD</th>
                <th style="${thStyle} text-align:right;">Azioni</th>
            `;
        } else if (variant === 'infortuni') {
            title = "Infortuni Atleti";
            subtitle = "Gestione infortuni, tempi di recupero e stato medico";
            thRow = `
                <th style="${thStyle}">Atleta</th>
                <th style="${thStyle} text-align:center;">Infortuni Attivi</th>
                <th style="${thStyle}">Ultimo Infortunio Occorso</th>
                <th style="${thStyle}">Certificato Medico</th>
                <th style="${thStyle} text-align:right;">Azioni</th>
            `;
        } else if (variant === 'quote') {
            // Estrazione tornei univoci da tutti gli atleti caricati per generare intestazioni orizzontali dinamicamente
            const tournamentsMap = new Map();
            athletes.forEach(a => {
                if (a.tournaments_summary) {
                    const parts = a.tournaments_summary.split(';;;');
                    parts.forEach(p => {
                        const tDetails = p.split('||');
                        if (tDetails.length >= 4) {
                            tournamentsMap.set(tDetails[0], tDetails[1]); // ID => Nome
                        }
                    });
                }
            });
            AthletesView._currentTournaments = Array.from(tournamentsMap.entries()).map(([id, title]) => ({ id, title }));
            
            const torneiHeaders = AthletesView._currentTournaments.map(t => 
                `<th style="${thStyle} text-align:center;" title="${Utils.escapeHtml(t.title)}">${Utils.escapeHtml(t.title.length > 10 ? t.title.substring(0, 8) + '..' : t.title)}</th>`
            ).join('');

            title = "Quote Atleti";
            subtitle = "Riepilogo generale delle quote da versare (In verde se pagate, in rosso se non pagate)";
            thRow = `
                <th style="${thStyle}">Atleta</th>
                <th style="${thStyle}">Squadra</th>
                <th style="${thStyle} text-align:center;">Q. Iscrizione</th>
                <th style="${thStyle} text-align:center;">Q. Vestiario</th>
                <th style="${thStyle} text-align:center;">Q. Foresteria</th>
                <th style="${thStyle} text-align:center;">Q. Trasporti</th>
                ${torneiHeaders}
                <th style="${thStyle} text-align:right;">Bilancio</th>
                <th style="${thStyle} text-align:right;">Azioni</th>
            `;
        } else {
            thRow = `
                <th style="${thStyle}">Atleta</th>
                <th style="${thStyle}">Ruolo</th>
                <th style="${thStyle}">Squadra</th>
                <th style="${thStyle}">Data Nascita</th>
                <th style="${thStyle}">Certificato Medico</th>
                <th style="${thStyle} text-align:right;">Azioni</th>
            `;
        }

        return `
        <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
                <h1 class="dash-title" style="font-family:var(--font-display); font-size:32px; font-weight:800; color:var(--color-white); letter-spacing:-0.02em;"><i class="ph ph-users-three" style="color:var(--color-pink);"></i> ${title}</h1>
                <p class="dash-subtitle" style="margin-top:4px; color:var(--color-text-muted); font-size:14px;">${subtitle}</p>
            </div>
            <div class="header-actions">
                ${variant === 'quote' ? `
                <button class="btn btn-secondary btn-sm" id="bulk-quotes-btn" style="padding:10px 20px; border-radius:12px; font-weight:600; margin-right:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--color-white);">
                    <i class="ph ph-stack"></i> Assegnazione Massiva (per Squadra)
                </button>
                ` : ''}
                ${variant === 'metrics' ? `
                <button class="btn btn-secondary btn-sm" id="manage-vald-links-btn" style="padding:10px 20px; border-radius:12px; font-weight:600; margin-right:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--color-white);">
                    <i class="ph ph-link"></i> Gestione Link VALD
                </button>
                ` : ''}
                <button class="btn btn-primary btn-sm" id="new-athlete-btn" style="padding:10px 20px; border-radius:12px; font-weight:600;">
                    <i class="ph ph-user-plus"></i> Nuovo Atleta
                </button>
            </div>
        </div>

        <div class="module-controls card glass-card" style="display:flex; align-items:center; gap:16px; padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); margin-bottom:24px;">
            <div class="search-box" style="flex:1; position:relative;">
                <i class="ph ph-magnifying-glass" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.3);"></i>
                <input type="text" id="athlete-search" class="search-input" placeholder="Cerca per nome, ruolo o maglia..." style="width:100%; padding:12px 12px 12px 42px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; color:var(--color-white); font-size:14px;">
            </div>
            <div class="filter-group" style="display:flex; gap:12px;">
                <select id="team-filter" class="form-input select-filter" style="min-width:240px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); color:var(--color-white);">
                    <option value="">Tutte le squadre/stagioni</option>
                    ${teams.map(t => `<option value="${Utils.escapeHtml(t.id)}">${Utils.escapeHtml(t.season)} — ${Utils.escapeHtml(t.name)}</option>`).join('')}
                </select>
                <button class="btn btn-ghost btn-sm" id="reset-filters" title="Reset filtri" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
                    <i class="ph ph-arrow-counter-clockwise"></i>
                </button>
            </div>
        </div>

        <div class="table-wrapper" style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.05); border-radius:16px; overflow:hidden;">
            <table class="table" style="width:100%; text-align:left; border-collapse:collapse;">
                <thead style="background:rgba(255,255,255,0.03);">
                    <tr>
                        ${thRow}
                    </tr>
                </thead>
                <tbody id="athletes-grid"></tbody>
            </table>
        </div>
        <div id="athlete-bulk-bar" class="bulk-action-bar" style="display:none;"></div>
    `;
    },

    /**
     * Template per singola card atleta nella griglia
     */
    athleteCard: (athlete, isSelected = false, variant = 'anagrafica') => {
        const initials = Utils.initials(athlete.full_name);
        const nameColor = `hsl(${Array.from(athlete.full_name).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 60%, 65%)`;
        const profilePhoto = athlete.photo_path 
            ? `<img src="${Utils.escapeHtml(athlete.photo_path)}" alt="${Utils.escapeHtml(athlete.full_name)}" style="width:40px; height:40px; border-radius:12px; object-fit:cover; border:1px solid rgba(255,255,255,0.1);">`
            : `<div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg, ${nameColor}, rgba(0,0,0,0.5)); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#fff; border:1px solid rgba(255,255,255,0.1);">${initials}</div>`;
        
        let medStatusHtml = '<span style="color:rgba(255,255,255,0.2)">—</span>';
        if (athlete.medical_cert_expires_at) {
            const daysIdx = Utils.daysUntil(athlete.medical_cert_expires_at);
            const dateFmt = Utils.formatDate(athlete.medical_cert_expires_at);
            if (daysIdx > 30) {
                medStatusHtml = `<div style="display:flex; align-items:center; gap:6px; color:var(--color-success); font-weight:600; font-size:13px;">${dateFmt} <i class="ph ph-check-circle-fill"></i></div>`;
            } else if (daysIdx >= 0) {
                medStatusHtml = `<div style="display:flex; align-items:center; gap:6px; color:var(--color-warning); font-weight:600; font-size:13px;">${dateFmt} <i class="ph ph-warning-fill"></i></div>`;
            } else {
                medStatusHtml = `<div style="display:flex; align-items:center; gap:6px; color:var(--color-pink); font-weight:600; font-size:13px;">${dateFmt} <i class="ph ph-x-circle-fill"></i></div>`;
            }
        }

        const tdStyle = `padding:14px 16px; font-size:14px; color:rgba(255,255,255,0.7); vertical-align:middle;`;

        let extraCells
        if (variant === 'documenti') {
            const getDocSymbol = (path) => path 
                ? `<i class="ph ph-check-circle-fill" style="color:var(--color-success); font-size:20px;"></i>` 
                : `<i class="ph ph-circle" style="color:rgba(255,255,255,0.1); font-size:20px;"></i>`;
            
            extraCells = `
                <td style="${tdStyle} color:rgba(255,255,255,0.4); font-size:13px;">${Utils.escapeHtml(athlete.team_name)}</td>
                <td style="${tdStyle} text-align:center;">${getDocSymbol(athlete.id_doc_front_file_path)}</td>
                <td style="${tdStyle} text-align:center;">${getDocSymbol(athlete.cf_doc_front_file_path)}</td>
                <td style="${tdStyle} text-align:center;">${getDocSymbol(athlete.contract_file_path)}</td>
                <td style="${tdStyle}">${medStatusHtml}</td>
            `;
        } else if (variant === 'metrics') {
            let metricsData = {};
            try { if (athlete.latest_vald_metrics) metricsData = JSON.parse(athlete.latest_vald_metrics); } catch(_e) {}

            const jhVal = metricsData.JumpHeight?.Value ?? metricsData.JumpHeightTotal?.Value ?? null;
            const rsiVal = metricsData.RSIModified?.Value ?? null;
            const biVal = metricsData.BrakingImpulse?.Value ?? metricsData.EccentricBrakingImpulse?.Value ?? metricsData.BrakingPhaseImpulse?.Value ?? null;
            const testDateFmt = athlete.latest_vald_date ? Utils.formatDate(athlete.latest_vald_date) : null;

            const getColor = (val, lowThresh, highThresh) => {
                if (!val) return 'rgba(255,255,255,0.2)';
                if (val < lowThresh) return '#ef4444'; // red for low
                if (val >= highThresh) return 'var(--color-success)'; // green for good
                return 'var(--color-white)'; // white for normal
            };

            const jhColor = getColor(jhVal, 25, 30);       // Thresholds for Jump Height: <25 Red, >=30 Green
            const rsiColor = getColor(rsiVal, 0.30, 0.45); // Thresholds for RSIMOD: <0.30 Red, >=0.45 Green
            const biColor = getColor(biVal, 25, 35);       // Thresholds for Braking Imp: <25 Red, >=35 Green

            extraCells = `
                <td style="${tdStyle} color:rgba(255,255,255,0.4); font-size:13px;"><i class="ph ph-shield-star"></i> ${Utils.escapeHtml(athlete.team_name)}</td>
                <td style="${tdStyle} text-align:center; font-weight:700; color:${jhColor};">${jhVal ? jhVal.toFixed(1) : '—'}</td>
                <td style="${tdStyle} text-align:center; font-weight:700; color:${rsiColor};">${rsiVal ? rsiVal.toFixed(3) : '—'}</td>
                <td style="${tdStyle} text-align:center; font-weight:700; color:${biColor};">${biVal ? biVal.toFixed(1) : '—'}</td>
                <td style="${tdStyle} text-align:center; font-size:12px;">${testDateFmt || '<span style="opacity:0.3">Mai</span>'}</td>
            `;
        } else if (variant === 'infortuni') {
            let injuries = [];
            if (athlete.injuries_summary) {
                athlete.injuries_summary.split(';;;').forEach(ij => {
                    const parts = ij.split('||');
                    if (parts.length >= 3) {
                        injuries.push({
                            date: parts[0],
                            type: parts[1],
                            status: parts[2],
                            return_date: parts[3] || null
                        });
                    }
                });
            }
            
            const active = injuries.filter(i => !i.return_date);
            const activeHtml = active.length > 0 
                ? `<span class="badge badge-pink" style="font-size:11px; padding:4px 8px;">${active.length} In corso</span>` 
                : `<span style="color:var(--color-text-muted); font-size:12px;">Nessuno</span>`;
            
            const lastInjury = injuries.length > 0 ? injuries[0] : null;
            const lastInjuryHtml = lastInjury 
                ? `<div style="font-size:13px; color:var(--color-white); font-weight:500;">${Utils.escapeHtml(lastInjury.type)}</div>
                   <div style="font-size:11px; color:rgba(255,255,255,0.4);"><i class="ph ph-calendar-blank"></i> ${Utils.formatDate(lastInjury.date)} <span style="margin:0 4px;">&middot;</span> ${Utils.escapeHtml(lastInjury.status)}</div>`
                : `<span style="color:var(--color-text-muted); font-size:12px;">Nessuno in storico</span>`;

            extraCells = `
                <td style="${tdStyle} text-align:center; vertical-align:middle;">${activeHtml}</td>
                <td style="${tdStyle} vertical-align:middle;">${lastInjuryHtml}</td>
                <td style="${tdStyle} vertical-align:middle;">${medStatusHtml}</td>
            `;
        } else if (variant === 'quote') {
            const renderEditableQuota = (field, amount, isPaid) => {
                const val = parseFloat(amount) || 0;
                const color = isPaid ? 'var(--color-success)' : (val > 0 ? 'var(--color-pink)' : 'rgba(255,255,255,0.1)');
                return `
                    <div class="inline-edit-group" style="display:flex; align-items:center; justify-content:center; gap:6px;">
                        <div style="position:relative; width:65px;">
                            <span style="position:absolute; left:6px; top:50%; transform:translateY(-50%); font-size:10px; opacity:0.5; color:${color}; pointer-events:none;">€</span>
                            <input type="number" 
                                   class="quota-inline-input" 
                                   data-id="${athlete.id}" 
                                   data-field="${field}" 
                                   value="${val > 0 ? val.toFixed(0) : ''}" 
                                   placeholder="0"
                                   step="1"
                                   style="width:100%; padding:6px 6px 6px 16px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; color:${color}; font-weight:700; font-size:13px; text-align:right; transition: all 0.2s;">
                        </div>
                        <button class="quota-status-toggle ${isPaid ? 'paid' : ''}" 
                                data-id="${athlete.id}" 
                                data-field="${field}_paid" 
                                data-value="${isPaid ? 0 : 1}"
                                style="background:none; border:none; padding:4px; cursor:pointer; color:${color}; font-size:18px; display:flex; align-items:center; transition:transform 0.2s; opacity:${val > 0 ? 1 : 0.2};"
                                title="${isPaid ? 'Segna come non pagato' : 'Segna come pagato'}">
                            <i class="ph ${isPaid ? 'ph-check-circle-fill' : 'ph-circle'}"></i>
                        </button>
                    </div>
                `;
            };

            const p1 = parseFloat(athlete.quota_iscrizione_rata1) || 0;
            const p2 = parseFloat(athlete.quota_iscrizione_rata2) || 0;
            const qIscrizione = p1 + p2;
            const qIscriPaid = (athlete.quota_iscrizione_rata1_paid ? p1 : 0) + (athlete.quota_iscrizione_rata2_paid ? p2 : 0);
            
            const iscrizioneHtml = `
                <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                    <div style="display:flex; align-items:center; gap:4px;">
                        <span style="font-size:9px; opacity:0.3; font-weight:700;">R1</span>
                        ${renderEditableQuota('quota_iscrizione_rata1', athlete.quota_iscrizione_rata1, athlete.quota_iscrizione_rata1_paid)}
                    </div>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <span style="font-size:9px; opacity:0.3; font-weight:700;">R2</span>
                        ${renderEditableQuota('quota_iscrizione_rata2', athlete.quota_iscrizione_rata2, athlete.quota_iscrizione_rata2_paid)}
                    </div>
                </div>
            `;

            const vestiarioHtml = renderEditableQuota('quota_vestiario', athlete.quota_vestiario, athlete.quota_vestiario_paid);
            const foresteriaHtml = renderEditableQuota('quota_foresteria', athlete.quota_foresteria, athlete.quota_foresteria_paid);
            const trasportiVal = parseFloat(athlete._transportReimbursement) || 0;
            const trasportiColor = athlete.quota_trasporti_paid ? 'var(--color-success)' : (trasportiVal > 0 ? 'var(--color-pink)' : 'rgba(255,255,255,0.1)');
            const trasportiHtml = `
                <div class="inline-edit-group" style="display:flex; align-items:center; justify-content:center; gap:6px;">
                    <div style="position:relative; width:65px;">
                        <span style="position:absolute; left:6px; top:50%; transform:translateY(-50%); font-size:10px; opacity:0.5; color:${trasportiColor}; pointer-events:none;">€</span>
                        <input type="number" 
                               value="${trasportiVal > 0 ? trasportiVal.toFixed(0) : ''}" 
                               placeholder="0"
                               readonly
                               title="Calcolato da Rimborsi Trasporti"
                               style="width:100%; padding:6px 6px 6px 16px; background:rgba(0,0,0,0.1); border:1px solid rgba(255,255,255,0.03); border-radius:8px; color:${trasportiColor}; font-weight:700; font-size:13px; text-align:right; cursor:default; opacity:0.8;">
                    </div>
                    <span style="color:${trasportiColor}; font-size:18px; display:flex; align-items:center; opacity:${trasportiVal > 0 ? 1 : 0.2};">
                        <i class="ph ${athlete.quota_trasporti_paid ? 'ph-check-circle-fill' : 'ph-circle'}"></i>
                    </span>
                </div>
            `;

            const v = parseFloat(athlete.quota_vestiario) || 0;
            const f = parseFloat(athlete.quota_foresteria) || 0;
            const t = trasportiVal;
            const v_p = athlete.quota_vestiario_paid ? v : 0;
            const f_p = athlete.quota_foresteria_paid ? f : 0;
            const t_p = athlete.quota_trasporti_paid ? t : 0;
            
            // Loop tornei generati e check dell'atleta
            let torneiHtml = '';
            let torneiTotal = 0;
            let torneiPaid = 0;
            const athleteTournaments = new Map();
            
            if (athlete.tournaments_summary) {
                const parts = athlete.tournaments_summary.split(';;;');
                parts.forEach(p => {
                    const tDetails = p.split('||');
                    if (tDetails.length >= 4) {
                        athleteTournaments.set(tDetails[0], { fee: parseFloat(tDetails[2]) || 0, is_paid: parseInt(tDetails[3]) === 1 });
                    }
                });
            }

            const currentTournaments = AthletesView._currentTournaments || [];
            currentTournaments.forEach(torneo => {
                if (athleteTournaments.has(torneo.id)) {
                    const data = athleteTournaments.get(torneo.id);
                    const fee = data.fee;
                    torneiTotal += fee;
                    if (data.is_paid) torneiPaid += fee;
                    
                    const tColor = data.is_paid ? 'var(--color-success)' : (fee > 0 ? 'var(--color-pink)' : 'rgba(255,255,255,0.1)');
                    const tIcon = data.is_paid ? 'ph-check-circle-fill' : 'ph-circle';
                    
                    torneiHtml += `
                        <td style="${tdStyle} text-align:center;">
                            <div class="inline-edit-group" style="display:flex; align-items:center; justify-content:center; gap:6px;">
                                <div style="position:relative; width:45px;">
                                    <span style="position:absolute; left:4px; top:50%; transform:translateY(-50%); font-size:10px; opacity:0.5; color:${tColor}; pointer-events:none;">€</span>
                                    <input type="number" 
                                           value="${fee > 0 ? fee.toFixed(0) : ''}" 
                                           readonly
                                           title="${Utils.escapeHtml(torneo.title)}"
                                           style="width:100%; padding:4px 4px 4px 12px; background:rgba(0,0,0,0.1); border:1px solid rgba(255,255,255,0.03); border-radius:6px; color:${tColor}; font-weight:700; font-size:12px; text-align:right; cursor:default; opacity:0.8;">
                                </div>
                                <span style="color:${tColor}; font-size:16px; display:flex; align-items:center; opacity:${fee > 0 ? 1 : 0.2};" title="${data.is_paid ? 'Pagato' : 'Non Pagato'}">
                                    <i class="ph ${tIcon}"></i>
                                </span>
                            </div>
                        </td>
                    `;
                } else {
                    torneiHtml += `
                        <td style="${tdStyle} text-align:center; color:rgba(255,255,255,0.1); font-size:16px;">-</td>
                    `;
                }
            });

            const total = qIscrizione + v + f + t + torneiTotal;
            const paid = qIscriPaid + v_p + f_p + t_p + torneiPaid;
            const remaining = total - paid;
            
            let bilancioHtml = '<span style="color:rgba(255,255,255,0.1)">-</span>';
            if (total > 0) {
                if (remaining <= 0) {
                    bilancioHtml = `<span class="badge badge-success" style="font-size:11px;">TUTTO PAGATO</span>`;
                } else {
                     bilancioHtml = `<div style="text-align:right; line-height:1.2;">
                                        <div style="color:var(--color-pink); font-weight:700; font-size:14px; font-family:var(--font-display);">€${remaining.toFixed(0)}</div>
                                        <div style="font-size:10px; color:rgba(255,255,255,0.4)">DA PAGARE</div>
                                     </div>`;
                }
            }

            extraCells = `
                <td style="${tdStyle} color:rgba(255,255,255,0.4); font-size:13px;"><i class="ph ph-shield-star"></i> ${Utils.escapeHtml(athlete.team_name)}</td>
                <td style="${tdStyle} text-align:center;">${iscrizioneHtml}</td>
                <td style="${tdStyle} text-align:center;">${vestiarioHtml}</td>
                <td style="${tdStyle} text-align:center;">${foresteriaHtml}</td>
                <td style="${tdStyle} text-align:center;">${trasportiHtml}</td>
                ${torneiHtml}
                <td style="${tdStyle} text-align:right;">${bilancioHtml}</td>
            `;
        } else {
            extraCells = `
                <td style="${tdStyle} color:var(--color-white); font-weight:500;">${Utils.escapeHtml(athlete.role || '—')}</td>
                <td style="${tdStyle} color:rgba(255,255,255,0.4); font-size:13px;"><i class="ph ph-shield-star"></i> ${Utils.escapeHtml(athlete.team_name)}</td>
                <td style="${tdStyle}">${athlete.birth_date ? Utils.formatDate(athlete.birth_date) : '—'}</td>
                <td style="${tdStyle}">${medStatusHtml}</td>
            `;
        }

        let actionBtnHtml = `
            <button class="btn btn-ghost btn-xs quick-edit-btn" title="Modifica Rapida" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
                <i class="ph ph-pencil-simple" style="font-size:16px;"></i>
            </button>
        `;
        
        if (variant === 'infortuni') {
            actionBtnHtml = `
                <button class="btn btn-ghost btn-xs quick-edit-btn" title="Nuovo Infortunio" style="background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.2); color:#ef4444;">
                    <i class="ph ph-plus" style="font-size:16px;"></i>
                </button>
            `;
        }

        return `
            <tr class="athlete-card ${isSelected ? 'selected' : ''}" data-id="${athlete.id}" style="cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.03); transition:background 0.2s;">
                <td style="padding:12px 16px;">
                    <div style="display:flex; align-items:center; gap:14px;">
                        ${profilePhoto}
                        <div>
                            <div style="font-weight:700; font-size:15px; color:var(--color-white); line-height:1.2;">${Utils.escapeHtml(athlete.full_name)}</div>
                            <div style="font-size:12px; color:rgba(255,255,255,0.3); margin-top:2px;"><i class="ph ph-hashtag"></i> ${athlete.jersey_number || '—'}</div>
                        </div>
                    </div>
                </td>
                ${extraCells}
                <td style="padding:12px 16px; text-align:right;">
                    ${actionBtnHtml}
                </td>
            </tr>
        `;
    },

    /**
     * Layout del profilo atleta (Header + Tabs)
     */
    profileLayout: (athlete, _currentTab = 'anagrafica', user = null) => {
        const photoHtml = athlete.photo_path 
            ? `<img src="${Utils.escapeHtml(athlete.photo_path)}" class="athlete-hero-photo" alt="${athlete.full_name}">`
            : `<div class="athlete-hero-photo" style="display:flex;align-items:center;justify-content:center;background:var(--color-bg-card);"><span style="font-family:var(--font-display);font-size:5rem;font-weight:700;color:rgba(255,255,255,0.1);">${Utils.initials(athlete.full_name)}</span></div>`;

        return `
            <div style="padding: 0 var(--sp-4) var(--sp-4); display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <button class="btn btn-default btn-sm" id="back-to-list" style="background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1);">
                    <i class="ph ph-arrow-left"></i> Torna alla lista
                </button>
                <div style="display:flex; gap:12px;">
                    ${user && user.role === 'admin' && !athlete.user_id && athlete.email ? `
                        <button class="btn btn-accent btn-sm" id="generate-user-btn" style="background:var(--color-primary); color:white;">
                            <i class="ph ph-user-plus"></i> Genera Utente
                        </button>
                    ` : ''}
                    ${user && user.role === 'admin' && !athlete.email && !athlete.user_id ? `
                        <div class="badge badge-error" style="font-size:11px; padding:4px 10px; opacity:0.7;" title="Inserisci una mail per generare l'utente">
                            Mancano recapiti per utente
                        </div>
                    ` : ''}
                    <button class="btn btn-primary btn-sm" id="edit-athlete-btn" style="box-shadow: 0 4px 12px rgba(255, 0, 122, 0.2);">
                        <i class="ph ph-pencil-simple"></i> Modifica Atleta
                    </button>
                </div>
            </div>

            <div class="athlete-hero">
                ${photoHtml}
                <div class="athlete-hero-overlay">
                    <div class="profile-main-info">
                        <h1 class="profile-name" style="font-size:clamp(2.5rem, 6vw, 4.5rem);line-height:1;margin-bottom:var(--sp-2);color:var(--color-white);font-family:var(--font-display);font-weight:800;text-transform:uppercase;letter-spacing:-0.03em;">
                            ${Utils.escapeHtml(athlete.full_name)}
                        </h1>
                        <div class="profile-badges" style="display:flex;gap:8px;flex-wrap:wrap;">
                            <span class="badge badge-pink" style="border-radius:20px;padding:6px 14px;font-size:11px;"><i class="ph ph-hashtag"></i> Maglia #${athlete.jersey_number || '—'}</span>
                            <span class="badge badge-white" style="border-radius:20px;padding:6px 14px;font-size:11px;background:rgba(255,255,255,0.05);"><i class="ph ph-shield"></i> ${Utils.escapeHtml(athlete.role || '—')}</span>
                            <span class="badge badge-white" style="border-radius:20px;padding:6px 14px;font-size:11px;background:rgba(255,255,255,0.05);"><i class="ph ph-users"></i> ${Utils.escapeHtml(athlete.team_name)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin: -40px 16px 0; border-radius: 24px; position:relative; z-index: 10; padding: 4px; background: rgba(20,20,20,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1);">
                <div class="fusion-tabs-container" id="athlete-tab-bar" style="border:none;background:transparent;width:100%;justify-content:flex-start;padding:8px 16px;">
                    <button class="fusion-tab" data-tab="anagrafica">Anagrafica</button>
                    <button class="fusion-tab" data-tab="quote">Quote</button>
                    <button class="fusion-tab" data-tab="metrics" style="color:var(--color-pink)">Performance (VALD)</button>
                    <button class="fusion-tab" data-tab="infortuni" style="color:#ef4444">Infortuni</button>
                    <button class="fusion-tab" data-tab="documenti">Documenti</button>
                    <button class="fusion-tab" data-tab="trasporti" style="color:#00e676;"><i class="ph ph-bus"></i> Trasporti</button>
                    ${user && (user.role === 'atleta' || user.role === 'admin') ? `
                        <button class="fusion-tab" data-tab="subusers">Sotto-Utenti</button>
                    ` : ''}
                </div>
            </div>

            <div id="tab-panel-anagrafica" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            <div id="tab-panel-quote" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            <div id="tab-panel-metrics" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            <div id="tab-panel-infortuni" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            <div id="tab-panel-documenti" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            <div id="tab-panel-trasporti" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            ${user && (user.role === 'atleta' || user.role === 'admin') ? `
                <div id="tab-panel-subusers" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            ` : ''}
        `;
    },

    /**
     * Tab: Anagrafica (Redesigned with logical groups and all DB fields)
     */
    tabAnagrafica: (athlete, canEdit = true) => {
        // Calcolo giorni alla scadenza medica per la barra visuale
        const daysToMetric = athlete.medical_cert_expires_at ? Utils.daysUntil(athlete.medical_cert_expires_at) : -1;
        const medicalPercent = Math.max(0, Math.min(100, (daysToMetric / 365) * 100)); // Approssimazione annuale
        const medicalColor = daysToMetric > 30 ? 'var(--color-success)' : (daysToMetric >= 0 ? 'var(--color-warning)' : 'var(--color-pink)');

        const sections = [
            {
                title: "Identità & Bio",
                icon: "ph-user-focus",
                items: [
                    { label: "Data di nascita", value: athlete.birth_date ? Utils.formatDate(athlete.birth_date) : null, icon: "ph-calendar" },
                    { label: "Luogo di nascita", value: athlete.birth_place, icon: "ph-map-pin" },
                    { label: "Codice Fiscale", value: athlete.fiscal_code, icon: "ph-identification-card", copy: true },
                    { label: "Documento ID", value: athlete.identity_document, icon: "ph-cardholder" },
                ]
            },
            {
                title: "Squadra & Ruolo",
                icon: "ph-volleyball",
                items: [
                    { label: "Ruolo tecnico", value: athlete.role, icon: "ph-shield-check" },
                    { label: "Numero Maglia", value: athlete.jersey_number ? `#${athlete.jersey_number}` : null, icon: "ph-hashtag" },
                    { label: "ID Federale", value: athlete.federal_id, icon: "ph-barcode" },
                    { label: "Squadra attuale", value: athlete.team_name, icon: "ph-users-three" },
                ]
            },
            {
                title: "Contatti & Residenza",
                icon: "ph-address-book",
                items: [
                    { label: "Email Atleta", value: athlete.email, icon: "ph-envelope-simple", copy: true },
                    { label: "Cellulare", value: athlete.phone, icon: "ph-phone" },
                    { label: "Indirizzo", value: athlete.residence_address, icon: "ph-map-trifold" },
                    { label: "Città / CAP", value: athlete.residence_city, icon: "ph-buildings" },
                ]
            },
            {
                title: "Famiglia & Referenti",
                icon: "ph-users-four",
                items: [
                    { label: "Genitore Referente", value: athlete.parent_contact, icon: "ph-user-circle" },
                    { label: "Cellulare Genitore", value: athlete.parent_phone, icon: "ph-phone-call" },
                    { label: "Taglia Kit", value: athlete.shirt_size ? `Taglia ${athlete.shirt_size}` : null, icon: "ph-t-shirt" },
                    { label: "Scarpe", value: athlete.shoe_size, icon: "ph-sneaker-move" },
                ]
            },
            {
                title: "Salute & Emergenza",
                icon: "ph-first-aid",
                items: [
                    { label: "Gruppo Sanguigno", value: athlete.blood_group, icon: "ph-drop" },
                    { label: "Allergie Note", value: athlete.allergies, icon: "ph-warning-octagon" },
                    { label: "Farmaci / Terapie", value: athlete.medications, icon: "ph-pill" },
                    { label: "Contatto Emergenza", value: athlete.emergency_contact_name ? `${athlete.emergency_contact_name} (${athlete.emergency_contact_phone || '—'})` : null, icon: "ph-emergency" },
                ]
            },
            {
                title: "Privacy & Consensi",
                icon: "ph-shield-checkered",
                items: [
                    { label: "Nazionalità", value: athlete.nationality, icon: "ph-globe-hemisphere-west" },
                    { label: "Preferenza Comm.", value: athlete.communication_preference, icon: "ph-broadcast" },
                    { label: "Consenso Immagini", value: athlete.image_release_consent ? 'Rilasciato' : 'Non Rilasciato', icon: "ph-camera" },
                    { label: "Data Rilascio Cert.", value: athlete.medical_cert_issued_at ? Utils.formatDate(athlete.medical_cert_issued_at) : null, icon: "ph-calendar-check" },
                ]
            }
        ];

        const athletePhoto = athlete.photo_path 
            ? `<img src="${Utils.escapeHtml(athlete.photo_path)}" alt="${athlete.full_name}">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.1);font-size:64px;font-weight:800;">${Utils.initials(athlete.full_name)}</div>`;

        return `
            <div class="anagrafica-premium-container">
                <!-- Sidebar: Quick Info & Status -->
                <aside class="profile-info-sidebar">
                    <div class="sidebar-glass-card" style="padding:12px;">
                        <div class="profile-photo-container">
                            ${athletePhoto}
                            <div class="photo-overlay-badge">#${athlete.jersey_number || '—'}</div>
                        </div>
                        <div style="text-align:center; padding:12px 0 8px;">
                            <h2 style="font-size:20px; font-weight:800; color:var(--color-white); margin:0;">${athlete.first_name}</h2>
                            <p style="font-size:14px; color:rgba(255,255,255,0.4); margin:4px 0 0; text-transform:uppercase; letter-spacing:0.05em;">${athlete.last_name}</p>
                        </div>
                    </div>

                    <div class="sidebar-glass-card">
                        <div class="quick-stats-grid">
                            <div class="stat-item">
                                <div class="stat-label">Altezza</div>
                                <div class="stat-value">${athlete.height_cm ? athlete.height_cm + ' cm' : '—'}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Peso</div>
                                <div class="stat-value">${athlete.weight_kg ? athlete.weight_kg + ' kg' : '—'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="sidebar-glass-card ${athlete.is_active ? 'indicator-active' : 'indicator-inactive'} status-indicator-card">
                        <div class="indicator-icon">
                            <i class="ph ph-${athlete.is_active ? 'check-circle' : 'prohibit'}"></i>
                        </div>
                        <div class="indicator-text" style="flex:1;">
                            <h4>Stato Atleta</h4>
                            <p>${athlete.is_active ? 'Attiva e tesserata' : 'Inattiva system-wide'}</p>
                        </div>
                        ${canEdit ? `
                            <button id="toggle-active-btn" class="btn btn-ghost btn-xs" style="padding:4px; min-height:auto;">
                                <i class="ph ph-arrows-counter-clockwise"></i>
                            </button>
                        ` : ''}
                    </div>

                    <div class="sidebar-glass-card">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                            <div class="indicator-text">
                                <h4 style="color:rgba(255,255,255,0.6); font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Certificato Medico</h4>
                                <h3 style="font-size:14px; color:var(--color-white); margin:4px 0;">${athlete.medical_cert_type || 'Agonistico'}</h3>
                            </div>
                            <i class="ph ph-shield-check" style="font-size:24px; color:${medicalColor}; opacity:0.8;"></i>
                        </div>
                        
                        <div class="expiry-visual">
                            <div class="expiry-bar-bg">
                                <div class="expiry-bar-fill" style="width:${medicalPercent}%; background:${medicalColor}; box-shadow: 0 0 10px ${medicalColor}44;"></div>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:600; color:${medicalColor};">
                                <span>${athlete.medical_cert_expires_at ? Utils.formatDate(athlete.medical_cert_expires_at) : 'Dato mancante'}</span>
                                <span>${daysToMetric >= 0 ? daysToMetric + ' gg' : 'SCADUTO'}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <!-- Main Content: Detailed Details -->
                <main class="profile-details-main">
                    ${sections.map(section => `
                        <div class="detail-section">
                            <div class="section-header-premium">
                                <i class="ph ${section.icon}"></i>
                                <h2>${section.title}</h2>
                            </div>
                            <div class="details-grid-premium">
                                ${section.items.map(item => `
                                    <div class="detail-item-premium">
                                        <div class="detail-item-label">
                                            <i class="ph ${item.icon}"></i>
                                            <span>${item.label}</span>
                                        </div>
                                        <div class="detail-item-value">
                                            <span>${Utils.escapeHtml(item.value || '—')}</span>
                                            ${item.copy && item.value ? `
                                                <button class="btn btn-ghost btn-xs copy-btn-mini" onclick="navigator.clipboard.writeText('${item.value}'); UI.toast('Copiato!')" title="Copia">
                                                    <i class="ph ph-copy" style="font-size:14px;"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </main>
            </div>
        `;
    },

    /**
     * Form per l'inserimento o modifica di un atleta
     */
    athleteForm: (athlete = null, teams = []) => {
        const isEdit = !!athlete;
        const title = isEdit ? `Modifica ${athlete.full_name}` : "Nuova Atleta";
        const btnLabel = isEdit ? "SALVA MODIFICHE" : "CREA ATLETA";
        
        // Seleziona i team attuali dell'atleta (solo se in editing)
        const currentTeamIds = athlete ? (athlete.team_ids || [athlete.team_id]) : [];

        return `
            <div class="form-container card glass-card" style="max-width:900px;margin:0 auto;padding:32px;border:1px solid rgba(255,255,255,0.1);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;">
                    <h2 style="font-family:var(--font-display);font-size:24px;color:var(--color-white);margin:0;"><i class="ph ph-user-circle-plus"></i> ${title}</h2>
                    <button class="btn btn-ghost" id="cancel-form"><i class="ph ph-x"></i> ANNULLA</button>
                </div>

                <form id="athlete-edit-form">
                    <input type="hidden" name="id" value="${athlete?.id || ''}">
                    
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
                        <!-- Sezione 1: Identità -->
                        <div style="display:flex;flex-direction:column;gap:16px;">
                            <h4 style="font-size:12px;text-transform:uppercase;color:var(--color-pink);letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Identità & Bio</h4>
                            <div class="form-group"><label class="form-label">Nome *</label><input name="first_name" class="form-input" value="${Utils.escapeHtml(athlete?.first_name || '')}" required></div>
                            <div class="form-group"><label class="form-label">Cognome *</label><input name="last_name" class="form-input" value="${Utils.escapeHtml(athlete?.last_name || '')}" required></div>
                            <div class="form-grid">
                                <div class="form-group"><label class="form-label">Data Nascita</label><input name="birth_date" class="form-input" type="date" value="${athlete?.birth_date || ''}"></div>
                                <div class="form-group"><label class="form-label">Luogo Nascita</label><input name="birth_place" class="form-input" value="${Utils.escapeHtml(athlete?.birth_place || '')}"></div>
                            </div>
                            <div class="form-group"><label class="form-label">Codice Fiscale</label><input name="fiscal_code" class="form-input" placeholder="ABCDEF12G34H567I" maxlength="16" style="text-transform:uppercase;" value="${Utils.escapeHtml(athlete?.fiscal_code || '')}"></div>
                            <div class="form-group"><label class="form-label">Documento Identità (Nr.)</label><input name="identity_document" class="form-input" value="${Utils.escapeHtml(athlete?.identity_document || '')}"></div>
                        </div>

                        <!-- Sezione 2: Sport & Squadra -->
                        <div style="display:flex;flex-direction:column;gap:16px;">
                            <h4 style="font-size:12px;text-transform:uppercase;color:var(--color-primary);letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Inquadramento Sportivo</h4>
                            <div class="form-group">
                                <label class="form-label">Squadre / Stagioni *</label>
                                <div id="form-team-panel" class="multi-team-panel" style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:10px;background:rgba(255,255,255,0.04);border:1px solid var(--color-border);border-radius:var(--radius);">
                                    ${teams.map(t => {
                                        const isSelected = currentTeamIds.includes(t.id);
                                        return `
                                            <label class="multi-team-option ${isSelected ? 'selected' : ''}" for="fe-team-${t.id}">
                                                <input type="checkbox" name="team_season_ids[]" id="fe-team-${t.id}" class="fe-team-cb" value="${t.id}" ${isSelected ? 'checked' : ''} style="display:none;">
                                                <span class="multi-team-label">${Utils.escapeHtml(t.name)} — ${Utils.escapeHtml(t.season)}</span>
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group"><label class="form-label">Ruolo</label><input name="role" class="form-input" value="${Utils.escapeHtml(athlete?.role || '')}"></div>
                                <div class="form-group"><label class="form-label">Numero Maglia</label><input name="jersey_number" class="form-input" type="number" value="${athlete?.jersey_number || ''}"></div>
                            </div>
                            <div class="form-group"><label class="form-label">ID Federale (FIPAV)</label><input name="federal_id" class="form-input" value="${Utils.escapeHtml(athlete?.federal_id || '')}"></div>
                        </div>
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
                        <!-- Sezione 3: Contatti -->
                        <div style="display:flex;flex-direction:column;gap:16px;">
                            <h4 style="font-size:12px;text-transform:uppercase;color:var(--color-text-muted);letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Contatti</h4>
                            <div class="form-group"><label class="form-label">Email Atleta</label><input name="email" class="form-input" type="email" value="${Utils.escapeHtml(athlete?.email || '')}"></div>
                            <div class="form-group"><label class="form-label">Nazionalità</label><input name="nationality" class="form-input" placeholder="es. Italiana" value="${Utils.escapeHtml(athlete?.nationality || '')}"></div>
                            <div class="form-group"><label class="form-label">Cellulare Atleta</label><input name="phone" class="form-input" type="tel" value="${Utils.escapeHtml(athlete?.phone || '')}"></div>
                            <div class="form-group"><label class="form-label">Indirizzo Residenza</label><input name="residence_address" class="form-input" value="${Utils.escapeHtml(athlete?.residence_address || '')}"></div>
                            <div class="form-group"><label class="form-label">Città</label><input name="residence_city" class="form-input" value="${Utils.escapeHtml(athlete?.residence_city || '')}"></div>
                        </div>

                        <!-- Sezione 4.1: Emergenza & Salute -->
                        <div style="display:flex;flex-direction:column;gap:16px;">
                            <h4 style="font-size:12px;text-transform:uppercase;color:var(--color-pink);letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Emergenza & Salute</h4>
                            <div class="form-grid">
                                <div class="form-group"><label class="form-label">Gruppo Sanguigno</label><input name="blood_group" class="form-input" placeholder="es. A+" value="${Utils.escapeHtml(athlete?.blood_group || '')}"></div>
                                <div class="form-group"><label class="form-label">Nome Contatto Emergenza</label><input name="emergency_contact_name" class="form-input" value="${Utils.escapeHtml(athlete?.emergency_contact_name || '')}"></div>
                            </div>
                            <div class="form-group"><label class="form-label">Telefono Emergenza</label><input name="emergency_contact_phone" class="form-input" type="tel" value="${Utils.escapeHtml(athlete?.emergency_contact_phone || '')}"></div>
                            <div class="form-group"><label class="form-label">Allergie</label><textarea name="allergies" class="form-input" rows="2" style="resize:none;">${Utils.escapeHtml(athlete?.allergies || '')}</textarea></div>
                            <div class="form-group"><label class="form-label">Farmaci / Terapie</label><textarea name="medications" class="form-input" rows="2" style="resize:none;">${Utils.escapeHtml(athlete?.medications || '')}</textarea></div>
                        </div>
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
                        <!-- Sezione 4: Kit & Stato Medico -->
                        <div style="display:flex;flex-direction:column;gap:16px;">
                            <h4 style="font-size:12px;text-transform:uppercase;color:var(--color-text-muted);letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Kit & Stato Medico</h4>
                            <div class="form-grid">
                                <div class="form-group"><label class="form-label">Taglia Maglia</label><input name="shirt_size" class="form-input" placeholder="es. M o S" value="${Utils.escapeHtml(athlete?.shirt_size || '')}"></div>
                                <div class="form-group"><label class="form-label">Taglia Scarpe</label><input name="shoe_size" class="form-input" placeholder="es. 42" value="${Utils.escapeHtml(athlete?.shoe_size || '')}"></div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group"><label class="form-label">Altezza (cm)</label><input name="height_cm" class="form-input" type="number" value="${athlete?.height_cm || ''}"></div>
                                <div class="form-group"><label class="form-label">Peso (kg)</label><input name="weight_kg" class="form-input" type="number" step="0.1" value="${athlete?.weight_kg || ''}"></div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group"><label class="form-label">Data Rilascio Cert.</label><input name="medical_cert_issued_at" class="form-input" type="date" value="${athlete?.medical_cert_issued_at || ''}"></div>
                                <div class="form-group"><label class="form-label">Scadenza Certificato</label><input name="medical_cert_expires_at" class="form-input" type="date" value="${athlete?.medical_cert_expires_at || ''}"></div>
                            </div>
                            <div class="form-group"><label class="form-label">Nome Genitore Referente</label><input name="parent_contact" class="form-input" value="${Utils.escapeHtml(athlete?.parent_contact || '')}"></div>
                            <div class="form-group"><label class="form-label">Cellulare Genitore</label><input name="parent_phone" class="form-input" type="tel" value="${Utils.escapeHtml(athlete?.parent_phone || '')}"></div>
                        </div>

                        <!-- Sezione 5: Privacy & Amministrazione -->
                        <div style="display:flex;flex-direction:column;gap:16px;">
                            <h4 style="font-size:12px;text-transform:uppercase;color:var(--color-warning);letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Privacy & Amministrazione</h4>
                            <div class="form-group">
                                <label class="form-label">Preferenza Comunicazioni</label>
                                <select name="communication_preference" class="form-input">
                                    <option value="email" ${athlete?.communication_preference === 'email' ? 'selected' : ''}>Email</option>
                                    <option value="whatsapp" ${athlete?.communication_preference === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
                                    <option value="none" ${athlete?.communication_preference === 'none' ? 'selected' : ''}>Nessuna</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="multi-team-option ${athlete?.image_release_consent ? 'selected' : ''}" style="padding:12px; display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                                    <input type="checkbox" name="image_release_consent" value="1" ${athlete?.image_release_consent ? 'checked' : ''} style="width:18px; height:18px;">
                                    <span style="font-size:12px; font-weight:600;">Consenso riprese video e foto</span>
                                </label>
                            </div>
                            
                            <div style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px;">
                                <div class="form-group">
                                    <label class="form-label" style="display:none;"></label>
                                    <p style="font-size:12px; color:rgba(255,255,255,0.5);"><i class="ph ph-info"></i> La gestione di Quote e Rate è disponibile nel tab "Quote" salvando il profilo.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="form-error" class="form-error hidden" style="margin-bottom:20px;"></div>

                    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);">
                        <button type="button" class="btn btn-ghost" id="cancel-form-btn">ANNULLA</button>
                        <button type="submit" class="btn btn-primary" id="save-athlete-btn" style="padding: 12px 32px;">${btnLabel}</button>
                    </div>
                </form>
            </div>
        `;
    },


    /**
     * Tab: Quote (Gestione importi)
     */
    tabQuote: (athlete, isAdmin = false, transportReimbursement = 0, tournamentHistory = []) => {
        const p1 = parseFloat(athlete.quota_iscrizione_rata1) || 0;
        const p2 = parseFloat(athlete.quota_iscrizione_rata2) || 0;
        const v = parseFloat(athlete.quota_vestiario) || 0;
        const f = parseFloat(athlete.quota_foresteria) || 0;
        const t = transportReimbursement || 0;

        let tornei = 0;
        let tornei_p = 0;
        let _tournamentRowsTable = '';
        let _tournamentRowsForm = '';

        tournamentHistory.forEach(tour => {
            const fee = parseFloat(tour.fee_per_athlete) || 0;
            const has_paid = tour.has_paid ? true : false;
            tornei += fee;
            if (has_paid) tornei_p += fee;
        });

        const p1_p = athlete.quota_iscrizione_rata1_paid ? p1 : 0;
        const p2_p = athlete.quota_iscrizione_rata2_paid ? p2 : 0;
        const v_p = athlete.quota_vestiario_paid ? v : 0;
        const f_p = athlete.quota_foresteria_paid ? f : 0;
        const t_p = athlete.quota_trasporti_paid ? t : 0;

        const total = p1 + p2 + v + f + t + tornei;
        const paid = p1_p + p2_p + v_p + f_p + t_p + tornei_p;
        const remaining = total - paid;

        const formatCurrency = (val) => '€ ' + val.toFixed(2);
        const getStatusBadge = (isPaid, amount) => {
            if (amount === 0) return '<span style="color:var(--color-text-muted)">-</span>';
            return isPaid ? '<span class="badge badge-success" style="font-size:10px;">PAGATA</span>' : '<span class="badge badge-pink" style="font-size:10px;">DA PAGARE</span>';
        };

        return `
            <div class="card glass-card" style="padding:24px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01); margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div>
                        <h3 style="font-family:var(--font-display); font-size:20px; color:var(--color-white); margin-bottom:4px;">Riepilogo Quote</h3>
                        <p style="color:var(--color-text-muted); font-size:13px;">Stato attuale delle quote concordate per questo atleta.</p>
                    </div>
                </div>
                
                <div class="table-responsive" style="margin-bottom:24px; border:1px solid rgba(255,255,255,0.05); border-radius:12px; overflow:hidden;">
                    <table class="table" style="width:100%; border-collapse:collapse; margin:0;">
                        <thead style="background:rgba(255,255,255,0.03);">
                            <tr>
                                <th style="padding:12px 16px; color:rgba(255,255,255,0.4); font-size:11px; text-transform:uppercase; text-align:left;">Descrizione Quota</th>
                                <th style="padding:12px 16px; color:rgba(255,255,255,0.4); font-size:11px; text-transform:uppercase; text-align:right;">Importo Assegnato</th>
                                <th style="padding:12px 16px; color:rgba(255,255,255,0.4); font-size:11px; text-transform:uppercase; text-align:center;">Stato</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                <td style="padding:14px 16px; color:var(--color-white); font-size:14px;">Quota di Iscrizione - Prima Rata</td>
                                <td style="padding:14px 16px; color:var(--color-white); font-size:15px; text-align:right; font-weight:600; font-family:var(--font-display);">${formatCurrency(p1)}</td>
                                <td style="padding:14px 16px; text-align:center;">${getStatusBadge(athlete.quota_iscrizione_rata1_paid, p1)}</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                <td style="padding:14px 16px; color:var(--color-white); font-size:14px;">Quota di Iscrizione - Seconda Rata</td>
                                <td style="padding:14px 16px; color:var(--color-white); font-size:15px; text-align:right; font-weight:600; font-family:var(--font-display);">${formatCurrency(p2)}</td>
                                <td style="padding:14px 16px; text-align:center;">${getStatusBadge(athlete.quota_iscrizione_rata2_paid, p2)}</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                <td style="padding:14px 16px; color:var(--color-white); font-size:14px;">Quota Vestiario</td>
                                <td style="padding:14px 16px; color:var(--color-white); font-size:15px; text-align:right; font-weight:600; font-family:var(--font-display);">${formatCurrency(v)}</td>
                                <td style="padding:14px 16px; text-align:center;">${getStatusBadge(athlete.quota_vestiario_paid, v)}</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                <td style="padding:14px 16px; color:var(--color-white); font-size:14px;">Quota Foresteria</td>
                                <td style="padding:14px 16px; color:var(--color-white); font-size:15px; text-align:right; font-weight:600; font-family:var(--font-display);">${formatCurrency(f)}</td>
                                <td style="padding:14px 16px; text-align:center;">${getStatusBadge(athlete.quota_foresteria_paid, f)}</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                <td style="padding:14px 16px; color:var(--color-white); font-size:14px;">Quota Trasporti</td>
                                <td style="padding:14px 16px; color:var(--color-white); font-size:15px; text-align:right; font-weight:600; font-family:var(--font-display);">${formatCurrency(t)}</td>
                                <td style="padding:14px 16px; text-align:center;">${getStatusBadge(athlete.quota_trasporti_paid, t)}</td>
                            </tr>

                            ${tournamentHistory.map(tour => {
                                const fee = parseFloat(tour.fee_per_athlete) || 0;
                                return `
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                    <td style="padding:14px 16px; color:var(--color-white); font-size:14px;">Quota Torneo: ${Utils.escapeHtml(tour.tournament_name)}</td>
                                    <td style="padding:14px 16px; color:var(--color-white); font-size:15px; text-align:right; font-weight:600; font-family:var(--font-display);">${formatCurrency(fee)}</td>
                                    <td style="padding:14px 16px; text-align:center;">${getStatusBadge(tour.has_paid, fee)}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); border-radius:12px; padding:20px; border:1px solid rgba(255,255,255,0.05);">
                     <div style="flex:1; text-align:center; border-right:1px solid rgba(255,255,255,0.05)">
                          <div style="font-size:11px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Totale Assegnato</div>
                          <div style="font-size:24px; font-weight:800; color:var(--color-white); font-family:var(--font-display);">${formatCurrency(total)}</div>
                     </div>
                     <div style="flex:1; text-align:center; border-right:1px solid rgba(255,255,255,0.05)">
                          <div style="font-size:11px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Totale Pagato</div>
                          <div style="font-size:24px; font-weight:800; color:var(--color-success); font-family:var(--font-display);">${formatCurrency(paid)}</div>
                     </div>
                     <div style="flex:1; text-align:center;">
                          <div style="font-size:11px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Rimanente Da Pagare</div>
                          <div style="font-size:24px; font-weight:800; color:${remaining > 0 ? 'var(--color-pink)' : 'var(--color-success)'}; font-family:var(--font-display);">${formatCurrency(remaining)}</div>
                     </div>
                </div>
            </div>

            <div class="card glass-card" style="padding:24px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                    <div>
                        <h3 style="font-family:var(--font-display); font-size:20px; color:var(--color-white); margin-bottom:4px;">Assegnazione Quote</h3>
                        <p style="color:var(--color-text-muted); font-size:13px;">Definisci o modifica gli importi concordati e lo stato di pagamento.</p>
                    </div>
                </div>

                <form id="athlete-quotas-form">
                    <input type="hidden" name="id" value="${athlete.id}">
                    <div style="display:grid; grid-template-columns:1fr; gap:24px;">
                        
                        <!-- Quota Iscrizione Rata 1 -->
                        <div style="display:flex; gap:16px; align-items:flex-end; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <div class="form-group" style="flex:1;">
                                <label class="form-label">Quota di Iscrizione - Prima Rata</label>
                                <input type="number" name="quota_iscrizione_rata1" class="form-input" placeholder="es. 250.00" step="0.01" value="${athlete.quota_iscrizione_rata1 || ''}" ${isAdmin ? '' : 'disabled'}>
                            </div>
                            <div class="form-group" style="margin-bottom:10px;">
                                <label class="form-label" style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" name="quota_iscrizione_rata1_paid" value="1" ${athlete.quota_iscrizione_rata1_paid ? 'checked' : ''} ${isAdmin ? '' : 'disabled'}>
                                    Pagata
                                </label>
                            </div>
                        </div>

                        <!-- Quota Iscrizione Rata 2 -->
                        <div style="display:flex; gap:16px; align-items:flex-end; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <div class="form-group" style="flex:1;">
                                <label class="form-label">Quota di Iscrizione - Seconda Rata</label>
                                <input type="number" name="quota_iscrizione_rata2" class="form-input" placeholder="es. 250.00" step="0.01" value="${athlete.quota_iscrizione_rata2 || ''}" ${isAdmin ? '' : 'disabled'}>
                            </div>
                            <div class="form-group" style="margin-bottom:10px;">
                                <label class="form-label" style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" name="quota_iscrizione_rata2_paid" value="1" ${athlete.quota_iscrizione_rata2_paid ? 'checked' : ''} ${isAdmin ? '' : 'disabled'}>
                                    Pagata
                                </label>
                            </div>
                        </div>

                        <!-- Quota Vestiario -->
                        <div style="display:flex; gap:16px; align-items:flex-end; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <div class="form-group" style="flex:1;">
                                <label class="form-label">Quota Vestiario</label>
                                <input type="number" name="quota_vestiario" class="form-input" placeholder="es. 150.00" step="0.01" value="${athlete.quota_vestiario || ''}" ${isAdmin ? '' : 'disabled'}>
                            </div>
                            <div class="form-group" style="margin-bottom:10px;">
                                <label class="form-label" style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" name="quota_vestiario_paid" value="1" ${athlete.quota_vestiario_paid ? 'checked' : ''} ${isAdmin ? '' : 'disabled'}>
                                    Pagata
                                </label>
                            </div>
                        </div>

                        <!-- Quota Foresteria -->
                        <div style="display:flex; gap:16px; align-items:flex-end; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <div class="form-group" style="flex:1;">
                                <label class="form-label">Quota Foresteria</label>
                                <input type="number" name="quota_foresteria" class="form-input" placeholder="es. 400.00" step="0.01" value="${athlete.quota_foresteria || ''}" ${isAdmin ? '' : 'disabled'}>
                            </div>
                            <div class="form-group" style="margin-bottom:10px;">
                                <label class="form-label" style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" name="quota_foresteria_paid" value="1" ${athlete.quota_foresteria_paid ? 'checked' : ''} ${isAdmin ? '' : 'disabled'}>
                                    Pagata
                                </label>
                            </div>
                        </div>

                        <!-- Quota Trasporti -->
                        <div style="display:flex; gap:16px; align-items:flex-end; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <div class="form-group" style="flex:1;">
                                <label class="form-label">Quota Trasporti</label>
                                <input type="number" name="quota_trasporti" class="form-input" placeholder="-" step="0.01" value="${t.toFixed(2)}" readonly style="opacity:0.7; cursor:not-allowed; background:rgba(255,255,255,0.02)">
                                <div style="font-size:11px; color:var(--color-pink); margin-top:4px;"><i class="ph ph-info"></i> Importo calcolato automaticamente da Rimborsi Trasporti (€ 2,50 × viaggio)</div>
                            </div>
                            <div class="form-group" style="margin-bottom:10px;">
                                <label class="form-label" style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" name="quota_trasporti_paid" value="1" ${athlete.quota_trasporti_paid ? 'checked' : ''} ${isAdmin ? '' : 'disabled'}>
                                    Pagata
                                </label>
                            </div>
                        </div>

                        <!-- Quote Tornei -->
                        ${tournamentHistory.map(tour => {
                            const fee = parseFloat(tour.fee_per_athlete) || 0;
                            return `
                            <div style="display:flex; gap:16px; align-items:flex-end;">
                                <div class="form-group" style="flex:1;">
                                    <label class="form-label">Quota Torneo: ${Utils.escapeHtml(tour.tournament_name)}</label>
                                    <input type="number" class="form-input" placeholder="-" step="0.01" value="${fee.toFixed(2)}" readonly style="opacity:0.7; cursor:not-allowed; background:rgba(255,255,255,0.02)">
                                    <div style="font-size:11px; color:var(--color-pink); margin-top:4px;"><i class="ph ph-info"></i> Importo del torneo a cui l'atleta partecipa.</div>
                                </div>
                                <div class="form-group" style="margin-bottom:10px;">
                                    <label class="form-label" style="display:flex; align-items:center; gap:8px;">
                                        <input type="checkbox" class="tournament-payment-cb" data-event-id="${tour.event_id}" value="1" ${tour.has_paid ? 'checked' : ''} ${isAdmin ? '' : 'disabled'}>
                                        Pagata
                                    </label>
                                </div>
                            </div>`;
                        }).join('')}


                    </div>
                    
                    ${isAdmin ? `
                        <div style="margin-top:24px; text-align:right;">
                            <button type="submit" class="btn btn-primary" id="save-quotas-btn">Salva Quote</button>
                        </div>
                    ` : ''}
                </form>
            </div>
        `;
    },

    /**
     * Tab: Documenti
     */
    tabDocumenti: (athlete, canUpload = false) => {
        const docs = [
            { id: 'contract-file', label: 'Contratto / Iscrizione', path: athlete.contract_file_path, icon: 'ph-file-pdf' },
            { id: 'id-doc-front', label: 'Documento ID (Fronte)', path: athlete.id_doc_front_file_path, icon: 'ph-identification-badge' },
            { id: 'id-doc-back', label: 'Documento ID (Retro)', path: athlete.id_doc_back_file_path, icon: 'ph-identification-badge' },
            { id: 'cf-doc-front', label: 'Codice Fiscale (Fronte)', path: athlete.cf_doc_front_file_path, icon: 'ph-identification-card' },
            { id: 'cf-doc-back', label: 'Codice Fiscale (Retro)', path: athlete.cf_doc_back_file_path, icon: 'ph-identification-card' },
            { id: 'med-cert', label: 'Certificato Medico', path: athlete.medical_cert_file_path, icon: 'ph-article-ny-times' },
            { id: 'photo-release', label: 'Liberatoria Foto/Video', path: athlete.photo_release_file_path, icon: 'ph-camera' },
            { id: 'privacy-policy', label: 'Informativa Privacy', path: athlete.privacy_policy_file_path, icon: 'ph-shield-checkered' }
        ];

        const foresteriaDocs = [
            { id: 'guesthouse-rules', label: 'Regolamento Foresteria', path: athlete.guesthouse_rules_file_path, icon: 'ph-house-line' },
            { id: 'guesthouse-delegate', label: 'Delega', path: athlete.guesthouse_delegate_file_path, icon: 'ph-signature' },
            { id: 'health-card', label: 'Tessera Sanitaria', path: athlete.health_card_file_path, icon: 'ph-identification-card' }
        ];

        const renderDocCard = (doc) => {
            const hasFile = !!doc.path;
            return `
                <div class="doc-card card glass-card" style="padding:24px; display:flex; flex-direction:column; gap:20px; border:1px solid ${hasFile ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.05)'}; background:${hasFile ? 'rgba(0, 230, 118, 0.02)' : 'rgba(255,255,255,0.01)'}; transition: transform 0.2s, background 0.2s;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="width:48px; height:48px; border-radius:12px; background:rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center; color:${hasFile ? 'var(--color-success)' : 'rgba(255,255,255,0.2)'};">
                            <i class="ph ${doc.icon}" style="font-size:24px;"></i>
                        </div>
                        <span class="badge ${hasFile ? 'badge-success' : 'badge-pink'}" style="font-size:10px; padding:4px 10px;">
                            ${hasFile ? 'CARICATO' : 'MANCANTE'}
                        </span>
                    </div>
                    
                    <div>
                        <h4 style="font-size:14px; font-weight:600; color:var(--color-white); margin-bottom:4px;">${doc.label}</h4>
                        <p style="font-size:11px; color:var(--color-text-muted);">${hasFile ? 'Documento verificato e pronto per la consultazione.' : 'Il documento non è ancora stato caricato nel sistema.'}</p>
                    </div>

                    <div style="display:flex; gap:10px; margin-top:auto; padding-top:16px; border-top:1px solid rgba(255,255,255,0.05);">
                        ${hasFile ? `
                            <button class="btn btn-default btn-xs" style="flex:1; background:rgba(0, 230, 118, 0.1); border-color:rgba(0, 230, 118, 0.2); color:var(--color-success);" onclick="UI.openPdf('api/?module=athletes&action=downloadDoc&id=${athlete.id}&field=${doc.id.replace(/-/g,'_')}_file_path', 'Documento Atleta')">
                                <i class="ph ph-eye"></i> Visualizza
                            </button>
                        ` : ''}
                        ${canUpload ? `
                            <label for="upload-${athlete.id}-${doc.id}-input" class="btn btn-ghost btn-xs" style="flex:${hasFile ? '0.5' : '1'}; background:rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.1); cursor:pointer; margin:0; display:inline-flex; justify-content:center; align-items:center; gap:4px;">
                                <i class="ph ph-upload-simple"></i> ${hasFile ? 'Sostituisci' : 'Carica PDF/Foto'}
                            </label>
                            <input type="file" id="upload-${athlete.id}-${doc.id}-input" style="opacity:0; position:absolute; z-index:-1; width:0.1px; height:0.1px; overflow:hidden;" accept=".pdf,image/*" onchange="window._handleAthleteDocumentUpload('${athlete.id}', '${doc.id}', this)">
                        ` : ''}
                    </div>
                </div>
            `;
        };

        return `
            <div style="display:flex; flex-direction:column; gap:32px;">
                <!-- Sezione Documenti Principali -->
                <div class="docs-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                    ${docs.map(doc => renderDocCard(doc)).join('')}
                </div>

                <!-- Sezione Sotto-sezione Foresteria -->
                <div class="foresteria-section-toggle" style="margin-top:20px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.05); text-align:center;">
                    <button class="btn btn-ghost" id="toggle-foresteria-btn" style="padding:16px 40px; border-radius:30px; font-weight:700; letter-spacing:0.05em; background:rgba(255,255,255,0.02);">
                        <i class="ph ph-buildings"></i> SEZIONE FORESTERIA
                    </button>
                </div>

                <div id="foresteria-docs-container" style="display:none;">
                    <div style="margin-bottom:24px; padding:0 8px;">
                        <h3 style="font-family:var(--font-display); font-size:18px; color:var(--color-pink); margin-bottom:4px;">Documenti Foresteria</h3>
                        <p style="color:var(--color-text-muted); font-size:12px;">Documentazione specifica per le atlete residenti presso la Foresteria Fusion.</p>
                    </div>
                    <div class="docs-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                        ${foresteriaDocs.map(doc => renderDocCard(doc)).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Tab: Sotto-Utenti (Management for Athlete Portal)
     */
    tabSubUsers: (subs = []) => {
        return `
            <div class="card glass-card" style="padding:24px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                    <div>
                        <h3 style="font-family:var(--font-display); font-size:20px; color:var(--color-white); margin-bottom:4px;">Gestione Sotto-Utenti</h3>
                        <p style="color:var(--color-text-muted); font-size:13px;">Puoi invitare fino a 2 persone (es. genitori o tutor) a visualizzare il tuo profilo.</p>
                    </div>
                    ${subs.length < 2 ? `
                        <button class="btn btn-primary btn-sm" id="invite-subuser-btn">
                            <i class="ph ph-user-plus"></i> Invita Persona
                        </button>
                    ` : `
                        <span class="badge badge-white" style="opacity:0.5;">Limite raggiunto (2/2)</span>
                    `}
                </div>

                <div class="subs-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:16px;">
                    ${subs.length === 0 ? `
                        <div style="grid-column: 1 / -1; padding:40px; text-align:center; color:rgba(255,255,255,0.2);">
                            <i class="ph ph-users" style="font-size:48px; margin-bottom:12px;"></i>
                            <p>Nessun sotto-utente attivo.</p>
                        </div>
                    ` : subs.map(s => `
                        <div class="card" style="padding:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:12px;">
                            <div style="width:40px; height:40px; border-radius:50%; background:var(--color-primary); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">
                                ${Utils.initials(s.full_name)}
                            </div>
                            <div style="flex:1;">
                                <div style="font-weight:600; color:white;">${Utils.escapeHtml(s.full_name)}</div>
                                <div style="font-size:12px; color:rgba(255,255,255,0.4);">${Utils.escapeHtml(s.email)}</div>
                            </div>
                            <span class="badge badge-success" style="font-size:10px;">ATTIVO</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Modal Invito (Hidden by default) -->
            <div id="invite-modal" class="modal-overlay" style="display:none;">
                <div class="modal glass-card" style="max-width:400px; padding:24px;">
                    <h3 style="margin-bottom:16px;">Invita Sotto-utente</h3>
                    <div class="form-group">
                        <label class="form-label">Nome Completo</label>
                        <input type="text" id="invite-name" class="form-input" placeholder="es. Mario Rossi">
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Email</label>
                        <input type="email" id="invite-email" class="form-input" placeholder="mario.rossi@example.com">
                    </div>
                    <div style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px;">
                        <button class="btn btn-ghost" id="close-invite-modal">Annulla</button>
                        <button class="btn btn-primary" id="confirm-invite-btn">Invia Invito</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Tab: Trasporti (Riepilogo rimborsi basato sullo storico)
     */
    tabTrasporti: (athlete, history = []) => {
        const FEE_PER_TRIP = 2.50;
        const totalAmount = history.length * FEE_PER_TRIP;
        
        return `
            <div class="card glass-card" style="padding:24px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01); margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                    <div>
                        <h3 style="font-family:var(--font-display); font-size:20px; color:var(--color-white); margin-bottom:4px;">Rimborso Trasporti</h3>
                        <p style="color:var(--color-text-muted); font-size:13px;">Calcolo basato sui viaggi effettuati dall'atleta (${history.length} viaggi).</p>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Totale Rimborso</div>
                        <div style="font-size:28px; font-weight:800; color:var(--color-success); font-family:var(--font-display);">€ ${totalAmount.toFixed(2)}</div>
                    </div>
                </div>

                <div class="table-wrapper" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; overflow:hidden;">
                    <table class="table" style="width:100%; border-collapse:collapse; margin:0;">
                        <thead style="background:rgba(255,255,255,0.03);">
                            <tr>
                                <th style="padding:12px 16px; color:rgba(255,255,255,0.4); font-size:11px; text-transform:uppercase; text-align:left;">Destinazione</th>
                                <th style="padding:12px 16px; color:rgba(255,255,255,0.4); font-size:11px; text-transform:uppercase; text-align:center;">Data</th>
                                <th style="padding:12px 16px; color:rgba(255,255,255,0.4); font-size:11px; text-transform:uppercase; text-align:center;">Orario</th>
                                <th style="padding:12px 16px; color:rgba(255,255,255,0.4); font-size:11px; text-transform:uppercase; text-align:right;">Quota</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.length === 0 ? `
                                <tr>
                                    <td colspan="4" style="padding:32px; text-align:center; color:rgba(255,255,255,0.2);">
                                        <i class="ph ph-bus" style="font-size:32px; margin-bottom:8px;"></i>
                                        <p>Nessun trasporto registrato per questo atleta.</p>
                                    </td>
                                </tr>
                            ` : history.map(t => `
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                                    <td style="padding:14px 16px; color:var(--color-white); font-weight:600;">${Utils.escapeHtml(t.destination_name)}</td>
                                    <td style="padding:14px 16px; text-align:center; color:rgba(255,255,255,0.6);">${Utils.formatDate(t.transport_date)}</td>
                                    <td style="padding:14px 16px; text-align:center; color:rgba(255,255,255,0.4); font-size:12px;">${t.departure_time ? t.departure_time.substring(0,5) : '--:--'}</td>
                                    <td style="padding:14px 16px; text-align:right; color:var(--color-success); font-weight:700;">€ ${FEE_PER_TRIP.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Modal: Assegnazione Massiva Quote
     */
    bulkQuotesModal: (teams = []) => {
        return `
            <div id="bulk-quotes-modal" class="modal-overlay" style="display:none; align-items:flex-start; padding-top:5vh;">
                <div class="modal glass-card" style="max-width:800px; width:100%; border:1px solid rgba(255,255,255,0.1); background:#0F1219;">
                    
                    <div style="padding:24px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="font-family:var(--font-display); font-size:24px; font-weight:800; color:var(--color-white); letter-spacing:-0.5px; margin-bottom:4px;">
                                Assegnazione Massiva Quote
                            </h3>
                            <p style="color:var(--color-text-muted); font-size:14px; margin:0;">
                                Seleziona squadra, atlete e imposta gli importi da assegnare.
                            </p>
                        </div>
                        <button id="close-bulk-modal" style="background:none; border:none; color:rgba(255,255,255,0.4); font-size:24px; cursor:pointer;"><i class="ph ph-x"></i></button>
                    </div>

                    <div style="padding:24px;">
                        <!-- Colonna Sinistra: Selezione -->
                        <div style="display:flex; gap:24px; flex-wrap:wrap;">
                            <div style="flex:1; min-width:300px;">
                                <div class="form-group" style="margin-bottom:20px;">
                                    <label class="form-label" style="display:block; margin-bottom:8px; font-size:12px; font-weight:600; color:rgba(255,255,255,0.6); text-transform:uppercase;">
                                        1. Seleziona Squadre
                                    </label>
                                    <select id="bulk-team-select" multiple class="form-input" style="height:120px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); outline:none;">
                                        ${teams.map(t => `<option value="${Utils.escapeHtml(t.id)}">${Utils.escapeHtml(t.season)} — ${Utils.escapeHtml(t.name)}</option>`).join('')}
                                    </select>
                                    <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-top:4px;">Tieni premuto <kbd>Ctrl</kbd> o <kbd>Cmd</kbd> per selezioni multiple</div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" style="display:block; margin-bottom:8px; font-size:12px; font-weight:600; color:rgba(255,255,255,0.6); text-transform:uppercase;">
                                        2. Seleziona Atlete (<span id="bulk-selected-count">0</span>)
                                    </label>
                                    <div id="bulk-athletes-container" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:12px; height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
                                        <div style="color:var(--color-text-muted); font-size:13px; text-align:center; padding:20px;">
                                            Seleziona una o più squadre per visualizzare le atlete.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Colonna Destra: Valori -->
                            <div style="flex:1; min-width:300px; background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                                <label class="form-label" style="display:block; margin-bottom:16px; font-size:12px; font-weight:600; color:var(--color-primary); text-transform:uppercase;">
                                    3. Imposta Quote
                                </label>
                                
                                <div class="form-group" style="margin-bottom:16px;">
                                    <label class="form-label">Quota Iscrizione (Totale) €</label>
                                    <input type="number" id="bulk-quota-iscrizione" class="form-input" placeholder="0" min="0" step="1">
                                    <div style="font-size:11px; color:rgba(255,255,255,0.3); margin-top:4px;">Il sistema dividerà l'importo a metà tra Rata 1 e Rata 2</div>
                                </div>
                                
                                <div class="form-group" style="margin-bottom:16px;">
                                    <label class="form-label">Quota Vestiario €</label>
                                    <input type="number" id="bulk-quota-vestiario" class="form-input" placeholder="0" min="0" step="1">
                                </div>
                                
                                <div class="form-group" style="margin-bottom:16px;">
                                    <label class="form-label">Quota Foresteria €</label>
                                    <input type="number" id="bulk-quota-foresteria" class="form-input" placeholder="0" min="0" step="1">
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label" style="color:var(--color-pink);">Data Scadenza Pagamenti</label>
                                    <input type="date" id="bulk-quota-deadline" class="form-input" style="color:var(--color-white); background:rgba(255,64,129,0.05); border-color:rgba(255,64,129,0.2);">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="padding:20px 24px; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:flex-end; gap:12px; background:rgba(0,0,0,0.2);">
                        <button class="btn btn-ghost" id="cancel-bulk-modal">Annulla</button>
                        <button class="btn btn-primary" id="save-bulk-modal" style="display:flex; align-items:center; gap:8px;">
                            <i class="ph ph-check"></i> <span id="save-bulk-modal-text">Assegna Quote</span>
                        </button>
                    </div>

                </div>
            </div>
        `;
    }
};
