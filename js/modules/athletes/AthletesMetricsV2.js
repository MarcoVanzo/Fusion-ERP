/**
 * AthletesMetrics — Gestione performance e integrazione VALD
 * Redesigned for Premium Elite Sports Analytics Experience (MED-VIEW)
 */

import { AthletesAPI } from './AthletesAPI.js';

export const AthletesMetrics = {
    /**
     * Renderizza la sezione metriche per un singolo atleta
     */
    async render(container, athleteId) {
        container.innerHTML = `
            <div class="perf-dashboard-v2" style="background-color: #030816; overflow: hidden; position: relative;">
                <div id="vald-section" style="width: 100%; height: 100%;">
                    <div class="section-loader" style="padding:100px; text-align:center;">
                        <i class="ph ph-circle-notch animate-spin" style="font-size:32px; color:#00E676; opacity:0.8;"></i>
                        <p style="margin-top:16px; font-size:13px; opacity:0.6; letter-spacing:2px; color:#00E676;">INITIALIZING BIO-TELEMETRY...</p>
                    </div>
                </div>
            </div>
        `;

        await this._loadValdData(athleteId);
    },

    /**
     * Carica e renderizza i dati VALD con il layout MED-VIEW
     */
    async _loadValdData(athleteId) {
        const container = document.getElementById("vald-section");
        if (!container) return;

        try {
            const data = await Store.get("analytics", "vald", { athleteId });
            
            // Per il mock, assumiamo i dati della foto pari a 1:1
            container.innerHTML = `
                <style>
                    .med-view {
                        background-color: #030a16;
                        background-image: 
                            linear-gradient(rgba(0, 163, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 163, 255, 0.05) 1px, transparent 1px);
                        background-size: 20px 20px;
                        color: #a8c7fa;
                        font-family: 'Roboto', 'Inter', sans-serif;
                        width: 100%;
                        min-height: calc(100vh - 80px);
                        padding: 30px;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                    }
                    /* Ticks laterali left */
                    .med-view::before {
                        content: '';
                        position: absolute;
                        left: 10px; top: 100px; bottom: 100px; width: 5px;
                        background: repeating-linear-gradient(to bottom, #00d2ff 0, #00d2ff 2px, transparent 2px, transparent 15px);
                        opacity: 0.2;
                    }
                    /* Ticks laterali right */
                    .med-view::after {
                        content: '';
                        position: absolute;
                        right: 10px; top: 100px; bottom: 100px; width: 5px;
                        background: repeating-linear-gradient(to bottom, #00d2ff 0, #00d2ff 2px, transparent 2px, transparent 15px);
                        opacity: 0.2;
                    }

                    .med-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 25px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid rgba(0, 163, 255, 0.2);
                        position: relative;
                    }
                    .med-header::after {
                        content: '';
                        position: absolute;
                        bottom: -1px; left: 0; width: 20px; height: 3px; background: #00d2ff;
                    }
                    
                    .med-title-area {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    .med-cross {
                        width: 25px; height: 25px;
                        background: #00d2ff;
                        box-shadow: 0 0 10px #00d2ff;
                        position: relative;
                    }
                    .med-cross::before, .med-cross::after {
                        content: '';
                        position: absolute;
                        background: #030a16;
                    }
                    .med-cross::before { top: 0; bottom: 0; left: 8px; right: 8px; }
                    .med-cross::after { left: 0; right: 0; top: 8px; bottom: 8px; }
                    
                    .med-title {
                        font-size: 24px;
                        font-weight: 700;
                        color: #ffffff;
                        letter-spacing: 1px;
                        display:flex; align-items:center; gap:8px;
                    }
                    .med-title span { color: #00d2ff; font-weight: 300; }
                    
                    .med-time {
                        text-align: right;
                        font-size: 14px;
                        color: #a8c7fa;
                        letter-spacing: 1.5px;
                    }
                    .med-session {
                        color: #00d2ff;
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-top: 4px;
                    }
                    
                    .med-grid {
                        display: grid;
                        grid-template-columns: 280px 1fr 280px;
                        gap: 40px;
                        flex: 1;
                    }
                    
                    .med-panel {
                        display: flex;
                        flex-direction: column;
                        gap: 30px;
                    }
                    
                    .med-card-header {
                        font-size: 15px;
                        font-weight: 700;
                        color: #e8f0fe;
                        background: rgba(0, 163, 255, 0.05);
                        padding: 12px 15px;
                        border-left: 3px solid #00d2ff;
                        letter-spacing: 1.5px;
                        text-transform: uppercase;
                        margin-bottom: 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .med-card-header::after {
                        content: '';
                        display:block; width:100%; height:1px; background: rgba(0,163,255,0.2); margin-left:15px;
                    }
                    
                    .med-info-text {
                        font-size: 15px;
                        color: #fff;
                        margin-bottom: 12px;
                        font-family: monospace;
                        letter-spacing: 0.5px;
                    }
                    
                    .med-hl-item {
                        margin-bottom: 25px;
                        position: relative;
                        padding-left: 20px;
                        border-left: 1px solid rgba(0, 163, 255, 0.2);
                    }
                    .med-hl-item::before {
                        content: '';
                        position:absolute; left:-3px; top:0; width:5px; height:5px; background: rgba(0, 163, 255, 0.5);
                    }
                    .med-hl-title {
                        font-size: 13px;
                        font-weight: 800;
                        color: #fff;
                        letter-spacing: 1px;
                        margin-bottom: 4px;
                    }
                    .med-hl-color {
                        font-size: 12px;
                        margin-bottom: 4px;
                    }
                    .med-hl-stat {
                        font-size: 13px;
                        color: rgba(255,255,255,0.6);
                    }
                    .med-square {
                        width: 32px;
                        height: 32px;
                        border-radius: 4px;
                        position: absolute;
                        right: 0;
                        top: 0;
                    }
                    .sq-green { background: #00E676; box-shadow: 0 0 15px #00E676; }
                    .sq-yellow { background: #FFD600; box-shadow: 0 0 15px #FFD600; }
                    .sq-orange { background: #FF9100; box-shadow: 0 0 15px #FF9100; }
                    
                    /* Charts */
                    .med-chart-title {
                        font-size: 12px;
                        color: #ffffff;
                        letter-spacing: 1px;
                        margin-bottom: 10px;
                        font-weight: 600;
                    }
                    .med-chart {
                        height: 60px;
                        border-bottom: 1px solid rgba(0, 163, 255, 0.2);
                        position: relative;
                        margin-bottom: 25px;
                    }
                    
                    /* Diagnostics */
                    .med-diag-title {
                        font-size: 12px;
                        color: #ffffff;
                        letter-spacing: 1.5px;
                        margin-top: 15px;
                    }
                    .med-diag-val.orange { color: #FF9100; text-shadow: 0 0 10px rgba(255,145,0,0.5); font-size: 16px; margin-top:2px; font-weight:800; }
                    .med-diag-val.green { color: #00E676; text-shadow: 0 0 10px rgba(0,230,118,0.5); font-size: 16px; margin-top:2px; font-weight:800; }
                    
                    /* 3D Viewer Controls */
                    .viewer-controls { margin-top: auto; border: 1px solid rgba(0,163,255,0.1); padding: 15px; border-radius: 4px; background: rgba(0, 163, 255, 0.02);}
                    .viewer-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 12px; letter-spacing:1px; }
                    .viewer-layer { display: flex; align-items: center; gap: 8px; font-size:12px; margin-bottom: 5px; color:rgba(255,255,255,0.6); }
                    .viewer-layer.active { color: #00d2ff; }
                    .v-box { width: 10px; height: 10px; border: 1px solid rgba(255,255,255,0.5); border-radius:2px;}
                    .viewer-layer.active .v-box { background: #00d2ff; border-color: #00d2ff; box-shadow: 0 0 5px #00d2ff;}
                    
                    .anatomy-box {
                        width: 100%;
                        height: 100%;
                        position: relative;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .anatomy-glow {
                        position: absolute;
                        width: 80%; height: 80%;
                        background: radial-gradient(ellipse at center, rgba(0, 210, 255, 0.15) 0%, transparent 60%);
                        z-index: 0;
                    }
                </style>

                <div class="med-view">
                    
                    <!-- Config Header icon -->
                    <div style="position:absolute; top:20px; left:10px; display:flex; flex-direction:column; gap:10px; opacity:0.3;">
                        <i class="ph ph-waveform" style="font-size:20px; color:#00d2ff;"></i>
                        <i class="ph ph-magnifying-glass" style="font-size:20px; color:#00d2ff;"></i>
                    </div>
                    <!-- Config Header icon 2 -->
                    <div style="position:absolute; top:90px; left:10px; display:flex; flex-direction:column; gap:10px; opacity:0.3;">
                        <i class="ph ph-user-focus" style="font-size:20px; color:#00d2ff;"></i>
                        <i class="ph ph-shield-plus" style="font-size:20px; color:#00d2ff;"></i>
                        <i class="ph ph-database" style="font-size:20px; color:#00d2ff;"></i>
                    </div>


                    <div class="med-header">
                        <div class="med-title-area">
                            <div class="med-cross"></div>
                            <div class="med-title">MED-VIEW <span>| ANALYTICS | V.4.2</span></div>
                        </div>
                        <div class="med-time">
                            <div>09:14 AM | OCT 27, 2023</div>
                            <div class="med-session">ACTIVE SESSION - DR. ELARA VANCE</div>
                        </div>
                    </div>

                    <div class="med-grid">
                        
                        <!-- LEFT PANEL -->
                        <div class="med-panel">
                            <div>
                                <div class="med-card-header">MUSCULAR SYSTEM OVERVIEW</div>
                                <div style="padding-left:15px; border-left:1px solid rgba(0,163,255,0.2);">
                                    <div class="med-info-text">Female Model</div>
                                    <div class="med-info-text">H: 168cm</div>
                                    <div class="med-info-text">W: 58kg</div>
                                </div>
                            </div>
                            
                            <img src="assets/img/anatomy/db_icon.png" style="width:24px; opacity:0.5; margin: -10px 0;"> <!-- Placeholder DB Icon like in image -->

                            <div>
                                <div class="med-card-header">MUSCLE HIGHLIGHTS</div>
                                
                                <div class="med-hl-item">
                                    <div class="med-hl-title">QUADRICEPS</div>
                                    <div class="med-hl-color" style="color:#00E676;">Neon Green</div>
                                    <div class="med-hl-stat">Active: 94% Strain</div>
                                    <div class="med-square sq-green"></div>
                                </div>
                                
                                <div class="med-hl-item">
                                    <div class="med-hl-title">RECTUS ABDOMINIS</div>
                                    <div class="med-hl-color" style="color:#FFD600;">Vivid Yellow</div>
                                    <div class="med-hl-stat">Active: 88% Tension</div>
                                    <div class="med-square sq-yellow"></div>
                                </div>

                                <div class="med-hl-item" style="margin-bottom:0;">
                                    <div class="med-hl-title">RECTUS ABDOMINIS</div>
                                    <div class="med-hl-color" style="color:#FF9100;">Vivid Orange</div>
                                    <div class="med-hl-stat">Active: 88% Tension</div>
                                    <div class="med-square sq-orange"></div>
                                </div>
                            </div>
                        </div>

                        <!-- CENTER PANEL -->
                        <div class="anatomy-box">
                            <div class="anatomy-glow"></div>
                            
                            <!-- Immagine di base wireframe o silhouette medica (adattiamo la front) -->
                            <img src="assets/img/anatomy/body_front.png" style="
                                height: 100%;
                                width: auto;
                                object-fit: contain;
                                z-index: 1;
                                filter: brightness(1.2) contrast(1.1) drop-shadow(0 0 10px rgba(0,210,255,0.4));
                                mix-blend-mode: screen;
                            ">
                            
                            <!-- Overlays esatti -->
                            <svg viewBox="0 0 100 240" style="
                                position:absolute; 
                                top:0; 
                                left:50%; 
                                transform:translateX(-50%);
                                width:100%;
                                height:100%; 
                                z-index:2; 
                                pointer-events:none;
                                mix-blend-mode: screen;
                                filter: blur(1.5px) drop-shadow(0 0 15px rgba(255, 214, 0, 0.6));
                            ">
                                <!-- Rectus Abdominis / Core (Arancione/Giallo) -->
                                <path d="M42,65 c0,10 0,30 2,40 c2,15 10,15 12,0 c2,-10 2,-30 0,-40 c-2,-10 -10,-10 -14,0" 
                                      fill="#FF9100" fill-opacity="0.9" stroke="#FFD600" stroke-width="2" />
                            </svg>
                            
                            <svg viewBox="0 0 100 240" style="
                                position:absolute; 
                                top:0; 
                                left:50%; 
                                transform:translateX(-50%);
                                width:100%;
                                height:100%; 
                                z-index:3; 
                                pointer-events:none;
                                mix-blend-mode: screen;
                                filter: blur(1px) drop-shadow(0 0 15px rgba(0, 230, 118, 0.6));
                            ">
                                <!-- Quadriceps (Verde Neon) -->
                                <path d="M34,120 c-2,15 -3,40 -1,60 c1,10 4,12 8,12 c4,0 5,-5 6,-15 c1,-20 -2,-45 -4,-65 c-1,-10 -4,-10 -9,8" 
                                      fill="#00E676" fill-opacity="0.9" />
                                <path d="M66,120 c2,15 3,40 1,60 c-1,10 -4,12 -8,12 c-4,0 -5,-5 -6,-15 c-1,-20 2,-45 4,-65 c1,-10 4,-10 9,8" 
                                      fill="#00E676" fill-opacity="0.9" />
                            </svg>
                        </div>

                        <!-- RIGHT PANEL -->
                        <div class="med-panel">
                            
                            <div>
                                <div class="med-card-header">REAL-TIME DATA</div>
                                
                                <div class="med-chart-title">MYO-ELECTRICAL ACTIVITY</div>
                                <div class="med-chart">
                                    <svg viewBox="0 0 100 30" style="width:100%; height:100%; overflow:visible;">
                                        <polyline points="0,15 5,15 8,5 12,25 15,10 18,20 22,5 25,25 28,15 32,15 35,5 38,25 42,15 45,10 48,20 52,15 55,25 58,5 62,20 65,10 68,25 72,5 75,15 80,15 100,15" fill="none" stroke="#00d2ff" stroke-width="0.8"/>
                                        <text x="0" y="28" font-size="6" fill="rgba(255,255,255,0.4)">Low</text>
                                        <text x="90" y="28" font-size="6" fill="rgba(255,255,255,0.4)">High</text>
                                    </svg>
                                </div>
                                
                                <div class="med-chart-title">TENSION %</div>
                                <div class="med-chart">
                                    <svg viewBox="0 0 100 30" style="width:100%; height:100%; overflow:visible;">
                                        <path d="M0,25 C20,25 30,20 50,15 C70,10 80,15 100,5 L100,30 L0,30 Z" fill="rgba(0,163,255,0.15)" />
                                        <polyline points="0,25 20,25 30,20 50,15 70,10 80,15 100,5" fill="none" stroke="#00d2ff" stroke-width="1.5"/>
                                        <text x="0" y="28" font-size="6" fill="rgba(255,255,255,0.4)">0%</text>
                                        <text x="47" y="28" font-size="6" fill="rgba(255,255,255,0.4)">50%</text>
                                        <text x="85" y="28" font-size="6" fill="rgba(255,255,255,0.4)">100%</text>
                                    </svg>
                                </div>

                                <div class="med-chart-title">THERMAL STATUS</div>
                                <div class="med-chart">
                                    <svg viewBox="0 0 100 30" style="width:100%; height:100%; overflow:visible;">
                                        <defs>
                                            <linearGradient id="thermal" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stop-color="#00d2ff" />
                                                <stop offset="50%" stop-color="#FFD600" />
                                                <stop offset="100%" stop-color="#FF1744" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M0,20 L10,25 L20,15 L30,22 L40,10 L50,15 L60,18 L70,5 L80,10 L90,15 L100,12 L100,30 L0,30 Z" fill="url(#thermal)" opacity="0.3" />
                                        <polyline points="0,20 10,25 20,15 30,22 40,10 50,15 60,18 70,5 80,10 90,15 100,12" fill="none" stroke="url(#thermal)" stroke-width="1.5"/>
                                        <text x="0" y="28" font-size="6" fill="rgba(255,255,255,0.4)">0%</text>
                                        <text x="47" y="28" font-size="6" fill="rgba(255,255,255,0.4)">50%</text>
                                        <text x="85" y="28" font-size="6" fill="rgba(255,255,255,0.4)">100%</text>
                                    </svg>
                                </div>
                            </div>
                            
                            <div style="margin-top: 10px;">
                                <div class="med-card-header">DIAGNOSTICS</div>
                                <div class="med-diag-title">QUADRICEPS STRAIN:</div>
                                <div class="med-diag-val orange">ELEVATED</div>
                                <div class="med-diag-title">ABS ENGAGEMENT:</div>
                                <div class="med-diag-val green">HIGH</div>
                            </div>
                            
                            <!-- 3D VIEWER -->
                            <div class="viewer-controls">
                                <div class="med-card-header" style="border:none; padding:0; background:transparent; margin-bottom:10px;">3D VIEWER</div>
                                <div class="viewer-row">
                                    <span>ROTATE:</span>
                                    <span>ZOOM:</span>
                                </div>
                                <div class="viewer-row" style="margin-bottom:20px;">
                                    <i class="ph ph-arrows-out-line-horizontal" style="font-size:20px; color:#00d2ff;"></i>
                                    <div style="display:flex; gap:10px;">
                                        <i class="ph ph-magnifying-glass-minus" style="font-size:18px; color:#00d2ff;"></i>
                                        <i class="ph ph-magnifying-glass-plus" style="font-size:18px; color:#00d2ff;"></i>
                                    </div>
                                </div>
                                
                                <div style="font-size:12px; margin-bottom:10px; color:#b3d4ff; letter-spacing:1px; text-transform:uppercase;">LAYER TOGGLE:</div>
                                <div class="viewer-layer"><div class="v-box"></div> Skeletal</div>
                                <div class="viewer-layer active"><div class="v-box" style="display:flex; align-items:center; justify-content:center;"><i class="ph-fill ph-asterisk" style="font-size:8px; color:#030a16;"></i></div> Muscular*</div>
                                <div class="viewer-layer"><div class="v-box"></div> Vascular</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error("Errore critico in _loadValdData:", e);
            container.innerHTML = `<div class="error-box">ERROR::DATA_LOAD_FAILED ${e.message}</div>`;
        }
    }
};
