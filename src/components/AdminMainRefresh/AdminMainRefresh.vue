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
        @click="scheduleRefreshButtonClicked"
      >
        {{ $t('FORM_BUTTONS_GENERIC.FORCE_REFRESH_SITE_SCHEDULE') }}
      </button>
    </div>
    <div v-if="scheduledRefreshes.length > 0" class="scheduled-refreshes">
      <hr>
      <h3>{{ $t("SCHEDULE_REFRESH.HEADER_SCHEDULED_REFRESHES") }}</h3>
      <ul class="scheduled-refreshes__list">
        <li v-for="schedule in scheduledRefreshesWithLabel" :key="schedule.id">
          {{ schedule.label }}
          <button
            class="button-link button-link-delete"
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
    'schedule-refresh-requested',
  ],
  data() {
    return {
      refreshLogo: faSyncAlt,
      refreshTriggered: false,
    };
  },
  computed: {
    forceRefreshDirections() {
      const { siteName } = this;
      return siteName
        ? this.$t('ADMIN_REFRESH_MAIN.REFRESH_DIRECTIONS', { siteName })
        : this.$t('ADMIN_REFRESH_MAIN.REFRESH_DIRECTIONS_NO_SITE_NAME');
    },
    refreshLogoClass() {
      return {
        'admin__refresh-logo--active': this.refreshTriggered,
      };
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
          const timestampDate = new Date(0);
          timestampDate.setUTCSeconds(timestamp);

          const date = timestampDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });

          const time = timestampDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

          return {
            id: refreshId,
            label: `${date} at ${time}`,
          };
        });

      return sortedRefreshes;
    },
  },
  methods: {
    animateLogo() {
      this.refreshTriggered = true;
      setTimeout(() => {
        this.refreshTriggered = false;
      }, 2000);
    },
    deleteButtonWasClicked(uuid) {
      this.$emit('delete-scheduled-refresh', uuid);
    },
    emitEventButtonClicked() {
      this.$emit('refresh-requested');
    },
    refreshButtonClicked() {
      this.animateLogo();
      this.emitEventButtonClicked();
    },
    scheduleRefreshButtonClicked() {
      this.$emit('schedule-refresh-requested');
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
