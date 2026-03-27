const fs = require('fs');
let content = fs.readFileSync('js/modules/outseason.js', 'utf8');

// Strip out the entire inline <style>...</style> block
content = content.replace(/<style>[\\s\\S]*?<\\/style>/g, '');

// Main wrapper
content = content.replace(/<div class="os-page">/g, '<div class="transport-dashboard" style="min-height:100vh;">');

// Header
content = content.replace(/<div class="os-header">\\s*<h1><i class="ph ph-sun" style="font-size:28px;-webkit-text-fill-color:#f59e0b;"><\\/i> FTV Out Season 2026<\\/h1>/g, 
`<div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">\\n                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;width:100%;">\\n                    <h1 class="dash-title"><i class="ph ph-sun" style="color:var(--accent-pink);"></i> FTV Out Season '26</h1>`);

content = content.replace(/<span class="os-badge" id="os-badge-count">Caricamento…<\\/span>/g, '<span class="status-badge" id="os-badge-count" style="background:rgba(255,255,255,0.1);">Caricamento…</span>');

// Buttons
content = content.replace(/class="os-sync-btn"/g, 'class="btn-dash"');

// Close the dash-top-bar instead of os-header
content = content.replace(/<\/button>\\n            <\/div>/, '</button>\\n                </div>\\n            </div>');

// KPI Grid
content = content.replace(/class="os-kpi-row"/g, 'class="dash-stat-grid"');
content = content.replace(/class="os-kpi"/g, 'class="dash-stat-card"');
content = content.replace(/class="os-kpi-label"/g, 'class="dash-stat-title"');
content = content.replace(/class="os-kpi-value /g, 'class="dash-stat-value ');

// Tabs
content = content.replace(/class="os-tabs /g, 'class="dash-filters ');
content = content.replace(/class="os-tab /g, 'class="dash-filter ');
content = content.replace(/class="os-tab"/g, 'class="dash-filter"');

// Tables
content = content.replace(/class="os-table-wrap"/g, 'class="dash-card" style="padding:var(--sp-4);"');
content = content.replace(/class="os-table-title"/g, 'class="dash-card-title" style="margin-bottom:var(--sp-3);"');

// Verify Section
content = content.replace(/class="os-verify-section"/g, 'class="dash-card" style="padding:var(--sp-4);margin-top:var(--sp-4);"');
content = content.replace(/class="os-verify-btn"/g, 'class="btn-dash pink"');
content = content.replace(/class="os-verify-summary"/g, 'class="dash-stat-grid" style="margin-bottom:var(--sp-4);"');
content = content.replace(/class="os-verify-card"/g, 'class="dash-stat-card"');
content = content.replace(/class="os-verify-card-label"/g, 'class="dash-stat-title"');
content = content.replace(/class="os-verify-card-value /g, 'class="dash-stat-value ');

// Week header
content = content.replace(/class="os-week-header"/g, 'class="dash-card-header" style="margin-bottom:var(--sp-3);display:flex;align-items:center;gap:12px;"');

fs.writeFileSync('js/modules/outseason.js', content);
