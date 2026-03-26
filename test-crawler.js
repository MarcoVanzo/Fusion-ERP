const { chromium } = require('playwright');
const { spawn } = require('child_process');

async function run() {
  const server = spawn('php', ['-S', '127.0.0.1:8123', '-t', '/Users/marcovanzo/Fusion ERP']);
  await new Promise(r => setTimeout(r, 2000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));
  
  try {
     await page.goto('http://127.0.0.1:8123/');

     await new Promise(r => setTimeout(r, 2000));
  
     await page.fill('input[type="email"]', 'admin@fusion.erp');
     await page.fill('input[type="password"]', 'password');
     await page.click('button[type="submit"]');
     
     await new Promise(r => setTimeout(r, 3000));
     
     await page.evaluate(() => {
        window.location.hash = '#staff-documents';
     });
     
     await new Promise(r => setTimeout(r, 4000));
  } catch(e) {
     console.log("Login error: ", e);
  }

  await browser.close();
  server.kill();
  console.log("TEST FINISHED");
}
run();
