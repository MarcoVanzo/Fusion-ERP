/**
 * AthletesMetrics — Gestione performance e integrazione VALD
 * Redesigned for Premium Elite Sports Analytics Experience
 */

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
            // Fix: action and module order in Store.get
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
                                <span style="font-size:14px; color:rgba(255,255,255,0.9); line-height:1.4; display:block;">${Utils.escapeHtml(data.strategyShiftAlert)}</span>
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
                <div class="blueprint-card" style="margin-top:32px; width:100%;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:40px; align-items:start; width:100%; margin:0 auto;">
                        <div class="anatomy-entry" style="position:relative; width:100%;">
                            ${this._renderAnatomy('front', data.muscleMap)}
                            <div style="text-align:center; margin-top:8px;">
                                <span style="font-size:12px; font-weight:900; letter-spacing:6px; color:var(--accent-cyan); opacity:0.4;">ANTERIOR_VIEW_SILHOUETTE</span>
                            </div>
                        </div>
                        <div class="anatomy-entry" style="position:relative; width:100%;">
                            ${this._renderAnatomy('back', data.muscleMap)}
                            <div style="text-align:center; margin-top:8px;">
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
                        ${data.results.filter(res => ['CMJ', 'SJ', 'DJ'].includes(res.test_type)).map(res => {
                            const m = res.metrics || {};
                            const asyNum = res.asymmetry?.landing?.asymmetry ?? 0;
                            const asy = asyNum.toFixed(1);
                            const jhNum = m.JumpHeight?.Value || m.JumpHeightTotal?.Value || 0;
                            const jh = jhNum.toFixed(1);
                            const rsiNum = m.RSIModified?.Value || 0;
                            const rsi = rsiNum.toFixed(3);

                            // Same color logic as the summary table (AthletesView)
                            const getColor = (val, lowThresh, highThresh) => {
                                if (!val) return 'rgba(255,255,255,0.2)';
                                if (val < lowThresh) return '#ef4444';
                                if (val >= highThresh) return 'var(--color-success)';
                                return 'var(--color-white)';
                            };
                            // Asymmetry is inverted: lower is better
                            const getAsyColor = (val) => {
                                if (!val && val !== 0) return 'rgba(255,255,255,0.2)';
                                if (val <= 10) return 'var(--color-success)';
                                if (val > 15) return '#ef4444';
                                return 'var(--color-white)';
                            };

                            const jhColor = getColor(jhNum, 25, 30);
                            const rsiColor = getColor(rsiNum, 0.30, 0.45);
                            const asyColor = getAsyColor(asyNum);
                            
                            return `
                                <div class="timeline-entry" style="display:grid; grid-template-columns: 120px 1.5fr 1fr 1fr 1fr; padding:15px 20px; align-items:center;">
                                    <div class="timeline-date" style="opacity:0.6;">${new Date(res.test_date).toLocaleDateString('it-IT')}</div>
                                    <div class="timeline-type" style="font-weight:700;">${Utils.escapeHtml(res.test_type)}</div>
                                    <div class="timeline-val" style="color:${jhColor}; text-align:right; font-weight:800;">${jh}<small>cm</small></div>
                                    <div class="timeline-val" style="color:${rsiColor}; text-align:right; font-weight:800;">${rsi}</div>
                                    <div class="timeline-val" style="color:${asyColor}; text-align:right; font-weight:800;">${asy}<small>%</small></div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            document.getElementById("vald-sync-btn-header").onclick = () => this._syncVald(athleteId);
            document.getElementById("vald-upload-btn").onclick = () => this._handleCsvUpload(athleteId);

        } catch (_e) {
            console.error("Errore critico in _loadValdData:", e);
            container.innerHTML = `<div class="error-box">ERROR::DATA_LOAD_FAILED ${Utils.escapeHtml(e.message)}</div>`;
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
            if (!color) return `class="muscle-region" fill="transparent" stroke="none"`;
            // Enable CSS to pick up our dynamic status color correctly
            return `class="muscle-region active" style="--color-active: ${color};" fill="${color}" fill-opacity="0.4" stroke="${color}" stroke-width="1.5" stroke-opacity="0.9"`;
        };
        
        // Fix: Use existing high-fidelity anatomy assets from assets/img/anatomy/
        const imgSrc = `assets/img/anatomy/body_${view}.png`;

        // Interactive High-Performance Highlighting (Calibrated to 3D Assets)
        return `
            <div class="anatomy-container ${view}" style="width:100%; position:relative; overflow:hidden; background:transparent;">
                <div style="position:relative; width:100%; display:flex; justify-content:center;">
                    <!-- High-Fidelity 3D Medical Render (Muscle Fibers - Myology) -->
                    <img src="${imgSrc}" alt="${view} anatomy" style="
                        display:block;
                        width:100%; 
                        height:auto; 
                        object-fit:contain; 
                        opacity:0.85; 
                        mix-blend-mode:screen;
                        filter: brightness(1.1) contrast(1.15);
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
                        mix-blend-mode: screen;
                        opacity: 1;
                        filter: drop-shadow(0px 0px 4px rgba(255,255,255,0.2));
                    ">
                        <defs>
                        </defs>

                        <!-- MUSCLE REGION HIGHLIGHTS -->
                        ${view === 'front' ? `
                            <!-- Quads (Precise Fascia Outline) -->
                            <path d="M 47,110 Q 40,110 38,130 Q 36,155 38,175 Q 43,173 45,150 Q 46,130 47,110 Z" 
                                ${getStyles('quads_l')} />
                            <path d="M 53,110 Q 60,110 62,130 Q 64,155 62,175 Q 57,173 55,150 Q 54,130 53,110 Z" 
                                ${getStyles('quads_r')} />
                            
                            <!-- Core / Abs (Centralized Hexagonal Cut) -->
                            <path d="M 44,65 L 56,65 L 55,83 L 53,98 L 50,102 L 47,98 L 45,83 Z" 
                                ${getStyles('core')} />
                            
                            <!-- Hips / Lateral Stabilizers -->
                            <path d="M 42,88 Q 33,95 34,110 Q 38,105 40,92 Z" ${getStyles('hips_l')} />
                            <path d="M 58,88 Q 67,95 66,110 Q 62,105 60,92 Z" ${getStyles('hips_r')} />
                        ` : `
                            <!-- Glutes (Anatomical Wrap) -->
                            <path d="M 49,95 C 40,95 34,105 34,115 C 38,122 45,118 49,115 Z" 
                                ${getStyles('glutes_l')} />
                            <path d="M 51,95 C 60,95 66,105 66,115 C 62,122 55,118 51,115 Z" 
                                ${getStyles('glutes_r')} />
                            
                            <!-- Hamstrings (Precise Taper) -->
                            <path d="M 48,118 Q 38,122 36,145 Q 36,165 38,175 Q 43,170 45,150 Q 46,135 48,118 Z" 
                                ${getStyles('hams_l')} />
                            <path d="M 52,118 Q 62,122 64,145 Q 64,165 62,175 Q 57,170 55,150 Q 54,135 52,118 Z" 
                                ${getStyles('hams_r')} />
                        `}
                    </svg>
                </div>
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
            const result = await Store.api("sync", "vald", { athleteId });

            // Invalidate cache so _loadValdData fetches fresh data from server
            Store.invalidate("analytics/vald");

            // Show meaningful feedback using the actual API response
            const synced = result?.synced ?? 0;
            const found  = result?.found ?? 0;
            const skipped = result?.skipped ?? 0;
            const unlinked = result?.unlinkedAthletes ?? [];

            if (synced > 0) {
                UI.toast(`Sincronizzazione completata: ${synced} nuovi test salvati su ${found} trovati.`, "success");
            } else if (found > 0 && unlinked.length > 0) {
                UI.toast(`Trovati ${found} test ma nessun atleta collegato a VALD. Vai in "Gestione Link VALD" per collegare gli atleti.`, "warning");
            } else if (found > 0 && skipped > 0) {
                UI.toast(`${found} test trovati, tutti già presenti nel sistema.`, "info");
            } else {
                UI.toast("Nessun nuovo test trovato su VALD Hub.", "info");
            }

            await this._loadValdData(athleteId);
        } catch (_e) {
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
        } catch (_err) {
            UI.toast("Errore: " + err.message, "error");
        } finally {
            UI.loading(false);
        }
    }
};
