import { mount, shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminMainOptions from '../AdminMainOptions/AdminMainOptions.vue';
import AdminMainRefresh from '../AdminMainRefresh/AdminMainRefresh.vue';
import AdminMain from './AdminMain.vue';

const refreshOptions = {
  customRefreshIntervalMaximumInMinutes: 240,
  customRefreshIntervalMinimumInMinutes: 0.5,
  refreshInterval: 60,
  showRefreshInMenuBar: true,
  useStaticFilePolling: false,
};

describe('tab keyboard navigation', () => {
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
});

describe('forwarding to the panels', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(AdminMain, {
      attrs: { class: 'admin-section__main' },
      global: buildVueTestGlobals(),
      props: {
        detectedCdn: 'Cloudflare',
        hasWhatsNew: true,
        isScheduledRefreshEnabled: true,
        refreshOptions,
        scheduledRefreshes: [],
        siteName: 'Test Site',
      },
    });
  });

  afterEach(() => wrapper.unmount());

  it('applies the parent class to its root', () => {
    expect(wrapper.classes()).toContain('admin-section__main');
  });

  it('keeps the parent class off the Refresh panel', () => {
    expect(wrapper.findComponent(AdminMainRefresh).classes()).not.toContain('admin-section__main');
  });

  it('keeps the parent class off the Settings panel', () => {
    expect(wrapper.findComponent(AdminMainOptions).classes()).not.toContain('admin-section__main');
  });

  it('keeps the CDN off the Refresh panel markup', () => {
    expect(wrapper.findComponent(AdminMainRefresh).attributes()).not.toHaveProperty('detectedcdn');
  });

  it('keeps the schedule flag off the Settings panel markup', () => {
    expect(wrapper.findComponent(AdminMainOptions).attributes()).not.toHaveProperty('isscheduledrefreshenabled');
  });

  it('passes the schedule flag to the Refresh panel', () => {
    expect(wrapper.findComponent(AdminMainRefresh).props('isScheduledRefreshEnabled')).toBe(true);
  });

  it('passes the CDN to the Settings panel', () => {
    expect(wrapper.findComponent(AdminMainOptions).props('detectedCdn')).toBe('Cloudflare');
  });

  it('tells the Settings panel that What’s New is available', () => {
    expect(wrapper.findComponent(AdminMainOptions).props('hasWhatsNew')).toBe(true);
  });

  it.each([
    ['delete-scheduled-refresh', [42]],
    ['refresh-requested', []],
    ['schedule-refresh-requested', []],
    ['scheduled-refreshes-sync-requested', []],
  ])('forwards %s from the Refresh panel', async (event, payload) => {
    wrapper.findComponent(AdminMainRefresh).vm.$emit(event, ...payload);
    expect(wrapper.emitted(event)).toEqual([payload]);
  });

  it.each([
    ['notify-user-of-error', ['Could not save.']],
    ['options-were-updated', [{ refreshInterval: 30 }]],
    ['release-notes-page-clicked', []],
    ['troubleshooting-page-clicked', []],
    ['whats-new-page-clicked', []],
  ])('forwards %s from the Settings panel', async (event, payload) => {
    wrapper.findComponent(AdminMainOptions).vm.$emit(event, ...payload);
    expect(wrapper.emitted(event)).toEqual([payload]);
  });
});
