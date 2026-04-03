<template>
  <div class="admin__container">
    <font-awesome-icon
      class="admin__refresh-logo"
      :class="refreshLogoClass"
      :icon="refreshLogo"
    />
    <p>{{ forceRefreshDirections }}</p>
    <div class="admin__refresh-buttons">
      <button
        type="submit"
        class="button button-primary admin__refresh-button"
        data-test="btn-force-refresh"
        @click="refreshButtonClicked"
      >
        {{ $t('FORM_BUTTONS_GENERIC.FORCE_REFRESH_SITE_NOW') }}
      </button>
      <button
        v-if="isScheduledRefreshEnabled"
        type="submit"
        class="button admin__refresh-button"
        data-test="btn-schedule-refresh"
        @click="scheduleRefreshButtonClicked"
      >
        {{ $t('FORM_BUTTONS_GENERIC.FORCE_REFRESH_SITE_SCHEDULE') }}
      </button>
    </div>
    <div v-if="scheduledRefreshes.length > 0" class="scheduled-refreshes">
      <hr>
      <h3>{{ scheduledRefreshesHeader }}</h3>
      <ul class="scheduled-refreshes__list">
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
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import {
  formatScheduledRefreshBaseLabel,
  getScheduledRefreshCountdownLabel,
  getSecondsUntilScheduledRefresh,
  isScheduledRefreshImminent,
} from './AdminMainRefreshUtils.js';

library.add([faSyncAlt]);

export default {
  name: 'AdminMainRefresh',
  props: {
    isScheduledRefreshEnabled: VueTypes.bool.def(false),
    scheduledRefreshes: VueTypes.array,
    siteName: VueTypes.string.isRequired,
  },
  emits: [
    'delete-scheduled-refresh',
    'refresh-requested',
    'scheduled-refreshes-sync-requested',
    'schedule-refresh-requested',
  ],
  data() {
    return {
      countdownIntervalId: null,
      countdownTimeoutId: null,
      currentTimestamp: Math.floor(Date.now() / 1000),
      refreshLogo: faSyncAlt,
      refreshTriggered: false,
      scheduledRefreshSyncIntervalId: null,
    };
  },
  computed: {
    forceRefreshDirections() {
      const { siteName } = this;
      return siteName
        ? this.$t('ADMIN_REFRESH_MAIN.REFRESH_DIRECTIONS', { siteName })
        : this.$t('ADMIN_REFRESH_MAIN.REFRESH_DIRECTIONS_NO_SITE_NAME');
    },
    hasImminentScheduledRefresh() {
      return this.scheduledRefreshes?.some(({ timestamp }) => (
        isScheduledRefreshImminent(timestamp, this.currentTimestamp)
      )) ?? false;
    },
    refreshLogoClass() {
      return {
        'admin__refresh-logo--active': this.refreshTriggered,
      };
    },
    scheduledRefreshesHeader() {
      return this.scheduledRefreshes.length > 1
        ? this.$t('SCHEDULE_REFRESH.HEADER_SCHEDULED_REFRESHES_PLURAL')
        : this.$t('SCHEDULE_REFRESH.HEADER_SCHEDULED_REFRESHES');
    },
    scheduledRefreshesWithLabel() {
      if (!this.scheduledRefreshes || !this.scheduledRefreshes.length) {
        return [];
      }

      const sortedRefreshes = this.scheduledRefreshes
        .slice()
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({ timestamp, id }) => {
          const refreshId = id || `${timestamp}`;

          return {
            countdownLabel: getScheduledRefreshCountdownLabel(timestamp, this.currentTimestamp),
            deleteDisabled: isScheduledRefreshImminent(timestamp, this.currentTimestamp),
            id: refreshId,
            label: formatScheduledRefreshBaseLabel(timestamp),
          };
        });

      return sortedRefreshes;
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
    animateLogo() {
      this.refreshTriggered = true;
      setTimeout(() => {
        this.refreshTriggered = false;
      }, 2000);
    },
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
    emitEventButtonClicked() {
      this.$emit('refresh-requested');
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
    refreshButtonClicked() {
      this.animateLogo();
      this.emitEventButtonClicked();
    },
    scheduleRefreshButtonClicked() {
      this.$emit('schedule-refresh-requested');
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

      if (secondsUntilNextRefresh < 60) {
        this.startCountdownInterval();
        return;
      }

      const millisecondsUntilCountdownStarts = (secondsUntilNextRefresh - 59) * 1000;
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
      }, 5000);
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

<style lang="scss">
@use "@/scss/utilities" as utils;

@include utils.generate-animation("force-refresh--active") {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(180deg);
  }
}

</style>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

.admin__container {
  width: 100%;
  padding: 20px 0 30px;
  text-align: center;
  border: 2px solid var.$light_grey;
  border-radius: 10px;
  background-color: white;
}

.scheduled-refreshes {
  text-align: left;

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

.admin__refresh-logo {
  font-size: 40px;
  width: 40px;
  height: 40px;
  margin: 0;

  &.admin__refresh-logo--active {
    @include utils.animation("force-refresh--active", 1000ms, ease);
  }
}

.admin__refresh-buttons {
  position: relative;
  display: flex;
  justify-content: center;
}

.admin__refresh-button {
  font-size: 1rem;
  margin: 0.5rem;
  position: relative;
  cursor: pointer;
}
</style>
