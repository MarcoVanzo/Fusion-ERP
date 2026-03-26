const fs = require('fs');
let data = fs.readFileSync('js/modules/societa.js', 'utf8');

let maxWIdx = data.indexOf('<div style="max-width:760px">');
data = data.replace('<div style="max-width:760px">', '<div style="max-width:1200px">\\n                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--sp-4); align-items: start; margin-bottom: var(--sp-4)"><div style="display:flex; flex-direction:column; gap:var(--sp-4)">');

const identitaMarker = '<div class="card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">\\n                    <p class="section-label" style="margin-bottom:var(--sp-3)">Identità Visiva</p>';
const missionMarker = '<div class="card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">\\n                    <p class="section-label" style="margin-bottom:var(--sp-3)">Mission &amp; Vision</p>';
const indirizziMarker = '<div class="card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">\\n                    <p class="section-label" style="margin-bottom:var(--sp-3)">Indirizzi</p>';

let i1 = data.indexOf(identitaMarker);
let i2 = data.indexOf(missionMarker);
let i3 = data.indexOf(indirizziMarker);
let endI = data.indexOf('${o?\'\\n                <div style="display:flex');

if (endI === -1) {
    endI = data.indexOf('${o?'); // safer fallback
}

if(i1 > -1 && i2 > -1 && i3 > -1 && endI > i3) {
    let identitaBlock = data.substring(i1, i2).replace(/margin-bottom:var\\(--sp-3\\)/g, 'margin-bottom:0');
    let missionBlock = data.substring(i2, i3).replace(/margin-bottom:var\\(--sp-3\\)/g, 'margin-bottom:0').replace('padding:var(--sp-4)', 'padding:var(--sp-4); height:100%');
    let indirizziBlock = data.substring(i3, endI).replace(/margin-bottom:var\\(--sp-3\\)/g, 'margin-bottom:0');

    let newLayout = identitaBlock + indirizziBlock + '</div>' + missionBlock + '</div>';
    
    data = data.substring(0, i1) + newLayout + data.substring(endI);
    fs.writeFileSync('js/modules/societa.js', data);
    console.log("Success! Updated the file.");
} else {
    console.log("Error: markers not found", {i1, i2, i3, endI, maxWIdx});
}
