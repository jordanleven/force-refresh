<template>
  <BaseModal
    :header="$t('SCHEDULE_REFRESH.HEADER')"
    v-bind="$attrs"
  >
    <div class="admin-scheduled-refresh__inner">
      <div>
        <p>{{ $t("SCHEDULE_REFRESH.DESCRIPTION") }}</p>
      </div>
      <div class="admin-scheduled-refresh__date-picker">
        <label for="schedule-datetime-picker" class="admin-scheduled-refresh__label">
          {{ $t('SCHEDULE_REFRESH.DATE_TIME_LABEL') }}
        </label>
        <DatePicker
          :input-attr="{ id: 'schedule-datetime-picker' }"
          v-model:value="scheduleDateTime"
          type="datetime"
          :use12h="true"
          :show-second="false"
          :disabled-date="filterAvailableDates"
          :disabled-time="filterAvailableTimes"
        />
      </div>
      <div>
        <button
          class="button button-primary button-schedule-refresh"
          data-test="btn-submit-schedule-refresh"
          :disabled="buttonDisabled"
          @click="scheduleRefresh"
        >
          {{ scheduleButtonTest }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script>
import DatePicker from 'vue-datepicker-next';
import BaseModal from '@/components/BaseModal/BaseModal.vue';
import { filterAvailableDates, filterAvailableTimes, formatScheduledTime } from './AdminScheduleRefreshUtils.js';

export default {
  name: 'AdminScheduleRefresh',
  components: {
    BaseModal,
    DatePicker,
  },
  inheritAttrs: false,
  emits: ['schedule-refresh'],
  data() {
    return {
      scheduleDateTime: null,
    };
  },
  computed: {
    buttonDisabled() {
      return !this.scheduleDateTime;
    },
    scheduleButtonTest() {
      return this.scheduleDateTime
        ? this.$t('SCHEDULE_REFRESH.SUBMIT_BUTTON_WITH_DATE', { scheduledDate: this.scheduledTimeFormatted })
        : this.$t('SCHEDULE_REFRESH.SUBMIT_BUTTON');
    },
    scheduledTimeFormatted() {
      return formatScheduledTime(this.scheduleDateTime);
    },
  },
  methods: {
    filterAvailableDates,
    filterAvailableTimes,
    scheduleRefresh() {
      this.$emit('schedule-refresh', this.scheduleDateTime);
    },
  },
};
</script>

<style lang="scss">
  @use "@/scss/variables" as var;
  @use "@/scss/utilities" as utils;
  @use 'vue-datepicker-next/scss/index';

  .admin-scheduled-refresh__inner {
    text-align: center;

    > div {
      width: 100%;
    }
  }

  .admin-scheduled-refresh__date-picker {
    margin-top: var.$space-large;
  }

  .admin-scheduled-refresh__label {
    display: block;
    margin-bottom: var.$space-small;
    font-weight: 600;
    color: var.$dark-grey;
    font-size: 0.9rem;
  }

  .button-primary.button-schedule-refresh {
    margin-top: var.$space-medium;
    font-size: 1rem;
  }
</style>
