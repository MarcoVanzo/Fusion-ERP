const { chromium } = require('playwright');

(async () => {
    console.log("=== Fusion ERP Memory Profiling Test ===");

    // Launch browser with exposed GC for accurate heap measurements
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--js-flags="--expose-gc"'] 
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Navigating to local setup (modify URL if taking place on a different port/host)...");
    await page.goto('http://localhost:8000'); // Port standard for php -S localhost:8000
    
    console.log("⏳ Please assure you are logged in. The test will start iterating in 5 seconds...");
    await page.waitForTimeout(5000);

    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    async function measureHeap(label) {
        // Trigger GC to clean up unreferenced objects
        await page.evaluate(() => { if (window.gc) window.gc(); });
        
        const metrics = await client.send('Performance.getMetrics');
        const jsHeapUsedSize = metrics.metrics.find(m => m.name === 'JSHeapUsedSize').value;
        const mb = (jsHeapUsedSize / 1024 / 1024).toFixed(3);
        console.log(`[${label}] JS Heap Used: ${mb} MB`);
        return jsHeapUsedSize;
    }

    const baseline = await measureHeap('Baseline');

    // List of modules to cycle through to test AbortController cleanup
    const hashRoutes = ['athletes', 'squadre', 'results', 'tasks', 'societa', 'ecommerce', 'network', 'transport-fleet', 'scouting-database'];

    console.log(`\n🔄 Starting loop of 10 cycles through ${hashRoutes.length} modules...`);

    const heapSnapshots = [];

    for (let i = 1; i <= 10; i++) {
        for (const route of hashRoutes) {
            await page.evaluate((r) => { window.location.hash = r; }, route);
            // Give the app time to fetch and render the module
            await page.waitForTimeout(1000);
        }
        
        const currentHeap = await measureHeap(`Cycle ${i}`);
        heapSnapshots.push(currentHeap);
    }

    console.log("\n📊 --- Report ---");
    const finalHeap = await measureHeap('Final (post-test)');
    
    const diffBytes = finalHeap - baseline;
    const diffMb = (diffBytes / 1024 / 1024).toFixed(3);
    
    console.log(`Baseline Heap: ${(baseline / 1024 / 1024).toFixed(3)} MB`);
    console.log(`Final Heap: ${(finalHeap / 1024 / 1024).toFixed(3)} MB`);
    console.log(`Difference: ${diffMb > 0 ? "+" : ""}${diffMb} MB`);

    if (diffBytes > 5 * 1024 * 1024) { // 5 MB growth constitutes a likely leak
        console.warn("⚠️  WARNING: Significant heap growth detected (>= 5 MB). There might be memory leaks from event listeners or closure bindings.");
    } else {
        console.log("✅  SUCCESS: Heap is relatively stable. Event cleanup (AbortController) is functioning correctly.");
    }

    await browser.close();
})();
