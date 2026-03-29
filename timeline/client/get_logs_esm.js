import puppeteer from 'puppeteer';

(async () => {
    try {
        const browserURL = 'http://127.0.0.1:62024';
        const browser = await puppeteer.connect({ browserURL });
        const pages = await browser.pages();
        for (const page of pages) {
            const url = page.url();
            if (url.includes('5173')) {
                console.log('Checking page:', url);
                
                const err = await page.evaluate(() => {
                    const overlay = document.querySelector('vite-error-overlay');
                    if (overlay && overlay.shadowRoot) {
                        return overlay.shadowRoot.innerHTML;
                    }
                    return null;
                });
                
                if (err) {
                    console.log('VITE ERROR OVERLAY:', err);
                } else {
                    const reactError = await page.evaluate(() => {
                        return document.body.innerText;
                    });
                    console.log('BODY TEXT:', reactError.substring(0, 1000));
                }
            }
        }
        await browser.disconnect();
    } catch (err) {
        console.error('Puppeteer error:', err);
    }
})();
