/* eslint-disable */
const fs = require('fs');
const simpleGit = require('simple-git');
const moment = require('moment')
const git = simpleGit();
const {
  __, reject, mapObjIndexed, pipe, is, isNil, values, replace, toString,
} = require('ramda');
const dedent = require('dedent-js');
const md2json = require('md-2-json');
const pluginVersion = require('../package.json').version;

/**
 * In some changes, release notes for a specific release are unavailable for specific
 * types of commits. In these cases, this message will be used in lieu of the contents
 * of the change.
 */
const MESSAGE_NOTES_FOR_RELEASE_UNAVAILABLE = 'Performance enhancements and bug fixes';

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
const formatMarkdownSections = (content) => pipe(
  // Remove brackets
  replace(/(\["|\"])/g, ''),
  // Change commas from a flattened array into a line break
  replace(/", "/g, '\n'),
  // Update stringified line breaks to a real line break
  replace(/\\n ?/g, '\n'),
  // Remove leftover leading quotes
  replace(/^"/, ''),
  // Remove leftover trailing quotes
  replace(/\n"$/, ''),
)(content);

/**
 * Function to get the formatted plugin info that's displayed at the top of the
 * plugin
 * @param   {string}  content  The plugin info to be formatted
 * @return  {string}           The formatted plugin info
 */
const getFormattedPluginInfo = (content) => pipe(
  replace(/\n\n/g, ''),
  replace(/\\/g, ''),
  // Remove build badges
  replace(/\[?!.*/g, ''),
  replace(/\n\s*\n/g, ''),
  removeMdFormattingBold,
  removeMdFormattingHeadings,
  removeMdFormattingLinks,
  removeMdFormattingMultipleLineBreaks
)(content);

/**
 * Function to determine if the heading is actually the parent node content, meaning that it's
 * representing the raw content of the parent node.
 * @param   {string}  header  The header
 * @return  {boolean}         True if the header is raw
 */
const isHeadingParentNodeContent = (header) => header === 'raw';

/**
 * Function to get the formatted content from a specific markdown sections
 * @param   {object}  content     The section content object
 * @param   {string}  content.raw  The raw section content
 * @param   {string}  header  The section header
 * @return  {string}          The formatted markdown section
 */
const getFormattedMarkdownSection = ({ raw }, header) => !isHeadingParentNodeContent(header) && `== ${header} ==\n ${raw}`;

/**
 * Function to get the formatted content for all sections of the markdown file.
 * @param   {array}  sections  An array of parsed sections
 * @return  {string}            The formatted section content
 */
const getFormattedSectionContent = (sections) => pipe(
  mapObjIndexed(getFormattedMarkdownSection),
  // Only get the values, not the keys
  values,
  // Remove anything that is false (i.e., sections we don't want any more)
  reject(is(Boolean)),
  toString,
  formatMarkdownSections,
  removeMdFormattingMultipleLineBreaks,
  replace(/\\/g, ''),
)(sections);

const getFormattedReleaseContent = (content) => content.replace(/\n/g,'');

/**
 * Function to get the release details of a specific release in the changelog.
 * @param   {object}  content     The section content object
 * @param   {string}  content.raw  The raw section content
 * @param   {string}  releaseCategory  The release category parsed out from the changelog, like "feature" or "chore"
 * @return  {string}                   The formatted release content
 */
const getReleaseDetails = ({ raw }, releaseCategory) => `${raw}\n`;

/**
 * Function to get a formatted release note for a specific release.
 * @param   {object}  release        The parsed node for a specific release
 * @param   {string}  releaseHeader  The release header
 * @return  {string}                 The formatted release note
 */
const getFormattedReleaseNote = async (release, releaseVersion) => {
  if (!releaseVersion || releaseVersion === 'raw') return;

  const releaseDetails = pipe(
    mapObjIndexed(getReleaseDetails),
    values,
    toString,
    replace(/-/g, '*'),
    formatMarkdownSections,
    // Remove contents inside of a link
    replace(/\[\]/g, ''),
    replace(/ \(.*\)\)/g, ''),
    removeMdFormattingMultipleLineBreaks,
  )(release)
  // If the release details are null, then it means the content for this release is
  // unavailable and we should instead use the `MESSAGE_NOTES_FOR_RELEASE_UNAVAILABLE`
  // message
  || `* ${MESSAGE_NOTES_FOR_RELEASE_UNAVAILABLE}`;

  const releaseDate = await git.log([ `v${releaseVersion}`])
  const formattedReleaseDate = moment(releaseDate.latest.date).format('MMMM D, YYYY');

  return `
    = ${releaseVersion} =
    *Released on ${formattedReleaseDate}*

    ${releaseDetails}\n
  `;
};

/**
 * Function to get the formatted changelog from a parsed changelog.
 * @param   {object}  changelog  The parsed changelog
 * @return  {string}             The formatted changelog
 */
const getFormattedChangelog = async (changelog) => {
  const content = await Promise.all(values(mapObjIndexed(getFormattedReleaseNote, changelog)));
  return pipe(
    reject(isNil),
    toString,
    formatMarkdownSections,
    removeMdFormattingMultipleLineBreaks,
    replace(/\\/g, ''),
    replace(/(?<=\n)\n\*/g, '*'),
  )(content);
}

/**
 * Function to convert a heading three to a heading two if its followed by
 * integers (i.e., Conventional Changelog doesn't have release details)
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
 * Function to get the contents of a specific file
 * @param   {string}  fileLocation  The location of the file to get contents for
 * @return  {string}                The contents of the file
 */
const getFileContents = (fileLocation) => fs.readFileSync(fileLocation, 'utf8');

/**
 * Function to get the contents of the README.md file
 * @return  {string} The contents of the file
 */
const getParsedReadMe = () => pipe(
  getFileContents,
  md2json.parse,
)('./README.md');

/**
 * Function to get the contents of the CHANGELOG.md file
 * @return  {string} The contents of the file
 */
const getParsedChangeLog = () => pipe(
  () => fs.readFileSync('./CHANGELOG.md', 'utf8'),
  removeMdFormattingLinks,
  replace(/\(.*?\)/g, ''),
  convertHeadingThreeToHeadingTwo,
  md2json.parse,
)('./CHANGELOG.md');

/**
 * Main function to create the WordPress file
 * @return  {void}
 */
const createWordPressReadMeFile = async () => {
  const readmeContents = getParsedReadMe();
  const changelogContents = getParsedChangeLog();

  const pluginName = Object.keys(readmeContents)[0];
  const pluginInfo = readmeContents[pluginName].raw;
  const pluginSections = readmeContents[pluginName];
  const formattedSectionContent = getFormattedSectionContent(pluginSections);

  const newReadmeContents = dedent(
    `=== ${pluginName} ===
   Stable tag: ${pluginVersion}
   ${getFormattedPluginInfo(pluginInfo)}\n
   ${formattedSectionContent}
    == Changelog ==
    ${await getFormattedChangelog(changelogContents.Changelog)}`,
  );
  writeWordPressReadMeFile(newReadmeContents);
};

createWordPressReadMeFile();
