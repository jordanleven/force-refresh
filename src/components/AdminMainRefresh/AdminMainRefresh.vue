<template>
  <div class="admin__container">
    <div class="refresh-hero">
      <div class="refresh-hero__icon" @animationiteration="refreshLogoTurnCompleted" @animationend="refreshLogoTurnCompleted">
        <svg
          :class="refreshLogoClass"
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </div>
      <div class="refresh-hero__heading" role="status" aria-live="polite">
        <div v-if="justRefreshed" class="refresh-hero__success">
          <span class="refresh-hero__check" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="10"
              height="10"
              fill="none"
              stroke="#fff"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {{ $t('REDESIGN.REFRESH_REQUESTED') }}
        </div>
        <h2 v-else>
          {{ forceRefreshDirections }}
        </h2>
      </div>
      <p class="refresh-hero__description" data-test="refresh-hero-description">
        {{ heroDescription }}
      </p>
      <div class="admin__refresh-buttons">
        <button
          type="submit"
          class="button button-primary admin__refresh-button"
          data-test="btn-force-refresh"
          :disabled="isRefreshing"
          :aria-busy="isRefreshing"
          @click="refreshButtonClicked"
        >
          <Icon v-if="isRefreshing" name="spinner" class="admin__refresh-logo--active" :size="13" />
          {{ isRefreshing ? $t('REDESIGN.REFRESHING') : $t('FORM_BUTTONS_GENERIC.FORCE_REFRESH_SITE_NOW') }}
        </button>
        <button
          v-if="isScheduledRefreshEnabled"
          type="submit"
          class="button admin__refresh-button"
          data-test="btn-schedule-refresh"
          @click="scheduleRefreshButtonClicked"
        >
          <Icon name="clock-outline" :size="13" />
          {{ $t('FORM_BUTTONS_GENERIC.FORCE_REFRESH_SITE_SCHEDULE') }}
        </button>
      </div>
      <p v-if="lastRefreshAt" class="refresh-hero__status">
        {{ refreshStatus }}
      </p>
    </div>
    <AdminScheduledRefreshList
      :scheduled-refreshes="scheduledRefreshes"
      @delete-scheduled-refresh="$emit('delete-scheduled-refresh', $event)"
      @scheduled-refreshes-sync-requested="$emit('scheduled-refreshes-sync-requested')"
    />
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import AdminScheduledRefreshList from '../AdminScheduledRefreshList/AdminScheduledRefreshList.vue';
import Icon from '@/components/Icon/Icon.vue';
import { getRefreshIntervalUnitAndValue } from '@/js/utilities/getRefreshIntervalUnitAndValue.js';

export default {
  name: 'AdminMainRefresh',
  components: { AdminScheduledRefreshList, Icon },
  props: {
    isRefreshing: VueTypes.bool.def(false),
    isScheduledRefreshEnabled: VueTypes.bool.def(false),
    lastRefreshAt: VueTypes.object.def(null),
    refreshInterval: VueTypes.number,
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
    return { isLogoSpinning: false, justRefreshed: false, successTimeoutId: null };
  },
  computed: {
    forceRefreshDirections() {
      const { siteName } = this;
      return siteName
        ? this.$t('ADMIN_REFRESH_MAIN.REFRESH_DIRECTIONS', { siteName })
        : this.$t('ADMIN_REFRESH_MAIN.REFRESH_DIRECTIONS_NO_SITE_NAME');
    },
    heroDescription() {
      if (this.isRefreshing) return this.$t('REDESIGN.SENDING_REFRESH');
      if (this.justRefreshed && this.refreshInterval) {
        const [refreshIntervalValue, refreshIntervalUnit] = getRefreshIntervalUnitAndValue(this.refreshInterval);
        return this.$t('REDESIGN.REFRESH_SENT_DESCRIPTION', { refreshIntervalUnit, refreshIntervalValue });
      }
      return this.$t('REDESIGN.REFRESH_DESCRIPTION');
    },
    refreshLogoClass() {
      return {
        'admin__refresh-logo--active': this.isLogoSpinning,
      };
    },
    refreshStatus() {
      if (!this.lastRefreshAt) return '';
      const time = this.lastRefreshAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return this.$t('REDESIGN.LAST_REFRESH', { time });
    },
  },
  watch: {
    isRefreshing(refreshing) {
      // Requests often finish in a few milliseconds; keep spinning until the current turn completes.
      if (refreshing) this.isLogoSpinning = true;
    },
    lastRefreshAt(value, previous) {
      if (!value || value === previous) return;
      window.clearTimeout(this.successTimeoutId);
      this.justRefreshed = true;
      this.successTimeoutId = window.setTimeout(() => {
        this.justRefreshed = false;
      }, 3200);
    },
  },
  beforeUnmount() {
    window.clearTimeout(this.successTimeoutId);
  },
  methods: {
    emitEventButtonClicked() {
      this.$emit('refresh-requested');
    },
    refreshButtonClicked() {
      if (this.isRefreshing) return;
      this.emitEventButtonClicked();
    },
    refreshLogoTurnCompleted() {
      if (!this.isRefreshing) this.isLogoSpinning = false;
    },
    scheduleRefreshButtonClicked() {
      this.$emit('schedule-refresh-requested');
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;

.admin__container {
  box-sizing: border-box;
  width: 100%;

  @include utils.card-surface-raised;
}

.refresh-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 52px 40px 44px;
}

.refresh-hero__icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(160deg, rgb(0, 113, 227, 13%), rgb(0, 113, 227, 5%));
  border: 1px solid rgb(0, 113, 227, 13%);
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgb(0, 113, 227, 10%), inset 0 1px 0 rgb(255, 255, 255, 80%);
  color: #0071e3;
}

.refresh-hero h2 {
  margin: 0 0 6px;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.3px;
  text-align: center;
}

.refresh-hero__success {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: #248a3d;
}

.refresh-hero__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #34c759;
}

.refresh-hero__description {
  margin: 0 0 24px;
  font-size: 13.5px;
  color: #6e6e73;
  text-align: center;
  line-height: 1.55;
  max-width: 360px;
}

.admin__refresh-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.admin__refresh-buttons .button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  min-height: 36px;
  padding: 0 14px;
  font: inherit;
  font-size: 14px;
  border-radius: 3px;
  cursor: pointer;
  background: #f6f7f7;
  border: 1px solid #2271b1;
  color: #2271b1;
  box-shadow: 0 1px 0 rgb(0, 0, 0, 6%);
  white-space: nowrap;
}

.admin__refresh-buttons .button-primary {
  background: #2271b1;
  color: #fff;
  box-shadow: 0 1px 0 rgb(0, 0, 0, 10%);
}

.refresh-hero__status {
  font-size: 12px;
  color: #6e6e73;
  margin: 10px 0 0;
  letter-spacing: 0.01em;
}

.admin__refresh-logo--active {
  animation: refresh-turn 0.9s linear infinite;
}

@keyframes refresh-turn {
  to {
    transform: rotate(360deg);
  }
}

@media (width <= 600px) {
  .refresh-hero {
    padding: 36px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin__refresh-logo--active {
    animation: none;
  }
}
</style>
