import { setDebugMode } from '@/js/services/debugService.js';
import { FAILURE_KINDS, checkFailed } from './checkResult.js';
import { getCurrentVersion } from './currentVersions.js';
import { checkForRefresh } from './refreshCheck.js';
import { reloadPage } from './reloadPage.js';

jest.mock('./currentVersions.js', () => ({ getCurrentVersion: jest.fn() }));
jest.mock('./reloadPage.js', () => ({ reloadPage: jest.fn() }));

const ATTRIBUTE_VERSION_SITE = 'force-refresh-version-site';
const ATTRIBUTE_VERSION_PAGE = 'force-refresh-version-page';

const NETWORK_FAILURE = checkFailed(FAILURE_KINDS.NETWORK);

const html = () => document.querySelector('html');

const mockVersions = (versions) => getCurrentVersion.mockResolvedValue({ succeeded: true, versions });

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

  it('passes its options on to the version request', async () => {
    const options = { signal: new AbortController().signal };
    mockVersions({ currentVersionSite: 'site-1' });
    await checkForRefresh(options);
    expect(getCurrentVersion).toHaveBeenCalledWith(options);
  });

  describe('when the versions are retrieved', () => {
    it('resolves to a successful result', async () => {
      mockVersions({ currentVersionSite: 'site-1' });
      expect(await checkForRefresh()).toEqual({ succeeded: true });
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
    it('reports the kind of failure and the wait the server asked for', async () => {
      getCurrentVersion.mockResolvedValue(checkFailed(FAILURE_KINDS.SERVER, 30000));
      expect(await checkForRefresh()).toEqual(checkFailed(FAILURE_KINDS.SERVER, 30000));
    });

    it('reports a network failure', async () => {
      getCurrentVersion.mockResolvedValue(NETWORK_FAILURE);
      expect(await checkForRefresh()).toEqual(NETWORK_FAILURE);
    });

    it('reports a network failure when the request rejects', async () => {
      getCurrentVersion.mockRejectedValue(new Error('Network error'));
      expect(await checkForRefresh()).toEqual(NETWORK_FAILURE);
    });

    it('reports a network failure when the request resolves to nothing', async () => {
      getCurrentVersion.mockResolvedValue(undefined);
      expect(await checkForRefresh()).toEqual(NETWORK_FAILURE);
    });

    it('reports a failure when a successful result has no versions', async () => {
      getCurrentVersion.mockResolvedValue({ succeeded: true, versions: undefined });
      expect((await checkForRefresh()).succeeded).toBe(false);
    });

    it('does not reload', async () => {
      mockVersions({ currentVersionSite: 'site-1' });
      await checkForRefresh();
      getCurrentVersion.mockResolvedValue(NETWORK_FAILURE);
      await checkForRefresh();
      expect(reloadPage).not.toHaveBeenCalled();
    });

    it('still reloads on a later successful check with a new version', async () => {
      mockVersions({ currentVersionSite: 'site-1' });
      await checkForRefresh();
      getCurrentVersion.mockResolvedValue(NETWORK_FAILURE);
      await checkForRefresh();
      mockVersions({ currentVersionSite: 'site-2' });
      await checkForRefresh();
      expect(reloadPage).toHaveBeenCalledTimes(1);
    });
  });
});
