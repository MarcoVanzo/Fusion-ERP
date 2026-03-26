const fs = require('fs');
let content = fs.readFileSync('js/modules/societa.js', 'utf8');

// Main Container Wrapper
content = content.replace(
    /<div class="module-wrapper">[\\s\\S]*?class="page-header"[^>]*>[\\s\\S]*?<h1 class="page-title"[^>]*>\\$\\{title\\}<\\/h1>[\\s\\S]*?<p class="page-subtitle">\\s*\\$\\{subtitle\\}\\s*<\\/p>[\\s\\S]*?<\\/div>[\\s\\S]*?<div class="module-body">[\\s\\S]*?<main class="module-content" id="soc-tab-content"><\\/main>[\\s\\S]*?<\\/div>[\\s\\S]*?<\\/div>/,
    `<div class="transport-dashboard" style="min-height:100vh;">\\n                <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">\\n                    <div>\\n                        <h1 class="dash-title">\${title}</h1>\\n                        <p class="dash-subtitle" style="margin-top:4px;">\${subtitle}</p>\\n                    </div>\\n                </div>\\n                <main id="soc-tab-content"></main>\\n            </div>`
);

// Generic Replacements
content = content.replace(/class="card"/g, 'class="dash-card"');
content = content.replace(/class="section-label"/g, 'class="dash-card-title"');

// Button Replacements
content = content.replace(/class="btn btn-primary btn-sm"/g, 'class="btn-dash pink"');
content = content.replace(/class="btn btn-primary"/g, 'class="btn-dash pink"');
content = content.replace(/class="btn btn-default btn-sm"/g, 'class="btn-dash"');
content = content.replace(/class="btn btn-ghost btn-sm"/g, 'class="btn-dash"');
content = content.replace(/class="btn btn-default"/g, 'class="btn-dash"');
content = content.replace(/class="btn btn-ghost"/g, 'class="btn-dash"');

// Filter chips
content = content.replace(/class="filter-chip /g, 'class="dash-filter ');
content = content.replace(/class="filter-chip"/g, 'class="dash-filter"');
content = content.replace(/class="filter-bar"/g, 'class="dash-filters"');

// Write back
fs.writeFileSync('js/modules/societa.js', content);
