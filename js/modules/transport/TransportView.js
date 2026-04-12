/**
 * Transport View Module
 * Contains all the template literals and UI rendering functions for the Transport module.
 * Fusion ERP v1.0
 */

const TransportView = {
    renderDashboard: (events, stats, isAdmin, upcoming, past) => {
        const { total, upcoming: upcomingCount, past: pastCount } = stats;
        return `
            <div class="transport-dashboard">
                <div class="dash-top-bar">
                    <div>
                        <h1 class="dash-title">Gestione <span style="color:var(--accent-pink);">Trasporti</span></h1>
                        <p class="dash-subtitle">${total} viaggi nel sistema</p>
                    </div>
                    <div style="display:flex; gap:12px; flex-wrap:wrap;">
                        <button class="btn-dash pink" id="nuovo-trasporto-btn" type="button"><i class="ph ph-van" style="font-size:18px;"></i> NUOVO TRASPORTO</button>
                        ${isAdmin ? '<button class="btn-dash primary" id="new-event-btn" type="button"><i class="ph ph-plus-circle" style="font-size:20px;"></i> NUOVO EVENTO</button>' : ""}
                    </div>
                </div>

                <div class="dash-stat-grid">
                    <div class="dash-stat-card">
                        <div class="dash-stat-title">Viaggi Totale <div class="dash-stat-icon"><i class="ph ph-van"></i></div></div>
                        <div class="dash-stat-value">${total}</div>
                    </div>
                    <div class="dash-stat-card cyan">
                        <div class="dash-stat-title">Viaggi Programmati <div class="dash-stat-icon"><i class="ph ph-clock"></i></div></div>
                        <div class="dash-stat-value">${upcomingCount}</div>
                    </div>
                    <div class="dash-stat-card">
                        <div class="dash-stat-title">Viaggi Effettuati <div class="dash-stat-icon"><i class="ph ph-check-circle"></i></div></div>
                        <div class="dash-stat-value">${pastCount}</div>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:28px;">
                    <div class="dash-card cyan">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><i class="ph ph-road-horizon" style="color:var(--accent-cyan); margin-right:8px;"></i>PROSSIMI VIAGGI</div>
                            <div class="dash-card-dots"><i class="ph ph-dots-three-bold"></i></div>
                        </div>
                        <div id="upcoming-trips-list" style="max-height:420px; overflow-y:auto; padding-right:4px;">
                            ${upcoming.length === 0 ? TransportView._emptyTrips() : upcoming.map(tr => TransportView.renderTripCard(tr)).join("")}
                        </div>
                    </div>
                    <div class="dash-card">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><i class="ph ph-clock-counter-clockwise" style="color:var(--accent-pink); margin-right:8px;"></i>STORICO VIAGGI</div>
                            <div class="dash-card-dots"><i class="ph ph-dots-three-bold"></i></div>
                        </div>
                        <div id="past-trips-list" style="max-height:420px; overflow-y:auto; padding-right:4px;">
                            ${past.length === 0 ? TransportView._emptyArchive() : past.map(tr => TransportView.renderTripCard(tr)).join("")}
                        </div>
                    </div>
                </div>
            </div>`;
    },

    renderTripCard: (tr) => {
        let ath = [];
        try { ath = typeof tr.athletes_json === "string" ? JSON.parse(tr.athletes_json) : tr.athletes_json || []; } catch { ath = []; }
        let stats = {};
        try { stats = typeof tr.stats_json === "string" ? JSON.parse(tr.stats_json) : tr.stats_json || {}; } catch { stats = {}; }
        const dateStr = tr.transport_date ? new Date(tr.transport_date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }).toUpperCase() : "";

        return `
            <div class="st-card" style="cursor:default;">
                <div class="st-card-title"><i class="ph ph-map-pin" style="margin-right:8px;"></i>${Utils.escapeHtml(tr.destination_name)}</div>
                <div class="st-card-meta">
                    <span><i class="ph ph-calendar-blank"></i> ${Utils.escapeHtml(dateStr)}</span>
                    <span><i class="ph ph-clock"></i> Arrivo: ${Utils.escapeHtml(tr.arrival_time || "")}</span>
                    ${tr.departure_time ?`<span><i class="ph ph-van"></i> Partenza: ${Utils.escapeHtml(tr.departure_time)}</span>`: ""}
                    ${stats.durata ?`<span><i class="ph ph-timer"></i> ${Utils.escapeHtml(stats.durata)}</span>`: ""}
                    ${stats.distanza ?`<span><i class="ph ph-navigation-arrow"></i> ${Utils.escapeHtml(stats.distanza)}</span>`: ""}
                    ${stats.driver_name ?`<span><i class="ph ph-steering-wheel"></i> ${Utils.escapeHtml(stats.driver_name)}</span>`: ""}
                    ${stats.vehicle_name ?`<span><i class="ph ph-bus"></i> ${Utils.escapeHtml(stats.vehicle_name)}</span>`: ""}
                </div>
                <div class="st-card-athletes">
                    <i class="ph ph-users" style="margin-right:4px;"></i>
                    ${ath.map(a => Utils.escapeHtml(a.name || a.full_name || "")).join(", ") || "Nessuna atleta"}
                </div>
                <div style="margin-top:12px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.1);">
                    <button class="btn-dash ai-consult-btn" data-transport-id="${Utils.escapeHtml(tr.id)}" type="button" style="background:linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15)); border-color:rgba(139,92,246,0.4); color:#a78bfa; padding:8px 16px; font-size:11px;">
                        <i class="ph ph-brain" style="font-size:16px;"></i> CONSULTA AI
                    </button>
                    ${tr.pdf_reimbursement ? `<button class="btn-dash" style="padding:8px 16px; font-size:11px;" onclick="window.open('/storage/reimbursements/${tr.pdf_reimbursement}', '_blank')"><i class="ph ph-file-pdf"></i> PDF</button>` : ""}
                </div>
            </div>`;
    },

    _emptyTrips: () => `
        <div style="text-align:center; padding:40px 20px; color:rgba(255,255,255,0.4);">
            <i class="ph ph-van" style="font-size:48px; display:block; margin-bottom:12px; opacity:0.3;"></i>
            <p style="font-family:var(--font-display); font-size:15px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Nessun viaggio in programma</p>
            <p style="margin-top:8px; font-size:13px;">Crea un nuovo trasporto per vederlo qui.</p>
        </div>`,

    _emptyArchive: () => `
        <div style="text-align:center; padding:40px 20px; color:rgba(255,255,255,0.4);">
            <i class="ph ph-archive" style="font-size:48px; display:block; margin-bottom:12px; opacity:0.3;"></i>
            <p style="font-family:var(--font-display); font-size:15px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Nessun viaggio passato</p>
        </div>`,

    driversDashboard: (drivers, isAdmin) => {
        return `
            <div class="drv-page">
                <div class="drv-top">
                    <div class="drv-title">
                        <button class="btn-dash" id="drv-back" type="button" style="padding:10px; -webkit-text-fill-color:unset; font-size:14px;"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>
                        Gestione <span style="color:#00e5ff;">Autisti</span>
                    </div>
                    ${isAdmin ? '<button class="btn-dash primary" id="drv-add-btn" type="button"><i class="ph ph-plus-circle" style="font-size:18px;"></i> AGGIUNGI AUTISTA</button>' : ""}
                </div>
                <div id="drv-list">
                    ${drivers.length === 0 ? 
                        Utils.emptyState("Nessun autista registrato", "Aggiungi il primo autista per iniziare.") : 
                        '<div class="drv-grid">' + drivers.map(d => TransportView.renderDriverCard(d, isAdmin)).join("") + '</div>'
                    }
                </div>
            </div>`;
    },

    renderDriverCard: (t, isAdmin) => {
        const isActive = !!t.is_active;
        const totalMinutes = parseInt(t.total_minutes || 0);
        const hourlyRate = parseFloat(t.hourly_rate || 0);
        const compenso = (totalMinutes / 60) * hourlyRate;
        return `
            <div class="drv-card ${isActive ? "" : "inactive"}" data-driver-id="${Utils.escapeHtml(t.id)}">
                <div style="display:flex; gap:16px; align-items:flex-start;">
                    <div class="drv-avatar" data-driver-detail="${Utils.escapeHtml(t.id)}" style="cursor:pointer;"><i class="ph ph-steering-wheel"></i></div>
                    <div style="flex:1; min-width:0;">
                        <div class="drv-name" data-driver-detail="${Utils.escapeHtml(t.id)}" style="cursor:pointer;">${Utils.escapeHtml(t.full_name)}</div>
                        <div class="drv-meta">
                            ${t.phone ? `<span><i class="ph ph-phone"></i>${Utils.escapeHtml(t.phone)}</span>` : ""}
                            ${t.license_number ? `<span><i class="ph ph-identification-card"></i>Patente: ${Utils.escapeHtml(t.license_number)}</span>` : ""}
                            ${t.hourly_rate ? `<span><i class="ph ph-currency-eur"></i>${Utils.formatCurrency(t.hourly_rate)}/h</span>` : ""}
                            ${t.notes ? `<span style="margin-top:4px; color:rgba(255,255,255,0.35); font-size:12px;"><i class="ph ph-note"></i>${Utils.escapeHtml(t.notes)}</span>` : ""}
                            <span style="margin-top:4px; padding:4px 8px; border-radius:6px; background:rgba(236,72,153,0.15); color:var(--accent-pink); font-weight:700; border:1px solid rgba(236,72,153,0.3);"><i class="ph ph-wallet"></i> Maturato: ${Utils.formatCurrency(compenso)} (${totalMinutes} min)</span>
                        </div>
                        <span class="drv-badge ${isActive ? "active" : "inactive"}">
                            <i class="ph ${isActive ? "ph-check-circle" : "ph-pause-circle"}"></i>
                            ${isActive ? "Attivo" : "Non Attivo"}
                        </span>
                    </div>
                </div>
                ${isAdmin ? `
                <div class="drv-actions">
                    <button class="btn-drv" data-driver-detail="${Utils.escapeHtml(t.id)}" type="button">
                        <i class="ph ph-eye"></i> Dettaglio
                    </button>
                    <button class="btn-drv" data-driver-edit="${Utils.escapeHtml(t.id)}" type="button">
                        <i class="ph ph-pencil-simple"></i> Modifica
                    </button>
                    <button class="btn-drv" data-driver-toggle="${Utils.escapeHtml(t.id)}" data-driver-active="${isActive ? "1" : "0"}" type="button">
                        <i class="ph ${isActive ? "ph-pause" : "ph-play"}"></i> ${isActive ? "Disattiva" : "Attiva"}
                    </button>
                    <button class="btn-drv danger" data-driver-delete="${Utils.escapeHtml(t.id)}" type="button">
                        <i class="ph ph-trash"></i> Elimina
                    </button>
                </div>` : ""}
            </div>`;
    },

    renderDriverDetail: (driver, transports) => {
        const totalMinutes = parseInt(driver.total_minutes || 0);
        const hourlyRate = parseFloat(driver.hourly_rate || 0);
        const compenso = (totalMinutes / 60) * hourlyRate;
        const initials = (driver.full_name || "").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

        return `
            <div class="drv-page">
                <div class="drv-top">
                    <div class="drv-title">
                        <button class="btn-dash" id="drv-detail-back" type="button" style="padding:10px; -webkit-text-fill-color:unset; font-size:14px;"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>
                        Dettaglio <span style="color:#00e5ff;">Autista</span>
                    </div>
                </div>

                <div class="dash-grid" style="margin-top:24px;">
                    <!-- Profilo Autista -->
                    <div class="dash-card cyan" style="grid-column: 1 / 2;">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><i class="ph ph-user-circle" style="color:var(--accent-cyan); margin-right:8px;"></i>INFORMAZIONI</div>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:center; padding:24px 0;">
                            <div style="width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,0.05); border:2px solid var(--accent-cyan); display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:800; color:var(--accent-cyan); margin-bottom:16px;">${initials}</div>
                            <h2 style="font-size:22px; margin-bottom:4px;">${Utils.escapeHtml(driver.full_name)}</h2>
                            <span class="drv-badge ${driver.is_active ? "active" : "inactive"}">${driver.is_active ? "Attivo" : "Non Attivo"}</span>
                        </div>
                        <div style="padding-top:20px; border-top:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:16px;">
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:rgba(255,255,255,0.4); font-size:13px;">Telefono</span>
                                <span style="font-weight:600;">${Utils.escapeHtml(driver.phone || "-")}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:rgba(255,255,255,0.4); font-size:13px;">Patente</span>
                                <span style="font-weight:600;">${Utils.escapeHtml(driver.license_number || "-")}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:rgba(255,255,255,0.4); font-size:13px;">Tariffa</span>
                                <span style="font-weight:600;">${Utils.formatCurrency(driver.hourly_rate)}/h</span>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <span style="color:rgba(255,255,255,0.4); font-size:13px;">Note</span>
                                <p style="font-size:13px; color:rgba(255,255,255,0.8);">${Utils.escapeHtml(driver.notes || "Nessuna nota")}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Riepilogo Finanziario -->
                    <div class="dash-card pink" style="grid-column: 2 / -1;">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><i class="ph ph-wallet" style="color:var(--accent-pink); margin-right:8px;"></i>RIEPILOGO MATURATO</div>
                        </div>
                        <div style="display:flex; gap:24px; margin-top:16px;">
                            <div style="flex:1; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:20px; border-radius:16px; text-align:center;">
                                <div style="font-size:12px; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:8px;">Totale Compenso</div>
                                <div style="font-family:var(--font-display); font-size:32px; font-weight:800; color:var(--accent-pink);">${Utils.formatCurrency(compenso)}</div>
                            </div>
                            <div style="flex:1; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:20px; border-radius:16px; text-align:center;">
                                <div style="font-size:12px; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:8px;">Tempo Totale</div>
                                <div style="font-family:var(--font-display); font-size:32px; font-weight:800; color:var(--accent-cyan);">${totalMinutes} <span style="font-size:14px; opacity:0.6;">min</span></div>
                            </div>
                            <div style="flex:1; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:20px; border-radius:16px; text-align:center;">
                                <div style="font-size:12px; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:8px;">Totale Viaggi</div>
                                <div style="font-family:var(--font-display); font-size:32px; font-weight:800;">${transports.length}</div>
                            </div>
                        </div>

                        <!-- Storico Viaggi -->
                        <div style="margin-top:32px;">
                            <div style="font-family:var(--font-display); font-size:15px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                                <i class="ph ph-clock-counter-clockwise"></i> STORICO VIAGGI
                            </div>
                            <div style="max-height:400px; overflow-y:auto; padding-right:8px;">
                                <table class="dash-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Destinazione</th>
                                            <th>Durata</th>
                                            <th>Distanza</th>
                                            <th>Atlete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${transports.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:30px; color:rgba(255,255,255,0.3);">Nessun viaggio registrato</td></tr>' : transports.map(t => TransportView.renderDriverHistoryRow(t)).join("")}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    renderDriverHistoryRow: (t) => {
        let stats = {};
        try { stats = typeof t.stats_json === "string" ? JSON.parse(t.stats_json) : t.stats_json || {}; } catch { stats = {}; }
        let athletes = [];
        try { athletes = typeof t.athletes_json === "string" ? JSON.parse(t.athletes_json) : t.athletes_json || []; } catch { athletes = []; }
        
        const dateStr = t.transport_date ? new Date(t.transport_date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-";
        
        return `
            <tr>
                <td style="font-weight:700; color:rgba(255,255,255,0.6);">${dateStr}</td>
                <td>
                    <div style="font-weight:600;">${Utils.escapeHtml(t.destination_name)}</div>
                    <div style="font-size:11px; color:rgba(255,255,255,0.3);">${Utils.escapeHtml(t.destination_address || "")}</div>
                </td>
                <td><span class="badge cyan" style="font-size:11px;">${Utils.escapeHtml(stats.durata || "-")}</span></td>
                <td>${Utils.escapeHtml(stats.distanza || "-")}</td>
                <td style="font-size:11px; color:rgba(255,255,255,0.5);">
                    ${athletes.length} atlete
                </td>
            </tr>`;
    },

    renderNewTransport: (gymOptions, teamOptions, driverOptions, vehicleOptions) => {
        return `
            <div class="transport-dashboard">
                <div class="dash-top-bar">
                    <div>
                        <div class="dash-title-wrap">
                            <button class="btn-dash icon-only" id="nt-back" type="button" title="Torna Indietro"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>
                            <h1 class="dash-title">Nuovo <span style="color:var(--accent-pink);">Trasporto</span></h1>
                        </div>
                        <p class="dash-subtitle">Pianifica il percorso di raccolta atlete con backward planning</p>
                    </div>
                </div>

                <div class="dash-grid">
                    <!-- Step 1: Destinazione -->
                    <div class="dash-card pink" style="grid-column:1/-1;">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><span style="background:var(--accent-pink);color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:14px;">1</span> DESTINAZIONE</div>
                        </div>
                        <div class="form-group" style="margin-top:16px;">
                            <label class="form-label" for="nt-gym-select">Palestra / Impianto</label>
                            <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
                                <div style="flex:1; min-width:200px;">
                                    <select class="form-select" id="nt-gym-select">
                                        <option value="">— Seleziona destinazione —</option>
                                        ${gymOptions}
                                    </select>
                                </div>
                                <button class="btn-dash pink" id="nt-add-gym-btn" type="button"><i class="ph ph-plus"></i> Nuova Palestra</button>
                                <button class="btn-dash" id="nt-del-gym-btn" type="button" style="border-color:rgba(255, 0, 255,0.4);color:#FF00FF;" title="Elimina palestra selezionata"><i class="ph ph-trash"></i> Elimina</button>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Dati Viaggio -->
                    <div class="dash-card cyan" style="grid-column:1/-1;">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><span style="background:var(--accent-cyan);color:#000;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:14px;font-weight:700;">2</span> DATI VIAGGIO</div>
                        </div>
                        <div class="form-grid" style="margin-top:16px;">
                            <div class="form-group">
                                <label class="form-label" for="nt-team-select">Squadra</label>
                                <select class="form-select" id="nt-team-select">
                                    <option value="">— Seleziona squadra —</option>
                                    ${teamOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Orario Arrivo Desiderato</label>
                                <input class="form-input" type="time" id="nt-arrival-time" value="18:00">
                            </div>
                        </div>
                        <div class="form-grid" style="margin-top:0;">
                            <div class="form-group">
                                <label class="form-label" for="nt-driver-select">Autista</label>
                                <select class="form-select" id="nt-driver-select">
                                    <option value="">— Nessun autista —</option>
                                    ${driverOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="nt-veh-select">Mezzo</label>
                                <select class="form-select" id="nt-veh-select">
                                    <option value="">— Nessun mezzo —</option>
                                    ${vehicleOptions}
                                </select>
                            </div>
                        </div>
                        <div class="form-group" style="margin-top:0;">
                            <label class="form-label" style="display:flex;align-items:center;gap:8px;"> Indirizzo di Partenza del Mezzo <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);border-radius:6px;padding:2px 8px;font-size:10px;color:#4285F4;font-weight:700;letter-spacing:0.5px;"><i class="ph ph-google-logo"></i> Google Maps </span></label>
                            <div style="position:relative;">
                                <i class="ph ph-magnifying-glass" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.35);font-size:16px;pointer-events:none;"></i>
                                <input class="form-input" type="text" id="nt-departure-addr" autocomplete="off" placeholder="Cerca indirizzo di partenza..." value="${localStorage.getItem("fusion_last_departure") || ""}" style="padding-left:40px;">
                            </div>
                            <div id="nt-departure-map" style="display:none;margin-top:10px;border-radius:12px;overflow:hidden;height:160px;border:1px solid rgba(66,133,244,0.25);"></div>
                        </div>
                        <div class="form-group" style="margin-top:0;">
                            <label class="form-label">Data Trasporto</label>
                            <input class="form-input" type="date" id="nt-transport-date" value="${new Date().toISOString().slice(0, 10)}">
                        </div>
                    </div>

                    <!-- Step 3: Atlete -->
                    <div class="dash-card green" style="grid-column:1/-1;">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><span style="background:#00e676;color:#000;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:14px;font-weight:700;">3</span> SELEZIONA ATLETE</div>
                        </div>
                        <p style="font-size:13px; color:rgba(255,255,255,0.5); margin-top:8px; margin-bottom:16px;">Seleziona una squadra per caricare le atlete. Clicca su una card per selezionare o deselezionare.</p>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px;" id="nt-athletes-grid">
                            <div style="grid-column:1/-1; text-align:center; padding:40px; color:rgba(255,255,255,0.4);">
                                <i class="ph ph-users" style="font-size:48px; display:block; margin-bottom:12px; opacity:0.3;"></i> Seleziona una squadra per visualizzare le atlete
                            </div>
                        </div>
                        <div style="margin-top:24px; display:flex; gap:16px; flex-wrap:wrap; align-items:center; padding-top:20px; border-top:1px dashed rgba(255,255,255,0.1);">
                            <button class="btn-dash primary" id="nt-calc-btn" type="button" disabled style="padding:12px 24px;font-size:16px;"><i class="ph ph-route" style="font-size:22px;"></i> Calcola Percorso</button>
                            <span id="nt-validation-hint" style="font-size:13px; color:rgba(255,255,255,0.4);">Compila destinazione, squadra e seleziona almeno un'atleta</span>
                        </div>
                    </div>

                    <!-- Results -->
                    <div id="nt-results" style="display:none; grid-column:1/-1; margin-top:10px;"></div>
                </div>
            </div>`;
    },

    renderAthleteGrid: (athletes, selectedIds) => {
        return athletes.map(t => {
            const initial = (t.full_name || "").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
            const address = [t.residence_address, t.residence_city].filter(v => v && v.trim()).join(", ");
            const isSelected = selectedIds.some(s => s.id === t.id);
            const addrMissing = !t.residence_address || t.residence_address.trim().length < 3;

            return `
                <div class="nt-athlete-card ${isSelected ? "selected" : ""}" data-athlete-id="${Utils.escapeHtml(t.id)}" style="background:rgba(255,255,255,0.02);border:1px solid ${isSelected ? '#00e676' : 'rgba(255,255,255,0.1)'};border-radius:12px;padding:16px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all 0.2s;">
                    <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:${isSelected ? '#fff' : 'rgba(255,255,255,0.5)'};">${initial}</div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600;font-size:14px;color:${isSelected ? '#fff' : 'rgba(255,255,255,0.7)'};">${Utils.escapeHtml(t.full_name)}</div>
                        <div style="font-size:12px;color:${!addrMissing ? 'rgba(255,255,255,0.4)' : '#ff5252'};margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${!addrMissing ? '<i class="ph ph-map-pin"></i> ' + Utils.escapeHtml(t.residence_address) : '<i class="ph ph-warning"></i> Indirizzo mancante'}
                        </div>
                        ${addrMissing && isSelected ? `<input class="nt-addr-input form-input" style="margin-top:8px;padding:6px 10px;font-size:12px;height:auto;" type="text" data-addr-for="${Utils.escapeHtml(t.id)}" placeholder="Inserisci indirizzo..." onclick="event.stopPropagation()">`: ""}
                    </div>
                    <div style="color:${isSelected ? '#00e676' : 'rgba(255,255,255,0.2)'};font-size:24px;">
                        <i class="ph ${isSelected ? 'ph-check-circle-fill' : 'ph-circle'}"></i>
                    </div>
                </div>`;
        }).join("");
    },

    renderCalculationResult: (stats, timelineHtml, mapHtml) => {
        return `
            <div class="dash-card" style="margin-top:28px;">
                <div class="dash-card-header">
                    <div class="dash-card-title"><i class="ph ph-navigation-arrow" style="color:var(--accent-pink);"></i> RISULTATO PIANIFICAZIONE</div>
                    <div class="dash-card-dots"><i class="ph ph-clock"></i> ${stats.durata}</div>
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 380px; gap:24px; margin-top:20px;">
                    <div>
                        <div style="margin-bottom:16px; display:flex; gap:12px;">
                            <div style="flex:1; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:16px; border-radius:12px;">
                                <div style="font-size:11px; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:4px; letter-spacing:1px;">Distanza Totale</div>
                                <div style="font-family:var(--font-display); font-size:20px; font-weight:700;">${stats.distanza}</div>
                            </div>
                            <div style="flex:1; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:16px; border-radius:12px;">
                                <div style="font-size:11px; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:4px; letter-spacing:1px;">Orario Partenza</div>
                                <div style="font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--accent-cyan);">${stats.orarioPartenza}</div>
                            </div>
                        </div>
                        <div id="nt-map-container" style="height:440px; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); position:relative;">
                            ${mapHtml}
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:20px;">
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px;">
                            <div style="font-family:var(--font-display); font-size:14px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                                <i class="ph ph-list-numbers" style="color:var(--accent-pink);"></i> TABELLA DI MARCIA
                            </div>
                            <div id="nt-timeline-list" style="display:flex; flex-direction:column; gap:8px;">
                                ${timelineHtml}
                            </div>
                        </div>

                        <div style="margin-top:auto; display:flex; flex-direction:column; gap:12px;">
                            <button class="btn btn-primary" id="nt-save-btn" style="width:100%; padding:14px;"><i class="ph ph-floppy-disk-back"></i> SALVA TRASPORTO</button>
                            <button class="btn btn-ghost" id="nt-ai-refine-btn" style="width:100%; border-color:rgba(167,139,250,0.5); color:#a78bfa; padding:12px;">
                                <i class="ph ph-brain"></i> OTTIMIZZA CON AI
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    renderEventDetail: (event, routes, attendees) => {
        const dateStr = event.event_date ? new Date(event.event_date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
        return `
            <div class="transport-dashboard">
                <div class="dash-top-bar">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <button class="btn-dash icon-only" id="back-events" type="button" style="-webkit-text-fill-color:unset;"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>
                        <div>
                            <h1 class="dash-title">${Utils.escapeHtml(event.title)}</h1>
                            <p class="dash-subtitle">${Utils.escapeHtml(dateStr)} • ${Utils.escapeHtml(event.location_name || "Nessuna location")}</p>
                        </div>
                    </div>
                    <div style="display:flex; gap:12px;">
                        <button class="btn-dash primary" id="send-convocations-btn" type="button"><i class="ph ph-paper-plane-tilt"></i> INVIA CONVOCAZIONI</button>
                        <button class="btn-dash pink" id="add-route-btn" type="button"><i class="ph ph-plus"></i> OFFRI PASSAGGIO</button>
                    </div>
                </div>

                <div class="dash-grid">
                    <div class="dash-card cyan" style="grid-column: 1 / -1;">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><i class="ph ph-map-trifold" style="color:var(--accent-cyan); margin-right:8px;"></i> MAPPA LOCATION</div>
                        </div>
                        <div id="gmap" style="height:300px; border-radius:12px; margin-top:16px; border:1px solid rgba(255,255,255,0.05);"></div>
                    </div>

                    <div class="dash-card" style="grid-column: 1 / 2;">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><i class="ph ph-car-profile" style="color:var(--accent-pink); margin-right:8px;"></i> TRATTE DISPONIBILI (${routes.length})</div>
                        </div>
                        <div style="margin-top:16px; display:flex; flex-direction:column; gap:12px;">
                            ${routes.length === 0 ? '<p style="text-align:center; padding:20px; color:rgba(255,255,255,0.3);">Nessun passaggio offerto per questo evento.</p>' : routes.map(r => TransportView.renderRouteCard(r)).join("")}
                        </div>
                    </div>

                    <div class="dash-card pink" style="grid-column: 2 / -1;">
                        <div class="dash-card-header">
                            <div class="dash-card-title"><i class="ph ph-users-three" style="color:var(--accent-cyan); margin-right:8px;"></i> ATLETE CONVOCATE (${attendees.length})</div>
                        </div>
                        <table class="dash-table" style="margin-top:16px;">
                            <thead>
                                <tr>
                                    <th>Atleta</th>
                                    <th>Status</th>
                                    <th>Passaggio</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${attendees.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:20px; color:rgba(255,255,255,0.3);">Nessun partecipante convocato.</td></tr>' : attendees.map(a => TransportView.renderAttendeeRow(a)).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    },

    renderRouteCard: (r) => {
        return `
            <div class="st-card" style="border-left: 3px solid var(--accent-cyan); background:rgba(255,255,255,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="font-weight:700; color:#fff;">${Utils.escapeHtml(r.driver_name)}</div>
                        <div style="font-size:12px; color:rgba(255,255,255,0.5);">${Utils.escapeHtml(r.vehicle_name || "Auto privata")} • ${r.seats_available}/${r.seats_total} posti liberi</div>
                    </div>
                    <div style="font-family:var(--font-display); font-weight:800; color:var(--accent-cyan);">${Utils.escapeHtml(r.departure_time || "--:--")}</div>
                </div>
                ${r.notes ? `<div style="margin-top:8px; font-size:12px; font-style:italic; color:rgba(255,255,255,0.4);">"${Utils.escapeHtml(r.notes)}"</div>` : ""}
            </div>`;
    },

    renderAttendeeRow: (a) => {
        const hasCar = !!a.route_id;
        const initials = (a.user_name || "??").substring(0, 2).toUpperCase();
        return `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:rgba(255,255,255,0.6);">${initials}</div>
                        <div>
                            <div style="font-weight:600; font-size:13px;">${Utils.escapeHtml(a.user_name)}</div>
                            <div style="font-size:11px; color:rgba(255,255,255,0.4);">${Utils.escapeHtml(a.user_email || "")}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${a.status === 'confirmed' ? 'active' : 'pending'}" style="font-size:10px; padding:2px 8px;">${a.status === 'confirmed' ? 'Confermata' : 'In attesa'}</span>
                </td>
                <td>
                    ${hasCar ? `<span style="color:var(--accent-cyan); font-size:12px;"><i class="ph ph-car" style="margin-right:4px;"></i>${Utils.escapeHtml(a.driver_name)}</span>` : '<span style="color:var(--accent-pink); font-size:12px;"><i class="ph ph-warning" style="margin-right:4px;"></i>Senza passaggio</span>'}
                </td>
                <td>
                    ${!hasCar ? `<button class="btn btn-ghost btn-xs" style="font-size:10px; padding:4px 8px;" onclick="Transport.showRequestPassageModal('${a.athlete_id}')">CHIEDI</button>` : ""}
                </td>
            </tr>`;
    },

    refundsDashboard: (reimbursements) => {
        const totalGlobal = reimbursements.reduce((acc, r) => acc + r.totalAmount, 0);
        return `
            <div class="drv-page">
                <div class="drv-top">
                    <div class="drv-title">
                        <button class="btn-dash" id="ref-back" type="button" style="padding:10px; -webkit-text-fill-color:unset; font-size:14px;"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>
                        Riepilogo <span style="color:var(--accent-pink);">Rimborsi Trasporti</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:8px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:12px;">
                        <span style="font-size:12px; color:rgba(255,255,255,0.4); text-transform:uppercase;">Totale Maturato Atlete</span>
                        <span style="font-family:var(--font-display); font-size:20px; font-weight:800; color:var(--accent-pink);">€ ${Utils.formatNum(totalGlobal)}</span>
                    </div>
                </div>

                <div class="dash-card" style="margin-top:24px; padding:0; overflow:hidden;">
                    <div style="padding:16px 24px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
                        <div style="position:relative; width:300px;">
                            <i class="ph ph-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:0.3;"></i>
                            <input type="text" id="ref-search" class="form-input" placeholder="Cerca atleta o squadra..." style="padding-left:36px; height:40px; font-size:13px; background:rgba(0,0,0,0.2);">
                        </div>
                        <div style="font-size:12px; color:rgba(255,255,255,0.3);"><i class="ph ph-info"></i> Calcolo basato su € 2,50 per partecipazione</div>
                    </div>
                    <div class="table-responsive">
                        <table class="dash-table">
                            <thead>
                                <tr>
                                    <th style="padding-left:24px;">Atleta</th>
                                    <th>Squadra</th>
                                    <th style="text-align:center;">Viaggi</th>
                                    <th style="text-align:right; padding-right:24px;">Totale Rimborso</th>
                                </tr>
                            </thead>
                            <tbody id="ref-list-body">
                                ${reimbursements.length === 0 ? 
                                    '<tr><td colspan="4" style="text-align:center; padding:40px; color:rgba(255,255,255,0.3);">Nessun rimborso calcolato</td></tr>' : 
                                    reimbursements.map(r => TransportView.renderRefundRow(r)).join("")
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    },

    renderRefundRow: (r) => {
        return `
            <tr>
                <td style="padding-left:24px;">
                    <div style="font-weight:600; color:#fff;">${Utils.escapeHtml(r.athleteName)}</div>
                    <div style="font-size:11px; color:rgba(255,255,255,0.3);">Ultimo: ${Utils.escapeHtml(r.lastDestination)} (${Utils.formatDate(r.lastDate)})</div>
                </td>
                <td><span class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.7);">${Utils.escapeHtml(r.teamName)}</span></td>
                <td style="text-align:center;">
                    <div style="font-family:var(--font-display); font-weight:700;">${r.tripCount}</div>
                </td>
                <td style="text-align:right; padding-right:24px;">
                    <div style="font-family:var(--font-display); font-weight:800; color:#00e676; font-size:16px;">€ ${Utils.formatNum(r.totalAmount)}</div>
                </td>
            </tr>`;
    }
};

export default TransportView;
