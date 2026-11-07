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
const findDay = (wrapper, day) => wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === String(day));
const findOption = (wrapper, list, label) => wrapper.findAll('[role="listbox"]')[list].findAll('[role="option"]')
  .find((option) => option.text() === label);
const pressKey = async (element, key) => {
  element.element.focus();
  await element.trigger('keydown', { key });
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

  it('disables the previous day once the open dialog passes midnight', async () => {
    jest.setSystemTime(new Date(2026, 9, 18, 23, 59, 50));
    const wrapper = mountPicker({ isOpen: true });
    jest.advanceTimersByTime(15000);
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '18').attributes('disabled')).toBeDefined();
  });

  it('marks the new day as today once the open dialog passes midnight', async () => {
    jest.setSystemTime(new Date(2026, 9, 18, 23, 59, 50));
    const wrapper = mountPicker({ isOpen: true });
    jest.advanceTimersByTime(15000);
    await wrapper.vm.$nextTick();
    const newToday = wrapper.findAll('.schedule-calendar__grid button').find((button) => button.text() === '19');
    expect(newToday.classes()).toContain('schedule-calendar__today');
  });

  it.each(['AM', 'PM'])('labels the %s period from the locale', (period) => {
    const wrapper = mountPicker();
    expect(wrapper.findAll('.schedule-time__period button').map((button) => button.text())).toContain(`REDESIGN.PERIOD_${period}`);
  });

  it('explains a time skipped by the daylight saving change', async () => {
    jest.setSystemTime(new Date(2026, 2, 1, 12, 0));
    const wrapper = mountPicker({ isOpen: true });
    await wrapper.setData({
      selectedDay: new Date(2026, 2, 8).getTime(),
      selectedTime: { hour: 2, minute: 30, period: 'AM' },
      timeWasChosen: true,
    });
    expect(wrapper.find('[data-test="schedule-refresh-time-error"]').text()).toBe('REDESIGN.MISSING_TIME');
  });

  it('disables submission for a time skipped by the daylight saving change', async () => {
    jest.setSystemTime(new Date(2026, 2, 1, 12, 0));
    const wrapper = mountPicker({ isOpen: true });
    await wrapper.setData({
      selectedDay: new Date(2026, 2, 8).getTime(),
      selectedTime: { hour: 2, minute: 30, period: 'AM' },
      timeWasChosen: true,
    });
    expect(wrapper.find('[data-test="btn-submit-schedule-refresh"]').attributes('disabled')).toBeDefined();
  });

  it('keeps the future-time explanation for an ordinary past time', async () => {
    const wrapper = mountPicker();
    await wrapper.setData({
      selectedDay: new Date(2026, 9, 18).getTime(),
      selectedTime: { hour: 10, minute: 0, period: 'AM' },
      timeWasChosen: true,
    });
    expect(wrapper.find('[data-test="schedule-refresh-time-error"]').text()).toBe('REDESIGN.FUTURE_TIME');
  });

  describe('calendar keyboard navigation', () => {
    it('makes the calendar a single Tab stop', () => {
      const wrapper = mountPicker();
      expect(wrapper.findAll('.schedule-calendar__grid button[tabindex="0"]')).toHaveLength(1);
    });

    it('puts the calendar Tab stop on the selected day', () => {
      const wrapper = mountPicker();
      expect(wrapper.find('.schedule-calendar__grid button[tabindex="0"]').text()).toBe('18');
    });

    it('puts the calendar Tab stop on the first available day in a later month', async () => {
      const wrapper = mountPicker();
      await wrapper.findAll('.schedule-calendar__navigation button')[1].trigger('click');
      expect(wrapper.find('.schedule-calendar__grid button[tabindex="0"]').text()).toBe('1');
    });

    it('moves focus to the next day with the right arrow', async () => {
      const wrapper = mountPicker();
      await pressKey(findDay(wrapper, 18), 'ArrowRight');
      expect(document.activeElement).toBe(findDay(wrapper, 19).element);
    });

    it('moves focus to the previous day with the left arrow', async () => {
      const wrapper = mountPicker();
      await wrapper.setData({ focusedDay: new Date(2026, 9, 20).getTime() });
      await pressKey(findDay(wrapper, 20), 'ArrowLeft');
      expect(document.activeElement).toBe(findDay(wrapper, 19).element);
    });

    it('moves focus to the next week with the down arrow', async () => {
      const wrapper = mountPicker();
      await pressKey(findDay(wrapper, 18), 'ArrowDown');
      expect(document.activeElement).toBe(findDay(wrapper, 25).element);
    });

    it('moves focus to the previous week with the up arrow', async () => {
      const wrapper = mountPicker();
      await wrapper.setData({ focusedDay: new Date(2026, 9, 27).getTime() });
      await pressKey(findDay(wrapper, 27), 'ArrowUp');
      expect(document.activeElement).toBe(findDay(wrapper, 20).element);
    });

    it('moves focus to the end of the week with End', async () => {
      const wrapper = mountPicker();
      await pressKey(findDay(wrapper, 18), 'End');
      expect(document.activeElement).toBe(findDay(wrapper, 24).element);
    });

    it('moves focus to the start of the week with Home', async () => {
      const wrapper = mountPicker();
      await wrapper.setData({ focusedDay: new Date(2026, 9, 21).getTime() });
      await pressKey(findDay(wrapper, 21), 'Home');
      expect(document.activeElement).toBe(findDay(wrapper, 18).element);
    });

    it('moves the Tab stop with focus', async () => {
      const wrapper = mountPicker();
      await pressKey(findDay(wrapper, 18), 'ArrowRight');
      expect(wrapper.find('.schedule-calendar__grid button[tabindex="0"]').text()).toBe('19');
    });

    it('does not select a day with arrow keys', async () => {
      const wrapper = mountPicker();
      await pressKey(findDay(wrapper, 18), 'ArrowRight');
      expect(wrapper.vm.selectedDay).toBe(new Date(2026, 9, 18).getTime());
    });

    it('selects the focused day when it is activated', async () => {
      const wrapper = mountPicker();
      await pressKey(findDay(wrapper, 18), 'ArrowRight');
      // Enter and Space activate the native button, which jsdom models as a click.
      await wrapper.find('.schedule-calendar__grid button[tabindex="0"]').trigger('click');
      expect(wrapper.vm.selectedDay).toBe(new Date(2026, 9, 19).getTime());
    });

    it('shows the next month when the right arrow leaves the last day', async () => {
      const wrapper = mountPicker();
      await wrapper.setData({ focusedDay: new Date(2026, 9, 31).getTime() });
      await pressKey(findDay(wrapper, 31), 'ArrowRight');
      expect(wrapper.vm.month).toEqual(new Date(2026, 10, 1));
    });

    it('focuses the first day of the next month after crossing it', async () => {
      const wrapper = mountPicker();
      await wrapper.setData({ focusedDay: new Date(2026, 9, 31).getTime() });
      await pressKey(findDay(wrapper, 31), 'ArrowRight');
      expect(document.activeElement).toBe(findDay(wrapper, 1).element);
    });

    it('shows the previous month when the up arrow leaves the first week', async () => {
      const wrapper = mountPicker();
      await wrapper.setData({ focusedDay: new Date(2026, 10, 3).getTime(), month: new Date(2026, 10, 1) });
      await pressKey(findDay(wrapper, 3), 'ArrowUp');
      expect(wrapper.vm.month).toEqual(new Date(2026, 9, 1));
    });

    it('keeps focus on today instead of moving to a past day', async () => {
      const wrapper = mountPicker();
      await pressKey(findDay(wrapper, 18), 'ArrowLeft');
      expect(document.activeElement).toBe(findDay(wrapper, 18).element);
    });

    it('stops at today when the up arrow would reach a past day', async () => {
      const wrapper = mountPicker();
      await wrapper.setData({ focusedDay: new Date(2026, 9, 20).getTime() });
      await pressKey(findDay(wrapper, 20), 'ArrowUp');
      expect(document.activeElement).toBe(findDay(wrapper, 18).element);
    });

    it('leaves other keys to the browser', async () => {
      const wrapper = mountPicker();
      await pressKey(findDay(wrapper, 18), 'Tab');
      expect(wrapper.vm.focusedDay).toBeNull();
    });
  });

  describe('time keyboard navigation', () => {
    it('makes each time list a single Tab stop', () => {
      const wrapper = mountPicker();
      expect(wrapper.findAll('[role="listbox"]').map((list) => list.findAll('[tabindex="0"]').length)).toEqual([1, 1, 1]);
    });

    it('puts the hour Tab stop on the selected hour', () => {
      const wrapper = mountPicker();
      expect(wrapper.findAll('[role="listbox"]')[0].find('[tabindex="0"]').text()).toBe('04');
    });

    it('moves hour focus down with the down arrow', async () => {
      const wrapper = mountPicker();
      await pressKey(findOption(wrapper, 0, '04'), 'ArrowDown');
      expect(document.activeElement).toBe(findOption(wrapper, 0, '05').element);
    });

    it('moves hour focus up with the up arrow', async () => {
      const wrapper = mountPicker();
      await pressKey(findOption(wrapper, 0, '04'), 'ArrowUp');
      expect(document.activeElement).toBe(findOption(wrapper, 0, '03').element);
    });

    it('does not change the hour with arrow keys', async () => {
      const wrapper = mountPicker();
      await pressKey(findOption(wrapper, 0, '04'), 'ArrowDown');
      expect(wrapper.vm.selectedTime.hour).toBe(4);
    });

    it('moves minute focus to the last minute with End', async () => {
      const wrapper = mountPicker();
      await pressKey(findOption(wrapper, 1, '05'), 'End');
      expect(document.activeElement).toBe(findOption(wrapper, 1, '55').element);
    });

    it('moves minute focus to the first minute with Home', async () => {
      const wrapper = mountPicker();
      await pressKey(findOption(wrapper, 1, '05'), 'Home');
      expect(document.activeElement).toBe(findOption(wrapper, 1, '00').element);
    });

    it('keeps focus on the last hour at the end of the list', async () => {
      const wrapper = mountPicker();
      await wrapper.setData({ focusedTime: { hour: 12 } });
      await pressKey(findOption(wrapper, 0, '12'), 'ArrowDown');
      expect(document.activeElement).toBe(findOption(wrapper, 0, '12').element);
    });

    it('moves period focus with the up arrow', async () => {
      const wrapper = mountPicker();
      await pressKey(findOption(wrapper, 2, 'REDESIGN.PERIOD_PM'), 'ArrowUp');
      expect(document.activeElement).toBe(findOption(wrapper, 2, 'REDESIGN.PERIOD_AM').element);
    });

    it('selects the focused hour when it is activated', async () => {
      const wrapper = mountPicker();
      await pressKey(findOption(wrapper, 0, '04'), 'ArrowDown');
      // Enter and Space activate the native button, which jsdom models as a click.
      await wrapper.findAll('[role="listbox"]')[0].find('[tabindex="0"]').trigger('click');
      expect(wrapper.vm.selectedTime.hour).toBe(5);
    });

    it('marks the selected hour for assistive technology', () => {
      const wrapper = mountPicker();
      expect(findOption(wrapper, 0, '04').attributes('aria-selected')).toBe('true');
    });
  });
});
