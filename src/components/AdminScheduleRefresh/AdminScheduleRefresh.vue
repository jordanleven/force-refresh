<template>
  <BaseModal
    class="schedule-refresh-modal"
    :header="$t('SCHEDULE_REFRESH.HEADER')"
    max-width="720px"
    :polished="true"
    :show-default-footer="false"
    :show-divider="false"
    :is-open="isOpen"
    v-bind="$attrs"
    @modal-was-closed="$emit('modal-was-closed')"
  >
    <template #header>
      <h2 class="schedule-sheet__title">
        {{ $t('SCHEDULE_REFRESH.HEADER') }}
      </h2>
      <p class="schedule-sheet__description">
        {{ $t('SCHEDULE_REFRESH.DESCRIPTION') }}
      </p>
    </template>
    <div class="schedule-sheet" data-test="schedule-refresh-modal-content">
      <div v-if="scheduleDateTime" class="schedule-sheet__selection" aria-live="polite">
        <Icon name="clock-outline" :size="15" /><span>{{ scheduledTimeFormatted }}</span>
        <button type="button" @click="clearDate">
          {{ $t('REDESIGN.CLEAR_DATE') }}
        </button>
      </div>
      <div class="schedule-sheet__picker">
        <section class="schedule-calendar" :aria-label="$t('SCHEDULE_REFRESH.DATE_TIME_LABEL')">
          <div class="schedule-calendar__navigation">
            <button type="button" :disabled="isCurrentMonth" :aria-label="$t('REDESIGN.PREVIOUS_MONTH')" @click="changeMonth(-1)">
              <Icon name="chevron-left" :size="12" />
            </button>
            <span aria-live="polite">{{ monthLabel }}</span>
            <button type="button" :aria-label="$t('REDESIGN.NEXT_MONTH')" @click="changeMonth(1)">
              <Icon name="chevron-right" :size="12" />
            </button>
          </div>
          <div ref="calendar" class="schedule-calendar__grid" role="grid" :aria-label="monthLabel" @keydown="moveDayFocus">
            <div class="schedule-calendar__week" role="row">
              <span
                v-for="(day, index) in weekDays"
                :key="`weekday-${index}`"
                class="schedule-calendar__weekday"
                role="columnheader"
                :aria-label="day.long"
              >{{ day.short }}</span>
            </div>
            <div v-for="(week, weekIndex) in calendarWeeks" :key="`week-${weekIndex}`" class="schedule-calendar__week" role="row">
              <div v-for="(date, index) in week" :key="index" role="gridcell">
                <button
                  v-if="date"
                  type="button"
                  :aria-label="date.toLocaleDateString(undefined, { dateStyle: 'full' })"
                  :aria-pressed="selectedDay === date.getTime()"
                  :disabled="isPastDate(date)"
                  :tabindex="focusableDay === date.getTime() ? 0 : -1"
                  :class="{ 'schedule-calendar__today': isToday(date) }"
                  @click="chooseDay(date)"
                >
                  {{ date.getDate() }}<span v-if="isToday(date) && selectedDay !== date.getTime()" class="schedule-calendar__today-dot" />
                </button>
              </div>
            </div>
          </div>
        </section>
        <div class="schedule-time">
          <div v-for="column in timeColumns" :key="column.key" class="schedule-time__column">
            <span class="schedule-time__label">{{ column.label }}</span>
            <div
              ref="timeOptions"
              class="schedule-time__options"
              role="listbox"
              :aria-label="column.label"
              @keydown="moveTimeFocus($event, column.key, column.values)"
            >
              <button
                v-for="value in column.values"
                :key="value"
                type="button"
                role="option"
                :aria-selected="selectedTime[column.key] === value"
                :tabindex="focusableTime(column.key) === value ? 0 : -1"
                @click="chooseTime(column.key, value)"
              >
                {{ String(value).padStart(2, '0') }}
              </button>
            </div>
          </div>
          <div
            class="schedule-time__period"
            role="listbox"
            :aria-label="$t('REDESIGN.PERIOD')"
            @keydown="moveTimeFocus($event, 'period', periods)"
          >
            <button
              v-for="period in periods"
              :key="period"
              type="button"
              role="option"
              :aria-selected="selectedTime.period === period"
              :tabindex="focusableTime('period') === period ? 0 : -1"
              @click="chooseTime('period', period)"
            >
              {{ $t(`REDESIGN.PERIOD_${period}`) }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <p class="schedule-sheet__timezone">
        {{ $t('REDESIGN.SCHEDULE_TIMEZONE', { timezone }) }}
      </p>
      <p v-if="showTimeError || hasPastSelection" role="alert" class="schedule-sheet__error" data-test="schedule-refresh-time-error">
        {{ isMissingTime ? $t('REDESIGN.MISSING_TIME') : $t('REDESIGN.FUTURE_TIME') }}
      </p>
      <p v-if="errorMessage" role="alert" class="schedule-sheet__error" data-test="schedule-refresh-error">
        {{ errorMessage }}
      </p>
      <div class="schedule-sheet__footer">
        <button type="button" class="button" @click="$emit('modal-was-closed')">
          {{ $t('REDESIGN.CANCEL') }}
        </button>
        <button
          type="button"
          class="button button-primary"
          data-test="btn-submit-schedule-refresh"
          :disabled="buttonDisabled || isSubmitting"
          :aria-busy="isSubmitting ? 'true' : undefined"
          @click="scheduleRefresh"
        >
          <Icon name="clock-outline" :size="13" />
          {{ $t('SCHEDULE_REFRESH.SUBMIT_BUTTON') }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script>
import BaseModal from '@/components/BaseModal/BaseModal.vue';
import Icon from '@/components/Icon/Icon.vue';
import { filterAvailableDates, filterAvailableTimes, formatScheduledTime } from './AdminScheduleRefreshUtils.js';

// Re-check the selected time this often so it can't silently expire while the dialog is open.
const CLOCK_TICK_MS = 15000;

const PERIODS = ['AM', 'PM'];

// Arrow keys move through the calendar by day or week; Home and End go to the ends of the week.
const DAY_FOCUS_OFFSETS = {
  ArrowDown: () => 7, ArrowLeft: () => -1, ArrowRight: () => 1, ArrowUp: () => -7, End: (date) => 6 - date.getDay(), Home: (date) => -date.getDay(),
};

const getStartOfDay = (time) => {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const getNextAvailableDate = () => new Date(Math.ceil((Date.now() + 60000) / 300000) * 300000);

const getNextAvailableTime = (nextTime = getNextAvailableDate()) => ({
  hour: nextTime.getHours() % 12 || 12, minute: nextTime.getMinutes(), period: nextTime.getHours() >= 12 ? 'PM' : 'AM',
});

const getInitialScheduleState = () => {
  const nextTime = getNextAvailableDate();
  return {
    // The calendar and each time list keep a single Tab stop that follows arrow-key focus.
    focusedDay: null,
    focusedTime: {},
    month: new Date(nextTime.getFullYear(), nextTime.getMonth(), 1),
    now: Date.now(),
    selectedDay: new Date(nextTime.getFullYear(), nextTime.getMonth(), nextTime.getDate()).getTime(),
    selectedTime: getNextAvailableTime(nextTime),
    showTimeError: false,
    timeWasChosen: false,
    timezone: Intl.DateTimeFormat(undefined, { timeZoneName: 'longGeneric' })
      .formatToParts(nextTime).find((part) => part.type === 'timeZoneName').value,
  };
};

export default {
  name: 'AdminScheduleRefresh',
  components: { BaseModal, Icon },
  inheritAttrs: false,
  props: {
    errorMessage: { type: String, default: null },
    isOpen: { type: Boolean, default: true },
    isSubmitting: { type: Boolean, default: false },
  },
  emits: ['modal-was-closed', 'schedule-refresh'],
  data() {
    return getInitialScheduleState();
  },
  computed: {
    buttonDisabled() { return !this.scheduleDateTime || filterAvailableTimes(this.scheduleDateTime, new Date(this.now)); },
    calendarDays() {
      const { month } = this;
      return [
        ...Array(month.getDay()).fill(null),
        ...Array.from(
          { length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() },
          (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
        ),
      ];
    },
    calendarWeeks() {
      const { calendarDays } = this;
      return Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, index) => {
        const week = calendarDays.slice(index * 7, index * 7 + 7);
        return [...week, ...Array(7 - week.length).fill(null)];
      });
    },
    // The last focused day, else the selected day, else today, else the first available day in the shown month.
    focusableDay() {
      const availableDays = this.calendarDays.filter((date) => date && !this.isPastDate(date)).map((date) => date.getTime());
      return [this.focusedDay, this.selectedDay, getStartOfDay(this.now)].find((day) => availableDays.includes(day))
        ?? availableDays[0] ?? null;
    },
    // A chosen day whose time has passed (or doesn't exist across a DST change) needs an explanation,
    // not just a disabled button.
    hasPastSelection() {
      return this.selectedDay !== null && (!this.scheduleDateTime || filterAvailableTimes(this.scheduleDateTime, new Date(this.now)));
    },
    isCurrentMonth() {
      const now = new Date(this.now);
      return this.month.getFullYear() === now.getFullYear() && this.month.getMonth() === now.getMonth();
    },
    // A clock time skipped by a daylight-saving change can't be scheduled on that day.
    isMissingTime() { return this.selectedDay !== null && !this.scheduleDateTime; },
    monthLabel() { return this.month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); },
    periods() { return PERIODS; },
    scheduleDateTime() {
      if (this.selectedDay === null) return null;
      const date = new Date(this.selectedDay);
      const hour = (this.selectedTime.hour % 12) + (this.selectedTime.period === 'PM' ? 12 : 0);
      date.setHours(hour, this.selectedTime.minute, 0, 0);
      // A missing clock time during a daylight-saving transition is not schedulable.
      return date.getHours() === hour ? date : null;
    },
    scheduledTimeFormatted() { return formatScheduledTime(this.scheduleDateTime); },
    timeColumns() {
      return [
        { key: 'hour', label: this.$t('REDESIGN.HOUR'), values: Array.from({ length: 12 }, (_, index) => index + 1) },
        { key: 'minute', label: this.$t('REDESIGN.MINUTE'), values: Array.from({ length: 12 }, (_, index) => index * 5) },
      ];
    },
    weekDays() {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(2026, 0, 4 + index);
        return {
          long: date.toLocaleDateString(undefined, { weekday: 'long' }),
          short: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
        };
      });
    },
  },
  watch: {
    isOpen(open) {
      if (!open) {
        this.stopClock();
        return;
      }
      // The modal stays mounted so it can animate; start each visit from a fresh default time.
      Object.assign(this.$data, getInitialScheduleState());
      this.centerSelectedTimes();
      this.startClock();
    },
    selectedDay() {
      this.showTimeError = false;
      this.tickClock();
    },
    selectedTime: { deep: true, handler() { this.showTimeError = false; } },
  },
  mounted() {
    this.centerSelectedTimes();
    if (this.isOpen) this.startClock();
  },
  beforeUnmount() {
    this.stopClock();
  },
  methods: {
    // An untouched default time moves forward as the clock passes it; a time the user chose is kept.
    advanceDefaultTime() {
      if (this.timeWasChosen || !this.hasPastSelection) return;
      const nextTime = getNextAvailableDate();
      this.selectedDay = new Date(nextTime.getFullYear(), nextTime.getMonth(), nextTime.getDate()).getTime();
      this.month = new Date(nextTime.getFullYear(), nextTime.getMonth(), 1);
      this.selectedTime = getNextAvailableTime(nextTime);
      this.centerSelectedTimes();
    },
    centerSelectedTimes() {
      this.$nextTick(() => {
        this.$refs.timeOptions.forEach((column) => {
          const selected = column.querySelector('[aria-selected="true"]');
          const options = column;
          options.scrollTop = selected.offsetTop - (column.clientHeight - selected.offsetHeight) / 2;
        });
      });
    },
    changeMonth(offset) {
      if (offset < 0 && this.isCurrentMonth) return;
      this.month = new Date(this.month.getFullYear(), this.month.getMonth() + offset, 1);
    },
    chooseDay(date) {
      this.selectedDay = date.getTime();
      this.focusedDay = date.getTime();
    },
    chooseTime(key, value) {
      this.selectedTime[key] = value;
      this.focusedTime[key] = value;
      this.timeWasChosen = true;
    },
    clearDate() {
      // Return focus to the cleared day, or to the calendar's Tab stop once that day has passed.
      this.focusedDay = this.selectedDay;
      this.selectedDay = null;
      this.$nextTick(() => this.$refs.calendar.querySelector('[tabindex="0"]')?.focus());
    },
    focusableTime(key) { return this.focusedTime[key] ?? this.selectedTime[key]; },
    // Both read the ticking clock so the calendar moves on to a new day while the dialog is open.
    isPastDate(date) { return filterAvailableDates(date, new Date(this.now)); },
    isToday(date) { return date.toDateString() === new Date(this.now).toDateString(); },
    // Arrow keys move focus without selecting; Enter and Space choose the focused day as a click would.
    moveDayFocus(event) {
      const getOffset = DAY_FOCUS_OFFSETS[event.key];
      if (!getOffset || this.focusableDay === null) return;
      event.preventDefault();
      const current = new Date(this.focusableDay);
      const offsetDay = new Date(current.getFullYear(), current.getMonth(), current.getDate() + getOffset(current));
      // Past days can't be chosen, so moving into them stops at today.
      const target = this.isPastDate(offsetDay) ? new Date(getStartOfDay(this.now)) : offsetDay;
      this.focusedDay = target.getTime();
      this.month = new Date(target.getFullYear(), target.getMonth(), 1);
      this.$nextTick(() => this.$refs.calendar.querySelector('[tabindex="0"]')?.focus());
    },
    moveTimeFocus(event, key, values) {
      const index = values.indexOf(this.focusableTime(key));
      const targets = {
        ArrowDown: index + 1, ArrowUp: index - 1, End: values.length - 1, Home: 0,
      };
      if (!(event.key in targets)) return;
      event.preventDefault();
      const list = event.currentTarget;
      this.focusedTime[key] = values[Math.min(Math.max(targets[event.key], 0), values.length - 1)];
      this.$nextTick(() => list.querySelector('[tabindex="0"]')?.focus());
    },
    scheduleRefresh() {
      this.tickClock();
      if (this.buttonDisabled) { this.showTimeError = true; return; }
      this.$emit('schedule-refresh', this.scheduleDateTime);
    },
    startClock() {
      this.stopClock();
      this.clockIntervalId = window.setInterval(this.tickClock, CLOCK_TICK_MS);
    },
    stopClock() {
      window.clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    },
    tickClock() {
      this.now = Date.now();
      this.advanceDefaultTime();
    },
  },
};
</script>

<style lang="scss" scoped>
:global(.schedule-refresh-modal .modal--polished) {
  font-size: 13.5px;

}

.schedule-sheet__title {
  margin: 0;
  line-height: 1.45;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.4px;

}

.schedule-sheet__description {
  color: #6e6e73;
  margin: 3px 0 0;
  font-size: 13px;

}

.schedule-sheet {
  padding-top: 20px;
}

.schedule-sheet__picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;

}

.schedule-calendar__navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.2px;

}

.schedule-calendar__navigation button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 0;
  width: 28px;
  height: 28px;
  background: rgb(120, 120, 128, 10%);
  color: #6e6e73;
  font-size: 20px;
  cursor: pointer;

}

.schedule-calendar__grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;

}

.schedule-calendar__week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;

}

.schedule-calendar__grid button {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font: inherit;
  font-size: 13px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  color: #1d1d1f;

}

.schedule-calendar__grid button:disabled, .schedule-calendar__navigation button:disabled {
  color: #aeaeb2;
  cursor: default;

}

.schedule-calendar__weekday {
  color: #6e6e73;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 0 8px;
  letter-spacing: 0.04em;

}

.schedule-calendar__grid .schedule-calendar__today {
  color: #0071e3;
  font-weight: 600;

}

.schedule-calendar__today-dot {
  position: absolute;
  bottom: 3px;
  left: 50%;
  margin-left: -1.5px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #0071e3;

}

.schedule-time {
  display: flex;
  gap: 12px;
  align-items: stretch;
  min-width: 0;

}

.schedule-time__column, .schedule-time__period {
  flex: 1;
  min-width: 0;
  background: rgb(255, 255, 255, 50%);
  border: 1px solid rgb(255, 255, 255, 80%);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgb(0, 0, 0, 6%), inset 0 1px 0 rgb(255, 255, 255, 90%);
  overflow: hidden;

}

.schedule-time__label {
  display: block;
  text-align: center;
  padding: 10px 0 6px;
  border-bottom: 1px solid rgb(0, 0, 0, 5%);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6e6e73;

}

.schedule-time__options {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 236px;
  overflow-y: auto;
  padding: 6px;
  scrollbar-width: thin;

}

.schedule-time button {
  display: block;
  width: 100%;
  padding: 9px 0;
  font: inherit;
  font-size: 15px;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: #6e6e73;
  cursor: pointer;

}

.schedule-time__period {
  flex: 0 0 64px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;

}

.schedule-time__period button {
  flex: 1;
  min-height: 44px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  color: #6e6e73;

}

.schedule-calendar__grid button[aria-pressed="true"], .schedule-time button[aria-selected="true"] {
  background: #0071e3;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgb(0, 113, 227, 35%);

}

.schedule-sheet__selection {
  background: rgb(0, 113, 227, 7%);
  border: 1px solid rgb(0, 113, 227, 12%);
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #004ca3;
  font-size: 13.5px;
  font-weight: 500;

}

.schedule-sheet__selection > span {
  flex: 1;

}

.schedule-sheet__selection button {
  background: none;
  border: 0;
  color: #3a6fb0;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  padding: 4px;

}

.schedule-sheet__timezone {
  margin: 12px 0 0;
  font-size: 12px;
  color: #6e6e73;

}

.schedule-sheet__error {
  margin: 12px 0 0;
  color: #d63638;

}

.schedule-sheet__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  padding-bottom: env(safe-area-inset-bottom);

}

.schedule-sheet__footer .button {
  box-sizing: border-box;
  min-height: 34px;
  text-transform: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 16px;
  font: inherit;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1;
  border-radius: 980px;
  cursor: pointer;
  background: rgb(255, 255, 255, 60%);
  color: #1d1d1f;
  border: 1px solid rgb(0, 0, 0, 8%);
  box-shadow: 0 2px 8px rgb(0, 0, 0, 8%), inset 0 1px 0 rgb(255, 255, 255, 90%);

}

.schedule-sheet__footer .button-primary {
  background: #0071e3;
  border: 0;
  color: white;
  box-shadow: 0 2px 8px rgb(0, 113, 227, 35%), inset 0 1px 0 rgb(255, 255, 255, 20%);

}

/* WordPress applies !important gray colors to disabled primary buttons. */
.schedule-sheet__footer .button-primary:disabled {
  background: #0071e3 !important;
  color: white !important;
  border-color: #0071e3 !important;
  box-shadow: 0 2px 8px rgb(0, 113, 227, 35%), inset 0 1px 0 rgb(255, 255, 255, 20%) !important;
  text-shadow: none !important;
}

.schedule-sheet__footer .button:disabled {
  opacity: 0.45;
  cursor: default;

}

@media (width <= 540px) {
  .schedule-sheet__picker {
  grid-template-columns: 1fr;

}

  .schedule-time__options {
  max-height: 180px;

}

}
</style>
