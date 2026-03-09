const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`HTTP ${response.status()} on ${response.url()}`);
    }
  });

  console.log("Navigating to https://www.fusionteamvolley.it/demo/?v=5 ...");
  await page.goto('https://www.fusionteamvolley.it/demo/?v=5', { waitUntil: 'networkidle2' });

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
