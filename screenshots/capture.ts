import fs from 'fs';
import path from 'path';
import { test, Page } from '@playwright/test';
import { screenshots, ScreenshotAction, SCREENSHOT_VIEWPORT } from './screenshots.config';

const WORDPRESS_ORG_DIR = path.resolve(__dirname, '../.wordpress-org');
const HIGHLIGHT_OVERLAY_OPACITY = 0.75;

type ActionHandlers = {
  [K in ScreenshotAction['type']]: (_page: Page, _action: Extract<ScreenshotAction, { type: K }>) => Promise<void>;
};

type AnyActionHandler = (_page: Page, _action: ScreenshotAction) => Promise<void>;

const ACTION_HANDLERS: ActionHandlers = {
  navigate: (page, { path: p }) => page.goto(p).then(() => undefined),
  click: (page, { selector }) => page.locator(selector).click(),
  hover: (page, { selector }) => page.locator(selector).hover(),
  waitForSelector: (page, { selector }) => page.locator(selector).first().waitFor({ state: 'visible' }),
  waitForTimeout: (page, { ms }) => page.waitForTimeout(ms),
  // cspell:ignore networkidle
  waitForNetworkIdle: (page) => page.waitForLoadState('networkidle'),
  scrollTo: (page, { selector }) => page.locator(selector).scrollIntoViewIfNeeded(),
};

function runAction(page: Page, action: ScreenshotAction): Promise<void> {
  return (ACTION_HANDLERS[action.type] as AnyActionHandler)(page, action);
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
  await screenshots.reduce<Promise<void>>(async (chain, definition, i) => {
    await chain;

    const viewport = definition.viewport ?? SCREENSHOT_VIEWPORT;
    await page.setViewportSize(viewport);

    await definition.actions.reduce(
      (actionChain, action) => actionChain.then(() => runAction(page, action)),
      Promise.resolve(),
    );

    const outputPath = path.join(WORDPRESS_ORG_DIR, `screenshot-${i + 1}.png`);
    await page.screenshot({ path: outputPath });

    console.log(`Captured screenshot-${i + 1}.png`);
  }, Promise.resolve());

  syncCaptions();
  console.log('Captions synced to readme.txt and README.md');
});
