/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const unreleasedDir = path.resolve('.changes/unreleased');
const targetKind = 'Dependencies & security';
const listOnly = process.argv.includes('--list-only');

if (!fs.existsSync(unreleasedDir)) {
  process.exit(0);
}

const fragments = fs.readdirSync(unreleasedDir)
  .filter((file) => file.endsWith('.yaml'))
  .sort((a, b) => b.localeCompare(a));

let keptTargetFragment = false;

fragments.forEach((fragment) => {
  const filePath = path.join(unreleasedDir, fragment);
  const contents = fs.readFileSync(filePath, 'utf8');
  const match = contents.match(/^kind:\s*(.+)$/m);
  const kind = match ? match[1].trim() : '';

  if (kind !== targetKind) {
    return;
  }

  if (!keptTargetFragment) {
    keptTargetFragment = true;
    return;
  }

  console.log(filePath);

  if (!listOnly) {
    fs.unlinkSync(filePath);
  }
});
