import { setDebugMode } from '@/js/services/debugService.js';
import { getCurrentVersion } from './currentVersions.js';
import { checkForRefresh } from './refreshCheck.js';
import { reloadPage } from './reloadPage.js';

jest.mock('./currentVersions.js', () => ({ getCurrentVersion: jest.fn() }));
jest.mock('./reloadPage.js', () => ({ reloadPage: jest.fn() }));

const ATTRIBUTE_VERSION_SITE = 'force-refresh-version-site';
const ATTRIBUTE_VERSION_PAGE = 'force-refresh-version-page';

const html = () => document.querySelector('html');

const mockVersions = (data) => getCurrentVersion.mockResolvedValue({ code: 200, data });

describe('checkForRefresh', () => {
  beforeEach(() => {
    setDebugMode(false);
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    html().removeAttribute(ATTRIBUTE_VERSION_SITE);
    html().removeAttribute(ATTRIBUTE_VERSION_PAGE);
  });

  describe('when the versions are retrieved', () => {
    it('resolves to true', async () => {
      mockVersions({ currentVersionSite: 'site-1' });
      expect(await checkForRefresh()).toBe(true);
    });

    it('stores the site version on the first check without reloading', async () => {
      mockVersions({ currentVersionSite: 'site-1' });
      await checkForRefresh();
      expect(html().getAttribute(ATTRIBUTE_VERSION_SITE)).toBe('site-1');
      expect(reloadPage).not.toHaveBeenCalled();
    });

    it('stores the page version on the first check when one is returned', async () => {
      mockVersions({ currentVersionPage: 'page-1', currentVersionSite: 'site-1' });
      await checkForRefresh();
      expect(html().getAttribute(ATTRIBUTE_VERSION_PAGE)).toBe('page-1');
    });

    it('does not reload when the versions are unchanged', async () => {
      mockVersions({ currentVersionPage: 'page-1', currentVersionSite: 'site-1' });
      await checkForRefresh();
      await checkForRefresh();
      expect(reloadPage).not.toHaveBeenCalled();
    });

    it('reloads when the site version changes', async () => {
      mockVersions({ currentVersionSite: 'site-1' });
      await checkForRefresh();
      mockVersions({ currentVersionSite: 'site-2' });
      await checkForRefresh();
      expect(reloadPage).toHaveBeenCalledTimes(1);
    });

    it('reloads when the page version changes', async () => {
      mockVersions({ currentVersionPage: 'page-1', currentVersionSite: 'site-1' });
      await checkForRefresh();
      mockVersions({ currentVersionPage: 'page-2', currentVersionSite: 'site-1' });
      await checkForRefresh();
      expect(reloadPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('when debug mode is active', () => {
    beforeEach(async () => {
      setDebugMode(true);
      mockVersions({ currentVersionSite: 'site-1' });
      await checkForRefresh();
      mockVersions({ currentVersionSite: 'site-2' });
      await checkForRefresh();
    });

    it('does not reload when the version changes', () => {
      expect(reloadPage).not.toHaveBeenCalled();
    });

    it('logs that the conditions were met but not executed', () => {
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('Conditions met for reload but not executed.'),
      );
    });

    it('stores the new version so the same refresh is only reported once', () => {
      expect(html().getAttribute(ATTRIBUTE_VERSION_SITE)).toBe('site-2');
    });
  });

  describe('when the versions cannot be retrieved', () => {
    it('resolves to false when the request resolves to undefined after a network error', async () => {
      getCurrentVersion.mockResolvedValue(undefined);
      expect(await checkForRefresh()).toBe(false);
    });

    it('resolves to false when the request rejects', async () => {
      getCurrentVersion.mockRejectedValue(new Error('Network error'));
      expect(await checkForRefresh()).toBe(false);
    });

    it('resolves to false when the response is not a 200', async () => {
      getCurrentVersion.mockResolvedValue({ code: 500, data: undefined });
      expect(await checkForRefresh()).toBe(false);
    });

    it('resolves to false when a 200 response has no data', async () => {
      getCurrentVersion.mockResolvedValue({ code: 200, data: undefined });
      expect(await checkForRefresh()).toBe(false);
    });

    it('does not reload', async () => {
      mockVersions({ currentVersionSite: 'site-1' });
      await checkForRefresh();
      getCurrentVersion.mockResolvedValue(undefined);
      await checkForRefresh();
      expect(reloadPage).not.toHaveBeenCalled();
    });

    it('still reloads on a later successful check with a new version', async () => {
      mockVersions({ currentVersionSite: 'site-1' });
      await checkForRefresh();
      getCurrentVersion.mockResolvedValue(undefined);
      await checkForRefresh();
      mockVersions({ currentVersionSite: 'site-2' });
      await checkForRefresh();
      expect(reloadPage).toHaveBeenCalledTimes(1);
    });
  });
});
