const puppeteer = require('puppeteer');

(async () => {
    try {
        const browserURL = 'http://127.0.0.1:62024';
        const browser = await puppeteer.connect({ browserURL });
        const pages = await browser.pages();
        for (const page of pages) {
            const url = page.url();
            if (url.includes('5173')) {
                console.log('Checking page:', url);
                
                // If it's a vite error overlay
                const err = await page.evaluate(() => {
                    const overlay = document.querySelector('vite-error-overlay');
                    if (overlay && overlay.shadowRoot) {
                        return overlay.shadowRoot.textContent;
                    }
                    return null;
                });
                
                if (err) {
                    console.log('VITE ERROR OVERLAY:', err);
                } else {
                    console.log('BODY TEXT:', (await page.evaluate(() => document.body.innerText)).substring(0, 500));
                }
            }
        }
        await browser.disconnect();
    } catch (err) {
        console.error('Puppeteer error:', err);
    }
})();
