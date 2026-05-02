/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const TARGET_KIND = 'Dependencies & security';
const SIGNIFICANT_KINDS = ['Feature (major)', 'Feature (minor)'];

function getFragmentsToRemove(fragments) {
  const hasSignificantFragments = fragments.some(({ kind }) => SIGNIFICANT_KINDS.includes(kind));
  let keptDependencyFragment = false;

  return fragments
    .filter(({ kind }) => kind === TARGET_KIND)
    .filter(() => {
      // When other change types exist, omit the dependency section entirely
      if (hasSignificantFragments || keptDependencyFragment) {
        return true;
      }
      keptDependencyFragment = true;
      return false;
    })
    .map(({ name }) => name);
}

function dedupeUnreleasedDependencyFragments(unreleasedDir, { listOnly = false } = {}) {
  if (!fs.existsSync(unreleasedDir)) {
    return;
  }

  const fragments = fs.readdirSync(unreleasedDir)
    .filter((file) => file.endsWith('.yaml'))
    .sort((a, b) => b.localeCompare(a))
    .map((name) => {
      const filePath = path.join(unreleasedDir, name);
      const contents = fs.readFileSync(filePath, 'utf8');
      const match = contents.match(/^kind:\s*(.+)$/m);
      return { kind: match ? match[1].trim() : '', name };
    });

  getFragmentsToRemove(fragments).forEach((name) => {
    const filePath = path.join(unreleasedDir, name);
    console.log(filePath);
    if (!listOnly) {
      fs.unlinkSync(filePath);
    }
  });
}

module.exports = { dedupeUnreleasedDependencyFragments, getFragmentsToRemove };

if (require.main === module) {
  dedupeUnreleasedDependencyFragments(
    path.resolve('.changes/unreleased'),
    { listOnly: process.argv.includes('--list-only') },
  );
}
