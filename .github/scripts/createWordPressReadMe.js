/* eslint-disable */
const fs = require('fs');
const simpleGit = require('simple-git');
const git = simpleGit();
const dedent = require('dedent');
const md2json = require('md-2-json');
const pluginVersion = require('../../package.json').version;

/**
 * In some changes, release notes for a specific release are unavailable for specific
 * types of commits. In these cases, this message will be used in lieu of the contents
 * of the change.
 */
const MESSAGE_NOTES_FOR_RELEASE_UNAVAILABLE = 'Performance enhancements and bug fixes.';

const MESSAGE_NOTES_HEADERS = {
  BUG: '##### **Bug Fixes**\n',
  FEATURE: '##### **New Features**\n',
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
  !isHeadingParentNodeContent(header) && `== ${header} ==\n ${raw}`;

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
  const releaseNoteSplit = raw.split('\n').filter((v) => !!v).map((v) => `${v.trim()}.\n`);
  let releaseNote;
  switch (releaseCategory) {
    case 'Bug Fixes':
    case 'Fix':
    case 'Fixed':
    case 'Security':
      releaseNote = [MESSAGE_NOTES_HEADERS.BUG, ...releaseNoteSplit];
      break;
    default:
      releaseNote = [MESSAGE_NOTES_HEADERS.FEATURE, ...releaseNoteSplit];
      break;
  }
  return `${releaseNote.join('')}\n`;
};

/**
 * Function to get a formatted release note for a specific release.
 * @param   {object}  release         The parsed node for a specific release
 * @param   {string}  releaseVersion  The release version string
 * @return  {string}                  The formatted release note
 */
const getFormattedReleaseNote = async (release, releaseVersion) => {
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
    displayVersion = changieMatch[1];
    formattedReleaseDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(changieMatch[2]));
  } else {
    displayVersion = releaseVersion;
    const releaseDate = await git.log([`v${releaseVersion}`]);
    formattedReleaseDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(releaseDate.latest.date));
  }

  return `
    #### ${displayVersion}
    _Released on ${formattedReleaseDate}_

    ${releaseDetails}\n
  `;
};

/**
 * Function to get the formatted changelog from a parsed changelog.
 * @param   {object}  changelog  The parsed changelog
 * @return  {string}             The formatted changelog
 */
const getFormattedChangelog = async (changelog) => {
  const content = await Promise.all(
    Object.entries(changelog).map(([version, release]) =>
      getFormattedReleaseNote(release, version)
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
 * Function to write the finished content to WordPress's README.txt file.
 * @param   {string}  contents  The contents of the README file
 * @return  {void}
 */
const writeWordPressReadMeFile = (contents) => {
  fs.writeFileSync('README.txt', contents, (err) => {
    if (err) throw err;
    console.log('WordPress README.txt created');
  });
};

/**
 * Function to get the contents of a specific file.
 * @param   {string}  fileLocation  The location of the file to get contents for
 * @return  {string}                The contents of the file
 */
const getFileContents = (fileLocation) => fs.readFileSync(fileLocation, 'utf8');

/**
 * Function to get the parsed contents of the README.md file.
 * @return  {object} The parsed contents of the file
 */
const getParsedReadMe = () => {
  const content = getFileContents('./README.md').replace(/^!\[.*?\]\(.*?\)\n\n?/gm, '');
  return md2json.parse(content);
};

/**
 * Function to get the parsed contents of the CHANGELOG.md file.
 * @return  {object} The parsed contents of the file
 */
const getParsedChangeLog = () => {
  const raw = fs.readFileSync('./CHANGELOG.md', 'utf8');
  const cleaned = convertHeadingThreeToHeadingTwo(
    removeMdFormattingLinks(raw).replace(/\(.*?\)/g, '')
  );
  return md2json.parse(cleaned);
};

/**
 * Main function to create the WordPress README.txt file.
 * @return  {void}
 */
const createWordPressReadMeFile = async () => {
  const readmeContents = getParsedReadMe();
  const changelogContents = getParsedChangeLog();

  const pluginName = Object.keys(readmeContents)[0];
  const pluginInfo = readmeContents[pluginName].raw;
  const pluginSections = readmeContents[pluginName];
  const formattedSectionContent = getFormattedSectionContent(pluginSections);
  const changelog = await getFormattedChangelog(changelogContents.Changelog);
  const changelogDedented = dedent(changelog);

  const newReadmeContents = dedent(`
  === ${pluginName} ===
  Stable tag: ${pluginVersion}${getFormattedPluginInfo(pluginInfo)}\n
  ${formattedSectionContent}

  == Changelog ==
  ${changelogDedented}
  `);

  writeWordPressReadMeFile(newReadmeContents);
};

createWordPressReadMeFile();
