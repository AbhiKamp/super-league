import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'https://super-league.pages.dev';
const routes = ['', 'fantasy', 'wc', 'matches', 'standings', 'clubs', 'statistics', 'legends', 'rules'];

(async () => {
    console.log('🚀 Starting screenshot automation...');
    if (!fs.existsSync('./screenshots')) fs.mkdirSync('./screenshots');

    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1200, height: 630 },
        deviceScaleFactor: 2
    });

    const page = await context.newPage();

    for (const route of routes) {
        const url = route ? `${BASE_URL}/${route}` : BASE_URL;
        const filename = route || 'home';

        console.log(`📸 Capturing ${url}`);

        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(2000); // Allow frontend animations to settle
            await page.screenshot({ path: `./screenshots/${filename}.png` });
        } catch (error) {
            console.error(`❌ Failed to capture ${url}:`, error.message);
        }
    }

    await browser.close();
    console.log('✅ Screenshots captured!');
})();
