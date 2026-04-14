import fs from 'fs';
import path from 'path';
import { test, Page } from '@playwright/test';
import { screenshots, ScreenshotAction, SCREENSHOT_VIEWPORT } from './screenshots.config';

const WORDPRESS_ORG_DIR = path.resolve(__dirname, '../.wordpress-org');
const HIGHLIGHT_OVERLAY_OPACITY = 0.75;
const HIGHLIGHT_OUTLINE_RADIUS = 8;
const HIGHLIGHT_OUTLINE_SHADOW_INSET = 'inset 0 0 0 2px rgba(255,255,255,0.92), inset 0 0 0 4px rgba(72,94,144,0.55)';
const HIGHLIGHT_OUTLINE_SHADOW_OUTSET = '0 0 0 2px rgba(255,255,255,0.92), 0 0 0 4px rgba(72,94,144,0.55)';

type ActionHandlers = {
  [K in ScreenshotAction['type']]: (_page: Page, _action: Extract<ScreenshotAction, { type: K }>) => Promise<void>;
};

type AnyActionHandler = (_page: Page, _action: ScreenshotAction) => Promise<void>;

const ACTION_HANDLERS: ActionHandlers = {
  navigate: (page, { path: p }) => page.goto(p).then(() => undefined),
  click: (page, { selector }) => page.locator(selector).click(),
  selectOption: (page, { selector, label }) => page.locator(selector).selectOption({ label }).then(() => undefined),
  addStyle: (page, { css }) => page.addStyleTag({ content: css }).then(() => undefined),
  ensureSidebarCollapsed: async (page) => {
    const isCollapsed = await page.evaluate(() => document.body.classList.contains('folded'));

    if (!isCollapsed) {
      await page.locator('#collapse-button').click();
      await page.waitForTimeout(300);
    }
  },
  hover: (page, { selector }) => page.locator(selector).hover(),
  waitForSelector: (page, { selector }) => page.locator(selector).first().waitFor({ state: 'visible' }),
  waitForTimeout: (page, { ms }) => page.waitForTimeout(ms),
  // cspell:ignore networkidle
  waitForNetworkIdle: (page) => page.waitForLoadState('networkidle'),
  scrollTo: (page, { selector }) => page.locator(selector).scrollIntoViewIfNeeded(),
  pressKey: (page, { key }) => page.keyboard.press(key),
  highlightElement: (page, {
    selector,
    padding = 0,
    paddingX,
    paddingY,
    insetOutline = false,
  }) => page.evaluate(
    ({
      sel,
      opacity,
      padX,
      padY,
      outlineShadow,
      outlineRadius,
    }) => {
      const target = document.querySelector(sel);
      if (!target) return;

      const {
        x: sx, y: sy, right: sr, bottom: sb,
      } = target.getBoundingClientRect();
      const { innerWidth: vw, innerHeight: vh } = window;
      const left = Math.max(0, sx - padX);
      const top = Math.max(0, sy - padY);
      const right = Math.min(vw, sr + padX);
      const bottom = Math.min(vh, sb + padY);
      const bg = `rgba(0,0,0,${opacity})`;
      const base = `position:fixed;background:${bg};pointer-events:none;z-index:2147483647;`;

      // Four rectangles surrounding the spotlight — avoids SVG mask quirks
      const panels: [number, number, number, number][] = [
        [0, 0, vw, top],
        [0, bottom, vw, vh - bottom],
        [0, top, left, bottom - top],
        [right, top, vw - right, bottom - top],
      ];

      panels.forEach(([l, t, w, h]) => {
        const div = document.createElement('div');
        div.style.cssText = `${base}left:${l}px;top:${t}px;width:${w}px;height:${h}px;`;
        document.body.appendChild(div);
      });

      const outline = document.createElement('div');
      outline.style.cssText = [
        'position:fixed',
        `left:${left}px`,
        `top:${top}px`,
        `width:${Math.max(0, right - left)}px`,
        `height:${Math.max(0, bottom - top)}px`,
        `border-radius:${outlineRadius}px`,
        'box-sizing:border-box',
        `box-shadow:${outlineShadow}`,
        'pointer-events:none',
        'z-index:2147483647',
      ].join(';');
      document.body.appendChild(outline);
    },
    {
      sel: selector,
      opacity: HIGHLIGHT_OVERLAY_OPACITY,
      padX: paddingX ?? padding,
      padY: paddingY ?? padding,
      outlineShadow: insetOutline ? HIGHLIGHT_OUTLINE_SHADOW_INSET : HIGHLIGHT_OUTLINE_SHADOW_OUTSET,
      outlineRadius: HIGHLIGHT_OUTLINE_RADIUS,
    },
  ),
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
