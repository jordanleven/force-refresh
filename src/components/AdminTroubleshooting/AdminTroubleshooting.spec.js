import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminTroubleshooting from './AdminTroubleshooting.vue';

jest.mock('@/js/services/admin/forceRefreshAdminService.js', () => ({
  sendDebugEmail: jest.fn(),
}));

const createVuexStore = () => createStore({
  actions: {
    requestCronStatus: jest.fn(),
  },
  getters: {
    isFeatureEnabled: () => () => false,
  },
});

const getWrapper = ({ effectiveUpdateMethod, updateMethod }) => shallowMount(AdminTroubleshooting, {
  global: buildVueTestGlobals({
    plugins: [createVuexStore()],
  }),
  props: {
    isDebugActive: false,
    troubleshootingInfo: {
      currentSiteId: 1,
      detectedCdn: null,
      effectiveUpdateMethod: effectiveUpdateMethod ?? updateMethod,
      isMultiSite: false,
      lastCronRun: null,
      scheduledRefreshesCount: 0,
      siteName: 'Test Site',
      siteUrl: 'https://example.com',
      updateMethod,
      versions: {
        forceRefresh: {},
        php: {},
        wordPress: {},
      },
    },
  },
});

const getUpdateMethodValue = (wrapper) => wrapper
  .findComponent({ name: 'TroubleshootingSettings' })
  .props('settings')
  .find(({ label }) => label === 'ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_UPDATE_METHOD')
  .value;

describe('AdminTroubleshooting', () => {
  describe('Update method', () => {
    it.each([
      ['rest', 'ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WORDPRESS_API'],
      ['static_file', 'ADMIN_SETTINGS.OPTION_UPDATE_METHOD_STATIC_FILE'],
      ['websockets', 'ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WEBSOCKETS'],
    ])('shows the name of the %s method', (updateMethod, expected) => {
      const wrapper = getWrapper({ updateMethod });

      expect(getUpdateMethodValue(wrapper)).toBe(expected);
    });

    it('shows the method in use when WebSockets is selected but falls back', () => {
      const wrapper = getWrapper({ effectiveUpdateMethod: 'rest', updateMethod: 'websockets' });

      expect(getUpdateMethodValue(wrapper)).toBe(
        'ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VALUE_UPDATE_METHOD_FALLBACK'
        + '|effective=ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WORDPRESS_API'
        + ',selected=ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WEBSOCKETS',
      );
    });
  });
});
