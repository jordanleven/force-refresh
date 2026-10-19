import { shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminMainRefresh from './AdminMainRefresh.vue';

it('prevents duplicate refresh requests while a request is in flight', async () => {
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { isRefreshing: true, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  const button = wrapper.find('[data-test="btn-force-refresh"]');
  expect(button.attributes('disabled')).toBeDefined();
  expect(button.attributes('aria-busy')).toBe('true');
  wrapper.vm.refreshButtonClicked();
  expect(wrapper.emitted('refresh-requested')).toBeUndefined();
  await wrapper.setProps({ isRefreshing: false });
  await button.trigger('click');
  expect(wrapper.emitted('refresh-requested')).toHaveLength(1);
});

it('announces success only after a successful refresh date changes', async () => {
  jest.useFakeTimers();
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { lastRefreshAt: new Date('2026-10-18T10:00:00Z'), scheduledRefreshes: [], siteName: 'Test Site' },
  });
  try {
    expect(wrapper.find('.refresh-hero__success').exists()).toBe(false);
    await wrapper.setProps({ isRefreshing: true });
    expect(wrapper.find('.refresh-hero__success').exists()).toBe(false);
    await wrapper.setProps({ isRefreshing: false });
    expect(wrapper.find('.refresh-hero__success').exists()).toBe(false);
    await wrapper.setProps({ lastRefreshAt: new Date('2026-10-18T10:01:00Z') });
    expect(wrapper.find('.refresh-hero__success').exists()).toBe(true);
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

it('explains when visitors will reload after a successful refresh', async () => {
  const wrapper = shallowMount(AdminMainRefresh, {
    global: buildVueTestGlobals(),
    props: { refreshInterval: 30, scheduledRefreshes: [], siteName: 'Test Site' },
  });
  const description = () => wrapper.find('[data-test="refresh-hero-description"]').text();
  expect(description()).toBe('REDESIGN.REFRESH_DESCRIPTION');
  await wrapper.setProps({ lastRefreshAt: new Date('2026-10-18T10:01:00Z') });
  expect(description()).toBe('REDESIGN.REFRESH_SENT_DESCRIPTION|refreshIntervalUnit=seconds,refreshIntervalValue=30');
  wrapper.unmount();
});
