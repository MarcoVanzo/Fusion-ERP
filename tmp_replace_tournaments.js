const fs = require('fs');
let content = fs.readFileSync('js/modules/tournaments.js', 'utf8');

// Strip out the inline <style>...</style> block
content = content.replace(/<style>[\\s\\S]*?<\\/style>/g, '');

// Main wrapper
content = content.replace(/<div class="trm-page">/g, '<div class="transport-dashboard" style="min-height:100vh;">');

// Headers
content = content.replace(/<div class="trm-header">\\s*<h1><i class="ph ph-trophy"><\\/i> Tornei<\\/h1>\\s*<button class="trm-btn trm-btn-primary" id="btn-new-tournament">\\s*<i class="ph ph-plus"><\\/i> Nuovo Torneo<\\/button>\\s*<\\/div>/gi,
`<div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">\\n                    <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;width:100%;justify-content:space-between;">\\n                        <h1 class="dash-title"><i class="ph ph-trophy" style="color:var(--accent-pink);"></i> Tornei</h1>\\n                        <button class="btn-dash pink" id="btn-new-tournament"><i class="ph ph-plus-circle" style="font-size:18px;"></i> Nuovo Torneo</button>\\n                    </div>\\n                </div>`);

// Detail view header
content = content.replace(/<div class="trm-header">[\\s\\S]*?Modifica\\s*<\\/button>\\s*<\\/div>/gi,
`<div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">\\n            <div style="display:flex;width:100%;justify-content:space-between;align-items:flex-start;">\\n                <div>\\n                    <button class="btn-dash" id="btn-back-trm" style="margin-bottom: 12px; padding: 6px 12px; font-size:12px;">\\n                        <i class="ph ph-arrow-left"></i> Torna ai Tornei\\n                    </button>\\n                    <h1 class="dash-title">\${e.title}</h1>\\n                    <div class="dash-subtitle" style="margin-top: 4px;">\${e.team_name} • \${o}</div>\\n                </div>\\n                <button class="btn-dash" id="btn-edit-trm">\\n                    <i class="ph ph-pencil"></i> Modifica\\n                </button>\\n            </div>\\n        </div>`);

// Generic button replacements
content = content.replace(/trm-btn trm-btn-primary/g, 'btn-dash pink');
content = content.replace(/trm-btn trm-btn-secondary/g, 'btn-dash');
content = content.replace(/trm-btn/g, 'btn-dash');

// Grid and Cards
content = content.replace(/trm-grid/g, 'dash-stat-grid');
content = content.replace(/trm-card/g, 'dash-stat-card');

// Tabs
content = content.replace(/trm-tabs /g, 'dash-filters ');
content = content.replace(/trm-tab /g, 'dash-filter ');
content = content.replace(/trm-tab"/g, 'dash-filter"');

// Panels
content = content.replace(/trm-panel/g, 'dash-card');
// The active panel block
content = content.replace(/class="dash-card active" style="[^"]*"/g, 'class="dash-card active" style="padding: 24px; margin-top:24px;"');
// Non-active panels
content = content.replace(/class="dash-card"/g, 'class="dash-card" style="padding: 24px; margin-top:24px;"');

fs.writeFileSync('js/modules/tournaments.js', content);
