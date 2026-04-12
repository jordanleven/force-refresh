import { mount } from '@vue/test-utils';
import Tooltip from './Tooltip.vue';

jest.mock('@floating-ui/vue', () => ({
  useFloating: () => ({ floatingStyles: { position: 'absolute', top: '0', left: '0' } }),
  autoUpdate: jest.fn(),
  offset: jest.fn(),
  flip: jest.fn(),
  shift: jest.fn(),
}));

const getWrapper = (props = {}) => mount(Tooltip, {
  props,
  slots: {
    default: '<button>Trigger</button>',
  },
});

describe('Tooltip', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Slot', () => {
    it('renders the default slot content', () => {
      const wrapper = getWrapper();

      expect(wrapper.find('button').exists()).toBe(true);
    });
  });

  describe('Tooltip content', () => {
    it('does not render the tooltip element when no content is provided', () => {
      getWrapper();

      expect(document.body.querySelector('.tooltip')).toBeNull();
    });

    it('renders the tooltip with the provided content', () => {
      getWrapper({ content: 'Debug mode is active' });

      expect(document.body.querySelector('.tooltip').textContent.trim()).toBe('Debug mode is active');
    });
  });

  describe('Visibility', () => {
    it('is hidden by default', () => {
      getWrapper({ content: 'Some tooltip' });

      expect(document.body.querySelector('.tooltip').classList).not.toContain('tooltip--visible');
    });

    it('becomes visible on mouseenter', async () => {
      const wrapper = getWrapper({ content: 'Some tooltip' });

      await wrapper.find('.tooltip-wrapper').trigger('mouseenter');

      expect(document.body.querySelector('.tooltip').classList).toContain('tooltip--visible');
    });

    it('becomes hidden again on mouseleave', async () => {
      const wrapper = getWrapper({ content: 'Some tooltip' });

      await wrapper.find('.tooltip-wrapper').trigger('mouseenter');
      await wrapper.find('.tooltip-wrapper').trigger('mouseleave');

      expect(document.body.querySelector('.tooltip').classList).not.toContain('tooltip--visible');
    });
  });
});
