/**
 * @jest-environment node
 */
/* eslint-disable */
const { getFragmentsToRemove } = require('../dedupeUnreleasedDependencyFragments');

const dep = (name) => ({ name, kind: 'Dependencies & security' });
const feature = (name) => ({ name, kind: 'Feature (minor)' });
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

  describe('when other fragment types exist alongside dependency fragments', () => {
    it('removes the dependency fragment when a feature fragment exists', () => {
      const result = getFragmentsToRemove([feature('feature-1.yaml'), dep('deps-1.yaml')]);
      expect(result).toEqual(['deps-1.yaml']);
    });

    it('removes all dependency fragments when other fragments exist', () => {
      const result = getFragmentsToRemove([feature('feature-1.yaml'), dep('deps-2.yaml'), dep('deps-1.yaml')]);
      expect(result).toEqual(['deps-2.yaml', 'deps-1.yaml']);
    });

    it('does not remove non-dependency fragments', () => {
      const result = getFragmentsToRemove([feature('feature-1.yaml'), bugfix('bug-1.yaml'), dep('deps-1.yaml')]);
      expect(result).not.toContain('feature-1.yaml');
      expect(result).not.toContain('bug-1.yaml');
    });
  });

  describe('when there are no dependency fragments', () => {
    it('removes nothing', () => {
      expect(getFragmentsToRemove([feature('feature-1.yaml'), bugfix('bug-1.yaml')])).toEqual([]);
    });
  });

  describe('when there are no fragments', () => {
    it('removes nothing', () => {
      expect(getFragmentsToRemove([])).toEqual([]);
    });
  });
});
