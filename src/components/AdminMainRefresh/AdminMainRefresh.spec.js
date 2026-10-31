import { enableAutoUnmount, shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminMainRefresh from './AdminMainRefresh.vue';

enableAutoUnmount(afterEach);

it('disables refresh while a request is in flight', async () => {
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { isRefreshing: true, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  const button = wrapper.find('[data-test="btn-force-refresh"]');
  expect(button.attributes('disabled')).toBeDefined();
});

it('marks the refresh button busy during a request', async () => {
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { isRefreshing: true, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  const button = wrapper.find('[data-test="btn-force-refresh"]');
  expect(button.attributes('aria-busy')).toBe('true');
});

it('ignores duplicate refresh requests', async () => {
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { isRefreshing: true, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  wrapper.vm.refreshButtonClicked();
  expect(wrapper.emitted('refresh-requested')).toBeUndefined();
});

it('allows refreshing after a request finishes', async () => {
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { isRefreshing: true, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  const button = wrapper.find('[data-test="btn-force-refresh"]');
  wrapper.vm.refreshButtonClicked();
  await wrapper.setProps({ isRefreshing: false });
  await button.trigger('click');
  expect(wrapper.emitted('refresh-requested')).toHaveLength(1);
});

it('hides success for a previously recorded refresh', async () => {
  jest.useFakeTimers();
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { lastRefreshAt: new Date('2026-10-18T10:00:00Z'), scheduledRefreshes: [], siteName: 'Test Site' },
  });
  try {
    expect(wrapper.find('.refresh-hero__success').exists()).toBe(false);
  } finally {
    wrapper.unmount();
    jest.useRealTimers();
  }
});

it('hides success while refreshing', async () => {
  jest.useFakeTimers();
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { lastRefreshAt: new Date('2026-10-18T10:00:00Z'), scheduledRefreshes: [], siteName: 'Test Site' },
  });
  try {
    await wrapper.setProps({ isRefreshing: true });
    expect(wrapper.find('.refresh-hero__success').exists()).toBe(false);
  } finally {
    wrapper.unmount();
    jest.useRealTimers();
  }
});

it('hides success when a request finishes without a new refresh date', async () => {
  jest.useFakeTimers();
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { lastRefreshAt: new Date('2026-10-18T10:00:00Z'), scheduledRefreshes: [], siteName: 'Test Site' },
  });
  try {
    await wrapper.setProps({ isRefreshing: true });
    await wrapper.setProps({ isRefreshing: false });
    expect(wrapper.find('.refresh-hero__success').exists()).toBe(false);
  } finally {
    wrapper.unmount();
    jest.useRealTimers();
  }
});

it('shows success when the refresh date changes', async () => {
  jest.useFakeTimers();
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { lastRefreshAt: new Date('2026-10-18T10:00:00Z'), scheduledRefreshes: [], siteName: 'Test Site' },
  });
  try {
    await wrapper.setProps({ isRefreshing: true });
    await wrapper.setProps({ isRefreshing: false });
    await wrapper.setProps({ lastRefreshAt: new Date('2026-10-18T10:01:00Z') });
    expect(wrapper.find('.refresh-hero__success').exists()).toBe(true);
  } finally {
    wrapper.unmount();
    jest.useRealTimers();
  }
});

it('clears the success message after its timeout', async () => {
  jest.useFakeTimers();
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { lastRefreshAt: new Date('2026-10-18T10:00:00Z'), scheduledRefreshes: [], siteName: 'Test Site' },
  });
  try {
    await wrapper.setProps({ isRefreshing: true });
    await wrapper.setProps({ isRefreshing: false });
    await wrapper.setProps({ lastRefreshAt: new Date('2026-10-18T10:01:00Z') });
    jest.advanceTimersByTime(3200);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.refresh-hero__success').exists()).toBe(false);
  } finally {
    wrapper.unmount();
    jest.useRealTimers();
  }
});

it('shows no idle refresh status before the first request', () => {
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(), props: { scheduledRefreshes: [], siteName: 'Test Site' },
  });
  expect(wrapper.find('.refresh-hero__status').exists()).toBe(false);
});

it('explains refreshing before a request', async () => {
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { refreshInterval: 30, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  const description = () => wrapper.find('[data-test="refresh-hero-description"]').text();
  expect(description()).toBe('REDESIGN.REFRESH_DESCRIPTION');
  wrapper.unmount();
});

it('explains the visitor reload interval after success', async () => {
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { refreshInterval: 30, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  const description = () => wrapper.find('[data-test="refresh-hero-description"]').text();
  await wrapper.setProps({ lastRefreshAt: new Date('2026-10-18T10:01:00Z') });
  expect(description()).toBe('REDESIGN.REFRESH_SENT_DESCRIPTION|refreshIntervalUnit=seconds,refreshIntervalValue=30');
  wrapper.unmount();
});
