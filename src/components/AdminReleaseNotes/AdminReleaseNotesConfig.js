import {
  getDefaultExpandedMinorVersions,
  getGroupedReleaseNotes,
  getNextExpandedMinorVersions,
} from '@/components/AdminReleaseNotes/AdminReleaseNotesUtils.js';

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
