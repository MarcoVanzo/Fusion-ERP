/**
 * AthletesMetrics — Gestione performance e integrazione VALD
 * Redesigned for Premium Elite Sports Analytics Experience
 */

import { AthletesAPI } from './AthletesAPI.js';

export const AthletesMetrics = {
    /**
     * Renderizza la sezione metriche per un singolo atleta
     */
    async render(container, athleteId) {
        container.innerHTML = `
            <div class="perf-dashboard-v2">
                <div id="vald-section">
                    <div class="section-loader" style="padding:40px; text-align:center;">
                        <i class="ph ph-circle-notch animate-spin" style="font-size:32px; color:var(--color-pink); opacity:0.5;"></i>
                        <p style="margin-top:16px; font-size:13px; opacity:0.4; letter-spacing:1px;">CARICAMENTO TELEMETRIA VALD...</p>
                    </div>
                </div>
            </div>
        `;

        await this._loadValdData(athleteId);
    },

    /**
     * Carica e renderizza i dati VALD con il nuovo layout premium
     */
    async _loadValdData(athleteId) {
        const container = document.getElementById("vald-section");
        if (!container) return;

        try {
            const data = await Store.get("analytics", "vald", { athleteId });
            
            if (!data || !data.hasData) {
                container.innerHTML = `
                    <div class="card glass-card" style="padding:80px 40px; text-align:center; border:1px dashed rgba(255,255,255,0.1); background:rgba(255,255,255,0.01);">
                        <div style="width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; margin:0 auto 24px; color:rgba(255,255,255,0.1);">
                            <i class="ph ph-lightning-slash" style="font-size:40px;"></i>
                        </div>
                        <h3 style="font-family:var(--font-display); font-size:20px; color:var(--color-white); margin-bottom:8px;">Nessun dato VALD rilevato</h3>
                        <p style="color:var(--color-text-muted); max-width:400px; margin:0 auto 24px;">Sincronizza i dati da VALD Hub o carica un file CSV ForceDecks per visualizzare l'analisi biomeccanica dell'atleta.</p>
                        <div style="display:flex; justify-content:center; gap:12px;">
                            <button class="btn btn-primary btn-sm" id="vald-sync-btn"><i class="ph ph-arrows-clockwise"></i> Sincronizza Ora</button>
                            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('vald-upload-hidden').click()"><i class="ph ph-upload-simple"></i> Carica CSV</button>
                            <input type="file" id="vald-upload-hidden" style="display:none;" accept=".csv" onchange="AthletesMetrics._handleCsvUpload('${athleteId}', this)">
                        </div>
                    </div>
                `;
                document.getElementById("vald-sync-btn").onclick = () => this._syncVald(athleteId);
                return;
            }

            const rsiStatusColor = this._getStatusColor(data.semaphore?.status);
            const rsiZ = data.rsiZScore || 0;

            container.innerHTML = `
                <!-- Dashboard Header -->
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <div style="width:8px; height:8px; border-radius:50%; background:${rsiStatusColor}; box-shadow: 0 0 10px ${rsiStatusColor};"></div>
                            <span style="font-size:10px; font-weight:900; letter-spacing:2px; color:rgba(255,255,255,0.5); text-transform:uppercase;">VALD ForceDecks Telemetry</span>
                        </div>
                        <h2 style="font-family:var(--font-display); font-size:28px; font-weight:800; color:var(--color-white); margin:0;">Performance Analysis</h2>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-ghost btn-xs" id="vald-upload-btn" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
                            <i class="ph ph-upload-simple"></i> CSV ForceDecks
                        </button>
                        <button class="btn btn-ghost btn-xs" id="vald-sync-btn-header" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
                            <i class="ph ph-arrows-clockwise"></i> Sync Hub
                        </button>
                    </div>
                </div>

                ${data.strategyShiftAlert ? `
                    <div class="alert alert-warning alert-glitch" style="margin-bottom:32px; border-left:4px solid #FFD600; background:rgba(255, 214, 0, 0.05); padding:16px 20px; border-radius:12px;">
                        <div style="display:flex; gap:14px; align-items:center;">
                            <div style="width:40px; height:40px; border-radius:10px; background:rgba(255, 214, 0, 0.1); display:flex; align-items:center; justify-content:center; color:#FFD600;">
                                <i class="ph ph-warning-diamond" style="font-size:24px;"></i>
                            </div>
                            <div style="flex:1;">
                                <strong style="display:block; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#FFD600; margin-bottom:2px;">Movement Strategy Shift Detected</strong>
                                <span style="font-size:14px; color:rgba(255,255,255,0.9); line-height:1.4; display:block;">${data.strategyShiftAlert}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Main Grid: Anatomy & Performance -->
                <div class="perf-grid-main">
                    <!-- Column 1: Anatomy Blueprint -->
                    <div class="card glass-card blueprint-card" style="padding:24px; display:flex; flex-direction:column; align-items:center; gap:20px; min-height:450px;">
                        <div style="width:100%; display:flex; justify-content:space-between; align-items:flex-start;">
                            <span style="font-size:11px; font-weight:800; color:var(--accent-cyan); letter-spacing:1px;">BIOMECHANICAL MAP</span>
                            <div style="text-align:right;">
                                <div style="font-size:18px; font-weight:800; color:#fff;">${data.asymmetryPct?.toFixed(1) || '0.0'}%</div>
                                <div style="font-size:9px; opacity:0.5; text-transform:uppercase;">Landing Asymmetry</div>
                            </div>
                        </div>
                        
                        <div class="vald-hero" style="width:100%; flex:1; display:flex; justify-content:center; gap:40px; align-items:center;">
                            <div class="anatomy-view" style="position:relative; width:150px;">
                                ${this._renderAnatomy('front', data.muscleMap)}
                                <span style="position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); font-size:10px; opacity:0.3; letter-spacing:2px; font-weight:800;">ANTERIOR</span>
                            </div>
                             <div class="anatomy-view" style="position:relative; width:150px;">
                                ${this._renderAnatomy('back', data.muscleMap)}
                                <span style="position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); font-size:10px; opacity:0.3; letter-spacing:2px; font-weight:800;">POSTERIOR</span>
                            </div>
                        </div>
                        
                        <div style="width:100%; display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px;">
                             <div class="perf-mini-card ${parseFloat(data.asymmetryPct) > 15 ? 'active-pink' : 'active-cyan'}">
                                <span style="font-size:10px; opacity:0.5; text-transform:uppercase;">Arto Debole</span>
                                <span style="font-size:16px; font-weight:800; color:#fff;">${data.semaphore?.asymmetry?.weaker || 'N/D'}</span>
                             </div>
                             <div class="perf-mini-card active-cyan">
                                <span style="font-size:10px; opacity:0.5; text-transform:uppercase;">Peak Power</span>
                                <span style="font-size:16px; font-weight:800; color:#fff;">${data.peakPowerBM?.toFixed(1) || '—'} <small style="font-size:10px; font-weight:400; opacity:0.5;">W/kg</small></span>
                             </div>
                        </div>
                    </div>

                    <!-- Column 2: Growth Metrics & Readiness -->
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        
                        <!-- Row 1: Readiness Gauges -->
                        <div class="card glass-card" style="padding:24px; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:20px;">
                            <div style="grid-column: 1 / -1; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
                                <span style="font-size:11px; font-weight:800; color:#FFD600; letter-spacing:1px;">READINESS & FATIGUE (28-DAY ROLLING)</span>
                                <span class="badge ${data.semaphore?.status === 'GREEN' ? 'badge-success' : 'badge-warning'}" style="font-size:10px;">Status: ${data.semaphore?.label || 'Baseline'}</span>
                            </div>
                            
                            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                                ${this._renderGauge(data.semaphore?.rsimod?.variation || 0, rsiStatusColor, 'RSI MOD')}
                                <div style="text-align:center;">
                                    <div style="font-size:18px; font-weight:800; color:${rsiStatusColor}">${data.semaphore?.rsimod?.current?.toFixed(3) || '—'}</div>
                                    <div style="font-size:10px; opacity:0.4;">Z-Score: ${rsiZ?.toFixed(2)}</div>
                                </div>
                            </div>

                            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                                ${this._renderGauge(data.semaphore?.ttto?.variation || 0, '#9682ff', 'TTT Off')}
                                <div style="text-align:center;">
                                    <div style="font-size:18px; font-weight:800; color:#fff;">${data.semaphore?.ttto?.current?.toFixed(0) || '—'} <small style="font-size:10px; opacity:0.4;">ms</small></div>
                                    <div style="font-size:10px; opacity:0.4;">Take-off duration</div>
                                </div>
                            </div>

                            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                                ${this._renderGauge(parseFloat(data.asymmetryPct) * 5, rsiStatusColor, 'Landing')}
                                <div style="text-align:center;">
                                    <div style="font-size:18px; font-weight:800; color:#fff;">${data.asymmetryPct?.toFixed(1) || '0.0'} <small style="font-size:10px; opacity:0.4;">%</small></div>
                                    <div style="font-size:10px; opacity:0.4;">Load Variance</div>
                                </div>
                            </div>
                        </div>

                        <!-- Row 2: Performance Growth -->
                        <div class="card glass-card" style="padding:24px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                <span style="font-size:11px; font-weight:800; color:var(--color-pink); letter-spacing:1px;">PERFORMANCE GROWTH (PEAK)</span>
                                <div style="display:flex; gap:8px;">
                                    <span style="font-size:10px; opacity:0.4;">Last Sync: ${data.results?.[0]?.test_date ? new Date(data.results[0].test_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                                <div class="perf-mini-card active-pink" style="padding:20px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                        <i class="ph ph-arrow-fat-up" style="color:var(--color-pink); font-size:20px;"></i>
                                        <span class="trend ${data.jhTrend > 0 ? 'up' : 'down'}" style="font-size:12px; font-weight:800;">${data.jhTrend > 0 ? '+' : ''}${data.jhTrend?.toFixed(1)}%</span>
                                    </div>
                                    <div style="font-size:32px; font-weight:900; color:#fff; line-height:1;">${data.jumpHeight?.toFixed(1) || '—'} <small style="font-size:14px; opacity:0.4; font-weight:400;">cm</small></div>
                                    <div style="font-size:11px; opacity:0.5; margin-top:4px; text-transform:uppercase; letter-spacing:1px;">Max Jump Height (FT)</div>
                                </div>

                                <div class="perf-mini-card active-pink" style="padding:20px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                        <i class="ph ph-arrows-in" style="color:var(--color-pink); font-size:20px;"></i>
                                        <span style="font-size:10px; opacity:0.5; font-weight:500;">Ecctric Loading</span>
                                    </div>
                                    <div style="font-size:32px; font-weight:900; color:#fff; line-height:1;">${data.brakingImpulse?.toFixed(0) || '—'} <small style="font-size:14px; opacity:0.4; font-weight:400;">Ns</small></div>
                                    <div style="font-size:11px; opacity:0.5; margin-top:4px; text-transform:uppercase; letter-spacing:1px;">Braking Impulse</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- AI Intelligence Section -->
                <div class="card glass-card ai-intel-slot" style="padding:24px; margin-top:24px; border-radius:24px;">
                     <div style="display:flex; gap:24px; align-items:flex-start;">
                        <div style="width:120px; display:flex; flex-direction:column; gap:12px;">
                            <button class="btn btn-ai-primary" style="width:100%; flex-direction:column; padding:16px 10px; gap:8px;" onclick="window.__valdAi('${athleteId}', 'diagnosis')">
                                <i class="ph ph-brain" style="font-size:24px;"></i>
                                <span style="font-size:10px; letter-spacing:0.5px;">DIAGNOSI</span>
                            </button>
                            <button class="btn btn-ai-secondary" style="width:100%; flex-direction:column; padding:16px 10px; gap:8px;" onclick="window.__valdAi('${athleteId}', 'plan')">
                                <i class="ph ph-barbell" style="font-size:24px;"></i>
                                <span style="font-size:10px; letter-spacing:0.5px;">PIANO</span>
                            </button>
                        </div>
                        <div style="flex:1;">
                            <div id="vald-ai-diagnosis-result-${athleteId}" class="ai-result-slot"></div>
                            <div id="vald-ai-plan-result-${athleteId}" class="ai-result-slot"></div>
                            <div id="ai-empty-placeholder" style="padding:20px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.05); text-align:center; color:rgba(255,255,255,0.2);">
                                <i class="ph ph-sparkle" style="font-size:32px; margin-bottom:12px; display:block; margin-left:auto; margin-right:auto;"></i>
                                <p style="font-size:13px;">Seleziona un'azione per avviare l'analisi predittiva tramite AI.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Historical Telemetry Timeline -->
                <div style="margin-top:40px;">
                    <div style="display:flex; align-items:baseline; gap:12px; margin-bottom:20px;">
                        <h3 style="font-family:var(--font-display); font-size:20px; font-weight:800; color:#fff; margin:0;">Telemetry Timeline</h3>
                        <span style="font-size:11px; opacity:0.4; text-transform:uppercase; letter-spacing:1px;">Storico Misurazioni</span>
                    </div>
                    
                    <div class="perf-timeline">
                        ${data.results.map(res => {
                            const m = res.metrics || {};
                            const asy = res.asymmetry?.landing?.asymmetry?.toFixed(1) || '0.0';
                            const jh = (m.JumpHeight?.Value || m.JumpHeightTotal?.Value || 0).toFixed(1);
                            const rsi = (m.RSIModified?.Value || 0).toFixed(3);
                            
                            return `
                                <div class="timeline-entry">
                                    <div class="timeline-date">${new Date(res.test_date).toLocaleDateString('it-IT')}</div>
                                    <div class="timeline-type">${res.test_type}</div>
                                    <div class="timeline-val" style="color:var(--color-pink)">${jh}<small>cm</small></div>
                                    <div class="timeline-val" style="color:#FFD600">${rsi}<small>RSI</small></div>
                                    <div class="timeline-val" style="color:${parseFloat(asy) > 15 ? '#FF1744' : '#00e5ff'}">${asy}<small>% ASY</small></div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            document.getElementById("vald-sync-btn-header").onclick = () => this._syncVald(athleteId);
            document.getElementById("vald-upload-btn").onclick = () => this._handleCsvUpload(athleteId);

        } catch (e) {
            console.error("Errore critico in _loadValdData:", e);
            container.innerHTML = `<div class="error-box" style="padding:40px; border-radius:20px; background:rgba(255,23,68,0.05); border:1px solid rgba(255,23,68,0.2); color:#FF1744; text-align:center;">
                <i class="ph ph-warning-circle" style="font-size:32px; margin-bottom:12px;"></i>
                <p>TELEMETRY_LINK_ERROR: ${e.message}</p>
            </div>`;
        }
    },

    /**
     * Renderizza gli SVG dell'anatomia con i colori dei muscoli (Blueprint Style)
     */
    _renderAnatomy(view, muscleMap = {}) {
        if (!muscleMap) muscleMap = {};
        const getStyles = (muscle) => {
            const color = muscleMap[muscle];
            if (!color) return `fill="rgba(0, 229, 255, 0.08)" stroke="rgba(0, 229, 255, 0.15)" stroke-width="0.3" class="muscle-blob"`;
            return `fill="${color}" stroke="#fff" stroke-width="1.5" class="muscle-blob active" style="color:${color}"`;
        };
        
        return `
            <div class="anatomy-container ${view}" style="width:100%; height:100%;">
                <img src="assets/img/anatomy/body_${view}.png" class="anatomy-cyber-body" style="width:100%; display:block;">
                <svg viewBox="0 0 100 120" style="position:absolute; top:0; left:0; width:100%; height:100%;">
                    ${view === 'front' ? `
                        <ellipse cx="50" cy="38" rx="12" ry="15" ${getStyles('core')} />
                        <ellipse cx="42" cy="54" rx="8" ry="6" ${getStyles('hips_l')} />
                        <ellipse cx="58" cy="54" rx="8" ry="6" ${getStyles('hips_r')} />
                        <ellipse cx="42" cy="75" rx="8" ry="14" ${getStyles('quads_l')} />
                        <ellipse cx="58" cy="75" rx="8" ry="14" ${getStyles('quads_r')} />
                    ` : `
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

    /**
     * Renderizza un gauge CSS per i parametri di readiness
     */
    _renderGauge(variationPercent, color, label) {
        // Variation is 0-20% usually, map it to 0-100% for the gauge
        // We want 100% to be 20% variation (red zone)
        const displayPercent = Math.min(100, (Math.abs(variationPercent) / 20) * 100);
        return `
            <div class="gauge-container" style="--gauge-percent:${displayPercent}; --gauge-color:${color};">
                <div class="gauge-track"></div>
                <div class="gauge-fill"></div>
                <div class="gauge-value" style="color:${color}">${Math.abs(variationPercent).toFixed(1)}%</div>
                <div class="gauge-label">${label}</div>
            </div>
        `;
    },

    _getStatusColor(status) {
        const colors = { GREEN: '#00E676', YELLOW: '#FFD600', RED: '#FF1744' };
        return colors[status] || '#888';
    },

    async _syncVald(athleteId) {
        UI.loading(true, "Connessione a VALD Hub...");
        try {
            await Store.api("sync", "vald", { athleteId });
            UI.toast("Sincronizzazione completata", "success");
            this._loadValdData(athleteId);
        } catch (e) {
            UI.toast("Errore sync: " + e.message, "error");
        } finally {
            UI.loading(false);
        }
    },

    async _handleCsvUpload(athleteId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e) => this._processUpload(athleteId, e.target);
        input.click();
    },

    async _processUpload(athleteId, input) {
        const file = input.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('athleteId', athleteId);
        
        UI.loading(true, "AI Biomechanical Engine in corso...");
        
        try {
            const response = await fetch('api/?module=vald&action=uploadCsv', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                UI.toast("Analisi completata con successo", "success");
                this._loadValdData(athleteId);
            } else {
                throw new Error(result.error || "Errore sconosciuto");
            }
        } catch (err) {
            UI.toast("Errore: " + err.message, "error");
        } finally {
            UI.loading(false);
        }
    }
};
