/* eslint-disable */
const simpleGit = require('simple-git');
const git = simpleGit();
const dedent = require('dedent');
const md2json = require('md-2-json');

/**
 * In some changes, release notes for a specific release are unavailable for specific
 * types of commits. In these cases, this message will be used in lieu of the contents
 * of the change.
 */
const MESSAGE_NOTES_FOR_RELEASE_UNAVAILABLE = 'Performance enhancements and bug fixes.';

const MESSAGE_NOTES_HEADERS = {
  BUG: '##### **Fixes**\n',
  FEATURE: '##### **New Features**\n',
  CHANGED: '##### **Changes**\n',
};

const SINGLE_ENTRY_RELEASE_NOTES = {
  'Dependencies & security': '* Performance enhancements and bug fixes.\n',
};

/**
 * Function to remove the bold formatting in Markdown.
 */
const removeMdFormattingBold = (string) => string.replace(/\*/g, '');

/**
 * Function to remove all headings in Markdown.
 */
const removeMdFormattingHeadings = (string) => string.replace(/(?:__| ?[*#]) ?/g, '');

/**
 * Function to remove all links in Markdown.
 */
const removeMdFormattingLinks = (string) => string.replace(/(\[\]) ?|\[|]\(.*?\)/g, '');

/**
 * Function to convert multiple line breaks in Markdown into two line breaks.
 */
const removeMdFormattingMultipleLineBreaks = (string) => string.replace(/\n\s*\n/g, '\n\n');

/**
 * Function to apply an enumerated set of formatting changes to markdown sections.
 * @param   {string}  content  The content to be formatted
 * @return  {string}           Formatted content
 */
const formatMarkdownSections = (content) =>
  content
    .replace(/(\["|\"])/g, '')
    .replace(/", "/g, '\n')
    .replace(/\\n ?/g, '\n')
    .replace(/^"/, '')
    .replace(/\n"$/, '');

/**
 * Function to get the formatted plugin info that's displayed at the top of the plugin.
 * @param   {string}  content  The plugin info to be formatted
 * @return  {string}           The formatted plugin info
 */
const getFormattedPluginInfo = (content) => {
  let result = content
    .replace(/\n\n/g, '\n')
    .replace(/\\/g, '')
    .replace(/!.*/, '')
    .replace(/\n\s*\n/g, '');
  result = removeMdFormattingBold(result);
  result = removeMdFormattingHeadings(result);
  result = removeMdFormattingLinks(result);
  result = removeMdFormattingMultipleLineBreaks(result);
  return result;
};

/**
 * Function to determine if the heading is actually the parent node content, meaning that it's
 * representing the raw content of the parent node.
 * @param   {string}  header  The header
 * @return  {boolean}         True if the header is raw
 */
const isHeadingParentNodeContent = (header) => header === 'raw';

/**
 * Function to get the formatted content from a specific markdown section.
 * @param   {object}  content      The section content object
 * @param   {string}  content.raw  The raw section content
 * @param   {string}  header       The section header
 * @return  {string}               The formatted markdown section
 */
const getFormattedMarkdownSection = ({ raw }, header) =>
  !isHeadingParentNodeContent(header) && `== ${header} ==\n${raw}`;

/**
 * Function to get the formatted content for all sections of the markdown file.
 * @param   {object}  sections  The parsed sections object
 * @return  {string}            The formatted section content
 */
const getFormattedSectionContent = (sections) => {
  const content = Object.entries(sections)
    .map(([header, value]) => getFormattedMarkdownSection(value, header))
    .filter((v) => typeof v !== 'boolean')
    .join('');
  return removeMdFormattingMultipleLineBreaks(
    formatMarkdownSections(content).replace(/\\/g, '')
  );
};

/**
 * Function to get the release details of a specific release in the changelog.
 * @param   {object}  content              The section content object
 * @param   {string}  content.raw          The raw section content
 * @param   {string}  releaseCategory      The release category parsed from the changelog
 * @return  {string}                       The formatted release content
 */
const getReleaseDetails = ({ raw }, releaseCategory) => {
  const releaseNoteSplit = SINGLE_ENTRY_RELEASE_NOTES[releaseCategory]
    ? [SINGLE_ENTRY_RELEASE_NOTES[releaseCategory]]
    : raw.split('\n').filter((v) => !!v).map((v) => `${v.trim()}\n`);
  let releaseNote;
  switch (releaseCategory) {
    case 'Feature (major)':
    case 'Feature (minor)':
    case 'Feature':
    case 'Features':
    case 'New Features':
      releaseNote = [MESSAGE_NOTES_HEADERS.FEATURE, ...releaseNoteSplit];
      break;
    case 'Bug fix':
    case 'Bug Fixes':
    case 'Security':
    case 'Dependencies & Security':
      releaseNote = [MESSAGE_NOTES_HEADERS.BUG, ...releaseNoteSplit];
      break;
    default:
      releaseNote = [MESSAGE_NOTES_HEADERS.CHANGED, ...releaseNoteSplit];
      break;
  }
  return `${releaseNote.join('')}\n`;
};

/**
 * Function to get a formatted release note for a specific release.
 * @param   {object}  release         The parsed node for a specific release
 * @param   {string}  releaseVersion  The release version string
 * @param   {string}  pluginVersion   The current plugin version
 * @return  {string}                  The formatted release note
 */
const getFormattedReleaseNote = async (release, releaseVersion, pluginVersion) => {
  if (!releaseVersion || releaseVersion === 'raw') return;

  const releaseDetails =
    Object.entries(release)
      .map(([category, content]) => getReleaseDetails(content, category))
      .join('')
      .replace(/^\-/, '*')
      .replace(/\[\]/g, '')
      .replace(/ \(.*\)\)/g, '') ||
    `${MESSAGE_NOTES_HEADERS.BUG} * ${MESSAGE_NOTES_FOR_RELEASE_UNAVAILABLE}`;

  // Changie format: "2.17.0 - 2026-04-07" — date is embedded in the heading
  const changieMatch = releaseVersion.match(/^([\d.]+) - (\d{4}-\d{2}-\d{2})$/);
  let displayVersion;
  let formattedReleaseDate;

  if (changieMatch) {
    const baseVersion = changieMatch[1];
    displayVersion = pluginVersion.startsWith(baseVersion) ? pluginVersion : baseVersion;
    formattedReleaseDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/New_York',
    }).format(new Date(`${changieMatch[2]}T12:00:00Z`));
  } else {
    displayVersion = releaseVersion;
    const releaseDate = await git.log([`v${releaseVersion}`]);
    formattedReleaseDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(releaseDate.latest.date));
  }

  return `\n#### ${displayVersion}\n_Released on ${formattedReleaseDate}_\n\n${releaseDetails}\n`;
};

/**
 * Function to get the formatted changelog from a parsed changelog.
 * @param   {object}  changelog      The parsed changelog
 * @param   {string}  pluginVersion  The current plugin version
 * @return  {string}                 The formatted changelog
 */
const getFormattedChangelog = async (changelog, pluginVersion) => {
  const content = await Promise.all(
    Object.entries(changelog).map(([version, release]) =>
      getFormattedReleaseNote(release, version, pluginVersion)
    )
  );
  return removeMdFormattingMultipleLineBreaks(
    content
      .filter((v) => v != null)
      .join('')
      .replace(/\\/g, '')
      .replace(/(?<=\n)\n\*/g, '*')
  );
};

/**
 * Function to convert a heading three to a heading two if it's followed by
 * integers (i.e., standard-version patch releases used ### instead of ##).
 * @param {string} string the string to check
 * @returns {string} The formatted string
 */
const convertHeadingThreeToHeadingTwo = (string) => string.replace(/###(?= ?[0-9])/g, '##');

/**
 * Function to ensure headings are separated from preceding content by a blank
 * line. Changie batch output omits these blank lines, which causes md-2-json
 * to treat later headings as raw text instead of nested sections.
 * @param {string} string the string to normalize
 * @returns {string} The formatted string
 */
const normalizeMarkdownHeadingSpacing = (string) =>
  string.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

/**
 * Function to parse the raw README.md content into a structured object.
 * @param   {string}  readmeMd  The raw README.md content
 * @return  {object}            The parsed README contents
 */
const parseReadMe = (readmeMd) => {
  const content = readmeMd.replace(/^!\[.*?\]\(.*?\)\n\n?/gm, '');
  return md2json.parse(content);
};

/**
 * Function to parse the raw CHANGELOG.md content into a structured object.
 * @param   {string}  changelogMd  The raw CHANGELOG.md content
 * @return  {object}               The parsed changelog contents
 */
const parseChangeLog = (changelogMd) => {
  const cleaned = normalizeMarkdownHeadingSpacing(
    convertHeadingThreeToHeadingTwo(removeMdFormattingLinks(changelogMd).replace(/\(.*?\)/g, ''))
  );
  return md2json.parse(cleaned);
};

/**
 * Function to generate the contents of the WordPress README.txt file from raw markdown inputs.
 * @param   {string}  readmeMd      The raw README.md content
 * @param   {string}  changelogMd   The raw CHANGELOG.md content
 * @param   {string}  pluginVersion The current plugin version
 * @return  {Promise<string>}       The formatted README.txt content
 */
const generateWordPressReadMe = async (readmeMd, changelogMd, pluginVersion) => {
  const readmeContents = parseReadMe(readmeMd);
  const changelogContents = parseChangeLog(changelogMd);

  const pluginName = Object.keys(readmeContents)[0];
  const pluginInfo = readmeContents[pluginName].raw;
  const pluginSections = readmeContents[pluginName];
  const formattedSectionContent = getFormattedSectionContent(pluginSections);
  const changelog = await getFormattedChangelog(changelogContents.Changelog, pluginVersion);
  const changelogDedented = dedent(changelog);

  return dedent(`
  === ${pluginName} ===
  Stable tag: ${pluginVersion}${getFormattedPluginInfo(pluginInfo)}\n
  ${formattedSectionContent}

  == Changelog ==
  ${changelogDedented}
  `);
};

module.exports = { generateWordPressReadMe };
