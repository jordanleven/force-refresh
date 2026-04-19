<template>
  <div class="wrap">
    <div class="header-row">
      <h1 class="header">
        {{ $t("PLUGIN_NAME_FORCE_REFRESH") }}
      </h1>
      <transition-group name="header-row-badge" tag="div" class="header-row__badges">
        <AdminHeaderBadge
          v-if="isDebugActive"
          key="debug"
          variant="debug"
          :icon="faBug"
          :label="$t('ADMIN_REFRESH_MAIN.PLUGIN_BADGE_DEBUG_MODE')"
          :tooltip="$t('ADMIN_REFRESH_MAIN.PLUGIN_BADGE_DEBUG_MODE_TOOLTIP')"
        />
        <AdminHeaderBadge
          v-if="isVersionOutdated"
          key="update"
          variant="update"
          :icon="faArrowCircleUp"
          :label="$t('ADMIN_REFRESH_MAIN.PLUGIN_BADGE_OUTDATED', { latestVersion: troubleshootingInformation.versions.forceRefresh.required })"
          href="/wp-admin/plugins.php"
        />
        <AdminHeaderBadge
          v-if="isVersionPreRelease"
          key="prerelease"
          variant="prerelease"
          :icon="faTriangleExclamation"
          :label="$t('ADMIN_REFRESH_MAIN.PLUGIN_BADGE_PRE_RELEASE')"
          :tooltip="$t(
            'ADMIN_REFRESH_MAIN.PLUGIN_BADGE_PRE_RELEASE_TOOLTIP',
            { installedVersion: troubleshootingInformation.versions.forceRefresh.version }
          )"
        />
      </transition-group>
    </div>
    <div class="admin-section__notifications">
      <AdminNotification
        v-if="isAdminNotificationSet"
        :message="notificationMessage.message"
        :type="notificationMessage.type"
        @notification-closed="notificationMessageClear"
      />
    </div>
    <div class="admin-section">
      <transition :name="pageTransitionName">
        <AdminTroubleshooting
          v-if="troubleshootingActive"
          class="admin-section__troubleshooting"
          :is-debug-active="isDebugActive"
          :troubleshooting-info="troubleshootingInformation"
          @exit-troubleshooting="exitTroubleshooting"
          @debug-mode-was-updated="updateDebugMode"
        />
      </transition>
      <transition :name="pageTransitionName">
        <AdminMain
          v-if="!troubleshootingActive"
          class="admin-section__main"
          :is-scheduled-refresh-enabled="isScheduledRefreshEnabled"
          :refresh-options="refreshOptions"
          :scheduled-refreshes="scheduledRefreshes"
          :site-name="siteName"
          @refresh-requested="refreshSite"
          @schedule-refresh-requested="scheduleRefresh"
          @scheduled-refreshes-sync-requested="syncScheduledRefreshes"
          @delete-scheduled-refresh="deleteScheduledRefresh"
          @options-were-updated="updateOptions"
          @notify-user-of-error="notifyUserOfError"
          @release-notes-page-clicked="activateReleaseNotesPage"
          @troubleshooting-page-clicked="activateTroubleshootingPage"
        />
      </transition>
      <div class="admin-window" :class="classAdminReleaseNotes">
        <transition name="fade-and-move">
          <div
            v-if="!troubleshootingActive && releaseNotesPageActive"
            class="admin-window__inner"
          >
            <AdminReleaseNotes
              :release-notes="releaseNotes"
              @modal-was-closed="exitAdminWindow"
            />
          </div>
        </transition>
      </div>
      <div class="admin-window" :class="classAdminScheduleRefresh">
        <transition name="fade-and-move">
          <div
            v-if="isScheduledRefreshEnabled && !troubleshootingActive && scheduleRefreshPageActive"
            class="admin-window__inner"
          >
            <AdminScheduleRefresh
              @modal-was-closed="exitAdminWindow"
              @schedule-refresh="refreshWasScheduled"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faArrowCircleUp, faBug, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import { mapActions, mapGetters } from 'vuex';
import AdminHeaderBadge from '@/components/AdminHeaderBadge/AdminHeaderBadge.vue';
import AdminMain from '@/components/AdminMain/AdminMain.vue';
import AdminNotification from '@/components/AdminNotification/AdminNotification.vue';
import AdminReleaseNotes from '@/components/AdminReleaseNotes/AdminReleaseNotes.vue';
import AdminScheduleRefresh from '@/components/AdminScheduleRefresh/AdminScheduleRefresh.vue';
import AdminTroubleshooting from '@/components/AdminTroubleshooting/AdminTroubleshooting.vue';
import { versionSatisfies, getSanitizedVersion, isDevelopmentVersion } from '@/js/admin/compare-versions.js';
import { getRefreshIntervalUnitAndValue } from '@/js/utilities/getRefreshIntervalUnitAndValue.js';

library.add([faArrowCircleUp, faBug, faTriangleExclamation]);

const isTroubleshootingViewActiveOnLoad = () => (
  typeof window !== 'undefined' && window.location.hash === '#troubleshooting'
);

export default {
  name: 'LayoutAdminMain',
  components: {
    AdminHeaderBadge,
    AdminMain,
    AdminNotification,
    AdminReleaseNotes,
    AdminScheduleRefresh,
    AdminTroubleshooting,
  },
  props: {
    releaseNotes: VueTypes.object,
  },
  data() {
    return {
      faArrowCircleUp,
      faBug,
      faTriangleExclamation,
      notificationMessage: {},
      pageTransitionName: 'page-enter',
      releaseNotesPageActive: false,
      scheduleRefreshPageActive: false,
      troubleshootingPageIsActive: isTroubleshootingViewActiveOnLoad(),
    };
  },
  computed: {
    classAdminReleaseNotes() {
      return [
        this.releaseNotesPageActive && 'admin-window--active',
      ];
    },
    classAdminScheduleRefresh() {
      return [
        this.scheduleRefreshPageActive && 'admin-window--active',
      ];
    },
    headerClass() {
      return [
        this.troubleshootingPageIsActive && 'header--troubleshooting-active',
      ];
    },
    isAdminNotificationSet() {
      return !!this.notificationMessage?.message;
    },
    isScheduledRefreshEnabled() {
      return this.isFeatureEnabled('scheduledRefresh');
    },
    isVersionOutdated() {
      const { required, version } = this.troubleshootingInformation.versions.forceRefresh;
      if (!required) return false;
      return !versionSatisfies(required, getSanitizedVersion(version));
    },
    isVersionPreRelease() {
      const { version } = this.troubleshootingInformation.versions.forceRefresh;
      return isDevelopmentVersion(version);
    },
    troubleshootingActive() {
      return this.troubleshootingPageIsActive;
    },
    ...mapGetters([
      'isDebugActive',
      'isFeatureEnabled',
      'refreshFromAdminBar',
      'refreshInterval',
      'refreshOptions',
      'scheduledRefreshes',
      'siteName',
      'troubleshootingInformation',
      'wordPressNonce',
    ]),
  },
  mounted() {
    this.checkForOptionsUpdated();
  },
  methods: {
    activateReleaseNotesPage() {
      this.releaseNotesPageActive = true;
    },
    activateTroubleshootingPage() {
      this.pageTransitionName = 'page-enter';
      this.troubleshootingPageIsActive = true;
      this.updateViewHash('troubleshooting');
    },
    checkForOptionsUpdated() {
      if (window.location.href.indexOf('optionsUpdated') > -1) {
        this.notificationMessageSet(this.$t('ADMIN_NOTIFICATIONS.SITE_SETTINGS_UPDATED_SUCCESS'));
      }
    },
    async deleteScheduledRefresh(timestamp) {
      const success = await this.requestDeleteScheduledRefresh(timestamp);
      if (success) {
        this.notificationMessageSetSuccess(this.$t('ADMIN_NOTIFICATIONS.SCHEDULED_REFRESH_DELETE_SUCCESS'));
      } else {
        this.notificationMessageSetError(this.$t('ADMIN_NOTIFICATIONS.SCHEDULED_REFRESH_DELETE_FAILURE'));
      }
    },
    exitAdminWindow() {
      this.releaseNotesPageActive = false;
      this.scheduleRefreshPageActive = false;
    },
    exitTroubleshooting() {
      this.pageTransitionName = 'page-exit';
      this.troubleshootingPageIsActive = false;
      this.updateViewHash(null);
    },
    notificationMessageClear() {
      this.notificationMessage = null;
    },
    notificationMessageSet(message, type) {
      this.notificationMessage = {
        message,
        type,
      };
    },
    notificationMessageSetError(message) {
      this.notificationMessageSet(message, 'error');
    },
    notificationMessageSetSuccess(message) {
      this.notificationMessageSet(message, 'success');
    },
    notifyUserOfError(message) {
      this.notificationMessageSetError(message);
    },
    async refreshSite() {
      const success = await this.requestRefreshSite();

      if (success) {
        const [refreshIntervalValue, refreshIntervalUnit] = getRefreshIntervalUnitAndValue(this.refreshInterval);
        this.notificationMessageSetSuccess(this.$t('ADMIN_NOTIFICATIONS.SITE_REFRESHED_SUCCESS', {
          refreshIntervalUnit,
          refreshIntervalValue,
        }));
      } else {
        this.notificationMessageSetError(this.$t('ADMIN_NOTIFICATIONS.SITE_REFRESHED_FAILURE'));
      }
    },
    async refreshWasScheduled(scheduledRefresh) {
      const success = await this.requestScheduledRefresh(scheduledRefresh);
      this.scheduleRefreshPageActive = false;
      if (success) {
        await this.requestScheduledRefreshes();
        this.notificationMessageSetSuccess(this.$t('ADMIN_NOTIFICATIONS.SCHEDULED_REFRESH_SUCCESS'));
      } else {
        this.notificationMessageSetError(this.$t('ADMIN_NOTIFICATIONS.SCHEDULED_REFRESH_FAILURE'));
      }
    },
    scheduleRefresh() {
      this.scheduleRefreshPageActive = true;
    },
    async syncScheduledRefreshes() {
      await this.requestScheduledRefreshes();
    },
    async updateDebugMode(newValue) {
      const success = await this.updateForceRefreshDebugMode(newValue);

      if (success) {
        this.notificationMessage = '';
      } else {
        this.notificationMessageSetError(this.$t('ADMIN_NOTIFICATIONS.SITE_DEBUG_MODE_FAILURE'));
      }
    },
    async updateOptions(updatedOptions) {
      const previousRefreshFromAdminBar = this.refreshFromAdminBar;
      const success = await this.updateForceRefreshSettings(updatedOptions);

      if (success) {
        // If we've updated the menu bar option, we need to manually reload the page in order
        // to have the menu item rerendered server side
        if (updatedOptions.showRefreshInMenuBar !== previousRefreshFromAdminBar) {
          window.location.search += '&optionsUpdated';
          return;
        }
        this.notificationMessageSetSuccess(this.$t('ADMIN_NOTIFICATIONS.SITE_SETTINGS_UPDATED_SUCCESS'));
      } else {
        this.notificationMessageSetError(this.$t('ADMIN_NOTIFICATIONS.SITE_SETTINGS_UPDATED_FAILURE'));
      }
    },
    updateViewHash(view) {
      const url = new URL(window.location.href);

      if (view) {
        url.hash = view;
      } else {
        url.hash = '';
      }

      window.history.replaceState({}, '', url);
    },
    ...mapActions([
      'requestDeleteScheduledRefresh',
      'requestRefreshSite',
      'requestScheduledRefresh',
      'requestScheduledRefreshes',
      'updateForceRefreshSettings',
      'updateForceRefreshDebugMode',
    ]),
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as var;
@use "@/scss/utilities" as utils;

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-row__badges {
  display: flex;
  align-items: center;
  gap: var.$space-small;
}

.header-row-badge-enter-active,
.header-row-badge-leave-active,
.header-row-badge-move {
  transition:
    opacity var.$transition-medium ease,
    transform var.$transition-medium ease;
}

.header-row-badge-enter-from,
.header-row-badge-leave-to {
  opacity: 0;
  transform: translateY(-0.75rem);
}

.header {
  display: inline;
  user-select: none;
}

.admin-section__notifications {
  margin-top: 1rem;
}

.admin-section {
  position: relative;
  padding-top: var.$space-medium;
}

.admin-section__main,
.admin-section__troubleshooting {
  width: 100%;
}

.admin-section__main {
  z-index: 1;
}

.admin-section__troubleshooting {
  z-index: 2;
}

@keyframes fade-and-move {
  0% {
    opacity: 0;
    transform: translateY(100px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-window {
  &.admin-window--active {
    transition: backdrop-filter var.$transition-medium, background-color var.$transition-medium;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: rgba(var.$black, 0.4);
    backdrop-filter: blur(0.125rem);
    z-index: 9999;
  }

  .admin-window__inner {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.fade-and-move-enter-active {
  animation-fill-mode: both;
  position: absolute;
  animation-name: fade-and-move;
  animation-delay: var.$transition-medium;
  animation-duration: var.$transition-medium;
}

.page-enter-enter-active,
.page-enter-leave-active,
.page-exit-enter-active,
.page-exit-leave-active {
  position: absolute;
  width: 100%;
  transition:
    opacity var.$transition-medium cubic-bezier(0.32, 0.72, 0, 1),
    transform var.$transition-medium cubic-bezier(0.32, 0.72, 0, 1);
}

// Entering troubleshooting — both pages move upward
.page-enter-enter-from {
  opacity: 0;
  transform: translateY(1rem);
}

.page-enter-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
}

// Exiting troubleshooting — both pages move downward
.page-exit-enter-from {
  opacity: 0;
  transform: translateY(-1rem);
}

.page-exit-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
