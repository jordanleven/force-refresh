import { mount, shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../test/helpers/vue.js';
import createStore from '../js/store/index.js';
import LayoutAdminMain from './LayoutAdminMain.vue';

jest.mock('../js/services/admin/forceRefreshAdminService.js', () => ({
  markWhatsNewSeen: jest.fn().mockResolvedValue({
    code: 201,
  }),
  requestSiteRefresh: jest.fn(),
}));
describe('keeps the scheduler open after a failed save and shows the error inside it', () => {
  let context;
  beforeEach(async () => {
    context = {
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
  });

  it('keeps the scheduler open', async () => {
    expect(context.scheduleRefreshPageActive).toBe(true);
  });

  it('shows the save error inside the scheduler', async () => {
    expect(context.scheduleRefreshError).toBe('ADMIN_NOTIFICATIONS.SCHEDULED_REFRESH_FAILURE');
  });

  it('clears the submitting state', async () => {
    expect(context.scheduleRefreshSubmitting).toBe(false);
  });

  it('avoids an external error notification', async () => {
    expect(context.notificationMessageSetError).not.toHaveBeenCalled();
  });
});
it('ignores a second schedule submission while the first is saving', async () => {
  const context = {
    requestScheduledRefresh: jest.fn(),
    scheduleRefreshSubmitting: true,
  };
  await LayoutAdminMain.methods.refreshWasScheduled.call(context, new Date('2026-12-20T15:30:00Z'));
  expect(context.requestScheduledRefresh).not.toHaveBeenCalled();
});
describe('opens full history from Release Notes', () => {
  let store;
  let wrapper;
  beforeEach(() => {
    store = createStore({
      featureFlags: {},
      refreshOptions: {},
      scheduledRefreshes: [],
      versions: {
        forceRefresh: {
          version: '3.2.1',
        },
        php: {},
        wordPress: {},
      },
      whatsNewLastSeenVersion: '3.2.1',
    });
    wrapper = shallowMount(LayoutAdminMain, {
      global: buildVueTestGlobals({
        plugins: [store],
      }),
      props: {
        releaseNotes: {},
      },
    });
  });
  afterEach(() => {
    wrapper.unmount();
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('starts with history closed', async () => {
    expect(wrapper.findComponent({
      name: 'AdminReleaseNotes',
    }).attributes('is-open')).toBe('false');
  });

  it('opens history after the Release Notes event', async () => {
    wrapper.findComponent({
      name: 'AdminMain',
    }).vm.$emit('release-notes-page-clicked');
    await wrapper.vm.$nextTick();
    const modal = wrapper.findComponent({
      name: 'AdminReleaseNotes',
    });
    expect(modal.attributes('is-open')).toBe('true');
  });

  it('shows the full history after the Release Notes event', async () => {
    wrapper.findComponent({
      name: 'AdminMain',
    }).vm.$emit('release-notes-page-clicked');
    await wrapper.vm.$nextTick();
    const modal = wrapper.findComponent({
      name: 'AdminReleaseNotes',
    });
    expect(modal.props('historyOnly')).toBe(true);
  });
});
describe('What’s New', () => {
  const releaseNotes = {
    '3.2.0': {
      notes: [{
        sectionHeader: 'New Features',
        sectionNotes: ['Scheduling. Plan refreshes ahead.'],
      }],
    },
    '3.3.0': {
      notes: [{
        sectionHeader: 'New Features',
        sectionNotes: ['Redesigned admin. A cleaner page.'],
      }],
    },
  };
  const mountLayout = (whatsNewLastSeenVersion, version = '3.3.0') => {
    const store = createStore({
      featureFlags: {},
      refreshOptions: {},
      scheduledRefreshes: [],
      versions: {
        forceRefresh: {
          version,
        },
        php: {},
        wordPress: {},
      },
      whatsNewLastSeenVersion,
    });
    jest.spyOn(store, 'dispatch');
    const wrapper = shallowMount(LayoutAdminMain, {
      global: buildVueTestGlobals({
        plugins: [store],
      }),
      props: {
        releaseNotes,
      },
    });
    return {
      store,
      wrapper,
    };
  };
  describe('opens once after a minor update and marks it seen for the user', () => {
    let store;
    let wrapper;
    let modal;
    beforeEach(async () => {
      ({
        store,
        wrapper,
      } = mountLayout('3.1.4'));
      await wrapper.vm.$nextTick();
      modal = wrapper.findComponent({
        name: 'AdminReleaseNotes',
      });
    });
    afterEach(() => {
      wrapper.unmount();
    });

    it('opens the announcement', async () => {
      expect(modal.attributes('is-open')).toBe('true');
    });

    it('shows highlights rather than full history', async () => {
      expect(modal.props('historyOnly')).toBe(false);
    });

    it('includes features from unseen minor versions', async () => {
      expect(modal.props('whatsNewFeatures').map(({
        versionNumber,
      }) => versionNumber)).toEqual(['3.3.0', '3.2.0']);
    });

    it('marks the announcement seen', async () => {
      expect(store.dispatch).toHaveBeenCalledWith('requestMarkWhatsNewSeen');
    });
  });
  describe('stays closed when the user has already seen this minor version', () => {
    let store;
    let wrapper;
    beforeEach(() => {
      ({
        store,
        wrapper,
      } = mountLayout('3.3.0', '3.3.2'));
    });
    afterEach(() => {
      wrapper.unmount();
    });

    it('keeps the announcement closed', () => {
      expect(wrapper.findComponent({
        name: 'AdminReleaseNotes',
      }).attributes('is-open')).toBe('false');
    });

    it('does not mark an already seen minor version again', () => {
      expect(store.dispatch).not.toHaveBeenCalledWith('requestMarkWhatsNewSeen');
    });
  });
  describe('switches to the full history from the What’s New link', () => {
    let wrapper;
    let modal;
    beforeEach(async () => {
      ({
        wrapper,
      } = mountLayout('3.2.0'));
      modal = wrapper.findComponent({
        name: 'AdminReleaseNotes',
      });
      modal.vm.$emit('view-release-history');
      await wrapper.vm.$nextTick();
    });
    afterEach(() => {
      wrapper.unmount();
    });

    it('shows full history', async () => {
      expect(modal.props('historyOnly')).toBe(true);
    });

    it('keeps the dialog open', async () => {
      expect(modal.attributes('is-open')).toBe('true');
    });
  });
});
describe('returns to the selected Settings tab after exiting Troubleshooting', () => {
  let store;
  let wrapper;
  beforeEach(async () => {
    store = createStore({
      featureFlags: {},
      refreshOptions: {},
      scheduledRefreshes: [],
      versions: {
        forceRefresh: {
          version: '3.2.1',
        },
        php: {},
        wordPress: {},
      },
    });
    wrapper = mount(LayoutAdminMain, {
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
      props: {
        releaseNotes: {},
      },
    });
    await wrapper.find('#force-refresh-tab-settings').trigger('click');
    await wrapper.find('[data-test="enter-troubleshooting"]').trigger('click');
  });
  afterEach(() => {
    wrapper.unmount();
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('hides tabs while troubleshooting is active', async () => {
    expect(wrapper.find('#force-refresh-tab-settings').exists()).toBe(false);
  });

  it('selects Settings when troubleshooting closes', async () => {
    await wrapper.find('[data-test="exit-troubleshooting"]').trigger('click');
    expect(wrapper.find('#force-refresh-tab-settings').attributes('aria-selected')).toBe('true');
  });

  it('leaves Refresh unselected when troubleshooting closes', async () => {
    await wrapper.find('[data-test="exit-troubleshooting"]').trigger('click');
    expect(wrapper.find('#force-refresh-tab-refresh').attributes('aria-selected')).toBe('false');
  });
});
describe('restores Settings after reload and keeps successful settings saves on that tab', () => {
  let store;
  let wrapper;
  beforeEach(() => {
    store = createStore({
      featureFlags: {},
      refreshOptions: {
        showRefreshInMenuBar: true,
      },
      scheduledRefreshes: [],
      versions: {
        forceRefresh: {
          version: '3.2.1',
        },
        php: {},
        wordPress: {},
      },
    });
    window.history.replaceState({}, '', '#settings');
    wrapper = shallowMount(LayoutAdminMain, {
      global: buildVueTestGlobals({
        plugins: [store],
      }),
      props: {
        releaseNotes: {},
      },
    });
  });
  afterEach(() => {
    wrapper.unmount();
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('restores Settings after reload', async () => {
    expect(wrapper.findComponent({
      name: 'AdminMain',
    }).props('initialTab')).toBe('settings');
  });

  it('keeps Settings selected after saving', async () => {
    jest.spyOn(wrapper.vm, 'updateForceRefreshSettings').mockResolvedValue(true);
    await wrapper.vm.updateOptions({
      showRefreshInMenuBar: true,
    });
    expect(wrapper.vm.mainActiveTab).toBe('settings');
  });

  it('keeps the Settings URL after saving', async () => {
    jest.spyOn(wrapper.vm, 'updateForceRefreshSettings').mockResolvedValue(true);
    await wrapper.vm.updateOptions({
      showRefreshInMenuBar: true,
    });
    expect(window.location.hash).toBe('#settings');
  });
});
