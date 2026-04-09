/* eslint-disable */
const fs = require('fs');
const { generateWordPressReadMe } = require('./generateWordPressReadMe');
const pluginVersion = require('../../package.json').version;

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
 * Main function to create the WordPress README.txt file.
 * @return  {void}
 */
const createWordPressReadMeFile = async () => {
  const readmeMd = fs.readFileSync('./README.md', 'utf8');
  const changelogMd = fs.readFileSync('./CHANGELOG.md', 'utf8');
  const contents = await generateWordPressReadMe(readmeMd, changelogMd, pluginVersion);
  writeWordPressReadMeFile(contents);
};

createWordPressReadMeFile();
