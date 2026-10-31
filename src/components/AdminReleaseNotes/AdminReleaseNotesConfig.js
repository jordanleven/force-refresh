import {
  getDefaultExpandedMinorVersions,
  getGroupedReleaseNotes,
  getNextExpandedMinorVersions,
} from '@/components/AdminReleaseNotes/AdminReleaseNotesUtils.js';

const WHATS_NEW_SECTION_HEADER = 'New Features';

export const WHATS_NEW_MAX_FEATURES = 6;

export function parseVersion(version) {
  const match = /^(\d+)\.(\d+)(?:\.(\d+))?(-.+)?$/.exec(String(version ?? '').trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0),
    prerelease: Boolean(match[4]),
  };
}

const compareMinorVersions = (a, b) => (a.major - b.major) || (a.minor - b.minor);

const compareVersions = (a, b) => compareMinorVersions(a, b) || (a.patch - b.patch);

// A prerelease of a new minor (like 4.1.0-beta.1) predates that minor's final release, so it hasn't seen it yet.
const hasSeenMinorVersion = (version, lastSeen) => {
  const comparison = compareMinorVersions(version, lastSeen);
  if (comparison !== 0) return comparison < 0;
  return !(lastSeen.prerelease && lastSeen.patch === 0);
};

// Changelog entries lead with a sentence that works as a title; the rest becomes the description.
export function splitFeatureNote(note) {
  const match = /^(.+?[.!?])\s+(.+)$/s.exec(note.trim());
  return match
    ? { description: match[2], title: match[1] }
    : { description: '', title: note.trim() };
}

// Prereleases never announce, so beta testers still see What's New when the final release ships.
export function shouldAnnounceWhatsNew(installedVersion, lastSeenVersion) {
  const installed = parseVersion(installedVersion);
  if (!installed || installed.prerelease) return false;
  const lastSeen = parseVersion(lastSeenVersion);
  return !lastSeen || !hasSeenMinorVersion(installed, lastSeen);
}

// Collect every new feature since the user's last-seen minor version, capped at the installed major.
export function getWhatsNewFeatures(releaseNotes, installedVersion, lastSeenVersion) {
  const installed = parseVersion(installedVersion);
  if (!installed) return [];
  const lastSeen = parseVersion(lastSeenVersion);

  return Object.entries(releaseNotes || {})
    .map(([versionNumber, release]) => ({ release, version: parseVersion(versionNumber), versionNumber }))
    .filter(({ version }) => version
      && !version.prerelease
      && version.major === installed.major
      && compareMinorVersions(version, installed) <= 0
      && (!lastSeen || !hasSeenMinorVersion(version, lastSeen)))
    .sort((a, b) => compareVersions(b.version, a.version))
    .flatMap(({ release, versionNumber }) => (release?.notes ?? [])
      .filter(({ sectionHeader }) => sectionHeader?.trim() === WHATS_NEW_SECTION_HEADER)
      .flatMap(({ sectionNotes }) => sectionNotes.map((note) => ({ ...splitFeatureNote(note), versionNumber }))));
}

export function createReleaseNotesData() {
  return {
    expandedMinorVersions: {},
  };
}

export function getFlatReleaseNotes(releaseNotes) {
  return Object.entries(releaseNotes || {}).map(([versionNumber, release]) => ({
    release,
    versionNumber,
  }));
}

export function getGroupedMinorReleaseNotes(releaseNotes) {
  return getGroupedReleaseNotes(releaseNotes);
}

export function hasMinorVersionGrouping(releaseNotes) {
  return getGroupedMinorReleaseNotes(releaseNotes).length > 1;
}

export function syncExpandedMinorVersions(releaseNotes) {
  return getDefaultExpandedMinorVersions(releaseNotes);
}

export function getMinorVersionLabel(vm, minorVersion) {
  return vm.$t('RELEASE_NOTES.MINOR_VERSION_LABEL', {
    minorVersion,
  });
}

export function isMinorVersionExpanded(vm, minorVersion) {
  return !!vm.expandedMinorVersions[minorVersion];
}

export function getMinorVersionToggleLabel(vm, minorVersion) {
  if (isMinorVersionExpanded(vm, minorVersion)) {
    return vm.$t('RELEASE_NOTES.MINOR_VERSION_HIDE');
  }

  return vm.$t('RELEASE_NOTES.MINOR_VERSION_SHOW');
}

export function getMinorVersionHeaderDate(group) {
  if (!group?.releases?.length) {
    return '';
  }

  return group.releases[0]?.release?.date || '';
}

export function toggleMinorVersionGroup(vm, minorVersion) {
  return getNextExpandedMinorVersions(minorVersion, vm.expandedMinorVersions);
}
