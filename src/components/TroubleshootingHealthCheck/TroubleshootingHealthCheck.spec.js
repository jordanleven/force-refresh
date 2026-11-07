import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowMount } from '@vue/test-utils';
import { BaseDescriptiveListStub, BaseTooltipStub, buildVueTestGlobals } from '../../../test/helpers/vue.js';
import TroubleshootingHealthCheck from './TroubleshootingHealthCheck.vue';

const getWrapper = (props = {}) => shallowMount(TroubleshootingHealthCheck, {
  global: buildVueTestGlobals({
    components: { FontAwesomeIcon },
    stubs: {
      BaseDescriptiveList: BaseDescriptiveListStub,
      BaseTooltip: BaseTooltipStub,
    },
  }),
  props: {
    label: 'WebSocket Support',
    supported: true,
    tooltipNotSupported: 'Not supported tooltip',
    tooltipSupported: 'Supported tooltip',
    ...props,
  },
});

describe('TroubleshootingHealthCheck', () => {
  it('renders the label', () => {
    const wrapper = getWrapper();
    expect(wrapper.find('.health-check__label').text()).toContain('WebSocket Support');
  });

  describe('Supported state', () => {
    it('applies the okay status class', () => {
      const wrapper = getWrapper({ supported: true });
      expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--okay');
    });

    it('shows the check icon', () => {
      const wrapper = getWrapper({ supported: true });
      expect(wrapper.findComponent(FontAwesomeIcon).props('icon').iconName).toBe('check');
    });

    it('shows the supported value', () => {
      const wrapper = getWrapper({ supported: true });
      expect(wrapper.find('.health-check__value').text()).toBe('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VALUE_SUPPORTED');
    });

    it('shows the supported tooltip', () => {
      const wrapper = getWrapper({ supported: true });
      expect(wrapper.find('[data-test="tooltip-content"]').text()).toBe('Supported tooltip');
    });
  });

  describe('Unsupported state', () => {
    it('applies the error status class by default', () => {
      const wrapper = getWrapper({ supported: false });
      expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--error');
    });

    it('shows the exclamation icon by default', () => {
      const wrapper = getWrapper({ supported: false });
      expect(wrapper.findComponent(FontAwesomeIcon).props('icon').iconName).toBe('exclamation');
    });

    it('applies the neutral status class when the unsupported variant is neutral', () => {
      const wrapper = getWrapper({ supported: false, unsupportedVariant: 'neutral' });
      expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--neutral');
    });

    it('shows the minus icon when the unsupported variant is neutral', () => {
      const wrapper = getWrapper({ supported: false, unsupportedVariant: 'neutral' });
      expect(wrapper.findComponent(FontAwesomeIcon).props('icon').iconName).toBe('minus');
    });

    it('shows the not supported value', () => {
      const wrapper = getWrapper({ supported: false });
      expect(wrapper.find('.health-check__value').text()).toBe('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VALUE_NOT_SUPPORTED');
    });

    it('shows the not supported tooltip', () => {
      const wrapper = getWrapper({ supported: false });
      expect(wrapper.find('[data-test="tooltip-content"]').text()).toBe('Not supported tooltip');
    });
  });
});
