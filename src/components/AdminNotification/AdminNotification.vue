<template>
  <transition name="fade">
    <div
      v-if="notificationIsActive"
      class="notice notice-success notice-force-refresh"
    >
      <p>{{ message }}</p>
      <button
        type="button"
        class="notice-force-refresh__button"
        @click="notificationClosed"
      >
        <span class="dashicons dashicons-dismiss" />
        <span
          class="screen-reader-text"
        >
          Dismiss this notice.
        </span>
      </button>
    </div>
  </transition>
</template>

<script>
import VueTypes from 'vue-types';

const EVENT_NOTIFICATION_CLOSED = 'notification-closed';

export default {
  name: 'BaseNotice',
  props: {
    message: VueTypes.string.isRequired,
  },
  emits: [EVENT_NOTIFICATION_CLOSED],
  data() {
    return {
      notificationIsActive: false,
    };
  },
  mounted() {
    setTimeout(() => {
      this.activateNotification();
    }, 100);
  },
  methods: {
    activateNotification() {
      this.notificationIsActive = true;
    },
    notificationClosed() {
      this.notificationIsActive = false;
      this.$emit(EVENT_NOTIFICATION_CLOSED);
    },
  },
};
</script>

<style lang="scss" scoped>
.notice-force-refresh {
  margin: 0 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 250ms;

  &.fade-enter-active {
    opacity: 1;
  }

  &.fade-leave-active {
    opacity: 0;
  }

  .notice-force-refresh__button {
    background: none;
    border: none;
    height: 100%;

    .dashicons-dismiss {
      font-size: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
