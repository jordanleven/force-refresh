/* eslint-disable vue/sort-keys */
import {
  getCurrentMinorVersion,
  getDefaultExpandedMinorVersions,
  getGroupedReleaseNotes,
  getMinorVersion,
  getNextExpandedMinorVersions,
  getReleaseUrlByVersionNumber,
} from './AdminReleaseNotesUtils.js';

const RELEASE_NOTES_FIXTURE = {
  '3.0.0': {
    date: 'Released on January 24, 1984',
    isCurrentVersion: true,
    notes: [],
  },
  '2.16.2': {
    date: 'Released on June 29, 2007',
    isCurrentVersion: false,
    notes: [],
  },
  '2.16.1': {
    date: 'Released on January 9, 2007',
    isCurrentVersion: false,
    notes: [],
  },
  '1.5.0': {
    date: 'Released on January 9, 2001',
    isCurrentVersion: false,
    notes: [],
  },
};

describe('AdminReleaseNotesUtils', () => {
  describe('getMinorVersion', () => {
    it('returns the minor version from a stable version number', () => {
      expect(getMinorVersion('2.16.2')).toBe('2.16');
    });

    it('returns the minor version from a beta version number', () => {
      expect(getMinorVersion('3.0.0-ABC123.1')).toBe('3.0');
    });
  });

  describe('getReleaseUrlByVersionNumber', () => {
    it('returns the GitHub release tag URL for a stable version', () => {
      expect(getReleaseUrlByVersionNumber('2.16.2'))
        .toBe('https://github.com/jordanleven/force-refresh/releases/tag/v2.16.2');
    });

    it('returns the GitHub release tag URL for a prerelease version', () => {
      expect(getReleaseUrlByVersionNumber('3.0.0-ABC123.1'))
        .toBe('https://github.com/jordanleven/force-refresh/releases/tag/v3.0.0-ABC123.1');
    });
  });

  describe('getCurrentMinorVersion', () => {
    it('returns the current installed minor version when present', () => {
      expect(getCurrentMinorVersion(RELEASE_NOTES_FIXTURE)).toBe('3.0');
    });

    it('falls back to the latest release minor version when no release is marked current', () => {
      expect(getCurrentMinorVersion({
        '4.1.0': {
          isCurrentVersion: false,
          notes: [],
        },
        '3.9.0': {
          isCurrentVersion: false,
          notes: [],
        },
      })).toBe('4.1');
    });
  });

  describe('getGroupedReleaseNotes', () => {
    it('groups release notes by minor version while preserving release order', () => {
      expect(getGroupedReleaseNotes(RELEASE_NOTES_FIXTURE)).toEqual([
        {
          isCurrentMinorVersion: true,
          minorVersion: '3.0',
          releases: [
            {
              release: RELEASE_NOTES_FIXTURE['3.0.0'],
              versionNumber: '3.0.0',
            },
          ],
        },
        {
          isCurrentMinorVersion: false,
          minorVersion: '2.16',
          releases: [
            {
              release: RELEASE_NOTES_FIXTURE['2.16.2'],
              versionNumber: '2.16.2',
            },
            {
              release: RELEASE_NOTES_FIXTURE['2.16.1'],
              versionNumber: '2.16.1',
            },
          ],
        },
        {
          isCurrentMinorVersion: false,
          minorVersion: '1.5',
          releases: [
            {
              release: RELEASE_NOTES_FIXTURE['1.5.0'],
              versionNumber: '1.5.0',
            },
          ],
        },
      ]);
    });
  });

  describe('getDefaultExpandedMinorVersions', () => {
    it('expands only the current minor version by default', () => {
      expect(getDefaultExpandedMinorVersions(RELEASE_NOTES_FIXTURE)).toEqual({
        '3.0': true,
      });
    });

    it('returns an empty state when there are no release notes', () => {
      expect(getDefaultExpandedMinorVersions(null)).toEqual({});
    });
  });

  describe('getNextExpandedMinorVersions', () => {
    it('opens only the selected older minor version', () => {
      expect(getNextExpandedMinorVersions('2.16', { '3.0': true })).toEqual({
        2.16: true,
      });
    });

    it('switches to a different older minor version as the only open group', () => {
      expect(getNextExpandedMinorVersions('1.5', { 2.16: true })).toEqual({
        1.5: true,
      });
    });

    it('opens the current minor version when it is selected from a different open group', () => {
      expect(getNextExpandedMinorVersions('3.0', { 1.5: true })).toEqual({
        '3.0': true,
      });
    });

    it('closes the currently open group when it is clicked again', () => {
      expect(getNextExpandedMinorVersions('3.0', { '3.0': true })).toEqual({});
    });
  });
});
