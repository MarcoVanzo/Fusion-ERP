const fs = require('fs');
const file = 'js/modules/results.js';
let content = fs.readFileSync(file, 'utf8');

const badString = 'margin-top:${0 === t ? \\"24px\\" : \\"44px\\"};';
const goodString = 'margin-top:${0 === t ? "24px" : "44px"};';

if (content.includes(badString)) {
    content = content.replace(badString, goodString);
    fs.writeFileSync(file, content);
    console.log("Syntax fixed!");
} else {
    console.log("Bad string not found.");
}
