/**
 * @jest-environment node
 */
/* eslint-disable */
const { execFileSync } = require('child_process');
const { addUnreleasedRelease, insertRelease } = require('../addUnreleasedRelease');

jest.mock('child_process', () => ({ execFileSync: jest.fn() }));

const CHANGELOG_FIXTURE = `\
# Changelog

All notable changes to this project will be documented in this file.

## 3.2.1 - 2026-09-13
### Dependencies & security
* Performance enhancements and bug fixes.
`;

const RELEASE_FIXTURE = `\
## 4.0.0 - 2026-10-31
### Feature (major)
* Redesigned admin. A cleaner page. <!-- icon: palette -->`;

const CHANGELOG_WITH_RELEASE = `\
# Changelog

All notable changes to this project will be documented in this file.

## 4.0.0 - 2026-10-31
### Feature (major)
* Redesigned admin. A cleaner page. <!-- icon: palette -->

## 3.2.1 - 2026-09-13
### Dependencies & security
* Performance enhancements and bug fixes.
`;

afterEach(() => {
  execFileSync.mockReset();
});

describe('insertRelease', () => {
  it('inserts the release below the changelog header', () => {
    expect(insertRelease(CHANGELOG_FIXTURE, RELEASE_FIXTURE)).toBe(CHANGELOG_WITH_RELEASE);
  });
});

describe('addUnreleasedRelease', () => {
  it('adds the unreleased fragments as the next version', () => {
    execFileSync.mockReturnValue(RELEASE_FIXTURE);
    expect(addUnreleasedRelease(CHANGELOG_FIXTURE)).toBe(CHANGELOG_WITH_RELEASE);
  });

  it('renders the fragments without writing them to the changelog', () => {
    execFileSync.mockReturnValue(RELEASE_FIXTURE);
    addUnreleasedRelease(CHANGELOG_FIXTURE);
    expect(execFileSync).toHaveBeenCalledWith('npx', ['changie', 'batch', 'auto', '--dry-run'], expect.anything());
  });

  it('keeps the changelog unchanged when nothing is unreleased', () => {
    execFileSync.mockImplementation(() => {
      throw new Error('no unreleased changes found');
    });
    expect(addUnreleasedRelease(CHANGELOG_FIXTURE)).toBe(CHANGELOG_FIXTURE);
  });
});
