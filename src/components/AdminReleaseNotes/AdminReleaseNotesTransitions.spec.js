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
      });
    });
  });

  describe('onReleaseGroupEnter', () => {
    it('requests one animation frame for expansion', () => {
      const element = createElement();
      const animate = jest.fn((callback) => callback());

      onReleaseGroupEnter(element, animate);

      expect(animate).toHaveBeenCalledTimes(1);
    });

    it('animates expansion to its target height', () => {
      const element = createElement();
      const animate = jest.fn((callback) => callback());

      onReleaseGroupEnter(element, animate);

      expect(element.style.height).toBe('184px');
    });

    it('animates expansion to its target opacity', () => {
      const element = createElement();
      const animate = jest.fn((callback) => callback());

      onReleaseGroupEnter(element, animate);

      expect(element.style.opacity).toBe('1');
    });
  });

  describe('onAfterReleaseGroupEnter', () => {
    it('clears inline animation styles after expanding', () => {
      const element = createElement({
        style: {
          height: '184px',
          opacity: '1',
        },
      });

      onAfterReleaseGroupEnter(element);

      expect(element.style).toEqual({
        height: '',
        opacity: '',
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
      });
    });
  });

  describe('onReleaseGroupLeave', () => {
    it('requests one animation frame for collapse', () => {
      const element = createElement();
      const animate = jest.fn((callback) => callback());

      onReleaseGroupLeave(element, animate);

      expect(animate).toHaveBeenCalledTimes(1);
    });

    it('animates collapse to its target height', () => {
      const element = createElement();
      const animate = jest.fn((callback) => callback());

      onReleaseGroupLeave(element, animate);

      expect(element.style.height).toBe('0');
    });

    it('animates collapse to its target opacity', () => {
      const element = createElement();
      const animate = jest.fn((callback) => callback());

      onReleaseGroupLeave(element, animate);

      expect(element.style.opacity).toBe('0');
    });
  });

  describe('onAfterReleaseGroupLeave', () => {
    it('clears inline animation styles after collapsing', () => {
      const element = createElement({
        style: {
          height: '0',
          opacity: '0',
        },
      });

      onAfterReleaseGroupLeave(element);

      expect(element.style).toEqual({
        height: '',
        opacity: '',
      });
    });
  });
});
