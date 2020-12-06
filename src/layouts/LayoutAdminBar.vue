<template>
  <span
    class="force-refresh__admin-bar"
    @click="refreshSite"
  >
    <span class="force-refresh__admin-bar-inner">
      <font-awesome-icon
        class="force-refresh-logo"
        :class="logoClass"
        :icon="forceRefreshIcon"
      />
      Force Refresh Site
    </span>
  </span>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { sprintf } from 'sprintf-js';
import Vue from 'vue';
import VueTypes from 'vue-types';
import AdminFooterNotification from '@/components/AdminFooterNotification/AdminFooterNotification.vue';
import { requestSiteRefresh } from '@/js/services/admin/refreshService';

library.add([faSyncAlt]);

const MESSAGE_SITE_REFRESHED_SUCCESS = "You've successfully refreshed your site. All connected browsers will refresh within %s seconds.";
const MESSAGE_SITE_REFRESHED_FAILURE = 'There was an issue refreshing your site. Please try again.';

export default {
  name: 'LayoutAdminBar',
  props: {
    nonce: VueTypes.string.isRequired,
    refreshInterval: VueTypes.integer.isRequired,
    targetNotificationContainer: VueTypes.string.isRequired,
  },
  data() {
    return {
      forceRefreshIcon: faSyncAlt,
      isNotificationActive: false,
      notificationInstance: null,
      notificationMessage: null,
      refreshTriggered: false,
    };
  },
  computed: {
    logoClass() {
      return {
        'force-refresh-logo--active': this.refreshTriggered,
      };
    },
  },
  created() {
    // eslint-disable-next-line no-new
    new Vue({
      el: this.targetNotificationContainer,
      render: (h) => {
        if (!this.isNotificationActive) return null;
        return h(AdminFooterNotification,
          {
            on: {
              'notification-closed': this.closeNotification,
            },
            props: {
              message: this.notificationMessage,
            },
          });
      },
    });
  },
  methods: {
    animateLogo() {
      this.refreshTriggered = true;
      setTimeout(() => {
        this.refreshTriggered = false;
      }, 2000);
    },
    closeNotification() {
      this.isNotificationActive = false;
    },
    refreshSite() {
      const {
        nonce,
      } = this;
      this.animateLogo();

      requestSiteRefresh({ nonce })
        .then(({ success }) => {
          if (success) {
            this.notificationMessage = sprintf(MESSAGE_SITE_REFRESHED_SUCCESS, this.refreshInterval);
          } else {
            this.notificationMessage = MESSAGE_SITE_REFRESHED_FAILURE;
          }
          this.showNotification();
        });
    },
    showNotification() {
      this.isNotificationActive = true;
    },
  },
};
</script>

<style lang="scss">
@use '@/scss/utilities' as utils;

@include utils.generate-animation('admin-bar-refresh--active') {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(180deg);
  }
}

</style>

<style lang="scss" scoped>
@use '@/scss/variables' as var;
@use '@/scss/utilities' as utils;

#wpadminbar {
  .force-refresh__admin-bar {
    position: relative;
    cursor: pointer;
    display: inline;
  }

  .force-refresh__admin-bar-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .force-refresh-logo__container {
    position: relative;
    background-color: red;
    height: 100%;
    display: inline;
    width: 100%;
  }

  .force-refresh-logo {
    display: inline;
    height: 40%;
    margin-right: var.$space-small;

    &.force-refresh-logo--active {
      @include utils.animation('admin-bar-refresh--active', 1000ms, ease);
    }
  }
}
</style>
