function getStableReleaseEntries(releaseNotes = {}) {
  return Object.entries(releaseNotes || {});
}

const GITHUB_URL_FORCE_REFRESH_BY_TAG = 'https://github.com/jordanleven/force-refresh/releases/tag';

export function getMinorVersion(versionNumber = '') {
  const [versionCore = ''] = versionNumber.split('-');
  const [majorVersion = '0', minorVersion = '0'] = versionCore.split('.');

  return `${majorVersion}.${minorVersion}`;
}

export function getReleaseUrlByVersionNumber(versionNumber = '') {
  return `${GITHUB_URL_FORCE_REFRESH_BY_TAG}/v${versionNumber}`;
}

export function getCurrentMinorVersion(releaseNotes = {}) {
  const currentReleaseEntry = getStableReleaseEntries(releaseNotes)
    .find(([, release]) => release?.isCurrentVersion);

  if (currentReleaseEntry) {
    return getMinorVersion(currentReleaseEntry[0]);
  }

  const firstReleaseEntry = getStableReleaseEntries(releaseNotes)[0];
  return firstReleaseEntry ? getMinorVersion(firstReleaseEntry[0]) : null;
}

export function getGroupedReleaseNotes(releaseNotes = {}) {
  const currentMinorVersion = getCurrentMinorVersion(releaseNotes);
  const groups = [];

  getStableReleaseEntries(releaseNotes).forEach(([versionNumber, release]) => {
    const minorVersion = getMinorVersion(versionNumber);
    const existingGroup = groups.find((group) => group.minorVersion === minorVersion);

    if (existingGroup) {
      existingGroup.releases.push({
        release,
        versionNumber,
      });
      return;
    }

    groups.push({
      isCurrentMinorVersion: minorVersion === currentMinorVersion,
      minorVersion,
      releases: [
        {
          release,
          versionNumber,
        },
      ],
    });
  });

  return groups;
}

export function getDefaultExpandedMinorVersions(releaseNotes = {}) {
  const groups = getGroupedReleaseNotes(releaseNotes);
  const currentMinorVersion = groups.find((group) => group.isCurrentMinorVersion)?.minorVersion;

  if (!currentMinorVersion) {
    return {};
  }

  return {
    [currentMinorVersion]: true,
  };
}

export function getNextExpandedMinorVersions(minorVersion, expandedMinorVersions = {}) {
  if (expandedMinorVersions[minorVersion]) {
    return {};
  }

  return {
    [minorVersion]: true,
  };
}
