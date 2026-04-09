/* eslint-disable vue/sort-keys */
import {
  createReleaseNotesData,
  getFlatReleaseNotes,
  getGroupedMinorReleaseNotes,
  getMinorVersionHeaderDate,
  getMinorVersionLabel,
  getMinorVersionToggleLabel,
  hasMinorVersionGrouping,
  isMinorVersionExpanded,
  syncExpandedMinorVersions,
  toggleMinorVersionGroup,
} from './AdminReleaseNotesConfig.js';

const RELEASE_NOTES_FIXTURE = {
  '2.16.2': {
    date: 'Released on June 29, 2007',
    isCurrentVersion: true,
    notes: [],
  },
  '2.16.1': {
    date: 'Released on January 9, 2007',
    isCurrentVersion: false,
    notes: [],
  },
  '2.15.0': {
    date: 'Released on January 24, 1984',
    isCurrentVersion: false,
    notes: [],
  },
};

function createVm(overrides = {}) {
  return {
    ...createReleaseNotesData(),
    $t: (key, values = {}) => `${key}:${JSON.stringify(values)}`,
    ...overrides,
  };
}

describe('AdminReleaseNotesConfig', () => {
  describe('getFlatReleaseNotes', () => {
    it('returns release entries in render-ready shape', () => {
      expect(getFlatReleaseNotes(RELEASE_NOTES_FIXTURE)).toEqual([
        {
          release: RELEASE_NOTES_FIXTURE['2.16.2'],
          versionNumber: '2.16.2',
        },
        {
          release: RELEASE_NOTES_FIXTURE['2.16.1'],
          versionNumber: '2.16.1',
        },
        {
          release: RELEASE_NOTES_FIXTURE['2.15.0'],
          versionNumber: '2.15.0',
        },
      ]);
    });
  });

  describe('getGroupedMinorReleaseNotes', () => {
    it('groups releases by minor version for the component view', () => {
      expect(getGroupedMinorReleaseNotes(RELEASE_NOTES_FIXTURE)).toEqual([
        {
          isCurrentMinorVersion: true,
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
          minorVersion: '2.15',
          releases: [
            {
              release: RELEASE_NOTES_FIXTURE['2.15.0'],
              versionNumber: '2.15.0',
            },
          ],
        },
      ]);
    });
  });

  describe('hasMinorVersionGrouping', () => {
    it('returns true when more than one minor version is present', () => {
      expect(hasMinorVersionGrouping(RELEASE_NOTES_FIXTURE)).toBe(true);
    });

    it('returns false when only one minor version exists', () => {
      expect(hasMinorVersionGrouping({
        '2.16.2': RELEASE_NOTES_FIXTURE['2.16.2'],
        '2.16.1': RELEASE_NOTES_FIXTURE['2.16.1'],
      })).toBe(false);
    });
  });

  describe('syncExpandedMinorVersions', () => {
    it('opens the current minor version by default', () => {
      expect(syncExpandedMinorVersions(RELEASE_NOTES_FIXTURE)).toEqual({
        2.16: true,
      });
    });
  });

  describe('toggleMinorVersionGroup', () => {
    it('switches the open accordion section to the selected minor version', () => {
      const vm = createVm({
        expandedMinorVersions: {
          2.16: true,
        },
      });

      expect(toggleMinorVersionGroup(vm, '2.15')).toEqual({
        2.15: true,
      });
    });

    it('closes the open section when it is toggled again', () => {
      const vm = createVm({
        expandedMinorVersions: {
          2.15: true,
        },
      });

      expect(toggleMinorVersionGroup(vm, '2.15')).toEqual({});
    });
  });

  describe('isMinorVersionExpanded', () => {
    it('returns true when a minor version is expanded', () => {
      const vm = createVm({
        expandedMinorVersions: {
          2.16: true,
        },
      });

      expect(isMinorVersionExpanded(vm, '2.16')).toBe(true);
    });
  });

  describe('getMinorVersionLabel', () => {
    it('returns the translated minor version label', () => {
      expect(getMinorVersionLabel(createVm(), '2.16')).toBe('RELEASE_NOTES.MINOR_VERSION_LABEL:{"minorVersion":"2.16"}');
    });
  });

  describe('getMinorVersionHeaderDate', () => {
    it('returns the most recent release date in the visible group header', () => {
      expect(getMinorVersionHeaderDate(getGroupedMinorReleaseNotes(RELEASE_NOTES_FIXTURE)[0]))
        .toBe('Released on June 29, 2007');
    });

    it('returns an empty string when the group has no releases', () => {
      expect(getMinorVersionHeaderDate({
        minorVersion: '2.16',
        releases: [],
      })).toBe('');
    });
  });

  describe('getMinorVersionToggleLabel', () => {
    it('returns the hide label when the section is expanded', () => {
      const vm = createVm({
        expandedMinorVersions: {
          2.16: true,
        },
      });

      expect(getMinorVersionToggleLabel(vm, '2.16')).toBe('RELEASE_NOTES.MINOR_VERSION_HIDE:{}');
    });

    it('returns the show label when the section is collapsed', () => {
      expect(getMinorVersionToggleLabel(createVm(), '2.16')).toBe('RELEASE_NOTES.MINOR_VERSION_SHOW:{}');
    });
  });
});
