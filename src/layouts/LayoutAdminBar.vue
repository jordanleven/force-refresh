<template>
  <span
    v-if="refreshFromAdminBar"
    class="force-refresh__admin-bar"
    @click="refreshSite"
  >
    <span class="force-refresh__admin-bar-inner">
      <font-awesome-icon
        class="force-refresh-logo"
        :class="logoClass"
        :icon="forceRefreshIcon"
      />
      {{ $t('FORM_BUTTONS_GENERIC.FORCE_REFRESH_SITE') }}
    </span>
  </span>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import Vue from 'vue';
import VueTypes from 'vue-types';
import { mapActions, mapGetters } from 'vuex';
import AdminFooterNotification from '@/components/AdminFooterNotification/AdminFooterNotification.vue';

library.add([faSyncAlt]);

export default {
  name: 'LayoutAdminBar',
  props: {
    targetNotificationContainer: VueTypes.string.isRequired,
  },
  data() {
    return {
      forceRefreshIcon: faSyncAlt,
      isNotificationActive: false,
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
    ...mapGetters(['refreshInterval', 'refreshFromAdminBar']),
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
    async refreshSite() {
      this.animateLogo();
      const success = await this.requestRefreshSite();

      if (success) {
        this.notificationMessage = this.$t('ADMIN_NOTIFICATIONS.SITE_REFRESHED_SUCCESS', { refreshInterval: this.refreshInterval });
      } else {
        this.notificationMessage = this.$t('ADMIN_NOTIFICATIONS.SITE_REFRESHED_FAILURE');
      }

      this.showNotification();
    },
    showNotification() {
      this.isNotificationActive = true;
    },
    ...mapActions(['requestRefreshSite']),
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
