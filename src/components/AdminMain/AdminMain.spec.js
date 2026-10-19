import { shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminMain from './AdminMain.vue';

it('supports keyboard tab navigation while keeping settings mounted', async () => {
  const wrapper = shallowMount(AdminMain, {
    attachTo: document.body,
    global: buildVueTestGlobals(),
    props: { refreshOptions: {}, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  try {
    const settings = wrapper.find('#force-refresh-tab-settings');
    await wrapper.find('#force-refresh-tab-refresh').trigger('keydown', { key: 'ArrowRight' });
    expect(settings.attributes('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(settings.element);
    expect(wrapper.find('#force-refresh-panel-refresh').isVisible()).toBe(false);
    expect(wrapper.find('#force-refresh-panel-settings').isVisible()).toBe(true);
    await settings.trigger('keydown', { key: 'Home' });
    expect(wrapper.find('#force-refresh-panel-settings').exists()).toBe(true);
    expect(wrapper.find('#force-refresh-panel-settings').isVisible()).toBe(false);
  } finally { wrapper.unmount(); }
});
