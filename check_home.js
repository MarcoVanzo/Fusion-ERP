const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });

    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });

    try {
        await page.goto('https://www.fusionteamvolley.it/demo/', { waitUntil: 'networkidle0', timeout: 15000 });
        const rootHtml = await page.$eval('#root', el => el.innerHTML);
        console.log('HOME HTML LENGTH:', rootHtml.length);
    } catch (e) {
        console.log('Navigation error:', e.message);
    }

    await browser.close();
})();
