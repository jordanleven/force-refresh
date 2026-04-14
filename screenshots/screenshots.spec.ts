import fs from 'fs';
import path from 'path';
import { test, Page } from '@playwright/test';
import { screenshots, ScreenshotAction, SCREENSHOT_VIEWPORT } from './screenshots.config';

const WORDPRESS_ORG_DIR = path.resolve(__dirname, '../.wordpress-org');

async function runAction(page: Page, action: ScreenshotAction): Promise<void> {
  switch (action.type) {
    case 'navigate':
      await page.goto(action.path);
      break;
    case 'click':
      await page.locator(action.selector).click();
      break;
    case 'hover':
      await page.locator(action.selector).hover();
      break;
    case 'waitForSelector':
      await page.locator(action.selector).first().waitFor({ state: 'visible' });
      break;
    case 'waitForTimeout':
      await page.waitForTimeout(action.ms);
      break;
    case 'waitForNetworkIdle':
      await page.waitForLoadState('networkidle');
      break;
    case 'scrollTo':
      await page.locator(action.selector).scrollIntoViewIfNeeded();
      break;
  }
}

function syncCaptions(): void {
  const numberedCaptions = screenshots.map((s, i) => `${i + 1}. ${s.caption}`).join('\n');

  // readme.txt uses WordPress "== Screenshots ==" heading format
  const readmeTxtPath = path.resolve(__dirname, '..', 'readme.txt');
  if (fs.existsSync(readmeTxtPath)) {
    const content = fs.readFileSync(readmeTxtPath, 'utf-8');
    const updated = content.replace(
      /(== Screenshots ==\n)[\s\S]*?(\n\n)/,
      `$1${numberedCaptions}$2`,
    );
    fs.writeFileSync(readmeTxtPath, updated, 'utf-8');
  }

  // README.md uses Markdown "## Screenshots" heading format
  const readmeMdPath = path.resolve(__dirname, '..', 'README.md');
  if (fs.existsSync(readmeMdPath)) {
    const content = fs.readFileSync(readmeMdPath, 'utf-8');
    const updated = content.replace(
      /(## Screenshots\n\n)[\s\S]*$/,
      `$1${numberedCaptions}\n`,
    );
    fs.writeFileSync(readmeMdPath, updated, 'utf-8');
  }
}

test('Capture WordPress.org screenshots', async ({ page }) => {
  for (let i = 0; i < screenshots.length; i++) {
    const definition = screenshots[i];
    const viewport = definition.viewport ?? SCREENSHOT_VIEWPORT;

    await page.setViewportSize(viewport);

    for (const action of definition.actions) {
      await runAction(page, action);
    }

    const outputPath = path.join(WORDPRESS_ORG_DIR, `screenshot-${i + 1}.png`);
    await page.screenshot({ path: outputPath });

    console.log(`Captured screenshot-${i + 1}.png`);
  }

  syncCaptions();
  console.log('Captions synced to readme.txt and README.md');
});
