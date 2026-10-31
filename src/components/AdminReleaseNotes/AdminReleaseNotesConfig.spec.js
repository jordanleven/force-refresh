/* eslint-disable vue/sort-keys */
import {
  createReleaseNotesData,
  getFlatReleaseNotes,
  getLatestWhatsNewFeatures,
  getGroupedMinorReleaseNotes,
  getMinorVersionHeaderDate,
  getMinorVersionLabel,
  getMinorVersionToggleLabel,
  hasMinorVersionGrouping,
  isMinorVersionExpanded,
  getWhatsNewFeatures,
  parseReleaseNote,
  shouldAnnounceWhatsNew,
  splitFeatureNote,
  syncExpandedMinorVersions,
  toggleMinorVersionGroup,
  WHATS_NEW_DEFAULT_ICON,
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

describe('shouldAnnounceWhatsNew', () => {
  it('announces a release with no last-seen version', () => {
    expect(shouldAnnounceWhatsNew('3.3.0', null)).toBe(true);
  });
  it('announces a newer minor version', () => {
    expect(shouldAnnounceWhatsNew('3.3.0', '3.2.4')).toBe(true);
  });
  it('announces a newer major version', () => {
    expect(shouldAnnounceWhatsNew('4.0.0', '3.9.1')).toBe(true);
  });
  it('does not announce patch updates', () => {
    expect(shouldAnnounceWhatsNew('3.3.2', '3.3.0')).toBe(false);
  });
  it('does not repeat an already-seen minor version', () => {
    expect(shouldAnnounceWhatsNew('3.3.0', '3.3.0')).toBe(false);
  });
  it('does not announce prereleases', () => {
    expect(shouldAnnounceWhatsNew('3.3.0-beta.1', '3.2.1')).toBe(false);
  });
  it('ignores invalid versions', () => {
    expect(shouldAnnounceWhatsNew('not-a-version', null)).toBe(false);
  });
  it('announces the final release after a prerelease of that minor version', () => {
    expect(shouldAnnounceWhatsNew('4.1.0', '4.1.0-beta.1')).toBe(true);
  });
  it('announces the final release after a legacy-format prerelease of that minor version', () => {
    expect(shouldAnnounceWhatsNew('3.3.0', '3.3.0-1921AF.0')).toBe(true);
  });
  it('announces a patch release after a prerelease of its minor version', () => {
    expect(shouldAnnounceWhatsNew('4.1.2', '4.1.0-beta.1163.2')).toBe(true);
  });
  it('does not announce the final release after a prerelease of a patch version', () => {
    expect(shouldAnnounceWhatsNew('4.1.1', '4.1.1-beta.1')).toBe(false);
  });
});

describe('splitFeatureNote', () => {
  it('uses the first sentence as the feature title', () => {
    expect(splitFeatureNote('Static file polling is available. Enable it to reduce load.')).toEqual({
      description: 'Enable it to reduce load.',
      title: 'Static file polling is available.',
    });
  });
  it('keeps version numbers intact in feature titles', () => {
    expect(splitFeatureNote('Add support for WordPress 7.1.')).toEqual({ description: '', title: 'Add support for WordPress 7.1.' });
  });
});

describe('parseReleaseNote', () => {
  it('reads the icon named in a note comment', () => {
    expect(parseReleaseNote('Redesigned admin. A cleaner page. <!-- icon: palette -->').icon).toBe('palette');
  });
  it('removes the icon comment from the note text', () => {
    expect(parseReleaseNote('Redesigned admin. A cleaner page. <!-- icon: palette -->').text).toBe('Redesigned admin. A cleaner page.');
  });
  it('reads no icon from a note without a comment', () => {
    expect(parseReleaseNote('Redesigned admin.').icon).toBeNull();
  });
  it('keeps a note without a comment unchanged', () => {
    expect(parseReleaseNote('Redesigned admin.').text).toBe('Redesigned admin.');
  });
  it('removes other comments from the note text', () => {
    expect(parseReleaseNote('Redesigned admin. <!-- reviewed -->').text).toBe('Redesigned admin.');
  });
});

describe('getWhatsNewFeatures', () => {
  const release = (...features) => ({
    notes: [
      { sectionHeader: 'Changes', sectionNotes: ['Not a feature.'] },
      { sectionHeader: 'New Features', sectionNotes: features },
    ],
  });
  const notes = {
    '2.17.0': release('Old major.'),
    '3.0.0': release('Three oh.'),
    '3.1.0': release('Three one.'),
    '3.2.0': release('Three two.'),
    '3.2.1': { notes: [{ sectionHeader: 'Changes', sectionNotes: ['Bug fixes.'] }] },
    '3.3.0': release('Three three a.', 'Three three b.'),
    '3.4.0-beta.1': release('Beta.'),
  };
  const versionsOf = (features) => features.map(({ versionNumber }) => versionNumber);
  it('gathers features newer than the last-seen minor version, newest first', () => {
    expect(versionsOf(getWhatsNewFeatures(notes, '3.3.0', '3.1.2'))).toEqual(['3.3.0', '3.3.0', '3.2.0']);
  });
  it('caps features at the installed major after a major upgrade', () => {
    expect(versionsOf(getWhatsNewFeatures(notes, '3.3.0', '2.16.0'))).toEqual(['3.3.0', '3.3.0', '3.2.0', '3.1.0', '3.0.0']);
  });
  it('caps features at the installed major without a last-seen version', () => {
    expect(versionsOf(getWhatsNewFeatures(notes, '3.3.0', null))).toEqual(['3.3.0', '3.3.0', '3.2.0', '3.1.0', '3.0.0']);
  });
  it('excludes non-feature changelog sections', () => {
    const titles = getWhatsNewFeatures(notes, '3.3.0', null).map(({ title }) => title);
    expect(titles).not.toContain('Not a feature.');
  });
  it('excludes prerelease features', () => {
    const titles = getWhatsNewFeatures(notes, '3.3.0', null).map(({ title }) => title);
    expect(titles).not.toContain('Beta.');
  });
  it('returns nothing when the user has already seen the installed minor version', () => {
    expect(getWhatsNewFeatures(notes, '3.3.0', '3.3.0')).toEqual([]);
  });
  it('includes features of the minor version the user last saw as a prerelease', () => {
    expect(versionsOf(getWhatsNewFeatures(notes, '3.3.0', '3.3.0-beta.1'))).toEqual(['3.3.0', '3.3.0']);
  });
  it('excludes the minor version the user last saw as a patch prerelease', () => {
    expect(versionsOf(getWhatsNewFeatures(notes, '3.3.0', '3.2.1-beta.1'))).toEqual(['3.3.0', '3.3.0']);
  });
  it('gives each feature the icon named in its note', () => {
    const [{ icon }] = getWhatsNewFeatures({ '3.3.0': release('Redesign. <!-- icon: palette -->') }, '3.3.0', null);
    expect(icon).toBe('palette');
  });
  it('keeps the icon comment out of the feature title', () => {
    const [{ title }] = getWhatsNewFeatures({ '3.3.0': release('Redesign. <!-- icon: palette -->') }, '3.3.0', null);
    expect(title).toBe('Redesign.');
  });
  it('keeps the icon comment out of the feature description', () => {
    const [{ description }] = getWhatsNewFeatures({ '3.3.0': release('Redesign. A cleaner page. <!-- icon: palette -->') }, '3.3.0', null);
    expect(description).toBe('A cleaner page.');
  });
  it('gives features without an icon the default icon', () => {
    const [{ icon }] = getWhatsNewFeatures({ '3.3.0': release('Redesign.') }, '3.3.0', null);
    expect(icon).toBe(WHATS_NEW_DEFAULT_ICON);
  });
  it('gives features with an unknown icon the default icon', () => {
    const [{ icon }] = getWhatsNewFeatures({ '3.3.0': release('Redesign. <!-- icon: unicorn -->') }, '3.3.0', null);
    expect(icon).toBe(WHATS_NEW_DEFAULT_ICON);
  });
});

describe('getLatestWhatsNewFeatures', () => {
  const release = (...features) => ({
    notes: [
      { sectionHeader: 'Changes', sectionNotes: ['Not a feature.'] },
      { sectionHeader: 'New Features', sectionNotes: features },
    ],
  });
  const fixes = { notes: [{ sectionHeader: 'Fixes', sectionNotes: ['A fix.'] }] };
  const titlesOf = (features) => features.map(({ title }) => title);
  it('shows the features of the installed minor version', () => {
    const notes = { '4.0.0': release('Four oh.'), '4.1.0': release('Four one.') };
    expect(titlesOf(getLatestWhatsNewFeatures(notes, '4.1.0'))).toEqual(['Four one.']);
  });
  it('includes features from patch releases of the installed minor version', () => {
    const notes = { '4.1.0': release('Four one.'), '4.1.1': release('Four one one.') };
    expect(titlesOf(getLatestWhatsNewFeatures(notes, '4.1.1'))).toEqual(['Four one one.', 'Four one.']);
  });
  it('includes features from later patch releases of the installed minor version', () => {
    const notes = { '4.1.0': release('Four one.'), '4.1.1': release('Four one one.') };
    expect(titlesOf(getLatestWhatsNewFeatures(notes, '4.1.0'))).toEqual(['Four one one.', 'Four one.']);
  });
  it('falls back to the newest earlier minor version with features', () => {
    const notes = { '4.0.0': release('Four oh.'), '4.1.0': fixes, '4.2.0': fixes };
    expect(titlesOf(getLatestWhatsNewFeatures(notes, '4.2.0'))).toEqual(['Four oh.']);
  });
  it('falls back to an earlier major version with features', () => {
    const notes = { '3.9.0': release('Three nine.'), '4.0.0': fixes };
    expect(titlesOf(getLatestWhatsNewFeatures(notes, '4.0.0'))).toEqual(['Three nine.']);
  });
  it('ignores features newer than the installed minor version', () => {
    const notes = { '4.1.0': release('Four one.'), '4.2.0': release('Four two.') };
    expect(titlesOf(getLatestWhatsNewFeatures(notes, '4.1.3'))).toEqual(['Four one.']);
  });
  it('ignores features from other prereleases', () => {
    const notes = { '4.1.0': release('Four one.'), '4.2.0-beta.1': release('Beta.') };
    expect(titlesOf(getLatestWhatsNewFeatures(notes, '4.1.0'))).toEqual(['Four one.']);
  });
  it('shows the features of an installed prerelease', () => {
    const notes = { '4.1.0': release('Four one.'), '4.2.0-beta.1': release('Beta.') };
    expect(titlesOf(getLatestWhatsNewFeatures(notes, '4.2.0-beta.1'))).toEqual(['Beta.']);
  });
  it('returns nothing when no release has features', () => {
    expect(getLatestWhatsNewFeatures({ '4.0.0': fixes }, '4.0.0')).toEqual([]);
  });
  it('returns nothing without release notes', () => {
    expect(getLatestWhatsNewFeatures(null, '4.0.0')).toEqual([]);
  });
  it('returns nothing for an unreadable version', () => {
    expect(getLatestWhatsNewFeatures({ '4.0.0': release('Four oh.') }, 'not-a-version')).toEqual([]);
  });
});
