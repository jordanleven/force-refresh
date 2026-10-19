import { shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminMainOptions from './AdminMainOptions.vue';

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

it('preserves CDN restrictions and rejects an invalid custom interval', async () => {
  const wrapper = shallowMount(AdminMainOptions, {
    global: buildVueTestGlobals(), props: { detectedCdn: 'Cloudflare', refreshOptions: props },
  });
  expect(wrapper.find('[data-test="select-static-file-polling"]').attributes('disabled')).toBeDefined();
  await wrapper.find('#refresh-interval').setValue('custom');
  await wrapper.find('#custom-refresh-interval').setValue('300');
  await wrapper.find('form').trigger('submit');
  expect(wrapper.emitted('options-were-updated')).toBeUndefined();
  expect(wrapper.emitted('notify-user-of-error')).toHaveLength(1);
});

it('provides one footer release history control and a separate feature summary control', async () => {
  const wrapper = shallowMount(AdminMainOptions, { global: buildVueTestGlobals(), props: { refreshOptions: props } });
  const advanced = wrapper.find('details.advanced-options');
  expect(advanced.find('button').exists()).toBe(false);
  const utilities = wrapper.find('.force-refresh-admin__options-utilities');
  expect(wrapper.findAll('[data-test="btn-release-notes"]')).toHaveLength(1);
  expect(utilities.findAll('button').map((button) => button.attributes('data-test'))).toEqual([
    'btn-whats-new', 'btn-release-notes', 'btn-troubleshooting',
  ]);
  const star = utilities.find('[data-test="btn-whats-new"]').findComponent({ name: 'Icon' });
  expect(star.props()).toEqual({ name: 'star', size: 12 });
  await utilities.find('[data-test="btn-release-notes"]').trigger('click');
  expect(wrapper.emitted('release-notes-page-clicked')).toHaveLength(1);
  expect(wrapper.emitted('whats-new-page-clicked')).toBeUndefined();
  await utilities.find('[data-test="btn-whats-new"]').trigger('click');
  expect(wrapper.emitted('whats-new-page-clicked')).toHaveLength(1);
});
