import { shallowMount } from '@vue/test-utils';
import Tooltip from './BaseTooltip.vue';

jest.mock('@floating-ui/vue', () => ({
  autoUpdate: jest.fn(),
  flip: jest.fn(),
  offset: jest.fn(),
  shift: jest.fn(),
  useFloating: () => ({ floatingStyles: { left: '0', position: 'absolute', top: '0' } }),
}));

const getWrapper = (props = {}) => shallowMount(Tooltip, {
  global: {
    stubs: {
      Teleport: { template: '<div><slot /></div>' },
    },
  },
  props,
  slots: {
    default: '<button>Trigger</button>',
  },
});

describe('Tooltip', () => {
  describe('Slot', () => {
    it('renders the default slot content', () => {
      const wrapper = getWrapper();

      expect(wrapper.find('button').exists()).toBe(true);
    });
  });

  describe('Tooltip content', () => {
    it('does not render the tooltip element when no content is provided', () => {
      const wrapper = getWrapper();

      expect(wrapper.find('.tooltip').exists()).toBe(false);
    });

    it('renders the tooltip with the provided content', () => {
      const wrapper = getWrapper({ content: 'Debug mode is active' });

      expect(wrapper.find('.tooltip').text()).toBe('Debug mode is active');
    });
  });

  describe('Visibility', () => {
    it('is hidden by default', () => {
      const wrapper = getWrapper({ content: 'Some tooltip' });

      expect(wrapper.find('.tooltip').classes()).not.toContain('tooltip--visible');
    });

    it('becomes visible on mouseenter', async () => {
      const wrapper = getWrapper({ content: 'Some tooltip' });

      await wrapper.find('.tooltip-wrapper').trigger('mouseenter');

      expect(wrapper.find('.tooltip').classes()).toContain('tooltip--visible');
    });

    it('becomes hidden again on mouseleave', async () => {
      const wrapper = getWrapper({ content: 'Some tooltip' });

      await wrapper.find('.tooltip-wrapper').trigger('mouseenter');
      await wrapper.find('.tooltip-wrapper').trigger('mouseleave');

      expect(wrapper.find('.tooltip').classes()).not.toContain('tooltip--visible');
    });
  });
});
