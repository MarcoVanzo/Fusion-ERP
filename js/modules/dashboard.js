/**
 * Dashboard Module — Exact Match Nano Banana Layout
 * Fusion ERP v1.0
 */

'use strict';

const Dashboard = (() => {
    let _ac = new AbortController();

  async function init() {
    const app = document.getElementById('app');
    if (!app) return;

    // Check if we are inside the new top-nav shell or old one, update layout
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.padding = '0';
      mainContent.style.backgroundColor = '#0a0a0c';
    }

    render();
  }

  function render() {
    const app = document.getElementById('app');

    app.innerHTML = `
      <style>
        .dash-container {
          padding: 32px;
          color: white;
          background: #0a0a0c;
          min-height: 100%;
          font-family: var(--font-body), sans-serif;
        }
        
        /* KPI Row */
        .dash-kpi-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          border-bottom: 1px solid #1c1c1e;
          padding-bottom: 24px;
        }
        
        .kpi-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 24px;
          border-right: 1px solid #1c1c1e;
        }
        .kpi-item:last-child {
          border-right: none;
          padding-right: 0;
        }
        
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          color: #8e8e93;
        }
        
        .kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        
        .kpi-val {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 42px;
          line-height: 1;
          letter-spacing: -0.03em;
        }
        
        .kpi-trend {
          font-size: 13px;
          font-weight: 700;
          color: #00E676; /* Green */
        }
        .kpi-trend.pink {
          color: #E6007E;
        }

        /* Main Grid */
        .dash-grid {
          display: grid;
          grid-template-columns: 1.6fr 1.2fr 1.2fr;
          grid-auto-rows: min-content;
          gap: 20px;
        }
        
        .widget {
          background: #121214;
          border: 1px solid #1c1c1e;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
        
        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .widget-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        
        .widget-more {
          color: #8e8e93;
          letter-spacing: 2px;
          cursor: pointer;
          font-weight: 800;
        }

        /* Specific Widgets Grid placement */
        .w-team-perf { grid-column: 1 / 2; grid-row: 1 / 2; }
        .w-fixtures { grid-column: 2 / 3; grid-row: 1 / 2; }
        .w-finance { grid-column: 3 / 4; grid-row: 1 / 2; }
        .w-player-eff { grid-column: 1 / 2; grid-row: 2 / 3; }
        .w-player-status { grid-column: 2 / 4; grid-row: 2 / 3; }
        
        /* Utility styles for inner content */
        .badge {
            background: #E6007E;
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
        }
        .text-pink { color: #E6007E; }
        .text-cyan { color: #00A3FF; }
        .text-muted { color: #8e8e93; }
        
        /* Bar Chart */
        .bar-row { display: grid; grid-template-columns: 100px 1fr 40px; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 13px; font-weight: 600; }
        .bar-track { background: #1c1c1e; height: 8px; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }
        
        /* Table */
        .status-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .status-table th { text-align: left; color: #8e8e93; font-weight: 600; padding-bottom: 12px; border-bottom: 1px solid #1c1c1e; }
        .status-table td { padding: 14px 0; border-bottom: 1px solid #1c1c1e; font-weight: 500; }
        .status-table tr:last-child td { border-bottom: none; }
        
        /* Fixture Cards */
        .fixture-card { background: #0a0a0c; border: 1px solid #1c1c1e; padding: 12px; border-radius: 6px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .fixture-card:last-child { margin-bottom: 0; }
        .team-logo { width: 32px; height: 32px; border-radius: 50%; background: #1c1c1e; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: white;}
      </style>

      <div class="dash-container">
        
        <!-- KPI ROW -->
        <div class="dash-kpi-row">
          <div class="kpi-item">
            <div class="kpi-header">ACTIVE PLAYERS <i class="ph-fill ph-users"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val">148</div>
              <div class="kpi-trend">+5.1%</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-header">TEAMS <i class="ph-fill ph-users-three"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val">12</div>
              <div class="kpi-trend" style="color: #8e8e93;">100% capacity</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-header">SCOUTING REPORTS <i class="ph-fill ph-file-text"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val">67</div>
              <div class="kpi-trend">+12%</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-header">REVENUE (MTD) <i class="ph-fill ph-chart-line-up"></i></div>
            <div class="kpi-val-row">
              <div class="kpi-val">$85.3K</div>
              <div class="kpi-trend pink">+9.2%</div>
            </div>
          </div>
        </div>

        <!-- MAIN GRID -->
        <div class="dash-grid">
          
          <!-- WIDGET 1: TEAM PERFORMANCE -->
          <div class="widget w-team-perf">
            <div class="widget-header">
              <div class="widget-title">TEAM PERFORMANCE TRACKER</div>
              <div class="widget-more">...</div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:16px;">
              <div style="display:flex; gap:16px;">
                <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:#00A3FF; border-radius:2px;"></div> Blue</div>
                <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:#E6007E; border-radius:2px;"></div> Win %</div>
              </div>
              <div class="text-muted">2023-2024 Season</div>
            </div>
            
            <div style="position:relative; width:100%; height:200px; border-bottom:1px solid #1c1c1e; border-left:1px solid #1c1c1e;">
              <!-- Grid lines -->
              <div style="position:absolute; top:33%; width:100%; height:1px; background:#1c1c1e;"></div>
              <div style="position:absolute; top:66%; width:100%; height:1px; background:#1c1c1e;"></div>
              <!-- Text labels -->
              <div style="position:absolute; top:0; left:-25px; font-size:10px; color:#8e8e93;">100</div>
              <div style="position:absolute; top:33%; left:-25px; font-size:10px; color:#8e8e93;">75</div>
              <div style="position:absolute; top:66%; left:-25px; font-size:10px; color:#8e8e93;">25</div>
              <div style="position:absolute; bottom:-18px; left:-5px; font-size:10px; color:#8e8e93;">0</div>
              
              <!-- Inline SVG Chart -->
              <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none" style="overflow:visible;">
                <!-- Pink glowing line -->
                <path d="M 0,180 Q 40,160 80,140 T 160,100 T 240,60 T 320,120 T 400,20" fill="none" stroke="#E6007E" stroke-width="3" filter="drop-shadow(0 0 8px rgba(230,0,126,0.5))" />
                <circle cx="240" cy="60" r="5" fill="#E6007E" />
                
                <!-- Blue glowing line -->
                <path d="M 0,150 Q 50,140 100,80 T 200,120 T 300,160 T 400,90" fill="none" stroke="#00A3FF" stroke-width="3" filter="drop-shadow(0 0 8px rgba(0,163,255,0.5))" />
                <circle cx="200" cy="120" r="5" fill="#00A3FF" />
              </svg>
            </div>
            <!-- X Axis -->
            <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:11px; font-weight:600; color:#8e8e93; margin-left:10px;">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Dec</span><span>Thu</span><span>Fri</span><span>Sec</span>
            </div>
          </div>

          <!-- WIDGET 2: UPCOMING FIXTURES -->
          <div class="widget w-fixtures">
            <div class="widget-header">
              <div class="widget-title">UPCOMING FIXTURES</div>
              <div class="widget-more">...</div>
            </div>
            
            <div style="font-size:12px; font-weight:700; color:#8e8e93; margin-bottom:8px;">OCT 28</div>
            <div class="fixture-card">
              <div class="team-logo" style="color:#F5B041;">L</div>
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:700;">LA LAKERS</div>
                <div style="font-size:13px; font-weight:800; color:#E6007E;">@ NY KNICKS</div>
                <div style="font-size:11px; color:#8e8e93; margin-top:2px;">7:30 PM • MSG</div>
              </div>
              <div class="team-logo" style="color:#EB984E;">N</div>
            </div>

            <div style="font-size:12px; font-weight:700; color:#8e8e93; margin:16px 0 8px;">NOV 01</div>
            <div class="fixture-card">
              <div class="team-logo" style="color:#27AE60;">B</div>
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:700;">BOS CELTICS</div>
                <div style="font-size:13px; font-weight:800; color:#8e8e93;">vs MIA HEAT</div>
                <div style="font-size:11px; color:#8e8e93; margin-top:2px;">8:00 PM • TDG</div>
              </div>
              <div class="team-logo" style="color:#C0392B;">M</div>
            </div>
            
            <div style="text-align:center; margin-top:16px;">
              <span style="color:#E6007E; font-size:13px; font-weight:700; cursor:pointer;">((•)) Live Update</span>
            </div>
          </div>

          <!-- WIDGET 3: FINANCIAL OVERVIEW -->
          <div class="widget w-finance">
            <div class="widget-header">
              <div class="widget-title">FINANCIAL OVERVIEW (Q4)</div>
            </div>
            <div style="text-align:center; font-size:12px; color:#8e8e93; margin-bottom:16px;">Revenue Split</div>
            
            <div style="position:relative; width:150px; height:150px; margin:0 auto 24px;">
              <svg width="100%" height="100%" viewBox="0 0 36 36">
                <!-- Background circle -->
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1c1c1e" stroke-width="4"></path>
                <!-- Pink (42%) -->
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E6007E" stroke-width="4" stroke-dasharray="42, 100" filter="drop-shadow(0 0 4px rgba(230,0,126,0.5))"></path>
                <!-- Gray (28%) -->
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2c2c2e" stroke-width="4" stroke-dasharray="28, 100" stroke-dashoffset="-42"></path>
                <!-- Green/Cyan (18%) -->
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#00A3FF" stroke-width="4" stroke-dasharray="18, 100" stroke-dashoffset="-70" filter="drop-shadow(0 0 4px rgba(0,163,255,0.5))"></path>
              </svg>
              <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size:10px; color:#8e8e93; font-weight:700;">18%</div>
                <div style="font-family:var(--font-display); font-size:24px; font-weight:800; letter-spacing:-0.05em; color:white;">$312.5K</div>
                <div style="font-size:10px; color:#8e8e93; font-weight:700;">Total</div>
              </div>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:11px; font-weight:600; color:#8e8e93;">
              <div><span style="color:#E6007E;">■</span> Tickets (42%)</div>
              <div><span style="color:#1c1c1e;">■</span> Other: 12%</div>
              <div><span style="color:#00A3FF;">■</span> Merch: 28%</div>
              <div><span style="color:#1c1c1e;">■</span> Other: 12%</div>
              <div><span style="color:#666666;">■</span> Sponsorships: 18%</div>
            </div>
          </div>

          <!-- WIDGET 4: PLAYER EFFICIENCY RATING -->
          <div class="widget w-player-eff">
            <div class="widget-header">
              <div class="widget-title">PLAYER EFFICIENCY RATING (PER)</div>
              <div class="widget-more">...</div>
            </div>
            <div class="text-muted" style="font-size:12px; font-weight:600; margin-bottom:16px;">Top 5 Players</div>
            
            <div style="display:flex; flex-direction:column; gap:0;">
              <div class="bar-row">
                <div>K. Leonard: 28.1</div>
                <div class="bar-track"><div class="bar-fill" style="width:90%; background:#E6007E; box-shadow:0 0 8px rgba(230,0,126,0.5);"></div></div>
              </div>
              <div class="bar-row">
                <div>A. Davis: 27.5</div>
                <div class="bar-track"><div class="bar-fill" style="width:85%; background:#a30059;"></div></div>
              </div>
              <div class="bar-row">
                <div>P. George: 26.2</div>
                <div class="bar-track"><div class="bar-fill" style="width:80%; background:#E6007E;"></div></div>
              </div>
              <div class="bar-row">
                <div>S. Gilgeous: 25.8</div>
                <div class="bar-track"><div class="bar-fill" style="width:78%; background:#a30059;"></div></div>
              </div>
              <div class="bar-row">
                <div>D. Mitchell: 24.9</div>
                <div class="bar-track"><div class="bar-fill" style="width:75%; background:#E6007E;"></div></div>
              </div>
            </div>
          </div>

          <!-- WIDGET 5: PLAYER STATUS -->
          <div class="widget w-player-status">
             <div class="widget-header">
              <div class="widget-title">PLAYER STATUS</div>
              <div class="widget-more">...</div>
            </div>
            
            <table class="status-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Status (Active/Scouting)</th>
                  <th style="text-align:right;">Performance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color:white;">K. Leonard</td>
                  <td>SF</td>
                  <td>Active (Healthy)</td>
                  <td style="text-align:right; color:white;">28.1 PER</td>
                </tr>
                <tr>
                  <td style="color:white;">A. Davis</td>
                  <td>PF/C</td>
                  <td>Active (Healthy)</td>
                  <td style="text-align:right; color:white;">27.5 PER</td>
                </tr>
                <tr>
                  <td style="color:white;">P. George</td>
                  <td>SF/PF</td>
                  <td>Scouting (Clear)</td>
                  <td style="text-align:right; color:white;">26.2 PER</td>
                </tr>
                <tr>
                  <td style="color:white;">S. Gilgeous</td>
                  <td>PG/SG</td>
                  <td>Active (Healthy)</td>
                  <td style="text-align:right; color:white;">25.8 PER</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div> <!-- END MAIN GRID -->
      </div>
    `;
  }

  function destroy() {
        _ac.abort();
        _ac = new AbortController();
    }

    return { destroy, init };
})();
window.Dashboard = Dashboard;
