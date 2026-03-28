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
                <div class="dash-stat-card trm-card" data-id="${t.id}" style="cursor:pointer; transition: transform 0.2s;">
                    <div style="font-size: 11px; opacity: 0.6; margin-bottom: 8px; text-transform: uppercase; font-weight:700; color:var(--color-pink);">${Utils.escapeHtml(t.team_name)}</div>
                    <h3 style="font-size: 1.25rem; margin-bottom: 12px; line-height:1.2;">${Utils.escapeHtml(t.title)}</h3>
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
                    <div style="display:flex; gap:10px; align-items:flex-end;">
                        <button class="btn-dash" id="btn-edit-trm">
                            <i class="ph ph-pencil"></i> Modifica
                        </button>
                    </div>
                </div>

                <div class="res-view-selector" style="display:flex; gap:10px; margin-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:12px;">
                    <button class="res-view-btn active" data-target="panel-overview">OVERVIEW</button>
                    <button class="res-view-btn" data-target="panel-roster">ROSTER (${confirmedRoster}/${data.roster.length})</button>
                    <button class="res-view-btn" data-target="panel-matches">PARTITE (${data.matches.length})</button>
                </div>

                <div id="panel-overview" class="trm-panel active">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <div class="dash-card" style="padding: 24px;">
                            <h4 style="color: #f59e0b; margin-bottom: 20px; display:flex; align-items:center; gap:8px;">
                                <i class="ph ph-info"></i> Dettagli Logistici
                            </h4>
                            <div style="display:flex; flex-direction:column; gap:12px;">
                                <p><strong>Luogo:</strong> ${Utils.escapeHtml(e.location_name || "Non specificato")}</p>
                                <p><strong>Quota Atleta:</strong> ${e.fee_per_athlete > 0 ? e.fee_per_athlete + " €" : "Gratuito"}</p>
                                ${e.website_url ? `<p><strong>Sito Web:</strong> <a href="${Utils.escapeHtml(e.website_url)}" target="_blank" style="color:var(--color-pink);text-decoration:underline;">${Utils.escapeHtml(e.website_url)}</a></p>` : ""}
                            </div>
                        </div>
                        <div class="dash-card" style="padding: 24px;">
                            <h4 style="color: #f59e0b; margin-bottom: 20px; display:flex; align-items:center; gap:8px;">
                                <i class="ph ph-note"></i> Note / Alloggio
                            </h4>
                            <div style="white-space: pre-wrap; opacity: 0.8; font-size: 14px; line-height:1.6;">${Utils.escapeHtml(e.accommodation_info || "Nessuna informazione aggiuntiva.")}</div>
                        </div>
                    </div>
                </div>

                <div id="panel-roster" class="trm-panel">
                    <div class="dash-card" style="padding: 24px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                            <h3>Convocazioni Atlete</h3>
                            <button class="btn-dash pink" id="btn-save-roster">Salva Roster</button>
                        </div>
                        <div class="trm-roster-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px;">
                            ${data.roster.map(t => TournamentsView.rosterItem(t)).join("")}
                        </div>
                    </div>
                </div>

                <div id="panel-matches" class="trm-panel">
                    <div class="dash-card" style="padding: 24px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                            <h3>Calendario e Risultati</h3>
                            <button class="btn-dash pink" id="btn-add-match">Aggiungi Partita</button>
                        </div>
                        <div id="trm-matches-list" style="display:flex; flex-direction:column; gap:16px;">
                            ${data.matches.length === 0 ? '<div style="opacity:0.5; padding:40px; text-align:center;">Nessuna partita aggiunta.</div>' : ""}
                            ${data.matches.map(m => TournamentsView.matchItem(m, e.team_name)).join("")}
                        </div>
                    </div>
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
        const teamOptions = teams.map(team => `<option value="${team.id}" ${t && t.team_id === team.id ? "selected" : ""}>${Utils.escapeHtml(team.name)}</option>`).join("");
        
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
