<template>
  <BaseModal
    :header="$t('SCHEDULE_REFRESH.HEADER')"
    v-on="$listeners"
  >
    <div class="admin-scheduled-refresh__inner">
      <div>
        <p>{{ $t("SCHEDULE_REFRESH.DESCRIPTION") }}</p>
      </div>
      <div class="admin-scheduled-refresh__date-picker">
        <DatePicker
          v-model="scheduleDateTime"
          type="datetime"
          :use12h="true"
          :show-second="false"
          :disabled-date="filterAvailableDates"
          :disabled-time="filterAvailableTimes"
        />
      </div>
      <div>
        <button class="button button-primary button-schedule-refresh" :disabled="buttonDisabled" @click="scheduleRefresh">
          {{ scheduleButtonTest }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script>
import DatePicker from 'vue2-datepicker';
import BaseModal from '@/components/BaseModal/BaseModal.vue';

export default {
  name: 'AdminScheduleRefresh',
  components: {
    BaseModal,
    DatePicker,
  },
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
      const scheduledDateTime = new Date(this.scheduleDateTime);
      const date = scheduledDateTime.toLocaleDateString('en-us', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const time = scheduledDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${date} at ${time}`;
    },
  },
  methods: {
    filterAvailableDates(date) {
      const currentDate = new Date().setHours(0, 0, 0, 0);
      const optionDate = new Date(date);
      return currentDate > optionDate;
    },
    filterAvailableTimes(date) {
      const currentDate = new Date();
      const optionDate = new Date(date);
      return currentDate > optionDate;
    },
    scheduleRefresh() {
      this.$emit('schedule-refresh', this.scheduleDateTime);
    },
  },
};
</script>

<style lang="scss">
  @use "@/scss/variables" as var;
  @use "@/scss/utilities" as utils;
  @use 'vue2-datepicker/scss/index';

  .admin-scheduled-refresh__inner {
    text-align: center;

    > div {
      width: 100%;
    }
  }

  .admin-scheduled-refresh__date-picker {
    margin-top: var.$space-large;
  }

  .button-primary.button-schedule-refresh {
    margin-top: var.$space-medium;
    font-size: 1rem;
  }
</style>
