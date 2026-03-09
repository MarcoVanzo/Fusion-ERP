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
        await page.goto('https://www.fusionteamvolley.it/demo/results', { waitUntil: 'networkidle0', timeout: 15000 });
        const rootHtml = await page.$eval('#root', el => el.innerHTML);
        console.log('ROOT HTML LENGTH:', rootHtml.length);
        console.log('ROOT EXCERPT:', rootHtml.substring(0, 500));
    } catch (e) {
        console.log('Navigation error:', e.message);
    }

    await browser.close();
})();
