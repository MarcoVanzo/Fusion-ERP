/**
 * Dashboard Module — Overview stats, ACWR alerts, upcoming events
 * Fusion ERP v1.0
 */

'use strict';

const Dashboard = (() => {
  async function init() {
    const app = document.getElementById('app');
    if (!app) return;

    UI.loading(true);
    app.innerHTML = UI.skeletonPage();

    try {
      const [alerts, events, certs] = await Promise.all([
        Store.get('alerts', 'athletes').catch(() => []),
        Store.get('listEvents', 'transport', { type: 'away_game' }).catch(() => []),
        Store.get('expiringCertificates', 'admin').catch(() => []),
      ]);

      render(alerts, events, certs);
    } catch (err) {
      app.innerHTML = Utils.emptyState('Errore nel caricamento della dashboard', err.message);
      UI.toast('Errore nel caricamento', 'error');
    } finally {
      UI.loading(false);
    }
  }

  function render(alerts, events, certs) {
    const user = App.getUser();
    const app = document.getElementById('app');
    const highRisk = alerts.filter(a => a.risk_level === 'high' || a.risk_level === 'extreme');
    const expiring = certs.filter(c => {
      const days = Utils.daysUntil(c.expiry_date);
      return days !== null && days <= 30;
    });

    app.innerHTML = `
      <div class="page-header" style="padding-bottom:var(--sp-2); border-bottom:none;">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Bentornato, ${Utils.escapeHtml(user.fullName || user.email)}</p>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div style="padding: 0 var(--sp-4);">
        <div class="filter-bar" id="dashboard-cat-filters" style="overflow-x:auto; flex-wrap:nowrap; padding-bottom:4px; border-bottom:1px solid var(--color-border); gap:var(--sp-3);">
            <button class="filter-chip active" style="border:none; border-bottom:2px solid var(--color-pink); border-radius:0; background:transparent; padding:0 8px 8px 8px; color:var(--color-white)">U13</button>
            <button class="filter-chip" style="border:none; background:transparent; padding:0 8px 8px 8px;">U14</button>
            <button class="filter-chip" style="border:none; background:transparent; padding:0 8px 8px 8px;">U16</button>
            <button class="filter-chip" style="border:none; background:transparent; padding:0 8px 8px 8px;">B1</button>
        </div>
      </div>

      <!-- MATCH TICKER -->
      <div style="margin: var(--sp-2) 0; padding: var(--sp-1) var(--sp-4); background: var(--color-black); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; gap: var(--sp-2);">
          <div style="width:8px; height:8px; background:var(--color-pink); border-radius:50%; animation: pulse 2s infinite;"></div>
          <span style="font-family: var(--font-display); font-weight:700; color:var(--color-pink); text-transform:uppercase; letter-spacing:0.05em; font-size:16px;">LIVE</span>
          <span style="font-family: var(--font-display); font-weight:700; color:var(--color-white); margin-left:var(--sp-2); font-size:18px;">FUSION U16 68 - 62 OLIMPIA</span>
      </div>

      <div class="page-body" style="display:flex;flex-direction:column;gap:var(--sp-4); padding-top:var(--sp-2);">

        <!-- KPI row -->
        <div class="grid-2">
          ${statCard('Atleti Rischio', highRisk.length, 'var(--color-white)', 'ACWR critico')}
          ${statCard('Certificati', expiring.length, 'var(--color-white)', 'Scadenza <30gg')}
        </div>
        <div class="grid-2" style="margin-top: calc(var(--sp-2) * -1);">
            ${statCard('Eventi', events.length, 'var(--color-white)', 'Trasferte')}
            ${statCard('Staff', '—', 'var(--color-text-muted)', 'Attivi')}
        </div>

        <!-- LATEST NEWS MAGAZINE STYLE (Mockup Data since no DB table exists) -->
        <div>
           <p class="section-label" style="border-bottom:none; margin-bottom:var(--sp-1);">ULTIME NEWS</p>
           <div class="grid-2">
               <div style="position:relative; aspect-ratio:4/3; background:var(--color-black); border:1px solid var(--color-border); overflow:hidden;">
                   <img src="assets/media/player_hero_bg.png" class="duotone-img" style="opacity:0.6; position:absolute; inset:0;" />
                   <div style="position:absolute; bottom:0; left:0; width:100%; padding:var(--sp-2); background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                       <h3 style="color:var(--color-white); line-height:1;">VITTORIA IN TRASFERTA</h3>
                       <p style="font-size:11px; color:var(--color-pink); font-family:var(--font-display); font-weight:600; margin-top:4px;">U16 • IERI</p>
                   </div>
               </div>
               <div style="position:relative; aspect-ratio:4/3; background:var(--color-black); border:1px solid var(--color-border); overflow:hidden;">
                   <img src="assets/media/splash_bg.png" class="duotone-img" style="opacity:0.6; position:absolute; inset:0;" />
                   <div style="position:absolute; bottom:0; left:0; width:100%; padding:var(--sp-2); background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                       <h3 style="color:var(--color-white); line-height:1;">NUOVO PALAZZETTO</h3>
                       <p style="font-size:11px; color:var(--color-pink); font-family:var(--font-display); font-weight:600; margin-top:4px;">CLUB • 2 GG FA</p>
                   </div>
               </div>
           </div>
        </div>

        <!-- ACWR alerts -->
        ${highRisk.length > 0 ? `
        <div>
          <p class="section-label">⚠ Allerta Carico</p>
          <div style="display:flex;flex-direction:column;gap:var(--sp-1);">
            ${highRisk.map(a => `
              <div class="card card--highlighted" style="display:flex;align-items:center;justify-content:space-between;padding:var(--sp-2); border-left:4px solid var(--color-pink); box-shadow: inset 4px 0 10px -4px rgba(230,0,126,0.3);">
                <div>
                  <span style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;text-transform:uppercase; text-shadow: 0 0 8px rgba(255,255,255,0.4);">${Utils.escapeHtml(a.athlete_name)}</span>
                </div>
                <div style="text-align:right;">
                  <div style="font-family:var(--font-display);font-size:1.6rem;font-weight:700;color:var(--color-pink); text-shadow: 0 0 15px rgba(230,0,126,0.5);">${Utils.formatNum(a.acwr_score, 2)}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''}

        <!-- Expiring certs -->
        ${expiring.length > 0 ? `
        <div>
          <p class="section-label">Certificati Scadenza</p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${expiring.map(c => {
      const days = Utils.daysUntil(c.expiry_date);
      return `
            <div class="card" style="display:flex; justify-content:space-between; padding:var(--sp-2);">
                <div>
                    <div style="font-family:var(--font-display); font-weight:600; font-size:14px;">${Utils.escapeHtml(c.athlete_name)}</div>
                    <div style="font-size:11px; color:var(--color-text-muted);">${Utils.escapeHtml(c.category)}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-display); font-weight:700; color:var(--color-pink);">${days} GG</div>
                </div>
            </div>`;
    }).join('')}
          </div>
        </div>` : ''}

      </div>
      <style>
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
      </style>`;

    const chips = app.querySelectorAll('#dashboard-cat-filters .filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => {
          c.classList.remove('active');
          c.style.borderBottom = 'none';
          c.style.color = 'inherit';
        });
        chip.classList.add('active');
        chip.style.borderBottom = '2px solid var(--color-pink)';
        chip.style.color = 'var(--color-white)';
        // Here we could trigger a real data fetch filtering by category
      });
    });
  }

  function statCard(label, value, valueColor, sub) {
    return `
      <div class="stat-card">
        <span style="font-family:var(--font-display); font-weight:700; font-size:2.8rem; line-height:1; color:${valueColor}; letter-spacing:-0.02em; text-shadow: ${valueColor === 'var(--color-pink)' ? 'var(--glow-pink)' : '0 0 10px rgba(255,255,255,0.2)'};">${Utils.escapeHtml(String(value))}</span>
        <span style="font-size:12px; color:var(--color-silver); font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">${Utils.escapeHtml(label)}</span>
      </div>`;
  }

  return { init };
})();
window.Dashboard = Dashboard;
