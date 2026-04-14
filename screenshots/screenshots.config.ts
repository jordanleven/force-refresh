export type ScreenshotAction =
  | { type: 'navigate'; path: string }
  | { type: 'click'; selector: string }
  | { type: 'hover'; selector: string }
  | { type: 'waitForSelector'; selector: string }
  | { type: 'waitForTimeout'; ms: number }
  | { type: 'waitForNetworkIdle' }
  | { type: 'scrollTo'; selector: string };

export interface ScreenshotDefinition {
  caption: string;
  viewport?: { width: number; height: number };
  actions: ScreenshotAction[];
}

export const SCREENSHOT_VIEWPORT = { width: 1600, height: 999 };

export const screenshots: ScreenshotDefinition[] = [
  {
    caption: "Under Tools, you'll find all settings for Force Refresh.",
    actions: [
      { type: 'navigate', path: '/wp-admin/tools.php?page=force_refresh' },
      { type: 'waitForSelector', selector: 'select[name="refresh-interval"]' },
    ],
  },
  {
    caption: "You can choose from popular refresh intervals or specify a custom one. After clicking \"Refresh site\", you'll receive confirmation that you've requested connected browsers to refresh.",
    actions: [
      { type: 'navigate', path: '/wp-admin/tools.php?page=force_refresh' },
      { type: 'waitForSelector', selector: 'select[name="refresh-interval"]' },
      { type: 'click', selector: '[data-test="btn-force-refresh"]' },
      { type: 'waitForSelector', selector: '.notice-force-refresh.notice-success' },
    ],
  },
  {
    caption: 'To refresh a single page or post, locate the "Force Refresh" section under any page.',
    actions: [
      // Assumes post ID 1 exists (the default "Hello world!" post in WordPress)
      { type: 'navigate', path: '/wp-admin/post.php?post=1&action=edit' },
      { type: 'waitForSelector', selector: '#force-refresh-meta-box' },
      { type: 'scrollTo', selector: '#force-refresh-meta-box' },
    ],
  },
  {
    caption: 'Want to see the latest features? Clicking "View Release Notes" will display the most recent features and fixes for Force Refresh.',
    actions: [
      { type: 'navigate', path: '/wp-admin/tools.php?page=force_refresh' },
      { type: 'waitForSelector', selector: 'select[name="refresh-interval"]' },
      { type: 'click', selector: '[data-test="btn-release-notes"]' },
      { type: 'waitForNetworkIdle' },
      { type: 'waitForSelector', selector: '.release-note' },
    ],
  },
  {
    caption: "If you're having trouble, clicking on \"Troubleshooting\" will allow you to view the current settings for Force Refresh and allow you to enter Debugging Mode — an enhanced browser console logging mode that can be used to diagnose issues.",
    actions: [
      { type: 'navigate', path: '/wp-admin/tools.php?page=force_refresh' },
      { type: 'waitForSelector', selector: 'select[name="refresh-interval"]' },
      { type: 'click', selector: '[data-test="btn-troubleshooting"]' },
      { type: 'waitForSelector', selector: '.force-refresh-troubleshooting' },
    ],
  },
];
