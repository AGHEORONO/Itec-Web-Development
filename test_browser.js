const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

        console.log('Navigating to http://localhost:3001...');
        await page.goto('http://localhost:3001', { waitUntil: 'networkidle0', timeout: 10000 });

        console.log('Done scanning.');
        await browser.close();
    } catch (e) {
        console.error('Script Error:', e.message);
        process.exit(1);
    }
})();
