const fs = require('fs');
const file = 'js/modules/results.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Update the loop to compute lastPlayedRound
const oldLoop = `              const r = {};
              s.forEach((e) => {
                const t = e.round || "Altre";
                (r[t] || (r[t] = []), r[t].push(e));
              });`;

const newLoop = `              const r = {};
              let lastPlayedRound = null;
              let maxPlayedRound = -1;
              s.forEach((e) => {
                const t = e.round || "Altre";
                if (e.status === "played" && t !== "Altre") {
                  const rNum = parseInt(t);
                  if (!isNaN(rNum) && rNum > maxPlayedRound) {
                    maxPlayedRound = rNum;
                    lastPlayedRound = t;
                  }
                }
                (r[t] || (r[t] = []), r[t].push(e));
              });`;

if (content.includes(oldLoop)) {
    content = content.replace(oldLoop, newLoop);
}

// 2. Add id="res-last-played-round" to the header of the matching round
content = content.replace(
    'd += `\\n<div style="font-size:15px;font-weight:900;',
    'd += `\\n<div ${e === lastPlayedRound ? \'id="res-last-played-round"\' : \'\'} style="font-size:15px;font-weight:900;'
);

// 3. Add scrollIntoView logic
const oldSetHTML = `              t.innerHTML = d;
            }(e);`;

const newSetHTML = `              t.innerHTML = d;
              if (lastPlayedRound) {
                setTimeout(() => {
                  const el = document.getElementById("res-last-played-round");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    // optional: adjust for sticky header
                    const scrollContainer = document.getElementById("res-content")?.parentElement || window;
                    scrollContainer.scrollBy(0, -60);
                  }
                }, 100);
              }
            })(e);`;

if (content.includes('t.innerHTML = d;\n            })(e);')) {
    content = content.replace('t.innerHTML = d;\n            })(e);', newSetHTML);
}

fs.writeFileSync(file, content);
console.log("Scroll logic updated!");
