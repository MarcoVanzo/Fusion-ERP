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
                            <span style="font-size:10px; font-weight:900; letter-spacing:2px; color:rgba(255,255,255,0.5); text-transform:uppercase;">VALD ForceDecks Telemetry System</span>
                        </div>
                        <h2 style="font-family:var(--font-display); font-size:28px; font-weight:800; color:var(--color-white); margin:0; letter-spacing:-0.5px;">Performance Analysis</h2>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-ghost btn-xs" id="vald-upload-btn" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);">
                            <i class="ph ph-upload-simple"></i> CSV FORCE-DECKS
                        </button>
                        <button class="btn btn-ghost btn-xs" id="vald-sync-btn-header" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);">
                            <i class="ph ph-arrows-clockwise"></i> SYNC HUB
                        </button>
                    </div>
                </div>

                ${data.strategyShiftAlert ? `
                    <div class="alert alert-warning alert-glitch" style="margin-bottom:32px; border:1px solid rgba(255, 214, 0, 0.2); background:rgba(255, 214, 0, 0.05); padding:16px 20px; border-radius:12px;">
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

                <!-- Main Content: KPIs & Readiness -->
                <div class="perf-grid-kpis" style="display:grid; grid-template-columns: 1fr 1.6fr; gap:24px; margin-top:24px;">
                    <!-- Column 1: Performance Summary -->
                    <div style="display:flex; flex-direction:column; gap:20px;">
                        <div class="card glass-card" style="padding:24px;">
                            <span style="font-size:11px; font-weight:900; color:var(--accent-cyan); letter-spacing:1px; text-transform:uppercase; display:block; margin-bottom:16px;">Biomechanical Status</span>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <div style="font-size:32px; font-weight:900; color:#fff; font-family:var(--font-display);">${data.asymmetryPct?.toFixed(1) || '0.0'}%</div>
                                    <div style="font-size:10px; opacity:0.4; font-weight:800; text-transform:uppercase;">Asymmetry</div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="font-size:15px; font-weight:800; color:${parseFloat(data.asymmetryPct) > 15 ? 'var(--color-pink)' : 'var(--accent-cyan)'};">${data.semaphore?.asymmetry?.weaker || 'BALANCED'}</div>
                                    <div style="font-size:9px; opacity:0.4; font-weight:700;">WEAK_LIMB</div>
                                </div>
                            </div>
                        </div>

                        <div class="card glass-card" style="padding:24px;">
                             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span style="font-size:11px; font-weight:900; color:var(--color-pink); letter-spacing:1px; text-transform:uppercase;">Explosive Power</span>
                                <span class="trend up" style="font-size:11px; font-weight:900; color:var(--color-pink);">+${data.jhTrend?.toFixed(1)}%</span>
                             </div>
                             <div style="font-size:40px; font-weight:900; color:#fff; font-family:var(--font-display); line-height:1;">${data.jumpHeight?.toFixed(1) || '0.0'} <small style="font-size:16px; opacity:0.3; font-weight:400;">cm</small></div>
                             <div style="font-size:10px; opacity:0.3; font-weight:800; margin-top:10px; text-transform:uppercase;">Peak Flight Height</div>
                        </div>

                        <div class="perf-mini-card active-cyan" style="padding:20px;">
                            <span style="font-size:9px; opacity:0.4; text-transform:uppercase; font-weight:800;">RELATIVE_PEAK_POWER</span>
                            <div style="font-size:24px; font-weight:900; color:#fff; margin-top:4px;">${data.peakPowerBM?.toFixed(1) || '0.0'} <small style="font-size:12px; opacity:0.4;">W/kg</small></div>
                        </div>
                    </div>

                    <!-- Column 2: Readiness Gauges -->
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        <div class="card glass-card" style="padding:32px; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:20px; align-items:center;">
                            <div style="grid-column: 1 / -1; display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size:12px; font-weight:900; color:#FFD600; letter-spacing:1.5px; text-transform:uppercase;">Readiness & Readiness Index</span>
                                    <span style="font-size:9px; opacity:0.3; text-transform:uppercase; font-weight:700;">28-Day Rolling Baseline Integration</span>
                                </div>
                                <div class="badge" style="padding:6px 12px; background:${rsiStatusColor}15; color:${rsiStatusColor}; border:1px solid ${rsiStatusColor}40; font-size:10px; font-weight:900;">${data.semaphore?.label || 'STABLE'}</div>
                            </div>
                            
                            <div style="display:flex; flex-direction:column; align-items:center;">
                                ${this._renderGauge(data.semaphore?.rsimod?.variation || 0, rsiStatusColor, 'RSI_MOD')}
                                <div style="text-align:center; margin-top:12px;">
                                    <div style="font-size:24px; font-weight:900; color:${rsiStatusColor}">${data.semaphore?.rsimod?.current?.toFixed(3) || '0.000'}</div>
                                    <div style="font-size:10px; opacity:0.4; font-weight:800;">Z-SCORE: ${rsiZ?.toFixed(2)}</div>
                                </div>
                            </div>

                            <div style="display:flex; flex-direction:column; align-items:center;">
                                ${this._renderGauge(data.semaphore?.ttto?.variation || 0, '#9682ff', 'TTT_OFF')}
                                <div style="text-align:center; margin-top:12px;">
                                    <div style="font-size:24px; font-weight:900; color:#fff;">${data.semaphore?.ttto?.current?.toFixed(0) || '0'} <small style="font-size:11px; opacity:0.4;">ms</small></div>
                                    <div style="font-size:10px; opacity:0.4; font-weight:800;">TAKE-OFF DUR.</div>
                                </div>
                            </div>

                            <div style="display:flex; flex-direction:column; align-items:center;">
                                ${this._renderGauge(parseFloat(data.asymmetryPct) * 4, rsiStatusColor, 'ASYMMETRY')}
                                <div style="text-align:center; margin-top:12px;">
                                    <div style="font-size:24px; font-weight:900; color:#fff;">${data.asymmetryPct?.toFixed(1) || '0.0'} <small style="font-size:11px; opacity:0.4;">%</small></div>
                                    <div style="font-size:10px; opacity:0.4; font-weight:800;">LANDING_VARIANCE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- NEW: Full-Width Massive Anatomy Blueprint Section -->
                <div class="card glass-card blueprint-card" style="margin-top:32px; padding:60px 40px; border-radius:32px; background:#050508; width:100%; border:1px solid rgba(0, 229, 255, 0.1);">
                    <div style="display:flex; justify-content:center; align-items:center; gap:24px; margin-bottom:60px;">
                         <div style="width:100px; height:1px; background:linear-gradient(90deg, transparent, var(--accent-cyan));"></div>
                         <h3 style="font-family:var(--font-display); font-size:24px; font-weight:800; color:#fff; margin:0; letter-spacing:4px; text-transform:uppercase;">Biomechanical Blueprint</h3>
                         <div style="width:100px; height:1px; background:linear-gradient(90deg, var(--accent-cyan), transparent);"></div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:80px; align-items:center; min-height:1000px; width:100%; margin:0 auto;">
                        <div class="anatomy-entry" style="position:relative; width:100%; height:1000px; filter:drop-shadow(0 0 100px rgba(0, 229, 255, 0.1));">
                            ${this._renderAnatomy('front', data.muscleMap)}
                            <div style="position:absolute; bottom:-40px; left:50%; transform:translateX(-50%); white-space:nowrap;">
                                <span style="font-size:12px; font-weight:900; letter-spacing:6px; color:var(--accent-cyan); opacity:0.4;">ANTERIOR_VIEW_SILHOUETTE</span>
                            </div>
                        </div>
                        <div class="anatomy-entry" style="position:relative; width:100%; height:1000px; filter:drop-shadow(0 0 100px rgba(0, 229, 255, 0.1));">
                            ${this._renderAnatomy('back', data.muscleMap)}
                            <div style="position:absolute; bottom:-40px; left:50%; transform:translateX(-50%); white-space:nowrap;">
                                <span style="font-size:12px; font-weight:900; letter-spacing:6px; color:var(--accent-cyan); opacity:0.4;">POSTERIOR_VIEW_SILHOUETTE</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI Intelligence Section -->
                <div class="card glass-card ai-intel-slot" style="padding:32px; margin-top:24px; border-radius:24px;">
                     <div style="display:flex; gap:32px; align-items:flex-start;">
                        <div style="width:140px; display:flex; flex-direction:column; gap:16px;">
                            <button class="btn btn-ai-primary" style="width:100%; flex-direction:column; padding:20px 12px; gap:8px; border-radius:16px;" onclick="window.__valdAi('${athleteId}', 'diagnosis')">
                                <i class="ph ph-brain" style="font-size:28px;"></i>
                                <span style="font-size:11px; letter-spacing:1px; font-weight:900;">DIAGNOSI</span>
                            </button>
                            <button class="btn btn-ai-secondary" style="width:100%; flex-direction:column; padding:20px 12px; gap:8px; border-radius:16px;" onclick="window.__valdAi('${athleteId}', 'plan')">
                                <i class="ph ph-barbell" style="font-size:28px;"></i>
                                <span style="font-size:11px; letter-spacing:1px; font-weight:900;">PIANO_AI</span>
                            </button>
                        </div>
                        <div style="flex:1;">
                            <div id="vald-ai-diagnosis-result-${athleteId}" class="ai-result-slot"></div>
                            <div id="vald-ai-plan-result-${athleteId}" class="ai-result-slot"></div>
                            <div id="ai-empty-placeholder" style="padding:40px; border-radius:20px; background:rgba(255,255,255,0.01); border:1px dashed rgba(255,255,255,0.05); text-align:center; color:rgba(255,255,255,0.2);">
                                <i class="ph ph-sparkle animate-pulse" style="font-size:40px; margin-bottom:16px; display:block; margin-left:auto; margin-right:auto; color:var(--color-pink); opacity:0.5;"></i>
                                <h4 style="font-family:var(--font-display); color:#fff; margin-bottom:8px;">AI Performance Assistant</h4>
                                <p style="font-size:13px; max-width:320px; margin:0 auto;">Avvia un'analisi biomeccanica profonda per rilevare pattern di fatica e ricevere consigli sull'allenamento.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Historical Telemetry Timeline -->
                <div style="margin-top:40px;">
                    <div style="display:flex; align-items:baseline; gap:12px; margin-bottom:20px;">
                        <h3 style="font-family:var(--font-display); font-size:20px; font-weight:800; color:#fff; margin:0;">Telemetry Log</h3>
                        <span style="font-size:10px; opacity:0.4; text-transform:uppercase; letter-spacing:2px; font-weight:800;">Historical Data Stream</span>
                    </div>
                    
                    <div class="perf-timeline">
                        <div class="timeline-header" style="display:grid; grid-template-columns: 120px 1.5fr 1fr 1fr 1fr; padding:10px 20px; font-size:9px; font-weight:900; opacity:0.3; text-transform:uppercase; letter-spacing:1px;">
                            <span>Date</span>
                            <span>Test Type</span>
                            <span style="text-align:right;">Height</span>
                            <span style="text-align:right;">RSI_Mod</span>
                            <span style="text-align:right;">Asymmetry</span>
                        </div>
                        ${data.results.map(res => {
                            const m = res.metrics || {};
                            const asy = res.asymmetry?.landing?.asymmetry?.toFixed(1) || '0.0';
                            const jh = (m.JumpHeight?.Value || m.JumpHeightTotal?.Value || 0).toFixed(1);
                            const rsi = (m.RSIModified?.Value || 0).toFixed(3);
                            
                            return `
                                <div class="timeline-entry" style="display:grid; grid-template-columns: 120px 1.5fr 1fr 1fr 1fr; padding:15px 20px; align-items:center;">
                                    <div class="timeline-date" style="opacity:0.6;">${new Date(res.test_date).toLocaleDateString('it-IT')}</div>
                                    <div class="timeline-type" style="font-weight:700;">${res.test_type}</div>
                                    <div class="timeline-val" style="color:var(--color-pink); text-align:right; font-weight:800;">${jh}<small>cm</small></div>
                                    <div class="timeline-val" style="color:#FFD600; text-align:right; font-weight:800;">${rsi}</div>
                                    <div class="timeline-val" style="color:${parseFloat(asy) > 15 ? '#FF1744' : '#00e5ff'}; text-align:right; font-weight:800;">${asy}<small>%</small></div>
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
            container.innerHTML = `<div class="error-box">ERROR::DATA_LOAD_FAILED ${e.message}</div>`;
        }
    },

    /**
     * Renderizza gli SVG dell'anatomia FEMMINILE in modalità HYBRID (Realistic 3D + SVG Data)
     * High-fidelity medical renders for visualization with transparent SVG overlays for interactive data.
     */
    _renderAnatomy(view, muscleMap = {}) {
        if (!muscleMap) muscleMap = {};
        const getStyles = (muscle) => {
            const color = muscleMap[muscle];
            if (!color) return `class="muscle-region" fill="rgba(0, 229, 255, 0.01)"`;
            return `class="muscle-region active" style="--color-active:${color};"`;
        };
        
        const imgSrc = `assets/anatomy/female_muscle_${view}.png`;

        // Interactive High-Performance Highlighting (Calibrated to 3D Assets)
        return `
            <div class="anatomy-container ${view}" style="width:100%; height:100%; position:relative; overflow:hidden; background:#000; display:flex; align-items:center; justify-content:center;">
                <!-- High-Fidelity 3D Medical Render (Muscle Fibers - Myology) -->
                <img src="${imgSrc}" alt="${view} anatomy" style="
                    position:absolute; 
                    top:0; 
                    left:50%; 
                    transform:translateX(-50%); 
                    height:100%; 
                    width:auto; 
                    object-fit:contain; 
                    opacity:0.85; 
                    mix-blend-mode:screen;
                    filter: brightness(1.1) contrast(1.15);
                    z-index:1;
                ">

                <!-- Interactive SVG Telemetry Overlay -->
                <svg viewBox="0 0 100 240" style="
                    position:absolute; 
                    top:0; 
                    left:50%; 
                    transform:translateX(-50%);
                    width:auto;
                    height:100%; 
                    aspect-ratio: 100 / 240;
                    z-index:2; 
                    pointer-events:none;
                ">
                    <defs>
                        <filter id="neonGlowOutline" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    <!-- MUSCLE REGION HIGHLIGHTS (Data-Driven Neon Glows) -->
                    ${view === 'front' ? `
                        <!-- Quads (Calibrated to Realistic Muscle Tiers) -->
                        <path d="M34,120 c-2,15 -3,40 -1,60 c1,10 4,12 8,12 c4,0 5,-5 6,-15 c1,-20 -2,-45 -4,-65 c-1,-10 -4,-10 -9,8" 
                            ${getStyles('quads_l')} filter="url(#neonGlowOutline)" />
                        <path d="M66,120 c2,15 3,40 1,60 c-1,10 -4,12 -8,12 c-4,0 -5,-5 -6,-15 c-1,-20 2,-45 4,-65 c1,-10 4,-10 9,8" 
                            ${getStyles('quads_r')} filter="url(#neonGlowOutline)" />
                        
                        <!-- Core / Abs (Centralized on 3D Model) -->
                        <path d="M42,65 c0,10 0,30 2,40 c2,15 10,15 12,0 c2,-10 2,-30 0,-40 c-2,-10 -10,-10 -14,0" 
                            ${getStyles('core')} filter="url(#neonGlowOutline)" />
                        
                        <!-- Hips / Lateral Stabilizers -->
                        <ellipse cx="36" cy="100" rx="5" ry="12" ${getStyles('hips_l')} filter="url(#neonGlowOutline)" />
                        <ellipse cx="64" cy="100" rx="5" ry="12" ${getStyles('hips_r')} filter="url(#neonGlowOutline)" />
                    ` : `
                        <!-- Glutes (Powerful Base Highlights) -->
                        <path d="M36,95 c-5,5 -9,25 -5,45 c3,12 15,18 20,8 c5,-8 7,-25 4,-45 c-2,-12 -12,-18 -19,-8" 
                            ${getStyles('glutes_l')} filter="url(#neonGlowOutline)" />
                        <path d="M64,95 c5,5 9,25 5,45 c-3,12 -15,18 -20,8 c-5,-8 -7,-25 -4,-45 c2,-12 12,-18 19,-8" 
                            ${getStyles('glutes_r')} filter="url(#neonGlowOutline)" />
                        
                        <!-- Hamstrings -->
                        <path d="M35,155 c-2,15 -3,40 -1,60 c1,10 5,8 8,0 c3,-25 2,-50 -1,-70 c-1,-10 -5,-10 -6,10" 
                            ${getStyles('hams_l')} filter="url(#neonGlowOutline)" />
                        <path d="M65,155 c2,15 3,40 1,60 c-1,10 -5,8 -8,0 c-3,-25 -2,-50 1,-70 c1,-10 5,-10 6,10" 
                            ${getStyles('hams_r')} filter="url(#neonGlowOutline)" />
                    `}
                </svg>
            </div>
        `;
    },

    /**
     * Renderizza un gauge SVG semi-circolare (180 gradi) con precisione matematica
     */
    _renderGauge(variationPercent, color, label) {
        const percent = Math.min(100, (Math.abs(variationPercent) / 20) * 100);
        const radius = 55;
        const circumference = Math.PI * radius; // Half circumference
        const offset = circumference - (percent / 100) * circumference;

        return `
            <div class="gauge-svg-container">
                <svg viewBox="0 0 130 75" preserveAspectRatio="xMidYMax meet" style="width:100%; height:100%;">
                    <path class="gauge-svg-bg" d="M 10 65 A 55 55 0 0 1 120 65" />
                    <path class="gauge-svg-val" 
                          d="M 10 65 A 55 55 0 0 1 120 65" 
                          style="--gauge-color:${color}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};" />
                </svg>
                <div class="gauge-svg-text">
                    <span style="font-size:10px; font-weight:900; opacity:0.3; letter-spacing:1px;">${label}</span>
                    <span style="font-size:13px; font-weight:800; color:${color}; margin-top:-2px;">${variationPercent > 0 ? '+' : ''}${variationPercent.toFixed(1)}%</span>
                </div>
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
