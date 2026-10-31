const { execFileSync } = require('child_process');

/**
 * The title and intro lines at the top of CHANGELOG.md, which releases are inserted below.
 */
const CHANGELOG_HEADER_LINE_COUNT = 4;

/**
 * Function to insert a release's notes below the changelog header, the same way
 * release-beta.yml does, so the newest release comes first.
 * @param   {string}  changelogMd  The raw CHANGELOG.md content
 * @param   {string}  releaseMd    The release notes to insert
 * @return  {string}               The changelog including the release
 */
const insertRelease = (changelogMd, releaseMd) => {
  const lines = changelogMd.split('\n');
  return [
    ...lines.slice(0, CHANGELOG_HEADER_LINE_COUNT),
    releaseMd.trimEnd(),
    '',
    ...lines.slice(CHANGELOG_HEADER_LINE_COUNT),
  ].join('\n');
};

/**
 * Function to render the unreleased changie fragments as the next version. A dry run
 * prints the release without writing CHANGELOG.md or removing the fragments.
 * @return  {string|null}  The release notes, or null when nothing is unreleased
 */
const getUnreleasedRelease = () => {
  try {
    return execFileSync('npx', ['changie', 'batch', 'auto', '--dry-run'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
};

/**
 * Function to add the unreleased fragments to a changelog as the next version.
 * @param   {string}  changelogMd  The raw CHANGELOG.md content
 * @return  {string}               The changelog including any unreleased changes
 */
const addUnreleasedRelease = (changelogMd) => {
  const releaseMd = getUnreleasedRelease();
  return releaseMd ? insertRelease(changelogMd, releaseMd) : changelogMd;
};

module.exports = { addUnreleasedRelease, insertRelease };
