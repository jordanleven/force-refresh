<template>
  <div class="wrap force-refresh-redesign">
    <div class="header-row">
      <h1 class="header">
        {{ $t("PLUGIN_NAME_FORCE_REFRESH") }}
      </h1>
      <transition-group name="header-row-badge" tag="div" class="header-row__badges">
        <AdminHeaderBadge
          v-if="isDebugActive"
          key="debug"
          variant="debug"
          icon="bug"
          :label="$t('ADMIN_REFRESH_MAIN.PLUGIN_BADGE_DEBUG_MODE')"
          :tooltip="$t('ADMIN_REFRESH_MAIN.PLUGIN_BADGE_DEBUG_MODE_TOOLTIP')"
        />
        <AdminHeaderBadge
          v-if="isVersionOutdated"
          key="update"
          variant="update"
          icon="arrow-up"
          :label="$t('ADMIN_REFRESH_MAIN.PLUGIN_BADGE_OUTDATED', { latestVersion: troubleshootingInformation.versions.forceRefresh.required })"
          href="/wp-admin/plugins.php"
        />
        <AdminHeaderBadge
          v-if="isVersionPreRelease"
          key="prerelease"
          variant="prerelease"
          icon="flask"
          :label="$t('ADMIN_REFRESH_MAIN.PLUGIN_BADGE_PRE_RELEASE')"
          :tooltip="$t(
            'ADMIN_REFRESH_MAIN.PLUGIN_BADGE_PRE_RELEASE_TOOLTIP',
            { installedVersion: troubleshootingInformation.versions.forceRefresh.version }
          )"
        />
      </transition-group>
    </div>
    <div v-if="isAdminNotificationSet" class="admin-section__notifications">
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
          :detected-cdn="detectedCdn"
          :has-whats-new="latestWhatsNewFeatures.length > 0"
          :is-scheduled-refresh-enabled="isScheduledRefreshEnabled"
          :refresh-options="refreshOptions"
          :scheduled-refreshes="scheduledRefreshes"
          :site-name="siteName"
          :last-refresh-at="lastRefreshAt"
          :refresh-interval="refreshInterval"
          :initial-tab="mainActiveTab"
          :is-refreshing="isRefreshing"
          @tab-changed="mainTabWasChanged"
          @refresh-requested="refreshSite"
          @schedule-refresh-requested="scheduleRefresh"
          @scheduled-refreshes-sync-requested="syncScheduledRefreshes"
          @delete-scheduled-refresh="deleteScheduledRefresh"
          @options-were-updated="updateOptions"
          @notify-user-of-error="notifyUserOfError"
          @release-notes-page-clicked="activateReleaseHistoryPage"
          @troubleshooting-page-clicked="activateTroubleshootingPage"
          @whats-new-page-clicked="activateWhatsNewPage"
        />
      </transition>
      <AdminReleaseNotes
        v-if="!troubleshootingActive"
        :is-open="releaseNotesPageActive"
        :release-notes="releaseNotes"
        :history-only="releaseHistoryActive"
        :whats-new-features="whatsNewReopened ? latestWhatsNewFeatures : whatsNewFeatures"
        @modal-was-closed="exitAdminWindow"
        @view-release-history="activateReleaseHistoryPage"
      />
      <AdminScheduleRefresh
        v-if="isScheduledRefreshEnabled && !troubleshootingActive"
        :is-open="scheduleRefreshPageActive"
        :is-submitting="scheduleRefreshSubmitting"
        :error-message="scheduleRefreshError"
        @modal-was-closed="exitAdminWindow"
        @schedule-refresh="refreshWasScheduled"
      />
    </div>
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import { mapActions, mapGetters } from 'vuex';
import AdminHeaderBadge from '@/components/AdminHeaderBadge/AdminHeaderBadge.vue';
import AdminMain from '@/components/AdminMain/AdminMain.vue';
import AdminNotification from '@/components/AdminNotification/AdminNotification.vue';
import AdminReleaseNotes from '@/components/AdminReleaseNotes/AdminReleaseNotes.vue';
import {
  getLatestWhatsNewFeatures,
  getWhatsNewFeatures,
  shouldAnnounceWhatsNew,
} from '@/components/AdminReleaseNotes/AdminReleaseNotesConfig.js';
import AdminScheduleRefresh from '@/components/AdminScheduleRefresh/AdminScheduleRefresh.vue';
import AdminTroubleshooting from '@/components/AdminTroubleshooting/AdminTroubleshooting.vue';
import { versionSatisfies, getSanitizedVersion, isDevelopmentVersion } from '@/js/admin/compare-versions.js';

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
      isRefreshing: false,
      lastRefreshAt: null,
      mainActiveTab: ['#settings', '#troubleshooting'].includes(window.location.hash) ? 'settings' : 'refresh',
      notificationMessage: {},
      pageTransitionName: null,
      releaseHistoryActive: false,
      releaseNotesPageActive: false,
      scheduleRefreshError: null,
      scheduleRefreshPageActive: false,
      scheduleRefreshSubmitting: false,
      troubleshootingPageIsActive: isTroubleshootingViewActiveOnLoad(),
      whatsNewPreviewActive: process.env.NODE_ENV === 'development'
        && new URLSearchParams(window.location.search).get('force-refresh-whats-new') === '1',
      whatsNewReopened: false,
    };
  },
  computed: {
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
    latestWhatsNewFeatures() {
      const { version } = this.troubleshootingInformation.versions.forceRefresh;
      return getLatestWhatsNewFeatures(this.releaseNotes, version);
    },
    troubleshootingActive() {
      return this.troubleshootingPageIsActive;
    },
    whatsNewFeatures() {
      const { version } = this.troubleshootingInformation.versions.forceRefresh;
      return getWhatsNewFeatures(this.releaseNotes, version, this.whatsNewPreviewActive ? null : this.whatsNewLastSeenVersion);
    },
    ...mapGetters([
      'detectedCdn',
      'isDebugActive',
      'isFeatureEnabled',
      'refreshFromAdminBar',
      'refreshInterval',
      'refreshOptions',
      'scheduledRefreshes',
      'siteName',
      'troubleshootingInformation',
      'whatsNewLastSeenVersion',
      'wordPressNonce',
    ]),
  },
  mounted() {
    this.checkForOptionsUpdated();
    this.maybeAnnounceWhatsNew();
  },
  methods: {
    activateReleaseHistoryPage() {
      this.releaseHistoryActive = true;
      this.releaseNotesPageActive = true;
    },
    activateTroubleshootingPage() {
      this.mainActiveTab = 'settings';
      this.pageTransitionName = 'page-enter';
      this.troubleshootingPageIsActive = true;
      this.updateViewHash('troubleshooting');
    },
    // Reopening leaves the seen state alone, so it never changes when the announcement appears.
    activateWhatsNewPage() {
      this.whatsNewReopened = true;
      this.releaseHistoryActive = false;
      this.releaseNotesPageActive = true;
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
      // Leave releaseHistoryActive alone so the content doesn't swap during the close animation.
      this.releaseNotesPageActive = false;
      this.scheduleRefreshPageActive = false;
    },
    exitTroubleshooting() {
      this.pageTransitionName = 'page-exit';
      this.troubleshootingPageIsActive = false;
      this.updateViewHash('settings');
    },

    mainTabWasChanged(tab) {
      this.mainActiveTab = tab;
      this.updateViewHash(tab === 'settings' ? 'settings' : null);
    },
    maybeAnnounceWhatsNew() {
      if (this.troubleshootingActive) return;
      const { version } = this.troubleshootingInformation.versions.forceRefresh;
      if (!this.whatsNewPreviewActive && !shouldAnnounceWhatsNew(version, this.whatsNewLastSeenVersion)) return;
      // Without release notes there's nothing to show, so leave it unseen and try again next visit.
      if (!this.releaseNotes) return;
      if (this.whatsNewFeatures.length) {
        this.releaseHistoryActive = false;
        this.releaseNotesPageActive = true;
      }
      // Opening counts as seeing it, so it only appears once; a release without new features is marked quietly.
      if (!this.whatsNewPreviewActive) this.requestMarkWhatsNewSeen();
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
      if (this.isRefreshing) return;
      this.isRefreshing = true;
      try {
        const success = await this.requestRefreshSite();
        if (success) {
          // The refresh card confirms success inline, so only failures use the page notice.
          this.notificationMessageClear();
          this.lastRefreshAt = new Date();
        } else {
          this.notificationMessageSetError(this.$t('ADMIN_NOTIFICATIONS.SITE_REFRESHED_FAILURE'));
        }
      } catch {
        this.notificationMessageSetError(this.$t('ADMIN_NOTIFICATIONS.SITE_REFRESHED_FAILURE'));
      } finally {
        this.isRefreshing = false;
      }
    },
    async refreshWasScheduled(scheduledRefresh) {
      if (this.scheduleRefreshSubmitting) return;
      this.scheduleRefreshSubmitting = true;
      this.scheduleRefreshError = null;
      try {
        const success = await this.requestScheduledRefresh(scheduledRefresh);
        if (success) {
          this.scheduleRefreshPageActive = false;
          await this.requestScheduledRefreshes();
          this.notificationMessageSetSuccess(this.$t('ADMIN_NOTIFICATIONS.SCHEDULED_REFRESH_SUCCESS'));
        } else {
          // The modal stays open, so the error must render inside it rather than behind the backdrop.
          this.scheduleRefreshError = this.$t('ADMIN_NOTIFICATIONS.SCHEDULED_REFRESH_FAILURE');
        }
      } catch {
        this.scheduleRefreshError = this.$t('ADMIN_NOTIFICATIONS.SCHEDULED_REFRESH_FAILURE');
      } finally {
        this.scheduleRefreshSubmitting = false;
      }
    },

    scheduleRefresh() {
      this.scheduleRefreshError = null;
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
        this.mainTabWasChanged('settings');
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
      'requestMarkWhatsNewSeen',
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
  margin-bottom: 22px;
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
  margin: 0 0 16px;

  // The notice slides in from the side; clip it so narrow screens don't scroll horizontally.
  overflow-x: clip;
}

.admin-section {
  position: relative;
  padding-top: 0;
}

.admin-section__main,
.admin-section__troubleshooting {
  width: 100%;
}

.admin-section__main {
  z-index: var.$z-index-base;
}

.admin-section__troubleshooting {
  z-index: var.$z-index-sticky;
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

.page-enter-enter-from {
  opacity: 0;
  transform: translateY(1rem);
}

.page-enter-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
}

.page-exit-enter-from {
  opacity: 0;
  transform: translateY(-1rem);
}

.page-exit-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

.force-refresh-redesign.wrap {
  box-sizing: border-box;
  width: 100%;

  // Shared by the main and Troubleshooting views so switching between them doesn't shift the layout.
  max-width: 1256px;
  margin: 0 auto;
  padding: 28px 28px 80px;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  font-size: 13.5px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}

.force-refresh-redesign .header {
  margin: 0;
  padding: 0;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.4px;
}

@media (width <= 600px) {
  .force-refresh-redesign.wrap { padding: 20px 16px 48px; }
}
</style>

<style lang="scss">
body[class~="tools_page_force_refresh"] #wpcontent { padding-left: 0; }

// Modals teleport to <body>, so they need the same rules as the plugin root.
body[class~="tools_page_force_refresh"] :is(.force-refresh-redesign, .modal-window)
  :is(a, button, select, summary, input):focus-visible {
  outline: 2px solid #0071e3;
  outline-offset: 2px;
}

@media (width <= 600px) {
  body[class~="tools_page_force_refresh"] .force-refresh-redesign :is(
    .force-refresh-admin-options-footer .button,
    .force-refresh-admin__options-utility .button,
    .options-review,
    .admin-review a
  ) {
    height: auto;
    min-height: 44px;
  }

  body[class~="tools_page_force_refresh"] .modal-window .modal__close {
    width: 44px;
    height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  body[class~="tools_page_force_refresh"] .force-refresh-redesign :is(*, *::before, *::after) {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

body[class~="tools_page_force_refresh"] #wpbody-content {
  min-height: calc(100vh - 32px);
  padding-bottom: 0;
}
</style>
