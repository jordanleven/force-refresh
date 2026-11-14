import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { BaseTooltipStub, buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminMainOptions from './AdminMainOptions.vue';

const SELECTOR_UPDATE_METHOD = '[data-test="select-update-method"]';
const SELECTOR_WEBSOCKETS_UNAVAILABLE = '[data-test="update-method-websockets-unavailable"]';

const createVuexStore = ({ isRelayConfigured, isWebSocketsEnabled }) => createStore({
  getters: {
    isRelayConfigured: () => isRelayConfigured,
    isWebSocketsEnabled: () => isWebSocketsEnabled,
  },
});

const getWrapper = ({
  detectedCdn = null,
  isRelayConfigured = false,
  isWebSocketsEnabled = false,
  updateMethod = 'rest',
} = {}) => mount(AdminMainOptions, {
  global: buildVueTestGlobals({
    plugins: [createVuexStore({ isRelayConfigured, isWebSocketsEnabled })],
    stubs: {
      BaseTooltip: BaseTooltipStub,
      FontAwesomeIcon: true,
    },
  }),
  props: {
    detectedCdn,
    refreshOptions: {
      customRefreshIntervalMaximumInMinutes: 240,
      customRefreshIntervalMinimumInMinutes: 0.5,
      refreshInterval: 120,
      showRefreshInMenuBar: false,
      updateMethod,
    },
  },
});

const getUpdateMethodSelect = (wrapper) => wrapper.find(SELECTOR_UPDATE_METHOD);

const getUpdateMethodOptions = (wrapper) => getUpdateMethodSelect(wrapper).findAll('option').map((option) => ({
  disabled: option.element.disabled,
  label: option.text(),
  value: option.element.value,
}));

const getUpdateMethodOption = (wrapper, value) => getUpdateMethodOptions(wrapper).find((option) => option.value === value);

const getEmittedOptions = async (wrapper) => {
  await wrapper.find('[data-test="btn-update-options"]').trigger('click');
  return wrapper.emitted('options-were-updated').at(-1)[0];
};

describe('AdminMainOptions', () => {
  describe('Update method options', () => {
    it('lists static file and WordPress API when the websockets flag is off', () => {
      const wrapper = getWrapper();

      expect(getUpdateMethodOptions(wrapper)).toEqual([
        { disabled: false, label: 'ADMIN_SETTINGS.OPTION_UPDATE_METHOD_STATIC_FILE', value: 'static_file' },
        { disabled: false, label: 'ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WORDPRESS_API', value: 'rest' },
      ]);
    });

    it('hides everything about WebSockets when the websockets flag is off', () => {
      const wrapper = getWrapper({ isRelayConfigured: true });

      expect(getUpdateMethodOption(wrapper, 'websockets')).toBeUndefined();
      expect(wrapper.find(SELECTOR_WEBSOCKETS_UNAVAILABLE).exists()).toBe(false);
      expect(wrapper.text()).not.toContain('WEBSOCKETS');
    });

    it('lists all three methods when the websockets flag is on', () => {
      const wrapper = getWrapper({ isWebSocketsEnabled: true });

      expect(getUpdateMethodOptions(wrapper).map(({ value }) => value)).toEqual(['static_file', 'rest', 'websockets']);
      expect(getUpdateMethodOption(wrapper, 'websockets').label).toBe('ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WEBSOCKETS');
    });

    it.each(['rest', 'static_file', 'websockets'])('selects %s when it is the stored method', (updateMethod) => {
      const wrapper = getWrapper({ isRelayConfigured: true, isWebSocketsEnabled: true, updateMethod });

      expect(getUpdateMethodSelect(wrapper).element.value).toBe(updateMethod);
    });
  });

  describe('WebSockets availability', () => {
    it('disables WebSockets and explains why when no relay is configured', () => {
      const wrapper = getWrapper({ isWebSocketsEnabled: true });

      expect(getUpdateMethodOption(wrapper, 'websockets').disabled).toBe(true);
      expect(wrapper.find(SELECTOR_WEBSOCKETS_UNAVAILABLE).text())
        .toBe('ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WEBSOCKETS_UNAVAILABLE');
    });

    it('leaves the other methods and the select itself enabled when no relay is configured', () => {
      const wrapper = getWrapper({ isWebSocketsEnabled: true });

      expect(getUpdateMethodSelect(wrapper).element.disabled).toBe(false);
      expect(getUpdateMethodOption(wrapper, 'static_file').disabled).toBe(false);
      expect(getUpdateMethodOption(wrapper, 'rest').disabled).toBe(false);
    });

    it('enables WebSockets without an explanation when a relay is configured', () => {
      const wrapper = getWrapper({ isRelayConfigured: true, isWebSocketsEnabled: true });

      expect(getUpdateMethodOption(wrapper, 'websockets').disabled).toBe(false);
      expect(wrapper.find(SELECTOR_WEBSOCKETS_UNAVAILABLE).exists()).toBe(false);
    });
  });

  describe('CDN detection', () => {
    it('disables only the static file option when a CDN is detected', () => {
      const wrapper = getWrapper({ detectedCdn: 'Cloudflare', isRelayConfigured: true, isWebSocketsEnabled: true });

      expect(getUpdateMethodSelect(wrapper).element.disabled).toBe(false);
      expect(getUpdateMethodOptions(wrapper).map(({ disabled, value }) => [value, disabled])).toEqual([
        ['static_file', true],
        ['rest', false],
        ['websockets', false],
      ]);
    });

    it('keeps the select enabled when a CDN is detected and the websockets flag is off', () => {
      const wrapper = getWrapper({ detectedCdn: 'Cloudflare' });

      expect(getUpdateMethodSelect(wrapper).element.disabled).toBe(false);
      expect(getUpdateMethodOption(wrapper, 'static_file').disabled).toBe(true);
      expect(getUpdateMethodOption(wrapper, 'rest').disabled).toBe(false);
    });

    it('explains why static file is unavailable when a CDN is detected', () => {
      const wrapper = getWrapper({ detectedCdn: 'Cloudflare' });

      expect(wrapper.find('[data-test="tooltip-content"]').text()).toBe('ADMIN_SETTINGS.OPTION_UPDATE_METHOD_DISABLED_CDN');
    });

    it('describes the update method when no CDN is detected', () => {
      const wrapper = getWrapper();

      expect(wrapper.find('[data-test="tooltip-content"]').text()).toBe('ADMIN_SETTINGS.OPTION_UPDATE_METHOD_DESCRIPTION');
    });

    it('keeps a stored static file method selected when a CDN is detected', () => {
      const wrapper = getWrapper({ detectedCdn: 'Cloudflare', updateMethod: 'static_file' });

      expect(getUpdateMethodSelect(wrapper).element.value).toBe('static_file');
    });
  });

  describe('Saving', () => {
    it('emits the stored update method when it is not changed', async () => {
      const wrapper = getWrapper({ updateMethod: 'static_file' });

      expect(await getEmittedOptions(wrapper)).toEqual({
        refreshInterval: 120,
        showRefreshInMenuBar: false,
        updateMethod: 'static_file',
      });
    });

    it.each(['rest', 'static_file', 'websockets'])('emits %s when it is selected', async (updateMethod) => {
      const wrapper = getWrapper({ isRelayConfigured: true, isWebSocketsEnabled: true });
      await getUpdateMethodSelect(wrapper).setValue(updateMethod);

      expect((await getEmittedOptions(wrapper)).updateMethod).toBe(updateMethod);
    });

    it('leaves out a stored WebSockets method that can no longer be used', async () => {
      const wrapper = getWrapper({ isWebSocketsEnabled: true, updateMethod: 'websockets' });

      expect((await getEmittedOptions(wrapper)).updateMethod).toBeUndefined();
    });

    it('emits the new method when switching away from an unusable WebSockets method', async () => {
      const wrapper = getWrapper({ isWebSocketsEnabled: true, updateMethod: 'websockets' });
      await getUpdateMethodSelect(wrapper).setValue('rest');

      expect((await getEmittedOptions(wrapper)).updateMethod).toBe('rest');
    });
  });
});
