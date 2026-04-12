/**
 * Tournaments View Module
 * Fusion ERP v1.2 — UX Redesign
 * 
 * Redesigned for clarity: card badges, tab-based detail, clean CSS classes
 */

const TournamentsView = {
    skeleton: () => `
        <div class="transport-dashboard" style="min-height:100vh; padding: 24px;">
            <div id="trm-list-view">
                <div class="dash-top-bar">
                    <div>
                        <h1 class="dash-title"><i class="ph ph-trophy" style="color:#f59e0b;"></i> Tornei</h1>
                        <p class="dash-subtitle">Gestione eventi esterni e quadrangolari</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
                        <div class="trm-filters" id="trm-filters">
                            <button class="trm-filter-pill active" data-filter="upcoming">Prossimi</button>
                            <button class="trm-filter-pill" data-filter="past">Passati</button>
                            <button class="trm-filter-pill" data-filter="all">Tutti</button>
                        </div>
                        <button class="btn-dash pink" id="btn-new-tournament">
                            <i class="ph ph-plus"></i> Nuovo Torneo
                        </button>
                    </div>
                </div>
                <div id="trm-list-content" class="dash-stat-grid">
                    <div style="opacity:0.5; text-align:center; grid-column: 1/-1; padding: 40px;">Caricamento...</div>
                </div>
            </div>
            <div id="trm-detail-view" class="trm-detail-view" style="display:none;"></div>
        </div>
    `,

    /**
     * Compute tournament status based on dates
     */
    _getStatus: (t) => {
        const now = new Date();
        const start = new Date(t.event_date);
        const end = t.event_end ? new Date(t.event_end) : null;

        if (end && now >= start && now <= end) return 'ongoing';
        if (now < start) return 'upcoming';
        return 'past';
    },

    _statusLabel: (status) => {
        switch (status) {
            case 'upcoming': return '<i class="ph ph-clock"></i> Prossimo';
            case 'ongoing':  return '<i class="ph ph-lightning"></i> In Corso';
            case 'past':     return '<i class="ph ph-check"></i> Terminato';
            default: return '';
        }
    },

    list: (tournaments, filter = 'upcoming') => {
        // Filter tournaments
        let filtered = tournaments;
        if (filter !== 'all') {
            filtered = tournaments.filter(t => TournamentsView._getStatus(t) === filter);
        }

        if (filtered.length === 0) {
            const emptyMsg = filter === 'upcoming'
                ? 'Nessun torneo in programma'
                : filter === 'past'
                    ? 'Nessun torneo passato'
                    : 'Nessun torneo registrato';
            return `
                <div class="trm-empty">
                    <div class="trm-empty-icon"><i class="ph ph-trophy"></i></div>
                    <h3>${emptyMsg}</h3>
                    <p>Clicca su "Nuovo Torneo" per iniziare a gestire i tuoi eventi.</p>
                </div>
            `;
        }

        return filtered.map(t => {
            const date = new Date(t.event_date).toLocaleDateString("it-IT", { day: '2-digit', month: 'short', year: 'numeric' });
            const status = TournamentsView._getStatus(t);
            const fee = parseFloat(t.fee_per_athlete || 0);
            const confirmed = parseInt(t.confirmed_count || 0);
            const total = parseInt(t.roster_count || 0);
            const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

            return `
                <div class="dash-stat-card trm-card" data-id="${t.id}">
                    <div class="trm-card-actions">
                        <button class="trm-card-action btn-copy-trm" title="Duplica Torneo" data-id="${t.id}">
                            <i class="ph ph-copy"></i>
                        </button>
                        <button class="trm-card-action danger btn-delete-trm" title="Elimina Torneo" data-id="${t.id}">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>

                    <div class="trm-card-team">${Utils.escapeHtml(t.team_name)}</div>
                    <h3 class="trm-card-title">${Utils.escapeHtml(t.title)}</h3>
                    
                    <div class="trm-card-meta">
                        <div class="trm-card-meta-item">
                            <i class="ph ph-calendar-blank"></i>
                            <span>${date}</span>
                            <span class="trm-badge ${status}">${TournamentsView._statusLabel(status)}</span>
                        </div>
                        ${t.location_name ? `
                            <div class="trm-card-meta-item">
                                <i class="ph ph-map-pin"></i> ${Utils.escapeHtml(t.location_name)}
                            </div>
                        ` : ""}
                    </div>

                    <div class="trm-card-footer">
                        ${total > 0 ? `
                            <div class="trm-progress-wrap">
                                <div class="trm-progress-label">
                                    <i class="ph ph-users"></i> ${confirmed}/${total} convocate
                                </div>
                                <div class="trm-progress-bar">
                                    <div class="trm-progress-fill" style="width:${pct}%"></div>
                                </div>
                            </div>
                        ` : `
                            <div class="trm-progress-wrap">
                                <div class="trm-progress-label"><i class="ph ph-users"></i> Roster non impostato</div>
                            </div>
                        `}
                        ${fee > 0 ? `
                            <div class="trm-card-fee"><span>${fee.toFixed(0)} €</span> / atleta</div>
                        ` : ""}
                    </div>

                    <div class="trm-card-arrow"><i class="ph ph-arrow-right"></i></div>
                </div>
            `;
        }).join("");
    },

    detail: (data) => {
        const e = data.tournament;
        const date = new Date(e.event_date).toLocaleDateString("it-IT", { day: '2-digit', month: 'long', year: 'numeric' });
        const endDate = e.event_end ? new Date(e.event_end).toLocaleDateString("it-IT", { day: '2-digit', month: 'long', year: 'numeric' }) : null;
        const status = TournamentsView._getStatus(e);
        const confirmedRoster = data.roster.filter(t => t.attendance_status === 'confirmed').length;
        const fee = parseFloat(e.fee_per_athlete || 0);

        return `
            <div class="trm-detail-container">
                <!-- HEADER -->
                <div class="trm-detail-header">
                    <button class="trm-detail-back" id="btn-back-trm">
                        <i class="ph ph-arrow-left"></i> Torna ai Tornei
                    </button>
                    <div class="trm-detail-title-row">
                        <div class="trm-detail-title-left">
                            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                <h1>${Utils.escapeHtml(e.title)}</h1>
                                <span class="trm-badge ${status}">${TournamentsView._statusLabel(status)}</span>
                            </div>
                            <div style="font-size:13px; color:rgba(255,255,255,0.5);">
                                <strong>${Utils.escapeHtml(e.team_name)}</strong>
                            </div>
                        </div>
                        <button class="btn-dash" id="btn-edit-trm">
                            <i class="ph ph-pencil"></i> Modifica
                        </button>
                    </div>
                </div>

                <!-- INFO BAR -->
                <div class="trm-info-bar">
                    <div class="trm-info-item">
                        <i class="ph ph-calendar-blank"></i>
                        ${date}${endDate && endDate !== date ? ` — ${endDate}` : ''}
                    </div>
                    ${e.location_name ? `
                        <div class="trm-info-divider"></div>
                        <div class="trm-info-item">
                            <i class="ph ph-map-pin"></i> ${Utils.escapeHtml(e.location_name)}
                        </div>
                    ` : ''}
                    ${e.website_url ? `
                        <div class="trm-info-divider"></div>
                        <div class="trm-info-item">
                            <i class="ph ph-globe"></i>
                            <a href="${Utils.escapeHtml(e.website_url)}" target="_blank" rel="noopener">Sito Web</a>
                        </div>
                    ` : ''}
                    ${fee > 0 ? `
                        <div class="trm-info-divider"></div>
                        <div class="trm-info-item">
                            <i class="ph ph-currency-eur"></i>
                            <strong style="color:#f59e0b;">${fee.toFixed(2)} €</strong> / atleta
                        </div>
                    ` : ''}
                    <div class="trm-info-divider"></div>
                    <div class="trm-info-item">
                        <i class="ph ph-users"></i>
                        <strong>${confirmedRoster}</strong>/${data.roster.length} confermate
                    </div>
                </div>

                <!-- TABS -->
                <div class="trm-tabs" id="trm-tabs">
                    <button class="trm-tab active" data-tab="riepilogo">
                        <i class="ph ph-chart-line-up"></i> Riepilogo
                    </button>
                    <button class="trm-tab" data-tab="convocazioni">
                        <i class="ph ph-users"></i> Convocazioni
                    </button>
                    <button class="trm-tab" data-tab="documenti">
                        <i class="ph ph-file-pdf"></i> Documenti
                    </button>
                </div>

                <!-- TAB: RIEPILOGO -->
                <div class="trm-tab-panel active" data-panel="riepilogo">
                    ${TournamentsView.costsSummary(data)}
                </div>

                <!-- TAB: CONVOCAZIONI -->
                <div class="trm-tab-panel" data-panel="convocazioni">
                    ${TournamentsView.rosterPanel(data)}
                </div>

                <!-- TAB: DOCUMENTI -->
                <div class="trm-tab-panel" data-panel="documenti">
                    ${TournamentsView.documentsPanel(data, e)}
                </div>
            </div>
        `;
    },

    costsSummary: (data) => {
        const e = data.tournament;
        const fee = parseFloat(e.fee_per_athlete || 0);
        const confirmedAthletes = data.roster.filter(t => t.attendance_status === 'confirmed' && t.member_type === 'athlete').length;
        const totalRevenue = confirmedAthletes * fee;
        const totalExpenses = data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        const netProfit = totalRevenue - totalExpenses;
        const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

        return `
            <!-- Financial Cards -->
            <div class="trm-finance-grid">
                <div class="trm-finance-card revenue">
                    <div class="trm-finance-label">Totale Entrate</div>
                    <div class="trm-finance-value">${totalRevenue.toFixed(2)} €</div>
                    <div class="trm-finance-sub">${confirmedAthletes} atlete × ${fee.toFixed(2)} €</div>
                </div>
                <div class="trm-finance-card expense">
                    <div class="trm-finance-label">Totale Spese</div>
                    <div class="trm-finance-value">${totalExpenses.toFixed(2)} €</div>
                    <div class="trm-finance-sub">${data.expenses?.length || 0} voci di spesa</div>
                </div>
                <div class="trm-finance-card profit">
                    <div class="trm-finance-label">Utile Netto</div>
                    <div class="trm-finance-value">${netProfit.toFixed(2)} €</div>
                    <div class="trm-finance-sub">Margine: ${margin}%</div>
                </div>
            </div>

            <!-- Expenses Table -->
            <div class="trm-expense-section">
                <div class="trm-section-header">
                    <div class="trm-section-title">
                        <i class="ph ph-receipt"></i> Dettaglio Spese
                    </div>
                    <button class="btn-dash pink" id="btn-add-expense" style="padding:8px 16px; font-size:12px;">
                        <i class="ph ph-plus"></i> Aggiungi Spesa
                    </button>
                </div>
                <table class="trm-expense-table">
                    <thead>
                        <tr>
                            <th>Descrizione</th>
                            <th style="text-align:right;">Importo</th>
                            <th style="width:50px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.expenses.length === 0 ? `
                            <tr>
                                <td colspan="3" style="padding:40px; text-align:center; opacity:0.35; font-size:13px;">
                                    <i class="ph ph-receipt" style="font-size:24px; display:block; margin-bottom:8px;"></i>
                                    Nessuna spesa registrata
                                </td>
                            </tr>
                        ` : data.expenses.map(exp => `
                            <tr>
                                <td>${Utils.escapeHtml(exp.description)}</td>
                                <td class="trm-expense-amount">${parseFloat(exp.amount).toFixed(2)} €</td>
                                <td style="text-align:right;">
                                    <button class="trm-expense-delete btn-delete-expense" data-id="${exp.id}">
                                        <i class="ph ph-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    },

    rosterPanel: (data) => {
        const confirmedRoster = data.roster.filter(t => t.attendance_status === 'confirmed').length;
        return `
            <div class="trm-roster-section">
                <div class="trm-section-header">
                    <div class="trm-section-title">
                        <i class="ph ph-users-three"></i>
                        Gestione Presenze
                        <span style="font-size:12px; opacity:0.5; font-weight:400; margin-left:4px;">(${confirmedRoster}/${data.roster.length})</span>
                    </div>
                    <button class="btn-dash pink" id="btn-save-roster" style="padding:8px 16px; font-size:12px;">
                        <i class="ph ph-floppy-disk"></i> Salva Presenze
                    </button>
                </div>
                <div class="trm-roster-grid">
                    ${data.roster.map(t => TournamentsView.rosterItem(t)).join("")}
                </div>
            </div>
        `;
    },

    rosterItem: (t) => {
        const isConfirmed = t.attendance_status === 'confirmed';
        return `
            <div class="trm-roster-card">
                <div class="trm-roster-left">
                    <div class="trm-roster-number">${t.jersey_number || "-"}</div>
                    <div>
                        <div class="trm-roster-name">${Utils.escapeHtml(t.full_name)}</div>
                        <div class="trm-roster-role">${Utils.escapeHtml(t.role || "N/A")}</div>
                    </div>
                </div>
                <label class="trm-toggle">
                    <input type="checkbox" class="trm-roster-cb" data-id="${t.id}" ${isConfirmed ? "checked" : ""}>
                    <span class="trm-toggle-slider"></span>
                </label>
            </div>
        `;
    },

    documentsPanel: (data, e) => {
        return `
            <div class="trm-docs-grid">
                <!-- Rooming List -->
                <div class="trm-doc-card">
                    <div class="trm-doc-icon rooming">
                        <i class="ph ph-bed"></i>
                    </div>
                    <div class="trm-doc-title">Rooming List</div>
                    <div class="trm-doc-desc">Lista stanze per l'hotel con assegnazione atleti e staff</div>
                    ${e.rooming_list_path ? `
                        <div class="trm-doc-saved">
                            <i class="ph ph-check-circle"></i> Salvata nel server
                        </div>
                    ` : ''}
                    <div class="trm-doc-actions">
                        ${e.rooming_list_path ? `
                            <button class="trm-doc-btn" onclick="UI.openPdf('${e.rooming_list_path}', 'Rooming List salvata')">
                                <i class="ph ph-eye"></i> Visualizza
                            </button>
                        ` : ''}
                        <button class="trm-doc-btn" id="btn-save-rooming-list">
                            <i class="ph ph-floppy-disk"></i> Salva
                        </button>
                        <button class="trm-doc-btn primary" id="btn-rooming-list">
                            <i class="ph ph-download"></i> Scarica PDF
                        </button>
                    </div>
                </div>

                <!-- Dossier Torneo -->
                <div class="trm-doc-card">
                    <div class="trm-doc-icon dossier">
                        <i class="ph ph-clipboard-text"></i>
                    </div>
                    <div class="trm-doc-title">Dossier Torneo</div>
                    <div class="trm-doc-desc">Resoconto completo con riepilogo economico, presenze e spese</div>
                    ${e.summary_pdf_path ? `
                        <div class="trm-doc-saved">
                            <i class="ph ph-check-circle"></i> Salvato nel server
                        </div>
                    ` : ''}
                    <div class="trm-doc-actions">
                        ${e.summary_pdf_path ? `
                            <button class="trm-doc-btn" onclick="UI.openPdf('${e.summary_pdf_path}', 'Dossier Torneo')">
                                <i class="ph ph-eye"></i> Visualizza
                            </button>
                        ` : ''}
                        <button class="trm-doc-btn" id="btn-save-summary">
                            <i class="ph ph-floppy-disk"></i> Salva
                        </button>
                        <button class="trm-doc-btn primary" id="btn-summary-pdf">
                            <i class="ph ph-download"></i> Scarica PDF
                        </button>
                    </div>
                </div>
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
