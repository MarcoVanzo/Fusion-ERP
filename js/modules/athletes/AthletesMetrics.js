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
                    <div style="display:flex; align-items:center; gap:var(--sp-2);">
                        <div class="vald-status-dot" style="background:${this._getStatusColor(data.semaphore?.status)}"></div>
                        <span class="vald-title">VALD FORCE-DECKS ANALYSIS</span>
                    </div>
                    <button class="btn btn-default btn-xs" id="vald-sync-btn-header">
                        <i class="ph ph-arrows-clockwise"></i> Sincronizza
                    </button>
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

                <div class="vald-ai-actions-v2" id="vald-ai-section-${athleteId}">
                    <div class="ai-action-block">
                        <button class="btn btn-ai-primary w-100" id="vald-ai-dx-btn-${athleteId}" onclick="window.__valdAi('${athleteId}', 'diagnosis')">
                            <i class="ph ph-brain"></i> Analisi Stato di Forma (AI)
                        </button>
                        <div id="vald-ai-diagnosis-result-${athleteId}" class="ai-result-slot"></div>
                    </div>
                    
                    <div class="ai-action-block">
                        <button class="btn btn-ai-secondary w-100" id="vald-ai-pl-btn-${athleteId}" onclick="window.__valdAi('${athleteId}', 'plan')">
                            <i class="ph ph-barbell"></i> Piano di Intervento (AI)
                        </button>
                        <div id="vald-ai-plan-result-${athleteId}" class="ai-result-slot"></div>
                    </div>
                </div>
            `;

            document.getElementById("vald-sync-btn-header").onclick = () => this._syncVald(athleteId);
        } catch (e) {
            container.innerHTML = `<div class="error-box">Errore VALD: ${e.message}</div>`;
        }
    },

    /**
     * Renderizza gli SVG dell'anatomia con i colori dei muscoli
     */
    _renderAnatomy(view, muscleMap = {}) {
        const getStyles = (muscle) => {
            const color = muscleMap[muscle];
            if (!color) return `fill="rgba(0, 255, 188, 0.15)" stroke="rgba(0, 255, 188, 0.2)" stroke-width="0.5" class="muscle-blob"`;
            return `fill="${color}" stroke="${color}" stroke-width="2" class="muscle-blob muscle-pulse active" style="filter: drop-shadow(0 0 5px ${color});"`;
        };
        
        return `
            <div class="anatomy-container ${view}">
                <img src="assets/img/anatomy/body_${view}.png" class="anatomy-cyber-body">
                <svg viewBox="0 0 100 120" class="anatomy-overlay">
                    ${view === 'front' ? `
                        <!-- Front View -->
                        <ellipse cx="50" cy="38" rx="12" ry="15" ${getStyles('core')} />
                        <ellipse cx="42" cy="54" rx="8" ry="6" ${getStyles('hips_l')} />
                        <ellipse cx="58" cy="54" rx="8" ry="6" ${getStyles('hips_r')} />
                        <ellipse cx="42" cy="75" rx="8" ry="14" ${getStyles('quads_l')} />
                        <ellipse cx="58" cy="75" rx="8" ry="14" ${getStyles('quads_r')} />
                    ` : `
                        <!-- Back View -->
                        <ellipse cx="50" cy="38" rx="12" ry="15" ${getStyles('core')} />
                        <ellipse cx="42" cy="56" rx="9" ry="10" ${getStyles('glutes_l')} />
                        <ellipse cx="58" cy="56" rx="9" ry="10" ${getStyles('glutes_r')} />
                        <ellipse cx="42" cy="78" rx="8" ry="14" ${getStyles('hamstrings_l')} />
                        <ellipse cx="58" cy="78" rx="8" ry="14" ${getStyles('hamstrings_r')} />
                        <ellipse cx="42" cy="95" rx="5" ry="9" ${getStyles('calves_l')} />
                        <ellipse cx="58" cy="95" rx="5" ry="9" ${getStyles('calves_r')} />
                    `}
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
            const sections = await AthletesAPI.getActivityLog(athleteId);
            
            // Appiattiamo i log da tutte le sezioni (anagrafica, metrics, etc.) per la tabella
            const allLogs = [];
            if (sections && typeof sections === 'object') {
                Object.values(sections).forEach(sectionArray => {
                    if (Array.isArray(sectionArray)) {
                        allLogs.push(...sectionArray);
                    }
                });
            }

            if (allLogs.length === 0) {
                container.innerHTML = '<p class="text-muted" style="padding:var(--sp-4);">Nessun log attività recente disponibile.</p>';
                return;
            }

            // Ordiniamo per data decrescente
            allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            container.innerHTML = `
                <h3 class="section-title">Audit Log Attività</h3>
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Azione</th>
                                <th class="text-end">Operatore</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allLogs.map(log => `
                                <tr>
                                    <td><small>${new Date(log.created_at).toLocaleString('it-IT')}</small></td>
                                    <td>
                                        <div style="font-weight:600; font-size:0.85rem;">${Utils.escapeHtml(log.action)}</div>
                                        <div style="font-size:0.75rem; opacity:0.7;">Tabella: ${log.table_name}</div>
                                    </td>
                                    <td class="text-end"><small>${Utils.escapeHtml(log.operator)}</small></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            console.error("Error loading logs:", e);
            container.innerHTML = '<p class="text-danger">Errore caricamento log attività.</p>';
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
