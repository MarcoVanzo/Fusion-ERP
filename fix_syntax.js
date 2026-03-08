const fs = require('fs');
let c = fs.readFileSync('js/modules/results.js', 'utf8');
c = c.replace(/`Giornata \${e}`/, '"Giornata " + e'); // wait inside the file it might be \`Giornata \${e}\`
c = c.replace(/\\`Giornata \\\${e}\\`/, '"Giornata " + e');
fs.writeFileSync('js/modules/results.js', c);
