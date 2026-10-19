import {
  getDefaultExpandedMinorVersions,
  getGroupedReleaseNotes,
  getNextExpandedMinorVersions,
} from '@/components/AdminReleaseNotes/AdminReleaseNotesUtils.js';

// What's New highlights describe one release. Update both values when a release has new
// highlights; until then the modal only opens on demand.
export const WHATS_NEW_MINOR_VERSION = '3.3';
export const WHATS_NEW_FEATURES = [
  { icon: 'tag', key: 'INTERFACE' },
  { icon: 'clock', key: 'PICKER' },
];

export function getMinorVersion(version) {
  return String(version ?? '').split('.').slice(0, 2).join('.');
}

export function shouldAnnounceWhatsNew(installedVersion, seenVersion) {
  return getMinorVersion(installedVersion) === WHATS_NEW_MINOR_VERSION
    && getMinorVersion(seenVersion) !== WHATS_NEW_MINOR_VERSION;
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
