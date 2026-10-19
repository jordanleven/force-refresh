import { mount, shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../test/helpers/vue.js';
import createStore from '../js/store/index.js';
import LayoutAdminMain from './LayoutAdminMain.vue';

jest.mock('../js/services/admin/forceRefreshAdminService.js', () => ({ requestSiteRefresh: jest.fn() }));

it('keeps the scheduler open after a failed save and shows the error inside it', async () => {
  const context = {
    $t: (key) => key,
    notificationMessageSetError: jest.fn(),
    notificationMessageSetSuccess: jest.fn(),
    requestScheduledRefresh: jest.fn().mockResolvedValue(false),
    requestScheduledRefreshes: jest.fn(),
    scheduleRefreshError: null,
    scheduleRefreshPageActive: true,
    scheduleRefreshSubmitting: false,
  };
  await LayoutAdminMain.methods.refreshWasScheduled.call(context, new Date('2026-12-20T15:30:00Z'));
  expect(context.scheduleRefreshPageActive).toBe(true);
  expect(context.scheduleRefreshError).toBe('ADMIN_NOTIFICATIONS.SCHEDULED_REFRESH_FAILURE');
  expect(context.scheduleRefreshSubmitting).toBe(false);
  expect(context.notificationMessageSetError).not.toHaveBeenCalled();
});

it('ignores a second schedule submission while the first is saving', async () => {
  const context = {
    requestScheduledRefresh: jest.fn(),
    scheduleRefreshSubmitting: true,
  };
  await LayoutAdminMain.methods.refreshWasScheduled.call(context, new Date('2026-12-20T15:30:00Z'));
  expect(context.requestScheduledRefresh).not.toHaveBeenCalled();
});

it('opens full history from Release Notes and feature highlights from What’s New', async () => {
  const store = createStore({
    featureFlags: {},
    refreshOptions: {},
    scheduledRefreshes: [],
    versions: { forceRefresh: { version: '3.2.1' }, php: {}, wordPress: {} },
  });
  window.localStorage.setItem('force-refresh-whats-new-version', '3.2.1');
  const wrapper = shallowMount(LayoutAdminMain, {
    global: buildVueTestGlobals({ plugins: [store] }),
    props: { releaseNotes: {} },
  });
  const main = wrapper.findComponent({ name: 'AdminMain' });
  main.vm.$emit('release-notes-page-clicked');
  await wrapper.vm.$nextTick();
  let modal = wrapper.findComponent({ name: 'AdminReleaseNotes' });
  expect(modal.props('historyOnly')).toBe(true);
  modal.vm.$emit('modal-was-closed');
  await wrapper.vm.$nextTick();
  main.vm.$emit('whats-new-page-clicked');
  await wrapper.vm.$nextTick();
  modal = wrapper.findComponent({ name: 'AdminReleaseNotes' });
  expect(modal.props('historyOnly')).toBe(false);
  wrapper.unmount();
  window.localStorage.removeItem('force-refresh-whats-new-version');
  window.history.replaceState({}, '', window.location.pathname);
});

it('returns to the selected Settings tab after exiting Troubleshooting', async () => {
  const store = createStore({
    featureFlags: {},
    refreshOptions: {},
    scheduledRefreshes: [],
    versions: { forceRefresh: { version: '3.2.1' }, php: {}, wordPress: {} },
  });
  window.localStorage.setItem('force-refresh-whats-new-version', '3.2.1');
  const wrapper = mount(LayoutAdminMain, {
    global: buildVueTestGlobals({
      plugins: [store],
      stubs: {
        AdminHeaderBadge: true,
        AdminMainOptions: {
          emits: ['troubleshooting-page-clicked'],
          template: '<button data-test="enter-troubleshooting" @click="$emit(\'troubleshooting-page-clicked\')">Troubleshooting</button>',
        },
        AdminMainRefresh: true,
        AdminTroubleshooting: {
          emits: ['exit-troubleshooting'],
          template: '<button data-test="exit-troubleshooting" @click="$emit(\'exit-troubleshooting\')">Back</button>',
        },
      },
    }),
    props: { releaseNotes: {} },
  });
  await wrapper.find('#force-refresh-tab-settings').trigger('click');
  await wrapper.find('[data-test="enter-troubleshooting"]').trigger('click');
  expect(wrapper.find('#force-refresh-tab-settings').exists()).toBe(false);
  await wrapper.find('[data-test="exit-troubleshooting"]').trigger('click');
  expect(wrapper.find('#force-refresh-tab-settings').attributes('aria-selected')).toBe('true');
  expect(wrapper.find('#force-refresh-tab-refresh').attributes('aria-selected')).toBe('false');
  wrapper.unmount();
  window.localStorage.removeItem('force-refresh-whats-new-version');
  window.history.replaceState({}, '', window.location.pathname);
});

it('restores Settings after reload and keeps successful settings saves on that tab', async () => {
  const store = createStore({
    featureFlags: {},
    refreshOptions: { showRefreshInMenuBar: true },
    scheduledRefreshes: [],
    versions: { forceRefresh: { version: '3.2.1' }, php: {}, wordPress: {} },
  });
  window.history.replaceState({}, '', '#settings');
  window.localStorage.setItem('force-refresh-whats-new-version', '3.2.1');
  const wrapper = shallowMount(LayoutAdminMain, {
    global: buildVueTestGlobals({ plugins: [store] }),
    props: { releaseNotes: {} },
  });
  expect(wrapper.findComponent({ name: 'AdminMain' }).props('initialTab')).toBe('settings');
  jest.spyOn(wrapper.vm, 'updateForceRefreshSettings').mockResolvedValue(true);
  await wrapper.vm.updateOptions({ showRefreshInMenuBar: true });
  expect(wrapper.vm.mainActiveTab).toBe('settings');
  expect(window.location.hash).toBe('#settings');
  wrapper.unmount();
  window.localStorage.removeItem('force-refresh-whats-new-version');
  window.history.replaceState({}, '', window.location.pathname);
});
