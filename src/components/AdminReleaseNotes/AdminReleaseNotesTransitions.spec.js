import {
  onAfterReleaseGroupEnter,
  onAfterReleaseGroupLeave,
  onBeforeReleaseGroupEnter,
  onBeforeReleaseGroupLeave,
  onReleaseGroupEnter,
  onReleaseGroupLeave,
} from './AdminReleaseNotesTransitions.js';

function createElement(overrides = {}) {
  return {
    offsetHeight: 24,
    scrollHeight: 184,
    style: {},
    ...overrides,
  };
}

describe('AdminReleaseNotesTransitions', () => {
  describe('onBeforeReleaseGroupEnter', () => {
    it('starts an expanding group from a collapsed state', () => {
      const element = createElement();

      onBeforeReleaseGroupEnter(element);

      expect(element.style).toEqual({
        height: '0',
        opacity: '0',
        transform: 'scaleY(0.97)',
      });
    });
  });

  describe('onReleaseGroupEnter', () => {
    it('animates the group to its full height', () => {
      const element = createElement();
      const animate = jest.fn((callback) => callback());

      onReleaseGroupEnter(element, animate);

      expect(animate).toHaveBeenCalledTimes(1);
      expect(element.style.height).toBe('184px');
      expect(element.style.opacity).toBe('1');
      expect(element.style.transform).toBe('scaleY(1)');
    });
  });

  describe('onAfterReleaseGroupEnter', () => {
    it('clears inline animation styles after expanding', () => {
      const element = createElement({
        style: {
          height: '184px',
          opacity: '1',
          transform: 'scaleY(1)',
        },
      });

      onAfterReleaseGroupEnter(element);

      expect(element.style).toEqual({
        height: '',
        opacity: '',
        transform: '',
      });
    });
  });

  describe('onBeforeReleaseGroupLeave', () => {
    it('locks the current height before collapsing', () => {
      const element = createElement();

      onBeforeReleaseGroupLeave(element);

      expect(element.style).toEqual({
        height: '184px',
        opacity: '1',
        transform: 'scaleY(1)',
      });
    });
  });

  describe('onReleaseGroupLeave', () => {
    it('animates the group back to a collapsed state', () => {
      const element = createElement();
      const animate = jest.fn((callback) => callback());

      onReleaseGroupLeave(element, animate);

      expect(animate).toHaveBeenCalledTimes(1);
      expect(element.style.height).toBe('0');
      expect(element.style.opacity).toBe('0');
      expect(element.style.transform).toBe('scaleY(0.97)');
    });
  });

  describe('onAfterReleaseGroupLeave', () => {
    it('clears inline animation styles after collapsing', () => {
      const element = createElement({
        style: {
          height: '0',
          opacity: '0',
          transform: 'scaleY(0.97)',
        },
      });

      onAfterReleaseGroupLeave(element);

      expect(element.style).toEqual({
        height: '',
        opacity: '',
        transform: '',
      });
    });
  });
});
