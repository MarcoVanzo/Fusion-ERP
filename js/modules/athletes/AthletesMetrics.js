/**
 * AthletesMetrics — Gestione performance e integrazione VALD
 */

import { AthletesAPI } from './AthletesAPI.js';

export const AthletesMetrics = {
    /**
     * Renderizza la sezione metriche per un singolo atleta
     */
    async render(container, athleteId) {
        container.innerHTML = `
            <div class="metrics-dashboard">
                <div id="vald-section" class="vald-section">
                    <div class="section-loader">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-text" style="width:60%;"></div>
                        <div class="skeleton skeleton-rect" style="height:200px;"></div>
                    </div>
                </div>
                <div id="logs-section" class="logs-section" style="margin-top:var(--sp-4);"></div>
            </div>
        `;

        await Promise.all([
            this._loadValdData(athleteId),
            this._loadActivityLogs(athleteId)
        ]);
    },

    /**
     * Carica e renderizza i dati VALD
     */
    async _loadValdData(athleteId) {
        const container = document.getElementById("vald-section");
        if (!container) return;

        try {
            const data = await Store.get("analytics", "vald", { athleteId });
            
            if (!data || !data.hasData) {
                container.innerHTML = `
                    <div class="empty-state-vald">
                        <i class="ph ph-lightning-slash"></i>
                        <h3>Nessun dato VALD</h3>
                        <p>Sincronizza i dati da VALD Hub per questo atleta.</p>
                        <button class="btn btn-default btn-sm" id="vald-sync-btn"><i class="ph ph-arrows-clockwise"></i> Sincronizza Ora</button>
                    </div>
                `;
                document.getElementById("vald-sync-btn").onclick = () => this._syncVald(athleteId);
                return;
            }

            const kpi = [
                { label: 'Jump Height', value: data.jumpHeight?.toFixed(1) || '—', unit: 'cm', icon: 'arrow-fat-up' },
                { label: 'RSImod', value: data.semaphore?.rsimod?.current?.toFixed(3) || '—', unit: '', icon: 'lightning' },
                { label: 'Braking Imp.', value: data.brakingImpulse?.toFixed(0) || '—', unit: 'Ns', icon: 'arrows-in' },
                { label: 'Asimmetria', value: data.asymmetryPct?.toFixed(1) || '—', unit: '%', icon: 'arrows-left-right' }
            ];

            container.innerHTML = `
                <div class="vald-header">
                    <div class="vald-status-dot" style="background:${this._getStatusColor(data.semaphore?.status)}"></div>
                    <span class="vald-title">VALD FORCE-DECKS ANALYSIS</span>
                </div>
                
                <div class="vald-hero">
                    <div class="anatomy-view">
                        ${this._renderAnatomy('front', data.muscleMap)}
                        <span>Front</span>
                    </div>
                    <div class="anatomy-view">
                        ${this._renderAnatomy('back', data.muscleMap)}
                        <span>Back</span>
                    </div>
                </div>

                <div class="vald-kpi-grid">
                    ${kpi.map(item => `
                        <div class="vald-kpi-card">
                            <span class="kpi-label"><i class="ph ph-${item.icon}"></i> ${item.label}</span>
                            <span class="kpi-value">${item.value}<small>${item.unit}</small></span>
                        </div>
                    `).join('')}
                </div>

                <div class="vald-ai-actions" id="vald-ai-section-${athleteId}">
                    <button class="btn btn-ai-primary" onclick="window.__valdAi('${athleteId}', 'diagnosis')"><i class="ph ph-brain"></i> Analisi Stato di Forma (AI)</button>
                    <button class="btn btn-ai-secondary" onclick="window.__valdAi('${athleteId}', 'plan')"><i class="ph ph-barbell"></i> Piano di Intervento (AI)</button>
                </div>
            `;

        } catch (e) {
            container.innerHTML = `<div class="error-box">Errore VALD: ${e.message}</div>`;
        }
    },

    /**
     * Renderizza gli SVG dell'anatomia con i colori dei muscoli
     */
    _renderAnatomy(view, muscleMap = {}) {
        const getColor = (muscle) => muscleMap[muscle] || 'var(--color-anatomy-default)';
        
        // Semplificazione: ritorno un placeholder SVG o l'immagine con overlay
        // In produzione usiamo gli SVG completi estratti dal monolite
        return `
            <div class="anatomy-container ${view}">
                <img src="assets/img/anatomy/body_${view}.png" style="width:100%; opacity:0.3;">
                <svg viewBox="0 0 100 100" class="anatomy-overlay">
                    <!-- I cerchi rappresentano i gruppi muscolari principali -->
                    <circle cx="50" cy="35" r="5" fill="${getColor('core')}" />
                    <circle cx="43" cy="65" r="6" fill="${getColor('quads_l')}" />
                    <circle cx="57" cy="65" r="6" fill="${getColor('quads_r')}" />
                </svg>
            </div>
        `;
    },

    _getStatusColor(status) {
        const colors = { GREEN: '#00E676', YELLOW: '#FFD600', RED: '#FF1744' };
        return colors[status] || '#888';
    },

    async _loadActivityLogs(athleteId) {
        const container = document.getElementById("logs-section");
        if (!container) return;

        try {
            const logs = await AthletesAPI.getActivityLog(athleteId);
            if (!logs || logs.length === 0) {
                container.innerHTML = '<p class="text-muted">Nessun log attività recente.</p>';
                return;
            }

            container.innerHTML = `
                <h3 class="section-title">Log Attività Recenti</h3>
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>RPE</th>
                                <th>Carico</th>
                                <th>Stato ACWR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(log => `
                                <tr>
                                    <td>${Utils.formatDate(log.log_date)}</td>
                                    <td>${Utils.escapeHtml(log.activity_type)}</td>
                                    <td>${log.rpe}/10</td>
                                    <td><strong>${log.load_value}</strong></td>
                                    <td>${Utils.riskBadge(log.acwr_risk)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            container.innerHTML = '<p class="text-danger">Errore caricamento log.</p>';
        }
    },

    async _syncVald(athleteId) {
        UI.loading(true);
        try {
            await Store.api("sync", "vald", { athleteId });
            UI.toast("Sincronizzazione completata", "success");
            this._loadValdData(athleteId);
        } catch (e) {
            UI.toast("Errore sync: " + e.message, "error");
        } finally {
            UI.loading(false);
        }
    }
};
