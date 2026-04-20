import { library } from '@fortawesome/fontawesome-svg-core';
import { faBug } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import TroubleshootingDebug from './TroubleshootingDebug.vue';

library.add(faBug);

const createVuexStore = (isSubmitDebugEnabled) => createStore({
  getters: {
    isFeatureEnabled: () => (flag) => flag === 'troubleshootingSubmitDebug' && isSubmitDebugEnabled,
  },
});

const getWrapper = ({ isDebugActive = false, isSubmitDebugEnabled = false } = {}) => shallowMount(TroubleshootingDebug, {
  global: {
    components: { FontAwesomeIcon },
    mocks: {
      $t: (key) => key,
    },
    plugins: [createVuexStore(isSubmitDebugEnabled)],
  },
  props: {
    isDebugActive,
  },
});

describe('TroubleshootingDebug', () => {
  describe('Title', () => {
    it('renders the debug mode title', () => {
      const wrapper = getWrapper();

      expect(wrapper.find('.debug-panel__title').text()).toBe('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_DEBUG_MODE');
    });
  });

  describe('Subtitle', () => {
    it('shows the inactive copy when debug is off', () => {
      const wrapper = getWrapper({ isDebugActive: false });

      expect(wrapper.find('.debug-panel__subtitle').text()).toBe('ADMIN_TROUBLESHOOTING.DEBUG_MODE_DESCRIPTION_INACTIVE');
    });

    it('shows the active copy when debug is on', () => {
      const wrapper = getWrapper({ isDebugActive: true });

      expect(wrapper.find('.debug-panel__subtitle').text()).toBe('ADMIN_TROUBLESHOOTING.DEBUG_MODE_DESCRIPTION_ACTIVE');
    });
  });

  describe('Icon state', () => {
    it('does not apply the active modifier to the icon when debug is off', () => {
      const wrapper = getWrapper({ isDebugActive: false });

      expect(wrapper.find('.debug-panel__icon').classes()).not.toContain('debug-panel__icon--active');
    });

    it('applies the active modifier to the icon when debug is on', () => {
      const wrapper = getWrapper({ isDebugActive: true });

      expect(wrapper.find('.debug-panel__icon').classes()).toContain('debug-panel__icon--active');
    });

    it('does not apply the active modifier to the icon wrap when debug is off', () => {
      const wrapper = getWrapper({ isDebugActive: false });

      expect(wrapper.find('.debug-panel__icon-wrap').classes()).not.toContain('debug-panel__icon-wrap--active');
    });

    it('applies the active modifier to the icon wrap when debug is on', () => {
      const wrapper = getWrapper({ isDebugActive: true });

      expect(wrapper.find('.debug-panel__icon-wrap').classes()).toContain('debug-panel__icon-wrap--active');
    });
  });

  describe('Banner modifier', () => {
    it('does not apply the open modifier when the submit row is hidden', () => {
      const wrapper = getWrapper({ isDebugActive: false });

      expect(wrapper.find('.debug-panel__banner').classes()).not.toContain('debug-panel__banner--open');
    });

    it('applies the open modifier when the submit row is visible', () => {
      const wrapper = getWrapper({ isDebugActive: true, isSubmitDebugEnabled: true });

      expect(wrapper.find('.debug-panel__banner').classes()).toContain('debug-panel__banner--open');
    });
  });

  describe('Submit row', () => {
    it('is hidden when debug is off', () => {
      const wrapper = getWrapper({ isDebugActive: false, isSubmitDebugEnabled: true });

      expect(wrapper.find('.debug-panel__submit-row').exists()).toBe(false);
    });

    it('is hidden when the feature is disabled', () => {
      const wrapper = getWrapper({ isDebugActive: true, isSubmitDebugEnabled: false });

      expect(wrapper.find('.debug-panel__submit-row').exists()).toBe(false);
    });

    it('is visible when debug is on and the feature is enabled', () => {
      const wrapper = getWrapper({ isDebugActive: true, isSubmitDebugEnabled: true });

      expect(wrapper.find('.debug-panel__submit-row').exists()).toBe(true);
    });
  });

  describe('Toggle', () => {
    it('emits toggled when the toggle fires', async () => {
      const wrapper = getWrapper({ isDebugActive: false });

      await wrapper.findComponent({ name: 'BaseToggle' }).vm.$emit('toggled', true);

      expect(wrapper.emitted('toggled')).toEqual([[true]]);
    });
  });
});
