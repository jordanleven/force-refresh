<template>
  <div class="force-refresh-admin-main">
    <div class="force-refresh-admin-main-inner">
      <transition name="notification-fade">
        <AdminNotification
          v-if="notificationVisible"
          :message="notificationMessage"
          @notification-closed="hideNotification"
        />
      </transition>
      <p>Force all users to manually reload the {{ postType }} "{{ postNameDecoded }}".</p>
      <button
        class="button button-primary"
        @click="refreshPage"
      >
        Refresh {{ postNameDecoded }}
      </button>
    </div>
  </div>
</template>

<script>
import { decode } from 'html-entities';
import VueTypes from 'vue-types';
import { mapActions, mapGetters } from 'vuex';
import AdminNotification from '@/components/AdminNotification/AdminNotification.vue';
import { getRefreshIntervalUnitAndValue } from '@/js/utilities/getRefreshIntervalUnitAndValue.js';

export default {
  name: 'LayoutAdminMetaBox',
  components: {
    AdminNotification,
  },
  props: {
    postId: VueTypes.number.isRequired,
    postName: VueTypes.string.isRequired,
    postType: VueTypes.string.isRequired,
  },
  data() {
    return {
      notificationVisible: false,
      refreshStatus: null,
    };
  },
  computed: {
    notificationMessage() {
      const [refreshIntervalValue, refreshIntervalUnit] = getRefreshIntervalUnitAndValue(this.refreshInterval);
      return this.refreshStatus
        ? this.$t('ADMIN_NOTIFICATIONS.PAGE_REFRESHED_SUCCESS', {
          refreshIntervalUnit,
          refreshIntervalValue,
        })
        : this.$t('ADMIN_NOTIFICATIONS.PAGE_REFRESHED_FAILURE');
    },
    postNameDecoded() {
      return decode(this.postName);
    },
    ...mapGetters(['refreshInterval']),
  },
  methods: {
    hideNotification() {
      this.notificationVisible = false;
    },
    async refreshPage() {
      const { postId } = this;

      const response = await this.requestRefreshPost(postId);

      this.notificationVisible = true;
      this.refreshStatus = response?.code === 201;
    },
    ...mapActions(['requestRefreshPost']),
  },
};
</script>

<style lang="scss">
.notification-fade-enter-active,
.notification-fade-leave-active {
  transition: opacity 0.5s;
}

.notification-fade-enter,
.notification-fade-leave-to {
  opacity: 0;
}
</style>
