export type ScreenshotAction =
  | { type: 'navigate'; path: string }
  | { type: 'click'; selector: string }
  | { type: 'selectOption'; selector: string; label: string }
  | { type: 'addStyle'; css: string }
  | { type: 'ensureSidebarCollapsed' }
  | { type: 'hover'; selector: string }
  | { type: 'waitForSelector'; selector: string }
  | { type: 'waitForTimeout'; ms: number }
  | { type: 'waitForNetworkIdle' }
  | { type: 'scrollTo'; selector: string }
  | { type: 'pressKey'; key: string }
  | {
      type: 'highlightElement';
      selector: string;
      padding?: number;
      paddingX?: number;
      paddingY?: number;
      insetOutline?: boolean;
    };

export interface ScreenshotDefinition {
  caption: string;
  viewport?: { width: number; height: number };
  actions: ScreenshotAction[];
}

export const SCREENSHOT_VIEWPORT = { width: 1280, height: 831 };

const CAPTIONS = {
  adminBar: 'You can enable Force Refresh in the WordPress admin bar for quick access from anywhere in the dashboard.',
  pluginPage: "Under Tools, you'll find all settings for Force Refresh.",
  releaseNotes: 'Want to see the latest features? Clicking "View Release Notes" will display the most recent features and fixes for Force Refresh.',
  singlePage: 'To refresh a single page or post, locate the "Force Refresh" section under any page.',
  toolsRefresh: "Choose from popular refresh intervals or set a custom one. You'll receive confirmation that browsers were requested to refresh.",
  troubleshooting: `If you're having trouble, clicking on "Troubleshooting" will allow you to view the current settings for Force Refresh and allow
  you to enter Debugging Mode: an enhanced browser console logging mode that can be used to diagnose issues.`,
} as const;

export const screenshots: ScreenshotDefinition[] = [
  {
    caption: CAPTIONS.pluginPage,
    actions: [
      { type: 'navigate', path: '/wp-admin/tools.php?page=force_refresh' },
      { type: 'waitForSelector', selector: 'select[name="refresh-interval"]' },
      { type: 'addStyle', css: '.force-refresh__container { padding-top: 24px; }' },
      { type: 'ensureSidebarCollapsed' },
    ],
  },
  {
    caption: CAPTIONS.adminBar,
    actions: [
      { type: 'navigate', path: '/wp-admin/tools.php?page=force_refresh' },
      { type: 'waitForSelector', selector: 'select[name="show-in-wp-admin-bar"]' },
      { type: 'ensureSidebarCollapsed' },
      { type: 'selectOption', selector: 'select[name="show-in-wp-admin-bar"]', label: 'Show' },
      { type: 'click', selector: '[data-test="btn-update-options"]' },
      { type: 'waitForSelector', selector: '.notice-force-refresh.notice-success' },
      { type: 'click', selector: '.notice-force-refresh__button' },
      { type: 'waitForSelector', selector: '[data-test="btn-admin-bar-refresh"]' },
      {
        type: 'highlightElement',
        selector: '[data-test="btn-admin-bar-refresh"]',
        paddingX: 10,
        paddingY: 0,
        insetOutline: true,
      },
      { type: 'waitForTimeout', ms: 300 },
    ],
  },
  {
    caption: CAPTIONS.toolsRefresh,
    actions: [
      { type: 'navigate', path: '/wp-admin/tools.php?page=force_refresh' },
      { type: 'waitForSelector', selector: 'select[name="refresh-interval"]' },
      { type: 'ensureSidebarCollapsed' },
      { type: 'click', selector: '[data-test="btn-force-refresh"]' },
      { type: 'waitForSelector', selector: '.notice-force-refresh.notice-success' },
      { type: 'waitForTimeout', ms: 600 },
      { type: 'scrollTo', selector: '.notice-force-refresh.notice-success' },
    ],
  },
  {
    caption: CAPTIONS.singlePage,
    actions: [
      // Assumes post ID 1 exists (the default "Hello world!" post in WordPress)
      { type: 'navigate', path: '/wp-admin/post.php?post=1&action=edit' },
      // Dismiss the Gutenberg "Welcome to the editor" guide if present
      { type: 'pressKey', key: 'Escape' },
      { type: 'ensureSidebarCollapsed' },
      { type: 'waitForSelector', selector: '#force-refresh-meta-box' },
      { type: 'scrollTo', selector: '#force-refresh-meta-box' },
      {
        type: 'highlightElement',
        selector: '#force-refresh-meta-box .force-refresh-admin-main',
        padding: 10,
        insetOutline: false,
      },
      { type: 'waitForTimeout', ms: 200 },
    ],
  },
  {
    caption: CAPTIONS.releaseNotes,
    actions: [
      { type: 'navigate', path: '/wp-admin/tools.php?page=force_refresh' },
      { type: 'waitForSelector', selector: 'select[name="refresh-interval"]' },
      { type: 'ensureSidebarCollapsed' },
      { type: 'click', selector: '[data-test="btn-release-notes"]' },
      { type: 'waitForNetworkIdle' },
      { type: 'waitForSelector', selector: '.release-note' },
      { type: 'waitForTimeout', ms: 1000 },
    ],
  },
  {
    caption: CAPTIONS.troubleshooting,
    actions: [
      { type: 'navigate', path: '/wp-admin/tools.php?page=force_refresh' },
      { type: 'waitForSelector', selector: 'select[name="refresh-interval"]' },
      { type: 'ensureSidebarCollapsed' },
      { type: 'click', selector: '[data-test="btn-troubleshooting"]' },
      { type: 'waitForSelector', selector: '.force-refresh-troubleshooting' },
      { type: 'click', selector: '[data-test="toggle-debug-mode"] label' },
      { type: 'waitForSelector', selector: '.header-row__badges .admin-header-badge--debug' },
      { type: 'waitForTimeout', ms: 1500 },
    ],
  },
];
