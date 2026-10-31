import { enableAutoUnmount, shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminMainOptions from './AdminMainOptions.vue';

enableAutoUnmount(afterEach);

const props = {
  customRefreshIntervalMaximumInMinutes: 240,
  customRefreshIntervalMinimumInMinutes: 0.5,
  refreshInterval: 60,
  showRefreshInMenuBar: true,
  useStaticFilePolling: false,
};
it('submits changed settings exactly once through the form', async () => {
  const wrapper = shallowMount(AdminMainOptions, { global: buildVueTestGlobals(), props: { refreshOptions: props } });
  await wrapper.find('#refresh-interval').setValue('120');
  await wrapper.find('form').trigger('submit');
  expect(wrapper.emitted('options-were-updated')).toEqual([[{
    refreshInterval: 120, showRefreshInMenuBar: true, useStaticFilePolling: false,
  }]]);
});

it('disables static file polling controls behind a CDN', async () => {
  const wrapper = shallowMount(AdminMainOptions, {
    global: buildVueTestGlobals(), props: { detectedCdn: 'Cloudflare', refreshOptions: props },
  });
  expect(wrapper.find('[data-test="select-static-file-polling"]').attributes('disabled')).toBeDefined();
});

it('rejects settings with an out-of-bounds custom interval', async () => {
  const wrapper = shallowMount(AdminMainOptions, {
    global: buildVueTestGlobals(), props: { detectedCdn: 'Cloudflare', refreshOptions: props },
  });
  await wrapper.find('#refresh-interval').setValue('custom');
  await wrapper.find('#custom-refresh-interval').setValue('300');
  await wrapper.find('form').trigger('submit');
  expect(wrapper.emitted('options-were-updated')).toBeUndefined();
});

it('reports an out-of-bounds custom interval', async () => {
  const wrapper = shallowMount(AdminMainOptions, {
    global: buildVueTestGlobals(), props: { detectedCdn: 'Cloudflare', refreshOptions: props },
  });
  await wrapper.find('#refresh-interval').setValue('custom');
  await wrapper.find('#custom-refresh-interval').setValue('300');
  await wrapper.find('form').trigger('submit');
  expect(wrapper.emitted('notify-user-of-error')).toHaveLength(1);
});

it('keeps release history out of Advanced settings', async () => {
  const wrapper = shallowMount(AdminMainOptions, { global: buildVueTestGlobals(), props: { refreshOptions: props } });
  expect(wrapper.find('details.advanced-options button').exists()).toBe(false);
});

it('renders a single release history control', async () => {
  const wrapper = shallowMount(AdminMainOptions, { global: buildVueTestGlobals(), props: { refreshOptions: props } });
  expect(wrapper.findAll('[data-test="btn-release-notes"]')).toHaveLength(1);
});

it('places release history and troubleshooting in the settings footer', async () => {
  const wrapper = shallowMount(AdminMainOptions, { global: buildVueTestGlobals(), props: { refreshOptions: props } });
  const utilities = wrapper.find('.force-refresh-admin__options-utilities');
  expect(utilities.findAll('button').map((button) => button.attributes('data-test'))).toEqual([
    'btn-release-notes', 'btn-troubleshooting',
  ]);
});

it('opens release history from the footer', async () => {
  const wrapper = shallowMount(AdminMainOptions, { global: buildVueTestGlobals(), props: { refreshOptions: props } });
  const utilities = wrapper.find('.force-refresh-admin__options-utilities');
  await utilities.find('[data-test="btn-release-notes"]').trigger('click');
  expect(wrapper.emitted('release-notes-page-clicked')).toHaveLength(1);
});
