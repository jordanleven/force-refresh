/**
 * @jest-environment node
 */
/* eslint-disable */
const { generateWordPressReadMe } = require('../generateWordPressReadMe');

jest.mock('simple-git', () => () => ({ log: jest.fn() }));

const README_FIXTURE = `\
![banner](/assets/banner.png)

# Test Plugin

![CI](https://github.com/test/test-plugin/workflows/CI/badge.svg)\\
**Contributors:** [testauthor](https://profiles.wordpress.org/testauthor)\\
**Tags:** test, sample\\
**Requires PHP:** 8.0\\
**Requires at least:** 6.0\\
**Tested up to:** 6.9\\
**License:** GPLv2 or later

A simple test plugin for unit testing purposes.

## Description

Full description of the test plugin.

## Features

- Feature one.
- Feature two.

## Installation

Install and activate the plugin.
`;

const CHANGELOG_FIXTURE = `\
# Changelog

## 2.1.0 - 2007-06-29
### New Features
* Add new feature.

## 2.0.0 - 2007-01-09
### Bug fix
* Fix a critical bug.

## 1.0.0 - 1984-01-24
### Dependencies & security
* Performance enhancements and bug fixes.
`;

const CHANGELOG_FIXTURE_MERGED_SECTIONS = `\
# Changelog

## 2.1.0 - 2007-06-29
### Changed (minor)
* Update the plugin description.

### Dependencies & security
* Performance enhancements and bug fixes.
`;

describe('generateWordPressReadMe', () => {
  it('generates correctly formatted README content from markdown inputs', async () => {
    const result = await generateWordPressReadMe(README_FIXTURE, CHANGELOG_FIXTURE, '2.1.0');
    expect(result).toMatchSnapshot();
  });

  it('merges multiple categories that share the same section header into one section', async () => {
    const result = await generateWordPressReadMe(README_FIXTURE, CHANGELOG_FIXTURE_MERGED_SECTIONS, '2.1.0');
    expect(result).toMatchSnapshot();
  });
});
