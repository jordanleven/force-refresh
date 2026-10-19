import { shallowMount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminScheduleRefresh from './AdminScheduleRefresh.vue';

let wrappers = [];
const mountPicker = (props = {}) => {
  const wrapper = shallowMount(AdminScheduleRefresh, {
    attachTo: document.body,
    global: buildVueTestGlobals({
      stubs: {
        BaseModal: {
          template: '<div><slot /><slot name="footer" /></div>',
        },
      },
    }),
    props,
  });
  wrappers.push(wrapper);
  return wrapper;
};
describe('redesigned schedule picker', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 18, 16, 0));
  });
  afterEach(() => {
    wrappers.forEach((wrapper) => wrapper.unmount());
    wrappers = [];
    jest.useRealTimers();
  });
  it('omits recurring tabs', () => {
    const wrapper = mountPicker();
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false);
  });
  it('omits recurring controls', () => {
    const wrapper = mountPicker();
    expect(wrapper.find('.schedule-recurring').exists()).toBe(false);
  });
  it('shows the default date banner', () => {
    const wrapper = mountPicker();
    expect(wrapper.find('.schedule-sheet__selection').exists()).toBe(true);
  });
  it('presses today by default', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    const today = wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18');
    expect(today.attributes('aria-pressed')).toBe('true');
  });
  it('enables submission for the default time', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    expect(wrapper.find('[data-test="btn-submit-schedule-refresh"]').attributes('disabled')).toBeUndefined();
  });
  it('submits the default future time', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    await wrapper.find('[data-test="btn-submit-schedule-refresh"]').trigger('click');
    expect(wrapper.emitted('schedule-refresh')[0][0]).toEqual(new Date(2026, 9, 18, 16, 5));
  });
  it.each([18, 31])('shows tomorrow month at 11:58 PM on October %s', (day) => {
    jest.setSystemTime(new Date(2026, 9, day, 23, 58));
    const wrapper = mountPicker({
      isOpen: true,
    });
    const tomorrow = new Date(2026, 9, day + 1);
    expect(wrapper.vm.month).toEqual(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));
  });
  it.each([18, 31])('selects tomorrow at 11:58 PM on October %s', (day) => {
    jest.setSystemTime(new Date(2026, 9, day, 23, 58));
    const wrapper = mountPicker({
      isOpen: true,
    });
    const tomorrow = new Date(2026, 9, day + 1);
    expect(wrapper.vm.selectedDay).toBe(tomorrow.getTime());
  });
  it.each([18, 31])('presses tomorrow date at 11:58 PM on October %s', (day) => {
    jest.setSystemTime(new Date(2026, 9, day, 23, 58));
    const wrapper = mountPicker({
      isOpen: true,
    });
    const tomorrow = new Date(2026, 9, day + 1);
    const selected = wrapper.findAll('.schedule-calendar__grid button').find((button) => button.attributes('aria-pressed') === 'true');
    expect(selected.text()).toBe(String(tomorrow.getDate()));
  });
  it.each([18, 31])('defaults to midnight at 11:58 PM on October %s', (day) => {
    jest.setSystemTime(new Date(2026, 9, day, 23, 58));
    const wrapper = mountPicker({
      isOpen: true,
    });
    const tomorrow = new Date(2026, 9, day + 1);
    expect(wrapper.vm.scheduleDateTime).toEqual(tomorrow);
  });
  it.each([18, 31])('enables tomorrow default at 11:58 PM on October %s', (day) => {
    jest.setSystemTime(new Date(2026, 9, day, 23, 58));
    const wrapper = mountPicker({
      isOpen: true,
    });
    expect(wrapper.find('[data-test="btn-submit-schedule-refresh"]').attributes('disabled')).toBeUndefined();
  });
  it('shows the selected date in the banner', async () => {
    const wrapper = mountPicker();
    await wrapper.setData({
      selectedDay: new Date(2026, 9, 19).getTime(),
    });
    expect(wrapper.find('.schedule-sheet__selection').text()).toContain('October 19, 2026');
  });
  it('removes the date banner after clearing', async () => {
    const wrapper = mountPicker();
    await wrapper.setData({
      selectedDay: new Date(2026, 9, 19).getTime(),
    });
    await wrapper.find('.schedule-sheet__selection button').trigger('click');
    expect(wrapper.find('.schedule-sheet__selection').exists()).toBe(false);
  });
  it('disables submission after clearing the date', async () => {
    const wrapper = mountPicker();
    await wrapper.setData({
      selectedDay: new Date(2026, 9, 19).getTime(),
    });
    await wrapper.find('.schedule-sheet__selection button').trigger('click');
    expect(wrapper.find('[data-test="btn-submit-schedule-refresh"]').attributes('disabled')).toBeDefined();
  });
  it('does not schedule when clearing the date', async () => {
    const wrapper = mountPicker();
    await wrapper.setData({
      selectedDay: new Date(2026, 9, 19).getTime(),
    });
    await wrapper.find('.schedule-sheet__selection button').trigger('click');
    expect(wrapper.emitted('schedule-refresh')).toBeUndefined();
  });
  it('enables submission with an initial selection', async () => {
    const wrapper = mountPicker();
    expect(wrapper.find('[data-test="btn-submit-schedule-refresh"]').attributes('disabled')).toBeUndefined();
  });
  it('disables dates before today', async () => {
    const wrapper = mountPicker();
    const dates = wrapper.findAll('.schedule-calendar__grid button');
    expect(dates.find((button) => button.text() === '17').attributes('disabled')).toBeDefined();
  });
  it('emits the chosen local date and time', async () => {
    const wrapper = mountPicker();
    const dates = wrapper.findAll('.schedule-calendar__grid button');
    await dates.find((button) => button.text() === '19').trigger('click');
    await wrapper.setData({
      selectedTime: {
        hour: 5,
        minute: 30,
        period: 'PM',
      },
    });
    await wrapper.find('[data-test="btn-submit-schedule-refresh"]').trigger('click');
    expect(wrapper.emitted('schedule-refresh')[0][0]).toEqual(new Date(2026, 9, 19, 17, 30));
  });
  it('enables a future chosen time', async () => {
    const wrapper = mountPicker();
    await wrapper.setData({
      selectedDay: new Date(2026, 9, 18).getTime(),
      selectedTime: {
        hour: 5,
        minute: 0,
        period: 'PM',
      },
      timeWasChosen: true,
    });
    expect(wrapper.vm.buttonDisabled).toBe(false);
  });
  it('does not submit a chosen time that expired while idle', async () => {
    const wrapper = mountPicker();
    await wrapper.setData({
      selectedDay: new Date(2026, 9, 18).getTime(),
      selectedTime: {
        hour: 5,
        minute: 0,
        period: 'PM',
      },
      timeWasChosen: true,
    });
    jest.setSystemTime(new Date(2026, 9, 18, 18, 0));
    await wrapper.find('[data-test="btn-submit-schedule-refresh"]').trigger('click');
    expect(wrapper.emitted('schedule-refresh')).toBeUndefined();
  });
  it('explains an expired chosen time on submission', async () => {
    const wrapper = mountPicker();
    await wrapper.setData({
      selectedDay: new Date(2026, 9, 18).getTime(),
      selectedTime: {
        hour: 5,
        minute: 0,
        period: 'PM',
      },
      timeWasChosen: true,
    });
    jest.setSystemTime(new Date(2026, 9, 18, 18, 0));
    await wrapper.find('[data-test="btn-submit-schedule-refresh"]').trigger('click');
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });
  it('disables previous-month navigation in the current month', async () => {
    const wrapper = mountPicker();
    expect(wrapper.find('.schedule-calendar__navigation button').attributes('disabled')).toBeDefined();
  });
  it('emits closure when cancelled', async () => {
    const wrapper = mountPicker();
    await wrapper.find('.schedule-sheet__footer button').trigger('click');
    expect(wrapper.emitted('modal-was-closed')).toHaveLength(1);
  });
  it('does not schedule when cancelled', async () => {
    const wrapper = mountPicker();
    await wrapper.find('.schedule-sheet__footer button').trigger('click');
    expect(wrapper.emitted('schedule-refresh')).toBeUndefined();
  });
  it('shows a save error inside the dialog', () => {
    const wrapper = mountPicker({
      errorMessage: 'Could not schedule.',
      isSubmitting: true,
    });
    expect(wrapper.find('[data-test="schedule-refresh-error"]').text()).toBe('Could not schedule.');
  });
  it('disables submission while saving', () => {
    const wrapper = mountPicker({
      errorMessage: 'Could not schedule.',
      isSubmitting: true,
    });
    expect(wrapper.find('[data-test="btn-submit-schedule-refresh"]').attributes('disabled')).toBeDefined();
  });
  it('retains the chosen date while open', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '19').trigger('click');
    expect(wrapper.vm.selectedDay).not.toBeNull();
  });
  it('resets the date when reopened', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '19').trigger('click');
    await wrapper.setProps({
      isOpen: false,
    });
    await wrapper.setProps({
      isOpen: true,
    });
    expect(wrapper.vm.selectedDay).toBe(new Date(2026, 9, 18).getTime());
  });
  it('starts without a past-time error', async () => {
    const wrapper = mountPicker();
    expect(wrapper.find('[data-test="schedule-refresh-time-error"]').exists()).toBe(false);
  });
  it('keeps the valid default when today is selected', async () => {
    const wrapper = mountPicker();
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    expect(wrapper.find('[data-test="schedule-refresh-time-error"]').exists()).toBe(false);
  });
  it('explains a chosen past time', async () => {
    const wrapper = mountPicker();
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    wrapper.vm.selectedTime = {
      hour: 10,
      minute: 0,
      period: 'AM',
    };
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="schedule-refresh-time-error"]').exists()).toBe(true);
  });
  it('disables submission for a chosen past time', async () => {
    const wrapper = mountPicker();
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    wrapper.vm.selectedTime = {
      hour: 10,
      minute: 0,
      period: 'AM',
    };
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="btn-submit-schedule-refresh"]').attributes('disabled')).toBeDefined();
  });
  it('advances a stale untouched time when today is selected', async () => {
    const wrapper = mountPicker();
    await wrapper.find('.schedule-sheet__selection button').trigger('click');
    jest.setSystemTime(new Date(2026, 9, 18, 17, 2));
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    expect(wrapper.vm.selectedTime).toEqual({
      hour: 5,
      minute: 5,
      period: 'PM',
    });
  });
  it('enables the advanced default time', async () => {
    const wrapper = mountPicker();
    await wrapper.find('.schedule-sheet__selection button').trigger('click');
    jest.setSystemTime(new Date(2026, 9, 18, 17, 2));
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    expect(wrapper.vm.buttonDisabled).toBe(false);
  });
  it('clears the past-time error after advancing the default', async () => {
    const wrapper = mountPicker();
    await wrapper.find('.schedule-sheet__selection button').trigger('click');
    jest.setSystemTime(new Date(2026, 9, 18, 17, 2));
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    expect(wrapper.find('[data-test="schedule-refresh-time-error"]').exists()).toBe(false);
  });
  it('keeps an untouched default schedulable while idle', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    jest.advanceTimersByTime(9 * 60000);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.buttonDisabled).toBe(false);
  });
  it('submits the advanced default after sitting idle', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    jest.advanceTimersByTime(9 * 60000);
    await wrapper.vm.$nextTick();
    await wrapper.find('[data-test="btn-submit-schedule-refresh"]').trigger('click');
    // The default moved forward to the next slot when 4:05 PM passed.
    expect(wrapper.emitted('schedule-refresh')[0][0]).toEqual(new Date(2026, 9, 18, 16, 10));
  });
  it('enables a newly chosen future time', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    wrapper.vm.chooseTime('minute', 10);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.buttonDisabled).toBe(false);
  });
  it('retains the chosen minute after it expires', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    wrapper.vm.chooseTime('minute', 10);
    await wrapper.vm.$nextTick();
    jest.advanceTimersByTime(15 * 60000);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedTime.minute).toBe(10);
  });
  it('disables an expired chosen time', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    wrapper.vm.chooseTime('minute', 10);
    await wrapper.vm.$nextTick();
    jest.advanceTimersByTime(15 * 60000);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.buttonDisabled).toBe(true);
  });
  it('explains why the chosen time expired', async () => {
    const wrapper = mountPicker({
      isOpen: true,
    });
    await wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').trigger('click');
    wrapper.vm.chooseTime('minute', 10);
    await wrapper.vm.$nextTick();
    jest.advanceTimersByTime(15 * 60000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="schedule-refresh-time-error"]').exists()).toBe(true);
  });

  it.each([18, 31])('advances the untouched default date at midnight on October %s', async (day) => {
    jest.setSystemTime(new Date(2026, 9, day, 23, 50));
    const wrapper = mountPicker({ isOpen: true });
    jest.advanceTimersByTime(5 * 60000);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.scheduleDateTime).toEqual(new Date(2026, 9, day + 1));
  });

  it('shows November when an untouched October default rolls forward', async () => {
    jest.setSystemTime(new Date(2026, 9, 31, 23, 50));
    const wrapper = mountPicker({ isOpen: true });
    jest.advanceTimersByTime(5 * 60000);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.month).toEqual(new Date(2026, 10, 1));
  });

  it('keeps the submit button enabled when the untouched default rolls into tomorrow', async () => {
    jest.setSystemTime(new Date(2026, 9, 18, 23, 50));
    const wrapper = mountPicker({ isOpen: true });
    jest.advanceTimersByTime(5 * 60000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="btn-submit-schedule-refresh"]').attributes('disabled')).toBeUndefined();
  });

  it('returns focus to the cleared date in the calendar', async () => {
    const wrapper = mountPicker();
    const date = wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '19');
    await date.trigger('click');
    const clearButton = wrapper.find('.schedule-sheet__selection button');
    clearButton.element.focus();
    await clearButton.trigger('click');
    expect(document.activeElement).toBe(date.element);
  });

  it('focuses an available date when the cleared date has become unavailable', async () => {
    const wrapper = mountPicker();
    jest.setSystemTime(new Date(2026, 9, 19, 16, 0));
    await wrapper.find('.schedule-sheet__selection button').trigger('click');
    expect(document.activeElement).toBe(wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '19').element);
  });
});
