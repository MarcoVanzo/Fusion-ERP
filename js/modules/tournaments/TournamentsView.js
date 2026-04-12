/**
 * Tournaments View Module
 * Fusion ERP v1.1
 */

const TournamentsView = {
    skeleton: () => `
        <div class="transport-dashboard" style="min-height:100vh; padding: 24px;">
            <div id="trm-list-view">
                <div class="dash-top-bar" style="margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h1 class="dash-title"><i class="ph ph-trophy" style="color:#f59e0b;"></i> Tornei</h1>
                        <p class="dash-subtitle">Gestione eventi esterni e quadrangolari</p>
                    </div>
                    <button class="btn-dash pink" id="btn-new-tournament">
                        <i class="ph ph-plus"></i> Nuovo Torneo
                    </button>
                </div>
                <div id="trm-list-content" class="dash-stat-grid">
                    <div style="opacity:0.5; text-align:center; grid-column: 1/-1; padding: 40px;">Caricamento...</div>
                </div>
            </div>
            <div id="trm-detail-view" class="trm-detail-view" style="display:none;"></div>
        </div>
    `,

    list: (tournaments) => {
        if (tournaments.length === 0) {
            return `
                <div style="grid-column: 1/-1; text-align: center; padding: 80px; opacity: 0.5;">
                    <i class="ph ph-trophy" style="font-size: 48px; margin-bottom: 16px; color:#f59e0b;"></i>
                    <h3 style="margin-bottom:8px;">Nessun torneo programmato</h3>
                    <p>Clicca su "Nuovo Torneo" per iniziare a gestire i tuoi eventi.</p>
                </div>
            `;
        }

        return tournaments.map(t => {
            const date = new Date(t.event_date).toLocaleDateString("it-IT", { day: '2-digit', month: 'short', year: 'numeric' });
            return `
                <div class="dash-stat-card trm-card" data-id="${t.id}" style="cursor:pointer; transition: transform 0.2s; position:relative;">
                    <div class="trm-card-actions" style="position:absolute; top:20px; right:20px; display:flex; gap:8px; z-index:10;">
                        <button class="btn-trm-action btn-copy-trm" title="Copia Torneo" data-id="${t.id}" style="background:rgba(255,255,255,0.05); border:none; color:rgba(255,255,255,0.6); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;">
                            <i class="ph ph-copy" style="font-size:18px;"></i>
                        </button>
                        <button class="btn-trm-action btn-delete-trm" title="Elimina Torneo" data-id="${t.id}" style="background:rgba(239,68,68,0.05); border:none; color:#ef4444; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;">
                            <i class="ph ph-trash" style="font-size:18px;"></i>
                        </button>
                    </div>

                    <div style="font-size: 11px; opacity: 0.6; margin-bottom: 8px; text-transform: uppercase; font-weight:700; color:var(--color-pink);">${Utils.escapeHtml(t.team_name)}</div>
                    <h3 style="font-size: 1.25rem; margin-bottom: 12px; line-height:1.2; padding-right:80px;">${Utils.escapeHtml(t.title)}</h3>
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.8; margin-bottom:6px;">
                        <i class="ph ph-calendar"></i> ${date}
                    </div>
                    ${t.location_name ? `
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.8;">
                            <i class="ph ph-map-pin"></i> ${Utils.escapeHtml(t.location_name)}
                        </div>
                    ` : ""}
                    <div class="trm-card-arrow" style="position:absolute; bottom:20px; right:20px; opacity:0; transition:0.2s;">
                        <i class="ph ph-arrow-right" style="font-size:20px;"></i>
                    </div>
                </div>
            `;
        }).join("");
    },

    detail: (data) => {
        const e = data.tournament;
        const date = new Date(e.event_date).toLocaleDateString("it-IT", { day: '2-digit', month: 'long', year: 'numeric' });
        const confirmedRoster = data.roster.filter(t => t.attendance_status === 'confirmed').length;

        return `
            <div class="trm-detail-container">
                <div class="trm-header" style="margin-bottom:32px;">
                    <div style="flex:1;">
                        <button class="btn-dash" id="btn-back-trm" style="margin-bottom: 20px;">
                            <i class="ph ph-arrow-left"></i> Torna ai Tornei
                        </button>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <h1 style="font-size:2rem; margin:0;">${Utils.escapeHtml(e.title)}</h1>
                            <span class="res-badge played" style="background:rgba(245,158,11,0.1); color:#f59e0b; border:1px solid rgba(245,158,11,0.2);">Torneo</span>
                        </div>
                        <div style="opacity: 0.7; margin-top: 8px; font-size:15px;">
                            <strong>${Utils.escapeHtml(e.team_name)}</strong> • ${date}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                        ${e.rooming_list_path ? `
                            <div style="display:flex; align-items:center; gap:8px; background:rgba(16,185,129,0.1); padding:4px 10px; border-radius:100px; border:1px solid rgba(16,185,129,0.2);">
                                <i class="ph ph-check-circle" style="color:#10b981;"></i>
                                <a href="${e.rooming_list_path}" target="_blank" style="color:#10b981; font-size:11px; font-weight:700; text-decoration:none;">VISUALIZZA SALVATA</a>
                            </div>
                        ` : ""}
                        <div style="display:flex; gap:10px;">
                            <button class="btn-dash" id="btn-save-rooming-list" title="Salva versione corrente nel server" style="background:rgba(255,255,255,0.05); color:var(--accent-pink); border:1px solid rgba(255,255,255,0.1);">
                                <i class="ph ph-floppy-disk"></i> Salva PDF
                            </button>
                            <button class="btn-dash" id="btn-rooming-list" title="Genera Rooming List per Hotel" style="background:rgba(255,255,255,0.05); color:var(--color-pink); border:1px solid rgba(255,255,255,0.1);">
                                <i class="ph ph-file-pdf"></i> Rooming List
                            </button>
                            <button class="btn-dash" id="btn-edit-trm">
                                <i class="ph ph-pencil"></i> Modifica
                            </button>
                        </div>
                    </div>
                </div>

                <div id="panel-riepilogo-osti" class="trm-panel active" style="margin-bottom: 40px;">
                    <div style="font-family: var(--font-display); font-size: 14px; font-weight: 800; color: var(--color-pink); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
                        <i class="ph ph-chart-line-up"></i> Riepilogo Economico
                    </div>
                    ${TournamentsView.costsSummary(data)}
                </div>

                <div id="panel-atlete" class="trm-panel active">
                    <div style="font-family: var(--font-display); font-size: 14px; font-weight: 800; color: var(--color-pink); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
                         <i class="ph ph-users"></i> Atlete e Staff (${confirmedRoster}/${data.roster.length})
                    </div>
                    <div class="dash-card" style="padding: 24px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                            <h3 style="margin:0;">Gestione Presenze</h3>
                            <button class="btn-dash pink" id="btn-save-roster">Salva Presenze</button>
                        </div>
                        <div class="trm-roster-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px;">
                            ${data.roster.map(t => TournamentsView.rosterItem(t)).join("")}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    costsSummary: (data) => {
        const e = data.tournament;
        const confirmedAthletes = data.roster.filter(t => t.attendance_status === 'confirmed' && t.member_type === 'athlete').length;
        const totalRevenue = confirmedAthletes * (e.fee_per_athlete || 0);
        const totalExpenses = data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        const netProfit = totalRevenue - totalExpenses;

        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px;">
                <div class="dash-card" style="padding:20px; border-left: 4px solid #10b981;">
                    <div style="font-size:12px; opacity:0.6; text-transform:uppercase; margin-bottom:8px;">Totale Entrate</div>
                    <div style="font-size:24px; font-weight:800; color:#10b981;">${totalRevenue.toFixed(2)} €</div>
                    <div style="font-size:11px; margin-top:4px; opacity:0.5;">${confirmedAthletes} atlete × ${e.fee_per_athlete || 0} €</div>
                </div>
                <div class="dash-card" style="padding:20px; border-left: 4px solid #ef4444;">
                    <div style="font-size:12px; opacity:0.6; text-transform:uppercase; margin-bottom:8px;">Totale Spese</div>
                    <div style="font-size:24px; font-weight:800; color:#ef4444;">${totalExpenses.toFixed(2)} €</div>
                    <div style="font-size:11px; margin-top:4px; opacity:0.5;">${data.expenses.length} voci di spesa</div>
                </div>
                <div class="dash-card" style="padding:20px; border-left: 4px solid #f59e0b;">
                    <div style="font-size:12px; opacity:0.6; text-transform:uppercase; margin-bottom:8px;">Utile Netto</div>
                    <div style="font-size:24px; font-weight:800; color:#f59e0b;">${netProfit.toFixed(2)} €</div>
                    <div style="font-size:11px; margin-top:4px; opacity:0.5;">Margine: ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</div>
                </div>
            </div>

            <div class="dash-card" style="padding: 24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="margin:0;">Elenco Spese</h3>
                    <button class="btn-dash pink" id="btn-add-expense">
                        <i class="ph ph-plus"></i> Aggiungi Spesa
                    </button>
                </div>
                <div class="expense-list">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="text-align:left; border-bottom:1px solid rgba(255,255,255,0.05); opacity:0.6; font-size:12px;">
                                <th style="padding:12px;">DESCRIZIONE</th>
                                <th style="padding:12px; text-align:right;">IMPORTO</th>
                                <th style="padding:12px; width:80px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.expenses.length === 0 ? `
                                <tr>
                                    <td colspan="3" style="padding:40px; text-align:center; opacity:0.4;">Nessuna spesa registrata.</td>
                                </tr>
                            ` : data.expenses.map(exp => `
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
                                    <td style="padding:12px;">${Utils.escapeHtml(exp.description)}</td>
                                    <td style="padding:12px; text-align:right; font-weight:600;">${parseFloat(exp.amount).toFixed(2)} €</td>
                                    <td style="padding:12px; text-align:right;">
                                        <button class="btn-delete-expense" data-id="${exp.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; opacity:0.6;">
                                            <i class="ph ph-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    rosterItem: (t) => {
        const isConfirmed = t.attendance_status === 'confirmed';
        return `
            <div class="trm-roster-card" style="background: rgba(255,255,255,0.03); padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:28px; height:28px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700;">
                        ${t.jersey_number || "-"}
                    </div>
                    <div>
                        <div style="font-weight:600; font-size:14px;">${Utils.escapeHtml(t.full_name)}</div>
                        <div style="font-size:11px; opacity: 0.6; text-transform:uppercase;">${Utils.escapeHtml(t.role || "N/A")}</div>
                    </div>
                </div>
                <label class="fusion-toggle" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                    <input type="checkbox" class="trm-roster-cb" data-id="${t.id}" ${isConfirmed ? "checked" : ""}>
                    <span class="fusion-toggle-slider"></span>
                </label>
            </div>
        `;
    },

    matchItem: (m, teamName) => {
        const date = new Date(m.match_time).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        const win = m.our_score > m.opponent_score;
        const loss = m.our_score < m.opponent_score;
        const color = win ? "#10b981" : (loss ? "#ef4444" : "#fff");

        return `
            <div class="trm-match-item" style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                <div style="flex:1;">
                    <div style="font-size: 11px; opacity:0.6; margin-bottom: 6px; display:flex; align-items:center; gap:6px;">
                        <i class="ph ph-clock"></i> ${date} ${m.court_name ? "• " + Utils.escapeHtml(m.court_name) : ""}
                    </div>
                    <div style="font-size: 1.1rem; display:flex; align-items:center; gap:12px;">
                        <strong style="color:var(--color-pink);">${Utils.escapeHtml(teamName)}</strong>
                        <span style="opacity:0.3; font-size:12px;">VS</span>
                        <strong>${Utils.escapeHtml(m.opponent_name)}</strong>
                    </div>
                </div>
                <div style="text-align: right; min-width:120px;">
                    <div style="font-size: 28px; font-weight: 800; color: ${color}; letter-spacing:2px;">
                        ${m.our_score} - ${m.opponent_score}
                    </div>
                    <button class="btn-dash btn-edit-match" style="padding: 4px 10px; font-size:10px; margin-top: 8px; border-radius:4px;" data-id="${m.id}" data-json='${JSON.stringify(m).replace(/'/g, "&apos;")}'>
                        MODIFICA
                    </button>
                </div>
            </div>
        `;
    },

    tournamentModal: (t, teams) => {
        const teamOptions = teams.map(team => `<option value="${team.team_id || team.id}" ${t && t.team_id == (team.team_id || team.id) ? "selected" : ""}>${Utils.escapeHtml(team.name)}</option>`).join("");
        
        const formatDateTime = (dateStr) => {
            if (!dateStr) return "";
            const d = new Date(dateStr);
            return d.toISOString().slice(0, 16);
        };

        return `
            <div class="res-modal-section" style="padding:0;">
                <input type="hidden" id="tm-id" value="${t ? t.id : ""}">
                <div class="res-form-row">
                    <label class="res-form-label">Squadra *</label>
                    <select id="tm-team" class="res-form-input">
                        <option value="">Seleziona...</option>
                        ${teamOptions}
                    </select>
                </div>
                <div class="res-form-row">
                    <label class="res-form-label">Titolo Torneo *</label>
                    <input type="text" id="tm-title" class="res-form-input" value="${t ? Utils.escapeHtml(t.title) : ""}" placeholder="es. Memorial Bruna Campana">
                </div>
                <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="res-form-row">
                        <label class="res-form-label">Inizio *</label>
                        <input type="datetime-local" id="tm-start" class="res-form-input" value="${formatDateTime(t?.event_date)}">
                    </div>
                    <div class="res-form-row">
                        <label class="res-form-label">Fine</label>
                        <input type="datetime-local" id="tm-end" class="res-form-input" value="${formatDateTime(t?.event_end)}">
                    </div>
                </div>
                <div class="res-form-row">
                    <label class="res-form-label">Luogo (Città / Impianto)</label>
                    <input type="text" id="tm-loc" class="res-form-input" value="${t ? Utils.escapeHtml(t.location_name || "") : ""}" placeholder="es. Bassano del Grappa">
                </div>
                <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="res-form-row">
                        <label class="res-form-label">Sito Web</label>
                        <input type="url" id="tm-url" class="res-form-input" value="${t ? Utils.escapeHtml(t.website_url || "") : ""}" placeholder="https://...">
                    </div>
                    <div class="res-form-row">
                        <label class="res-form-label">Quota Atleta (€)</label>
                        <input type="number" step="0.01" id="tm-fee" class="res-form-input" value="${t ? t.fee_per_athlete : 0}">
                    </div>
                </div>
                <div class="res-form-row">
                    <label class="res-form-label">Note / Alloggio</label>
                    <textarea id="tm-notes" class="res-form-input" style="min-height:80px; resize:vertical;">${t ? Utils.escapeHtml(t.accommodation_info || "") : ""}</textarea>
                </div>
            </div>
        `;
    },

    expenseModal: () => `
        <div class="res-modal-section" style="padding:0;">
            <div class="res-form-row">
                <label class="res-form-label">Descrizione Spesa *</label>
                <input type="text" id="ex-desc" class="res-form-input" placeholder="es. Iscrizione Torneo, Hotel, Trasporto...">
            </div>
            <div class="res-form-row">
                <label class="res-form-label">Importo (€) *</label>
                <input type="number" step="0.01" id="ex-amount" class="res-form-input" value="0.00">
            </div>
        </div>
    `,

    matchModal: (m) => {
        const formatDateTime = (dateStr) => {
            if (!dateStr) return "";
            const d = new Date(dateStr);
            return d.toISOString().slice(0, 16);
        };

        return `
            <div class="res-modal-section" style="padding:0;">
                <input type="hidden" id="mm-id" value="${m ? m.id : ""}">
                <div class="res-form-row">
                    <label class="res-form-label">Avversario *</label>
                    <input type="text" id="mm-opp" class="res-form-input" value="${m ? Utils.escapeHtml(m.opponent_name) : ""}" placeholder="es. Imoco Conegliano">
                </div>
                <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="res-form-row">
                        <label class="res-form-label">Data e Ora *</label>
                        <input type="datetime-local" id="mm-time" class="res-form-input" value="${formatDateTime(m?.match_time)}">
                    </div>
                    <div class="res-form-row">
                        <label class="res-form-label">Campo / Palestra</label>
                        <input type="text" id="mm-court" class="res-form-input" value="${m ? Utils.escapeHtml(m.court_name || "") : ""}">
                    </div>
                </div>
                <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="res-form-row">
                        <label class="res-form-label">Ns. Punteggio</label>
                        <input type="number" id="mm-our" class="res-form-input" value="${m ? m.our_score : 0}">
                    </div>
                    <div class="res-form-row">
                        <label class="res-form-label">Pt. Avversario</label>
                        <input type="number" id="mm-opps" class="res-form-input" value="${m ? m.opponent_score : 0}">
                    </div>
                </div>
            </div>
        `;
    }
};

export default TournamentsView;
