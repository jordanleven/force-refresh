import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faInfo,
  faExclamation,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowMount } from '@vue/test-utils';
import TroubleshootingVersions from './TroubleshootingVersions.vue';

library.add(faCheck, faInfo, faExclamation, faExclamationTriangle);

const PAST_DATE = '2020-01-01';
const FUTURE_DATE = '2099-01-01';

const getWrapper = (props = {}) => shallowMount(TroubleshootingVersions, {
  global: {
    components: { FontAwesomeIcon },
    mocks: {
      $t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
    },
    stubs: {
      BaseDescriptiveList: {
        name: 'BaseDescriptiveList',
        template: '<div><slot name="term" /><slot name="definition" /></div>',
      },
      BaseTooltip: {
        name: 'BaseTooltip',
        props: ['content'],
        template: '<div><slot /></div>',
      },
    },
  },
  props: {
    label: 'PHP',
    version: '7.4.33',
    versionRequired: '7.2',
    ...props,
  },
});

describe('TroubleshootingVersions', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('EOL state', () => {
    it('shows the warning triangle icon when eolDate is in the past', () => {
      const wrapper = getWrapper({ eolDate: PAST_DATE });
      const icon = wrapper.findComponent(FontAwesomeIcon);
      expect(icon.props('icon').iconName).toBe('triangle-exclamation');
    });

    it('applies the warning status class when eolDate is in the past', () => {
      const wrapper = getWrapper({ eolDate: PAST_DATE });
      expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--warning');
    });

    it('passes the EOL tooltip message when eolDate is in the past', () => {
      const wrapper = getWrapper({ eolDate: PAST_DATE });
      const tooltip = wrapper.findComponent({ name: 'BaseTooltip' });
      expect(tooltip.props('content')).toContain('TROUBLESHOOTING_VERSION_IS_EOL');
    });

    it('formats the EOL date as a local calendar day in the tooltip', () => {
      const wrapper = getWrapper({ eolDate: '2024-01-09' });
      const tooltip = wrapper.findComponent({ name: 'BaseTooltip' });
      expect(tooltip.props('content')).toContain('"eolDate":"January 9, 2024"');
    });
  });

  describe('Non-EOL state (null eolDate)', () => {
    it('shows the checkmark icon when eolDate is null and version is current', () => {
      const wrapper = getWrapper({ eolDate: null });
      const icon = wrapper.findComponent(FontAwesomeIcon);
      expect(icon.props('icon').iconName).toBe('check');
    });

    it('applies the okay status class when eolDate is null and version is current', () => {
      const wrapper = getWrapper({ eolDate: null });
      expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--okay');
    });
  });

  describe('Future eolDate (not yet EOL)', () => {
    it('does not mark the version as EOL on the local day before the EOL date', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 8, 20, 0, 0));

      const wrapper = getWrapper({ eolDate: '2024-01-09' });
      expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--okay');
    });

    it('shows the checkmark icon when eolDate is in the future', () => {
      const wrapper = getWrapper({ eolDate: FUTURE_DATE });
      const icon = wrapper.findComponent(FontAwesomeIcon);
      expect(icon.props('icon').iconName).toBe('check');
    });

    it('applies the okay status class when eolDate is in the future', () => {
      const wrapper = getWrapper({ eolDate: FUTURE_DATE });
      expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--okay');
    });
  });

  describe('Outdated version (below minimum)', () => {
    it('shows the exclamation icon regardless of eolDate', () => {
      const wrapper = getWrapper({ eolDate: PAST_DATE, version: '6.0.0', versionRequired: '7.2' });
      const icon = wrapper.findComponent(FontAwesomeIcon);
      expect(icon.props('icon').iconName).toBe('exclamation');
    });

    it('applies the error status class regardless of eolDate', () => {
      const wrapper = getWrapper({ eolDate: PAST_DATE, version: '6.0.0', versionRequired: '7.2' });
      expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--error');
    });
  });
});
