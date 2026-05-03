/**
 * @jest-environment node
 */
/* eslint-disable */
const { getFragmentsToRemove } = require('../dedupeUnreleasedDependencyFragments');

const dep = (name) => ({ name, kind: 'Dependencies & security' });
const featureMinor = (name) => ({ name, kind: 'Feature (minor)' });
const featureMajor = (name) => ({ name, kind: 'Feature (major)' });
const bugfix = (name) => ({ name, kind: 'Bug fix' });

describe('getFragmentsToRemove', () => {
  describe('when there are only dependency fragments', () => {
    it('removes nothing when there is only one', () => {
      expect(getFragmentsToRemove([dep('deps-1.yaml')])).toEqual([]);
    });

    it('removes all but the first when there are duplicates', () => {
      const result = getFragmentsToRemove([dep('deps-2.yaml'), dep('deps-1.yaml')]);
      expect(result).toEqual(['deps-1.yaml']);
    });

    it('removes all but the first when there are three', () => {
      const result = getFragmentsToRemove([dep('deps-3.yaml'), dep('deps-2.yaml'), dep('deps-1.yaml')]);
      expect(result).toEqual(['deps-2.yaml', 'deps-1.yaml']);
    });
  });

  describe('when minor or major feature fragments exist alongside dependency fragments', () => {
    it('removes the dependency fragment when a minor feature fragment exists', () => {
      const result = getFragmentsToRemove([featureMinor('feature-1.yaml'), dep('deps-1.yaml')]);
      expect(result).toEqual(['deps-1.yaml']);
    });

    it('removes the dependency fragment when a major feature fragment exists', () => {
      const result = getFragmentsToRemove([featureMajor('feature-1.yaml'), dep('deps-1.yaml')]);
      expect(result).toEqual(['deps-1.yaml']);
    });

    it('removes all dependency fragments when a feature fragment exists', () => {
      const result = getFragmentsToRemove([featureMinor('feature-1.yaml'), dep('deps-2.yaml'), dep('deps-1.yaml')]);
      expect(result).toEqual(['deps-2.yaml', 'deps-1.yaml']);
    });

    it('does not remove non-dependency fragments', () => {
      const result = getFragmentsToRemove([featureMinor('feature-1.yaml'), bugfix('bug-1.yaml'), dep('deps-1.yaml')]);
      expect(result).not.toContain('feature-1.yaml');
      expect(result).not.toContain('bug-1.yaml');
    });
  });

  describe('when only bug fix fragments exist alongside dependency fragments', () => {
    it('keeps the dependency fragment', () => {
      const result = getFragmentsToRemove([bugfix('bug-1.yaml'), dep('deps-1.yaml')]);
      expect(result).toEqual([]);
    });

    it('dedupes multiple dependency fragments, keeping the first', () => {
      const result = getFragmentsToRemove([bugfix('bug-1.yaml'), dep('deps-2.yaml'), dep('deps-1.yaml')]);
      expect(result).toEqual(['deps-1.yaml']);
    });
  });

  describe('when there are no dependency fragments', () => {
    it('removes nothing', () => {
      expect(getFragmentsToRemove([featureMinor('feature-1.yaml'), bugfix('bug-1.yaml')])).toEqual([]);
    });
  });

  describe('when there are no fragments', () => {
    it('removes nothing', () => {
      expect(getFragmentsToRemove([])).toEqual([]);
    });
  });
});
