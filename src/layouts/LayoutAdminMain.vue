<template>
  <div class="wrap">
    <h1 class="header" @click="headerClicked">
      Force Refresh
    </h1>
    <div class="admin_section__notifications">
      <AdminNotification
        v-if="isDebugActive"
        :message="messageDebugModeActive"
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
        />
      </transition>
    </div>
  </div>
</template>

<script>
import { sprintf } from 'sprintf-js';
import { mapActions, mapGetters } from 'vuex';
import AdminMain from '@/components/AdminMain/AdminMain.vue';
import AdminNotification from '@/components/AdminNotification/AdminNotification.vue';
import AdminTroubleshooting from '@/components/AdminTroubleshooting/AdminTroubleshooting.vue';

const MESSAGE_SITE_REFRESHED_SUCCESS = "You've successfully refreshed your site. All connected browsers will refresh within %s seconds.";
const MESSAGE_SITE_REFRESHED_FAILURE = 'There was an issue refreshing your site. Please try again.';
const MESSAGE_SITE_SETTINGS_UPDATED_SUCCESS = "You've successfully updated settings for Force Refresh.";
const MESSAGE_SITE_SETTINGS_UPDATED_FAILURE = 'There was an issue updating your settings. Please try again.';
const MESSAGE_SITE_DEBUG_MODE_FAILURE = 'There was an issue updating settings for debug mode. Please try again.';
const MESSAGE_DEBUG_MODE_ACTIVE = 'Force Refresh is currently in Debug Mode.';

/**
 * The number of clicks required before the troubleshooting page show up.
 * @var {Number}
 */
const TROUBLESHOOTING_NUMBER_OF_CLICKS_REQUIRED_TO_VIEW = 3;

/**
 * The number of milliseconds before a single click expires (to ensure clicks are deliberate to enter
 * the troubleshooting page).
 * @var {Number}
 */
const TROUBLESHOOTING_TIMOUT_IN_MS = 1000;

export default {
  name: 'LayoutAdminMain',
  components: {
    AdminMain,
    AdminNotification,
    AdminTroubleshooting,
  },
  data() {
    return {
      messageDebugModeActive: MESSAGE_DEBUG_MODE_ACTIVE,
      notificationMessage: null,
      troubleshootingNumberOfClicks: 0,
      troubleshootingPageIsActive: false,
    };
  },
  computed: {
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
    checkForOptionsUpdated() {
      if (window.location.href.indexOf('optionsUpdated') > -1) {
        this.notificationMessage = MESSAGE_SITE_SETTINGS_UPDATED_SUCCESS;
      }
    },
    exitTroubleshooting() {
      this.troubleshootingPageIsActive = false;
    },
    /**
     * Method used to handle when users are trying to invoke the troubleshooting page. If the header is clicked
     * a certain number of times within a set interval, we'll reveal the troubleshooting page.
     * @return  {void}
     */
    headerClicked() {
      this.troubleshootingNumberOfClicks += 1;

      if (this.troubleshootingNumberOfClicks >= TROUBLESHOOTING_NUMBER_OF_CLICKS_REQUIRED_TO_VIEW) {
        this.troubleshootingPageIsActive = true;
      }

      setTimeout(() => {
        this.troubleshootingNumberOfClicks -= 1;
      }, TROUBLESHOOTING_TIMOUT_IN_MS);
    },
    notificationWasClosed() {
      this.notificationMessage = null;
    },
    async refreshSite() {
      const success = await this.requestRefreshSite();

      if (success) {
        this.notificationMessage = sprintf(MESSAGE_SITE_REFRESHED_SUCCESS, this.refreshInterval);
      } else {
        this.notificationMessage = MESSAGE_SITE_REFRESHED_FAILURE;
      }
    },
    async updateDebugMode(newValue) {
      const success = await this.updateForceRefreshDebugMode(newValue);

      if (success) {
        this.notificationMessage = '';
      } else {
        this.notificationMessage = MESSAGE_SITE_DEBUG_MODE_FAILURE;
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
        this.notificationMessage = MESSAGE_SITE_SETTINGS_UPDATED_SUCCESS;
      } else {
        this.notificationMessage = MESSAGE_SITE_SETTINGS_UPDATED_FAILURE;
      }
    },
    ...mapActions(['requestRefreshSite', 'updateForceRefreshSettings', 'updateForceRefreshDebugMode']),
  },
};
</script>

<style lang="scss" scoped>
@use '@/scss/variables' as var;
@use '@/scss/utilities' as utils;

.header {
  display: inline;
  user-select: none;
}

.admin_section__notifications {
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

@keyframes fade-and-scale-main {
  from {
    opacity: 0;
    transform: scale(2) translateY(-100px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fade-and-scale-troubleshooting {
  from {
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
