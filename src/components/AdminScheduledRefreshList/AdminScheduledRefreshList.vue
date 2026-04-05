<template>
  <div v-if="scheduledRefreshes.length > 0" class="scheduled-refreshes">
    <hr>
    <h3>{{ scheduledRefreshesHeader }}</h3>
    <template v-if="shouldGroupScheduledRefreshes">
      <div
        v-for="group in groupedScheduledRefreshes"
        :key="group.dateKey"
        class="scheduled-refreshes__group"
      >
        <h4 class="scheduled-refreshes__group-header">
          {{ group.dateLabel }}
        </h4>
        <ul class="scheduled-refreshes__list">
          <li v-for="schedule in group.refreshes" :key="schedule.id">
            {{ schedule.timeLabel }}
            <span
              v-if="schedule.countdownLabel"
              class="scheduled-refreshes__countdown"
            >
              ({{ getCountdownLabel(schedule.countdownLabel) }})
            </span>
            <button
              class="button-link button-link-delete"
              data-test="btn-delete-scheduled-refresh"
              :disabled="schedule.deleteDisabled"
              @click="deleteButtonWasClicked(schedule.id)"
            >
              {{ $t("SCHEDULE_REFRESH.BUTTON_DELETE") }}
            </button>
          </li>
        </ul>
      </div>
    </template>
    <ul v-else class="scheduled-refreshes__list">
      <li v-for="schedule in scheduledRefreshesWithLabel" :key="schedule.id">
        {{ schedule.label }}
        <span
          v-if="schedule.countdownLabel"
          class="scheduled-refreshes__countdown"
        >
          ({{ getCountdownLabel(schedule.countdownLabel) }})
        </span>
        <button
          class="button-link button-link-delete"
          data-test="btn-delete-scheduled-refresh"
          :disabled="schedule.deleteDisabled"
          @click="deleteButtonWasClicked(schedule.id)"
        >
          {{ $t("SCHEDULE_REFRESH.BUTTON_DELETE") }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import {
  getGroupedScheduledRefreshes,
  getScheduledRefreshesWithLabel,
  shouldGroupScheduledRefreshes,
} from './AdminScheduledRefreshListUtils.js';
import { getSecondsUntilScheduledRefresh, isScheduledRefreshImminent } from '../AdminMainRefresh/AdminMainRefreshUtils.js';

const SCHEDULED_REFRESH_COUNTDOWN_START_IN_SECONDS = 59;
const SCHEDULED_REFRESH_SYNC_POLL_INTERVAL_IN_MILLISECONDS = 5000;

export default {
  name: 'AdminScheduledRefreshList',
  props: {
    scheduledRefreshes: VueTypes.array,
  },
  emits: [
    'delete-scheduled-refresh',
    'scheduled-refreshes-sync-requested',
  ],
  data() {
    return {
      countdownIntervalId: null,
      countdownTimeoutId: null,
      currentTimestamp: Math.floor(Date.now() / 1000),
      scheduledRefreshSyncIntervalId: null,
    };
  },
  computed: {
    groupedScheduledRefreshes() {
      return getGroupedScheduledRefreshes(this.scheduledRefreshes, this.currentTimestamp);
    },
    hasImminentScheduledRefresh() {
      return this.scheduledRefreshes?.some(({ timestamp }) => (
        isScheduledRefreshImminent(timestamp, this.currentTimestamp)
      )) ?? false;
    },
    scheduledRefreshesHeader() {
      return this.scheduledRefreshes.length > 1
        ? this.$t('SCHEDULE_REFRESH.HEADER_SCHEDULED_REFRESHES_PLURAL')
        : this.$t('SCHEDULE_REFRESH.HEADER_SCHEDULED_REFRESHES');
    },
    scheduledRefreshesWithLabel() {
      return getScheduledRefreshesWithLabel(this.scheduledRefreshes, this.currentTimestamp);
    },
    shouldGroupScheduledRefreshes() {
      return shouldGroupScheduledRefreshes(this.scheduledRefreshes);
    },
  },
  watch: {
    hasImminentScheduledRefresh(isImminentNow, wasImminent) {
      if (isImminentNow && !wasImminent) {
        this.startScheduledRefreshImminentPolling();
      }

      if (!isImminentNow && wasImminent) {
        this.stopScheduledRefreshImminentPolling();
      }
    },
    scheduledRefreshes: {
      deep: true,
      handler() {
        this.scheduleScheduledRefreshTimers();
      },
    },
  },
  mounted() {
    this.scheduleScheduledRefreshTimers();
  },
  beforeUnmount() {
    this.clearCountdownInterval();
    this.clearCountdownTimeout();
    this.stopScheduledRefreshImminentPolling();
  },
  methods: {
    clearCountdownInterval() {
      if (!this.countdownIntervalId) {
        return;
      }

      window.clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    },
    clearCountdownTimeout() {
      if (!this.countdownTimeoutId) {
        return;
      }

      window.clearTimeout(this.countdownTimeoutId);
      this.countdownTimeoutId = null;
    },
    deleteButtonWasClicked(uuid) {
      this.$emit('delete-scheduled-refresh', uuid);
    },
    getCountdownLabel(countdownLabel) {
      if (!countdownLabel) {
        return null;
      }

      if (countdownLabel.type === 'imminent') {
        return this.$t('SCHEDULE_REFRESH.SCHEDULED_REFRESH_TIMING_IMMINENT');
      }

      if (countdownLabel.secondsUntilRefresh === 1) {
        return this.$t('SCHEDULE_REFRESH.SCHEDULED_REFRESH_TIMING_SECOND', {
          count: countdownLabel.secondsUntilRefresh,
        });
      }

      return this.$t('SCHEDULE_REFRESH.SCHEDULED_REFRESH_TIMING_SECONDS', {
        count: countdownLabel.secondsUntilRefresh,
      });
    },
    scheduleScheduledRefreshTimers() {
      this.currentTimestamp = Math.floor(Date.now() / 1000);
      this.clearCountdownInterval();
      this.clearCountdownTimeout();

      if (!this.scheduledRefreshes?.length) {
        return;
      }

      const secondsUntilNextRefresh = Math.min(...this.scheduledRefreshes.map(({ timestamp }) => (
        getSecondsUntilScheduledRefresh(timestamp, this.currentTimestamp)
      )));

      if (secondsUntilNextRefresh <= SCHEDULED_REFRESH_COUNTDOWN_START_IN_SECONDS) {
        this.startCountdownInterval();
        return;
      }

      const millisecondsUntilCountdownStarts = (
        secondsUntilNextRefresh - SCHEDULED_REFRESH_COUNTDOWN_START_IN_SECONDS
      ) * 1000;
      this.countdownTimeoutId = window.setTimeout(() => {
        this.scheduleScheduledRefreshTimers();
      }, millisecondsUntilCountdownStarts);
    },
    startCountdownInterval() {
      if (this.countdownIntervalId) {
        return;
      }

      this.countdownIntervalId = window.setInterval(() => {
        this.currentTimestamp = Math.floor(Date.now() / 1000);
      }, 1000);
    },
    startScheduledRefreshImminentPolling() {
      if (this.scheduledRefreshSyncIntervalId) {
        return;
      }

      this.$emit('scheduled-refreshes-sync-requested');
      this.scheduledRefreshSyncIntervalId = window.setInterval(() => {
        this.$emit('scheduled-refreshes-sync-requested');
      }, SCHEDULED_REFRESH_SYNC_POLL_INTERVAL_IN_MILLISECONDS);
    },
    stopScheduledRefreshImminentPolling() {
      if (!this.scheduledRefreshSyncIntervalId) {
        return;
      }

      window.clearInterval(this.scheduledRefreshSyncIntervalId);
      this.scheduledRefreshSyncIntervalId = null;
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as var;

.scheduled-refreshes {
  text-align: left;

  .scheduled-refreshes__group + .scheduled-refreshes__group {
    margin-top: var.$space-medium;
  }

  .scheduled-refreshes__group-header {
    margin: 0 0 var.$space-small;
  }

  hr {
    margin: var.$space-large 0;
  }

  .scheduled-refreshes__list {
    list-style: disc;
    padding-left: var.$space-medium;
  }

  .button-link {
    margin-left: var.$space-small;

    &:disabled {
      color: var.$medium_grey;
      cursor: not-allowed;
    }
  }

  .scheduled-refreshes__countdown {
    color: var.$status-error;
  }
}
</style>
