export class VehiclesView {
    /**
     * Renders the main dashboard for the fleet
     * @param {Array} vehicles 
     * @param {boolean} canEdit 
     * @returns {string} HTML string
     */
    static renderDashboard(vehicles, canEdit) {
        const activeCount = vehicles.filter((v) => v.status === 'active').length;
        const maintenanceCount = vehicles.filter((v) => v.status === 'maintenance').length;
        const anomaliesCount = vehicles.reduce((sum, v) => sum + (v.open_anomalies || 0), 0);

        return `
            <style>
                .vehicles-dashboard {
                    padding: 24px;
                    --dash-bg: #030305;
                    --card-bg: rgba(255, 255, 255, 0.03);
                    --card-border: rgba(255, 255, 255, 0.08);
                    --card-radius: 20px;
                    --accent-cyan: #00e5ff;
                    --accent-pink: #FF00FF;
                    --accent-orange: #FF9800;
                    --accent-green: #00E676;
                    --glass-bg: rgba(20, 20, 25, 0.6);
                    --glass-blur: blur(16px);
                    --shadow-soft: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
                    animation: fade-in 0.4s ease-out;
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dash-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
                .dash-title { 
                    font-family: var(--font-display); font-size: 32px; font-weight: 800; text-transform: uppercase; margin: 0; line-height: 1.1; 
                    background: linear-gradient(90deg, #fff, rgba(255,255,255,0.6)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .dash-subtitle { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 6px; font-weight: 500; }

                .dash-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 40px; }
                .dash-stat-card {
                    background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--card-border); border-radius: var(--card-radius);
                    padding: 24px; position: relative; overflow: hidden; box-shadow: var(--shadow-soft);
                    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;
                }
                .dash-stat-card:hover { transform: translateY(-4px) scale(1.02); z-index: 2; border-color: rgba(255,255,255,0.2); }
                .dash-stat-card::before {
                    content: ''; position: absolute; top:0; left:0; width: 100%; height: 3px;
                    background: linear-gradient(90deg, var(--accent-cyan), transparent); opacity: 0.9;
                }
                .dash-stat-card.pink::before { background: linear-gradient(90deg, var(--accent-pink), transparent); }
                .dash-stat-card.orange::before { background: linear-gradient(90deg, var(--accent-orange), transparent); }
                
                .dash-stat-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px; display: flex; justify-content: space-between; align-items: center; }
                .dash-stat-icon { font-size: 20px; color: rgba(255,255,255,0.4); padding: 8px; background: rgba(255,255,255,0.03); border-radius: 12px; }
                .dash-stat-value { font-family: var(--font-display); font-size: 42px; font-weight: 800; margin-top: 16px; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.5); display: flex; align-items: baseline; gap: 8px;}

                .vehicle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
                .vehicle-card {
                    background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                    border: 1px solid var(--card-border); border-radius: 16px;
                    padding: 24px; cursor: pointer; transition: all 0.3s;
                    position: relative; overflow: hidden;
                    display: flex; flex-direction: column; gap: 16px;
                }
                .vehicle-card:hover { transform: translateY(-4px); border-color: var(--accent-cyan); box-shadow: 0 12px 30px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,229,255,0.1); }
                .vehicle-card::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 4px; background: var(--accent-cyan); opacity: 0; transition: opacity 0.3s; }
                .vehicle-card:hover::before { opacity: 1; }
                
                .vehicle-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .vehicle-name { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 4px; }
                .vehicle-plate { display: inline-block; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 1px; border: 1px solid rgba(255,255,255,0.2); }
                
                .vehicle-status { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 20px; }
                .status-active { background: rgba(0,230,118,0.1); color: var(--accent-green); border: 1px solid rgba(0,230,118,0.2); }
                .status-maintenance { background: rgba(255,152,0,0.1); color: var(--accent-orange); border: 1px solid rgba(255,152,0,0.2); }
                .status-out { background: rgba(255,0,0,0.1); color: #FF5252; border: 1px solid rgba(255,0,0,0.2); }

                .vehicle-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
                .v-metric { font-size: 13px; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 6px; }
                .v-metric i { color: var(--accent-cyan); }
                .v-metric.alert i { color: #FF5252; }
                .v-metric.alert span { color: #FF5252; font-weight: bold; }

                .btn-dash { 
                    background: rgba(255,255,255,0.04); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; 
                    padding: 12px 24px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); 
                    text-transform: uppercase; letter-spacing: 1.5px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                    backdrop-filter: blur(8px);
                }
                .btn-dash:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
                .btn-dash.primary { background: linear-gradient(135deg, var(--accent-cyan), #00b3cc); color: #000; border: none; box-shadow: 0 4px 20px rgba(0,229,255,0.4); }
                .btn-dash.primary:hover { box-shadow: 0 8px 30px rgba(0,229,255,0.6); color:#000;}
            </style>

            <div class="vehicles-dashboard">
                <div class="dash-top-bar">
                    <div>
                        <h1 class="dash-title">Gestione <span style="color:var(--accent-cyan);">Mezzi</span></h1>
                        <p class="dash-subtitle">${vehicles.length} veicoli nel parco mezzi</p>
                    </div>
                    <div style="display:flex; gap:12px;">
                        ${canEdit ? '<button class="btn-dash primary" id="new-vehicle-btn" type="button"><i class="ph ph-plus-circle" style="font-size:20px;"></i> NUOVO MEZZO</button>' : ''}
                    </div>
                </div>

                <div class="dash-stat-grid">
                    <div class="dash-stat-card">
                        <div class="dash-stat-title">Flotta Attiva <div class="dash-stat-icon"><i class="ph ph-check-circle"></i></div></div>
                        <div class="dash-stat-value">${activeCount} <span style="font-size:16px; color:rgba(255,255,255,0.5); font-weight:500;">/ ${vehicles.length}</span></div>
                    </div>
                    <div class="dash-stat-card orange">
                        <div class="dash-stat-title">In Manutenzione <div class="dash-stat-icon"><i class="ph ph-wrench"></i></div></div>
                        <div class="dash-stat-value" style="color:var(--accent-orange);">${maintenanceCount}</div>
                    </div>
                    <div class="dash-stat-card pink">
                        <div class="dash-stat-title">Anomalie Aperte <div class="dash-stat-icon"><i class="ph ph-warning"></i></div></div>
                        <div class="dash-stat-value" style="color:var(--accent-pink);">${anomaliesCount}</div>
                    </div>
                </div>

                ${vehicles.length === 0 
                    ? window.Utils.emptyState('Nessun mezzo trovato', 'Aggiungi il primo veicolo al parco mezzi.') 
                    : this.renderVehicleCards(vehicles)}
            </div>
        `;
    }

    /**
     * Renders the grid of vehicle cards
     * @param {Array} vehicles 
     * @returns {string} HTML string
     */
    static renderVehicleCards(vehicles) {
        return `
            <div class="vehicle-grid">
                ${vehicles.map((v) => {
                    let statusLabel = "Attivo";
                    let statusClass = "status-active";

                    if (v.status === "maintenance") {
                        statusLabel = "In Manutenzione";
                        statusClass = "status-maintenance";
                    } else if (v.status === "out_of_service") {
                        statusLabel = "Fuori Servizio";
                        statusClass = "status-out";
                    }

                    const isExpiryNear = (dateStr) => {
                        return dateStr && (new Date(dateStr) - new Date()) < 2592000000; // < 30 days
                    };

                    return `
                        <div class="vehicle-card" data-id="${v.id}">
                            <div class="vehicle-header">
                                <div>
                                    <div class="vehicle-name">${window.Utils.escapeHtml(v.name)}</div>
                                    <div class="vehicle-plate">${window.Utils.escapeHtml(v.license_plate)}</div>
                                </div>
                                <div class="vehicle-status ${statusClass}">${statusLabel}</div>
                            </div>
                            
                            <div class="vehicle-metrics">
                                <div class="v-metric" title="Posti a sedere">
                                    <i class="ph ph-users"></i>
                                    <span>${v.capacity} Posti</span>
                                </div>
                                <div class="v-metric ${isExpiryNear(v.road_tax_expiry) ? 'alert' : ''}">
                                    <i class="ph ph-calendar-check"></i>
                                    <span>Bollo: ${v.road_tax_expiry ? window.Utils.formatDate(v.road_tax_expiry) : "N/D"}</span>
                                </div>
                                <div class="v-metric ${v.open_anomalies > 0 ? "alert" : ""}" style="grid-column: span 2;">
                                    <i class="ph ph-warning-circle"></i>
                                    <span>${v.open_anomalies > 0 ? `${v.open_anomalies} Anomalie Aperte` : "Nessuna anomalia"}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Renders the detail view for a single vehicle
     * @param {Object} vehicle 
     * @param {string} currentTab 
     * @param {boolean} canEdit 
     * @returns {string} HTML string
     */
    static renderDetail(vehicle, currentTab, canEdit) {
        let statusLabel = "Attivo";
        let statusColor = "var(--accent-green)";

        if (vehicle.status === "maintenance") {
            statusLabel = "In Manutenzione";
            statusColor = "var(--accent-orange)";
        } else if (vehicle.status === "out_of_service") {
            statusLabel = "Fuori Servizio";
            statusColor = "#FF5252";
        }

        const openAnomaliesCount = vehicle.anomalies?.filter((a) => a.status !== "resolved").length || 0;
        const maintenanceCount = vehicle.maintenance?.length || 0;

        return `
            <style>
                .detail-header {
                    padding: 32px 24px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex; justify-content: space-between; align-items: flex-end; position: relative; overflow: hidden;
                }
                .detail-header::before {
                    content: ''; position: absolute; top:0; left:0; width: 100%; height: 100%;
                    background: radial-gradient(circle at top right, rgba(0,229,255,0.05), transparent 40%); pointer-events: none;
                }
                
                .v-title-wrap { position: relative; z-index: 1;}
                .v-plate-badge { display: inline-block; background: #fff; color: #000; padding: 4px 12px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold; margin-bottom: 12px; border: 2px solid #ccc; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
                .v-title { font-family: var(--font-display); font-size: 36px; font-weight: 800; color: #fff; margin: 0 0 8px 0; line-height: 1; }
                .v-subtitle { font-size: 14px; color: ${statusColor}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }
                
                .v-content { padding: 32px 24px; }
                
                .btn-dash { 
                    background: rgba(255,255,255,0.04); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; 
                    padding: 10px 20px; font-weight: 700; font-size: 12px; cursor: pointer; transition: all 0.3s; 
                    text-transform: uppercase; letter-spacing: 1px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                }
                .btn-dash:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                
                .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
                .info-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; }
                .info-lbl { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                .info-val { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 16px; }
            </style>
            
            <div class="detail-header">
                <div class="v-title-wrap">
                    <div style="margin-bottom: 12px;">
                        <button class="btn btn-ghost btn-sm" id="btn-back" style="color:rgba(255,255,255,0.6); padding:0;">
                            <i class="ph ph-arrow-left"></i> Torna ai Mezzi
                        </button>
                    </div>
                    <div class="v-plate-badge">${window.Utils.escapeHtml(vehicle.license_plate)}</div>
                    <h1 class="v-title">${window.Utils.escapeHtml(vehicle.name)}</h1>
                    <div class="v-subtitle">
                        <span style="width:8px;height:8px;border-radius:50%;background:${statusColor};display:inline-block;box-shadow:0 0 10px ${statusColor};"></span> 
                        ${statusLabel}
                    </div>
                </div>
                <div style="display:flex; gap:12px;">
                    ${canEdit ? '<button class="btn-dash" id="btn-edit-veh"><i class="ph ph-pencil-simple"></i> Modifica</button>' : ''}
                </div>
            </div>
            
            <div class="fusion-tabs-container" style="margin: 0 24px;">
                <div class="fusion-tab ${currentTab === "anomalies" ? "active" : ""}" data-tab="anomalies">
                    <i class="ph ph-warning"></i> Anomalie (${openAnomaliesCount})
                </div>
                <div class="fusion-tab ${currentTab === "maintenance" ? "active" : ""}" data-tab="maintenance">
                    <i class="ph ph-wrench"></i> Manutenzione (${maintenanceCount})
                </div>
                <div class="fusion-tab ${currentTab === "info" ? "active" : ""}" data-tab="info">
                    <i class="ph ph-list-dashes"></i> Info e Scadenze
                </div>
            </div>
            
            <div class="v-content" id="tab-content">
                ${currentTab === "info" ? this._renderTabInfo(vehicle) : ''}
                ${currentTab === "maintenance" ? this._renderTabMaintenance(vehicle) : ''}
                ${currentTab === "anomalies" ? this._renderTabAnomalies(vehicle) : ''}
            </div>
        `;
    }

    static _renderTabInfo(vehicle) {
        const isExpiryNear = (dateStr) => dateStr && (new Date(dateStr) - new Date()) < 2592000000;

        return `
            <div class="info-grid">
                <div class="info-card">
                    <h3 style="margin-top:0; margin-bottom: 24px; font-size:14px; text-transform:uppercase; color:var(--accent-cyan);">Dettagli Tecnici</h3>
                    <div class="info-lbl">Capacità</div>
                    <div class="info-val">${vehicle.capacity} Posti a sedere</div>
                    <div class="info-lbl">Stato Attuale</div>
                    <div class="info-val">${vehicle.status === "active" ? "Attivo" : vehicle.status === "maintenance" ? "In Manutenzione" : "Fuori Servizio"}</div>
                    <div class="info-lbl">Note Aggiuntive</div>
                    <div class="info-val" style="color:rgba(255,255,255,0.7); font-weight:400; font-size:14px;">
                        ${vehicle.notes ? window.Utils.escapeHtml(vehicle.notes).replace(/\n/g, "<br>") : "—"}
                    </div>
                </div>
                <div class="info-card">
                    <h3 style="margin-top:0; margin-bottom: 24px; font-size:14px; text-transform:uppercase; color:var(--accent-pink);">Scadenze</h3>
                    <div class="info-lbl">Scadenza Assicurazione</div>
                    <div class="info-val" style="${isExpiryNear(vehicle.insurance_expiry) ? "color:#FF5252" : ""}">
                        ${vehicle.insurance_expiry ? window.Utils.formatDate(vehicle.insurance_expiry) : "N/D"}
                    </div>
                    <div class="info-lbl">Scadenza Bollo (Road Tax)</div>
                    <div class="info-val" style="${isExpiryNear(vehicle.road_tax_expiry) ? "color:#FF5252" : ""}">
                        ${vehicle.road_tax_expiry ? window.Utils.formatDate(vehicle.road_tax_expiry) : "N/D"}
                    </div>
                </div>
            </div>
        `;
    }

    static _renderTabMaintenance(vehicle) {
        const getMaintTypeLabel = (type) => ({
            tagliando: "Tagliando / Service",
            gomme_estive: "Cambio Gomme (Estive)",
            gomme_invernali: "Cambio Gomme (Invernali)",
            riparazione: "Riparazione",
            revisione: "Revisione di Legge",
            altro: "Altro",
        })[type] || type;

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
                <h2 style="margin:0; font-size:20px; font-weight:800;">Registro Manutenzioni / Tagliandi</h2>
                <button class="btn-dash" id="btn-add-maint" style="background:var(--accent-cyan); color:#000; border:none;">
                    <i class="ph ph-plus"></i> Registra Manutenzione
                </button>
            </div>
            
            ${vehicle.maintenance && vehicle.maintenance.length > 0 ? `
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>Km</th>
                                <th>Descrizione</th>
                                <th>Costo</th>
                                <th>Prossimo Controllo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vehicle.maintenance.map((m) => `
                                <tr>
                                    <td style="font-weight:600;">${window.Utils.formatDate(m.maintenance_date)}</td>
                                    <td>${getMaintTypeLabel(m.type)}</td>
                                    <td>${m.mileage ? m.mileage.toLocaleString() + " km" : "—"}</td>
                                    <td>${window.Utils.escapeHtml(m.description || "—")}</td>
                                    <td>${m.cost > 0 ? "€ " + window.Utils.formatNum(m.cost, 2) : "—"}</td>
                                    <td>
                                        ${m.next_maintenance_date ? window.Utils.formatDate(m.next_maintenance_date) : ""}
                                        ${m.next_maintenance_date && m.next_maintenance_mileage ? "<br>" : ""}
                                        ${m.next_maintenance_mileage ? m.next_maintenance_mileage.toLocaleString() + " km" : ""}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : window.Utils.emptyState("Nessuna manutenzione registrata", "Non ci sono interventi nello storico per questo mezzo.")}
        `;
    }

    static _renderTabAnomalies(vehicle) {
        const getSeverityColor = (s) => s === "critical" ? "#FF0000" : s === "high" ? "#FF5252" : s === "medium" ? "#FF9800" : "#00E676";
        const getStatusBadge = (s) => {
            if (s === "open") return '<span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; background:rgba(255,0,0,0.1); color:#FF5252; border:1px solid rgba(255,0,0,0.2);">Aperto</span>';
            if (s === "in_progress") return '<span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; background:rgba(255,152,0,0.1); color:#FF9800; border:1px solid rgba(255,152,0,0.2);">In Lavoraz.</span>';
            return '<span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; background:rgba(0,230,118,0.1); color:#00E676; border:1px solid rgba(0,230,118,0.2);">Risolto</span>';
        };

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
                <h2 style="margin:0; font-size:20px; font-weight:800;">Segnalazioni & Anomalie</h2>
                <button class="btn-dash" id="btn-add-anomaly" style="background:var(--accent-pink); color:#fff; border:none;">
                    <i class="ph ph-warning"></i> Segnala Guasto
                </button>
            </div>
            
            ${vehicle.anomalies && vehicle.anomalies.length > 0 ? `
                <div class="grid-2" style="display:grid; grid-template-columns:1fr; gap:16px;">
                    ${vehicle.anomalies.map((a) => `
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-left:4px solid ${getSeverityColor(a.severity)}; border-radius:12px; padding:20px; display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                                    ${getStatusBadge(a.status)}
                                    <span style="font-size:12px; color:rgba(255,255,255,0.5);"><i class="ph ph-clock"></i> ${window.Utils.formatDate(a.report_date.split(" ")[0])}</span>
                                    <span style="font-size:12px; color:rgba(255,255,255,0.5);"><i class="ph ph-user"></i> ${window.Utils.escapeHtml(a.reporter_name || "Utente")}</span>
                                </div>
                                <div style="font-size:15px; font-weight:600; margin-bottom:8px;">${window.Utils.escapeHtml(a.description)}</div>
                                ${a.resolution_notes ? `<div style="font-size:13px; color:rgba(255,255,255,0.6); margin-top:12px; padding:12px; background:rgba(0,0,0,0.2); border-radius:8px;"><strong>Risoluzione:</strong> ${window.Utils.escapeHtml(a.resolution_notes)}</div>` : ""}
                            </div>
                            <div>
                                ${a.status !== "resolved" ? `
                                    <select class="form-input anomaly-status-update" data-id="${a.id}" style="width:140px; padding:6px 10px; font-size:13px; height:auto;">
                                        <option value="open" ${a.status === "open" ? "selected" : ""}>Aperto</option>
                                        <option value="in_progress" ${a.status === "in_progress" ? "selected" : ""}>In Lavorazione</option>
                                        <option value="resolved">Risolto...</option>
                                    </select>
                                ` : `
                                    <div style="font-size:12px; color:rgba(255,255,255,0.4); text-align:right;">
                                        Risolto il<br>${window.Utils.formatDate(a.resolved_date?.split(" ")[0])}
                                    </div>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : window.Utils.emptyState("Nessuna anomalia", "Tutto funziona regolarmente.")}
        `;
    }

    static getVehicleModalBody(vehicle) {
        return `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3); margin-bottom:var(--sp-2);">
                <div>
                    <label class="form-label">Nome/Modello *</label>
                    <input id="veh-name" class="form-input" type="text" value="${vehicle?.name || ""}" placeholder="es: Pulmino Ducato">
                </div>
                <div>
                    <label class="form-label">Targa *</label>
                    <input id="veh-plate" class="form-input" type="text" value="${vehicle?.license_plate || ""}" style="text-transform:uppercase;">
                </div>
                <div>
                    <label class="form-label">Capacità (Posti)</label>
                    <input id="veh-cap" class="form-input" type="number" min="1" value="${vehicle?.capacity || 9}">
                </div>
                <div>
                    <label class="form-label">Stato</label>
                    <select id="veh-status" class="form-input">
                        <option value="active" ${vehicle?.status === "active" ? "selected" : ""}>Attivo</option>
                        <option value="maintenance" ${vehicle?.status === "maintenance" ? "selected" : ""}>In Manutenzione</option>
                        <option value="out_of_service" ${vehicle?.status === "out_of_service" ? "selected" : ""}>Fuori Servizio</option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Scadenza Assicurazione</label>
                    <input id="veh-ins" class="form-input" type="date" value="${vehicle?.insurance_expiry || ""}">
                </div>
                <div>
                    <label class="form-label">Scadenza Bollo</label>
                    <input id="veh-tax" class="form-input" type="date" value="${vehicle?.road_tax_expiry || ""}">
                </div>
                <div style="grid-column: span 2;">
                    <label class="form-label">Note</label>
                    <textarea id="veh-notes" class="form-textarea" rows="2">${vehicle?.notes || ""}</textarea>
                </div>
            </div>
            <div id="veh-error" class="form-error hidden"></div>
        `;
    }

    static getVehicleModalFooter(vehicle) {
        return `
            ${vehicle ? '<button class="btn btn-ghost btn-danger btn-sm" id="veh-del" style="margin-right:auto;" type="button">Elimina</button>' : ""}
            <button class="btn btn-ghost btn-sm" id="veh-cancel" type="button">Annulla</button>
            <button class="btn btn-primary btn-sm" style="color:#000;" id="veh-save" type="button">Salva</button>
        `;
    }

    static getMaintenanceModalBody() {
        return `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-2); margin-bottom:var(--sp-2);">
                <div>
                    <label class="form-label">Data *</label>
                    <input type="date" id="m-date" class="form-input" value="${new Date().toISOString().split("T")[0]}">
                </div>
                <div>
                    <label class="form-label">Tipo *</label>
                    <select id="m-type" class="form-input">
                        <option value="tagliando">Tagliando / Service</option>
                        <option value="gomme_estive">Cambio Gomme (Estive)</option>
                        <option value="gomme_invernali">Cambio Gomme (Invernali)</option>
                        <option value="revisione">Revisione MCTC</option>
                        <option value="riparazione">Riparazione</option>
                        <option value="altro">Altro</option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Km Attuali</label>
                    <input type="number" id="m-km" class="form-input" placeholder="es. 120500">
                </div>
                <div>
                    <label class="form-label">Costo Totale (€)</label>
                    <input type="number" id="m-cost" class="form-input" step="0.01" placeholder="0.00">
                </div>
                <div style="grid-column: span 2;">
                    <label class="form-label">Descrizione / Note</label>
                    <textarea id="m-desc" class="form-textarea" rows="2"></textarea>
                </div>
                <div style="grid-column: span 2; padding-top:16px; border-top:1px solid rgba(255,255,255,0.1); margin-top:8px;">
                    <p style="margin:0 0 12px 0; font-weight:bold; font-size:13px; color:var(--accent-cyan); text-transform:uppercase;">Prossimo Controllo Consigliato</p>
                </div>
                <div>
                    <label class="form-label">Prossima Data</label>
                    <input type="date" id="m-next-date" class="form-input">
                </div>
                <div>
                    <label class="form-label">Prossimi Km</label>
                    <input type="number" id="m-next-km" class="form-input" placeholder="es. 140500">
                </div>
            </div>
            <div id="m-err" class="form-error hidden"></div>
        `;
    }

    static getMaintenanceModalFooter() {
        return `
            <button class="btn btn-ghost btn-sm" id="m-cancel" type="button">Annulla</button>
            <button class="btn btn-primary btn-sm" id="m-save" type="button" style="color:#000;">Salva Manutenzione</button>
        `;
    }

    static getAnomalyModalBody() {
        return `
            <div style="margin-bottom:var(--sp-3);">
                <label class="form-label">Gravità</label>
                <select id="a-sev" class="form-input">
                    <option value="low">Bassa (Non pregiudica il servizio)</option>
                    <option value="medium" selected>Media (Da controllare presto)</option>
                    <option value="high">Alta (Urgente, possibile fermo macchina)</option>
                    <option value="critical">Critica (MEZZO FERMO)</option>
                </select>
            </div>
            <div style="margin-bottom:var(--sp-2);">
                <label class="form-label">Descrizione del problema *</label>
                <textarea id="a-desc" class="form-textarea" rows="4" placeholder="Cosa è successo? Che spie sono accese? Rumori strani?"></textarea>
            </div>
            <div id="a-err" class="form-error hidden"></div>
        `;
    }

    static getAnomalyModalFooter() {
        return `
            <button class="btn btn-ghost btn-sm" id="a-cancel" type="button">Annulla</button>
            <button class="btn btn-primary btn-sm" id="a-save" type="button" style="background:var(--accent-pink); color:#fff; border:none; box-shadow:0 4px 15px rgba(255,0,255,0.4);">Invia Segnalazione</button>
        `;
    }

    static getResolveAnomalyModalBody() {
        return `
            <p style="font-size:13px; color:rgba(255,255,255,0.6); margin-top:0;">Inserisci i dettagli di come è stato risolto il problema.</p>
            <div style="margin-bottom:var(--sp-2);">
                <label class="form-label">Note di Risoluzione</label>
                <textarea id="ar-notes" class="form-textarea" rows="3" placeholder="Es: Sostituita lampadina faro SX."></textarea>
            </div>
            <div id="ar-err" class="form-error hidden"></div>
        `;
    }

    static getResolveAnomalyModalFooter() {
        return `
            <button class="btn btn-ghost btn-sm" id="ar-cancel" type="button">Annulla</button>
            <button class="btn btn-primary btn-sm" id="ar-save" type="button" style="color:#000; background:#00E676; box-shadow:0 4px 15px rgba(0,230,118,0.4);">Segna come Risolto</button>
        `;
    }
}
