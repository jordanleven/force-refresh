<template>
  <div class="wrap">
    <h1 class="header">
      {{ $t("PLUGIN_NAME_FORCE_REFRESH") }}
    </h1>
    <template v-if="getPluginWarningText">
      <p class="admin-section__warning">
        {{ getPluginWarningText }}
      </p>
    </template>
    <div class="admin-section__notifications">
      <AdminNotification
        v-if="isDebugActive"
        :message="$t('ADMIN_NOTIFICATIONS.DEBUG_MODE_ACTIVE')"
        :is-dismissible="false"
        type="warning"
        size="large"
      />
      <AdminNotification v-if="notificationMessage" :message="notificationMessage" @notification-closed="notificationWasClosed" />
    </div>
    <div class="admin-section">
      <transition name="fade-and-scale__troubleshooting">
        <AdminTroubleshooting
          v-if="troubleshootingActive"
          class="admin-section__troubleshooting"
          :is-debug-active="isDebugActive"
          :troubleshooting-info="troubleshootingInformation"
          @exit-troubleshooting="exitTroubleshooting"
          @debug-mode-was-updated="updateDebugMode"
        />
      </transition>
      <transition name="fade-and-scale__main">
        <AdminMain
          v-if="!troubleshootingActive"
          class="admin-section__main"
          :refresh-options="refreshOptions"
          :site-name="siteName"
          @refresh-requested="refreshSite"
          @options-were-updated="updateOptions"
          @troubleshooting-page-clicked="activateTroubleshootingPage"
        />
      </transition>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import AdminMain from '@/components/AdminMain/AdminMain.vue';
import AdminNotification from '@/components/AdminNotification/AdminNotification.vue';
import AdminTroubleshooting from '@/components/AdminTroubleshooting/AdminTroubleshooting.vue';
import { versionSatisfies, getSanitizedVersion, isDevelopmentVersion } from '@/js/admin/compare-versions.js';

export default {
  name: 'LayoutAdminMain',
  components: {
    AdminMain,
    AdminNotification,
    AdminTroubleshooting,
  },
  data() {
    return {
      notificationMessage: null,
      troubleshootingPageIsActive: false,
    };
  },
  computed: {
    getPluginWarningText() {
      const { required, version } = this.troubleshootingInformation.versions.forceRefresh;
      const versionSanitized = getSanitizedVersion(version);

      switch (true) {
        case !versionSatisfies(required, versionSanitized):
          return this.$t('ADMIN_REFRESH_MAIN.PLUGIN_WARNING_OUTDATED', {
            currentVersion: this.troubleshootingInformation.versions.forceRefresh.required,
            installedVersion: this.troubleshootingInformation.versions.forceRefresh.version,
          });
        case isDevelopmentVersion(version):
          return this.$t('ADMIN_REFRESH_MAIN.PLUGIN_WARNING_DEVELOPMENT_BUILD', {
            currentVersion: this.troubleshootingInformation.versions.forceRefresh.required,
            installedVersion: this.troubleshootingInformation.versions.forceRefresh.version,
          });
        default:
          return null;
      }
    },
    headerClass() {
      return [
        this.troubleshootingPageIsActive && 'header--troubleshooting-active',
      ];
    },
    refreshOptions() {
      return {
        refreshInterval: this.refreshInterval,
        showRefreshInMenuBar: this.refreshFromAdminBar,
      };
    },
    troubleshootingActive() {
      return this.troubleshootingPageIsActive;
    },
    ...mapGetters(['isDebugActive', 'refreshFromAdminBar', 'refreshInterval', 'siteName', 'troubleshootingInformation', 'wordPressNonce']),
  },
  mounted() {
    this.checkForOptionsUpdated();
  },
  methods: {
    activateTroubleshootingPage() {
      this.troubleshootingPageIsActive = true;
    },
    checkForOptionsUpdated() {
      if (window.location.href.indexOf('optionsUpdated') > -1) {
        this.notificationMessage = this.$t('ADMIN_NOTIFICATIONS.SITE_SETTINGS_UPDATED_SUCCESS');
      }
    },
    exitTroubleshooting() {
      this.troubleshootingPageIsActive = false;
    },
    notificationWasClosed() {
      this.notificationMessage = null;
    },
    async refreshSite() {
      const success = await this.requestRefreshSite();

      if (success) {
        this.notificationMessage = this.$t('ADMIN_NOTIFICATIONS.SITE_REFRESHED_SUCCESS', { refreshInterval: this.refreshInterval });
      } else {
        this.notificationMessage = this.$t('ADMIN_NOTIFICATIONS.SITE_REFRESHED_FAILURE');
      }
    },
    async updateDebugMode(newValue) {
      const success = await this.updateForceRefreshDebugMode(newValue);

      if (success) {
        this.notificationMessage = '';
      } else {
        this.notificationMessage = this.$t('ADMIN_NOTIFICATIONS.SITE_DEBUG_MODE_FAILURE');
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
        this.notificationMessage = this.$t('ADMIN_NOTIFICATIONS.SITE_SETTINGS_UPDATED_SUCCESS');
      } else {
        this.notificationMessage = this.$t('ADMIN_NOTIFICATIONS.SITE_SETTINGS_UPDATED_FAILURE');
      }
    },
    ...mapActions(['requestRefreshSite', 'updateForceRefreshSettings', 'updateForceRefreshDebugMode']),
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as var;
@use "@/scss/utilities" as utils;

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

.admin-section__warning {
  font-style: italic;
  margin-bottom: 0;
  color: var.$status-error;
  font-size: 0.9rem;
}

@keyframes fade-and-scale-main {
  0% {
    opacity: 0;
    transform: scale(2) translateY(-100px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fade-and-scale-troubleshooting {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }

  100% {
    opacity: 1;
  }
}

.fade-and-scale__main-enter-active,
.fade-and-scale__main-leave-active,
.fade-and-scale__troubleshooting-enter-active,
.fade-and-scale__troubleshooting-leave-active {
  animation-fill-mode: both;
  position: absolute;
}

.fade-and-scale__main-enter-active,
.fade-and-scale__main-leave-active {
  animation-name: fade-and-scale-main;
}

.fade-and-scale__main-enter-active {
  animation-delay: var.$transition-medium;
  animation-duration: var.$transition-medium;
}

.fade-and-scale__main-leave-active {
  animation-duration: var.$transition-medium;
}

.fade-and-scale__troubleshooting-enter-active,
.fade-and-scale__troubleshooting-leave-active {
  animation-duration: var.$transition-long;
  animation-name: fade-and-scale-troubleshooting;
}

.fade-and-scale__troubleshooting-enter-active {
  animation-delay: var.$transition-medium;
  animation-duration: var.$transition-long;
}

.fade-and-scale__troubleshooting-leave-active {
  animation-duration: var.$transition-medium;
}

.fade-and-scale__main-leave-active,
.fade-and-scale__troubleshooting-leave-active {
  animation-direction: reverse;
}
</style>
