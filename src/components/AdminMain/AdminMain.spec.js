import { shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminMain from './AdminMain.vue';

const refreshOptions = {
  customRefreshIntervalMaximumInMinutes: 240,
  customRefreshIntervalMinimumInMinutes: 0.5,
  refreshInterval: 60,
  showRefreshInMenuBar: true,
  useStaticFilePolling: false,
};

let wrapper;

beforeEach(async () => {
  wrapper = shallowMount(AdminMain, {
    attachTo: document.body,
    global: buildVueTestGlobals(),
    props: { refreshOptions, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  await wrapper.find('#force-refresh-tab-refresh').trigger('keydown', { key: 'ArrowRight' });
});

afterEach(() => wrapper.unmount());

it('selects Settings with the right arrow', () => {
  expect(wrapper.find('#force-refresh-tab-settings').attributes('aria-selected')).toBe('true');
});

it('focuses Settings with the right arrow', () => {
  expect(document.activeElement).toBe(wrapper.find('#force-refresh-tab-settings').element);
});

it('hides Refresh when Settings is selected', () => {
  expect(wrapper.find('#force-refresh-panel-refresh').isVisible()).toBe(false);
});

it('shows Settings after right-arrow navigation', () => {
  expect(wrapper.find('#force-refresh-panel-settings').isVisible()).toBe(true);
});

it('keeps Settings mounted after Home', async () => {
  await wrapper.find('#force-refresh-tab-settings').trigger('keydown', { key: 'Home' });
  expect(wrapper.find('#force-refresh-panel-settings').exists()).toBe(true);
});

it('hides Settings after Home', async () => {
  await wrapper.find('#force-refresh-tab-settings').trigger('keydown', { key: 'Home' });
  expect(wrapper.find('#force-refresh-panel-settings').isVisible()).toBe(false);
});
