const fs = require('fs');
const path = require('path');

function getFiles(dir, exts) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file, exts));
        } else {
            if (exts.includes(path.extname(file))) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = getFiles('src', ['.tsx']);
let modifiedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let hasChanges = false;

    // 1. Replace style={{ backgroundImage: "url('/assets/hero-2.jpg')" }}
    const regex1 = /backgroundImage:\s*(["'])url\('\/assets\/([^']+)'\)\1/g;
    content = content.replace(regex1, (match, quote, filename) => {
        hasChanges = true;
        return `backgroundImage: \`url('\${import.meta.env.BASE_URL}assets/${filename}')\``;
    });

    // 2. Replace style={{ backgroundImage: `url('/assets/hero-${num}.jpg')` }}
    const regex2 = /backgroundImage:\s*`url\('\/assets\/([^']+)'\)`/g;
    content = content.replace(regex2, (match, filename) => {
        hasChanges = true;
        return `backgroundImage: \`url('\${import.meta.env.BASE_URL}assets/${filename}')\``;
    });

    if (hasChanges) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedFiles++;
        console.log(`Updated ${file}`);
    }
});
console.log(`Total files updated: ${modifiedFiles}`);
