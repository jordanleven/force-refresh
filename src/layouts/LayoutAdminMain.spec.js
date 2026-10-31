import { mount, shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../test/helpers/vue.js';
import createStore from '../js/store/index.js';
import LayoutAdminMain from './LayoutAdminMain.vue';

jest.mock('../js/services/admin/forceRefreshAdminService.js', () => ({
  markWhatsNewSeen: jest.fn().mockResolvedValue({ code: 201 }),
  requestSiteRefresh: jest.fn(),
}));

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

it('opens full history from Release Notes', async () => {
  const store = createStore({
    featureFlags: {},
    refreshOptions: {},
    scheduledRefreshes: [],
    versions: { forceRefresh: { version: '3.2.1' }, php: {}, wordPress: {} },
    whatsNewLastSeenVersion: '3.2.1',
  });
  const wrapper = shallowMount(LayoutAdminMain, {
    global: buildVueTestGlobals({ plugins: [store] }),
    props: { releaseNotes: {} },
  });
  expect(wrapper.findComponent({ name: 'AdminReleaseNotes' }).attributes('is-open')).toBe('false');
  wrapper.findComponent({ name: 'AdminMain' }).vm.$emit('release-notes-page-clicked');
  await wrapper.vm.$nextTick();
  const modal = wrapper.findComponent({ name: 'AdminReleaseNotes' });
  expect(modal.attributes('is-open')).toBe('true');
  expect(modal.props('historyOnly')).toBe(true);
  wrapper.unmount();
  window.history.replaceState({}, '', window.location.pathname);
});

describe('What’s New', () => {
  const releaseNotes = {
    '3.2.0': { notes: [{ sectionHeader: 'New Features', sectionNotes: ['Scheduling. Plan refreshes ahead.'] }] },
    '3.3.0': { notes: [{ sectionHeader: 'New Features', sectionNotes: ['Redesigned admin. A cleaner page.'] }] },
  };
  const mountLayout = (whatsNewLastSeenVersion, version = '3.3.0') => {
    const store = createStore({
      featureFlags: {},
      refreshOptions: {},
      scheduledRefreshes: [],
      versions: { forceRefresh: { version }, php: {}, wordPress: {} },
      whatsNewLastSeenVersion,
    });
    jest.spyOn(store, 'dispatch');
    const wrapper = shallowMount(LayoutAdminMain, {
      global: buildVueTestGlobals({ plugins: [store] }),
      props: { releaseNotes },
    });
    return { store, wrapper };
  };

  it('opens once after a minor update and marks it seen for the user', async () => {
    const { store, wrapper } = mountLayout('3.1.4');
    await wrapper.vm.$nextTick();
    const modal = wrapper.findComponent({ name: 'AdminReleaseNotes' });
    expect(modal.attributes('is-open')).toBe('true');
    expect(modal.props('historyOnly')).toBe(false);
    expect(modal.props('whatsNewFeatures').map(({ versionNumber }) => versionNumber)).toEqual(['3.3.0', '3.2.0']);
    expect(store.dispatch).toHaveBeenCalledWith('requestMarkWhatsNewSeen');
    wrapper.unmount();
  });

  it('stays closed when the user has already seen this minor version', () => {
    const { store, wrapper } = mountLayout('3.3.0', '3.3.2');
    expect(wrapper.findComponent({ name: 'AdminReleaseNotes' }).attributes('is-open')).toBe('false');
    expect(store.dispatch).not.toHaveBeenCalledWith('requestMarkWhatsNewSeen');
    wrapper.unmount();
  });

  it('switches to the full history from the What’s New link', async () => {
    const { wrapper } = mountLayout('3.2.0');
    const modal = wrapper.findComponent({ name: 'AdminReleaseNotes' });
    modal.vm.$emit('view-release-history');
    await wrapper.vm.$nextTick();
    expect(modal.props('historyOnly')).toBe(true);
    expect(modal.attributes('is-open')).toBe('true');
    wrapper.unmount();
  });
});

it('returns to the selected Settings tab after exiting Troubleshooting', async () => {
  const store = createStore({
    featureFlags: {},
    refreshOptions: {},
    scheduledRefreshes: [],
    versions: { forceRefresh: { version: '3.2.1' }, php: {}, wordPress: {} },
  });
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
  window.history.replaceState({}, '', window.location.pathname);
});
