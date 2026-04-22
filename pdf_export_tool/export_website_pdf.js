const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const urls = [
    'https://www.fusionteamvolley.it/',
    'https://www.fusionteamvolley.it/club',
    'https://www.fusionteamvolley.it/news',
    'https://www.fusionteamvolley.it/teams',
    'https://www.fusionteamvolley.it/shop',
    'https://www.fusionteamvolley.it/results',
    'https://www.fusionteamvolley.it/outseason',
    'https://www.fusionteamvolley.it/foresteria',
    'https://www.fusionteamvolley.it/network',
    'https://www.fusionteamvolley.it/sponsors',
    'https://www.fusionteamvolley.it/proposal1',
    'https://www.fusionteamvolley.it/proposal2',
    'https://www.fusionteamvolley.it/proposal3',
    'https://www.fusionteamvolley.it/menu1',
    'https://www.fusionteamvolley.it/menu2',
    'https://www.fusionteamvolley.it/menu3',
    'https://www.fusionteamvolley.it/menu4',
    'https://www.fusionteamvolley.it/menu5',
    'https://www.fusionteamvolley.it/news/venezia-si-tinge-di-fucsia',
    'https://www.fusionteamvolley.it/news/fusion-team-volley-vince-il-progetto-europeo-erasmus',
    'https://www.fusionteamvolley.it/news/nuove-regole-volley-2025-2028-cosa-cambia',
    'https://www.fusionteamvolley.it/news/psicologia-allenamento-pallavolo',
    'https://www.fusionteamvolley.it/news/preparazione-atletica-estiva-pallavolo',
    'https://www.fusionteamvolley.it/news/recupero-infortunio-volley-under18',
    'https://www.fusionteamvolley.it/news/alimentazione-giovani-pallavoliste',
    'https://www.fusionteamvolley.it/news/scheda-potenziamento-volley-under18',
    'https://www.fusionteamvolley.it/news/comunicazione-campo-pallavolo',
    'https://www.fusionteamvolley.it/news/arrivi-nuovi-atleti-mercato',
    'https://www.fusionteamvolley.it/news/fusion-team-volley-settimo-posto-nazionale',
    'https://www.fusionteamvolley.it/news/fusion-team-volley-notizie-media',
    'https://www.fusionteamvolley.it/news/sinergia-fusion-medovolley',
    'https://www.fusionteamvolley.it/teams/under-13',
    'https://www.fusionteamvolley.it/teams/under-14',
    'https://www.fusionteamvolley.it/teams/under-16',
    'https://www.fusionteamvolley.it/teams/under-18'
];

async function exportToPdf() {
    console.log('Starting PDF Export Process...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const tempDir = path.join(__dirname, 'temp_pdfs');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const pdfPaths = [];

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const page = await browser.newPage();
        
        // Set viewport for better rendering
        await page.setViewport({ width: 1920, height: 1080 });

        console.log(`Processing [${i + 1}/${urls.length}]: ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            
            // Minor wait for animations (framer-motion, etc.)
            await new Promise(r => setTimeout(r, 2000));

            // Hide cookie banner if present to avoid it being in every PDF page
            await page.evaluate(() => {
                const banner = document.querySelector('[role="dialog"]') || document.querySelector('.cookie-banner');
                if (banner) banner.remove();
            });

            const pdfPath = path.join(tempDir, `page_${i}.pdf`);
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
            });

            pdfPaths.push(pdfPath);
        } catch (err) {
            console.error(`Error processing ${url}:`, err.message);
        } finally {
            await page.close();
        }
    }

    await browser.close();

    console.log('Merging PDFs...');
    const mergedPdf = await PDFDocument.create();

    for (const pdfPath of pdfPaths) {
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const finalPath = path.join(__dirname, 'Fusion_Website_Full_Export.pdf');
    fs.writeFileSync(finalPath, mergedPdfBytes);

    console.log(`Done! Export saved to: ${finalPath}`);
    
    // Cleanup temp files
    pdfPaths.forEach(p => fs.unlinkSync(p));
    fs.rmdirSync(tempDir);
}

exportToPdf().catch(console.error);
