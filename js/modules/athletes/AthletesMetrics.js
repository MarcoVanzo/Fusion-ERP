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

        await this._loadValdData(athleteId);
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
                <div id="vald-history-container" style="margin-top:var(--sp-4);">
                    ${this._renderValdMeasurements(data.results)}
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
            if (!color) return `fill="rgba(0, 255, 188, 0.08)" stroke="rgba(0, 255, 188, 0.15)" stroke-width="0.3" class="muscle-blob"`;
            // Color decisi e bordi netti come richiesto
            return `fill="${color}" stroke="#fff" stroke-width="1.5" class="muscle-blob active" style="filter: drop-shadow(0 0 3px ${color}); opacity: 0.9;"`;
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

    /**
     * Renderizza la tabella delle misurazioni VALD
     */
    _renderValdMeasurements(results = []) {
        if (!results || results.length === 0) return '';
        
        return `
            <div class="logs-section">
                <h3 class="section-title">Storico Misurazioni VALD</h3>
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Data Test</th>
                                <th>Test</th>
                                <th class="text-end">Jump Height</th>
                                <th class="text-end">RSImod</th>
                                <th class="text-end">Asimmetria Atterraggio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.map(res => {
                                const m = res.metrics || {};
                                const asy = res.asymmetry?.landing?.asymmetry?.toFixed(1) || '—';
                                const jh = (m.JumpHeightTotal?.Value || m.JumpHeight?.Value || 0).toFixed(1);
                                const rsi = (m.RSIModified?.Value || 0).toFixed(3);
                                
                                return `
                                    <tr>
                                        <td><small>${new Date(res.test_date).toLocaleDateString('it-IT')}</small></td>
                                        <td><strong>${res.test_type}</strong></td>
                                        <td class="text-end">${jh} <small>cm</small></td>
                                        <td class="text-end"><strong>${rsi}</strong></td>
                                        <td class="text-end" style="color:${parseFloat(asy) > 15 ? '#FF1744' : 'inherit'}">
                                            ${asy}%
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async _loadActivityLogs(athleteId) {
        // Metodo rimosso in favore di _renderValdMeasurements
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
