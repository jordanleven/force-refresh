<template>
  <transition name="fade">
    <div
      v-if="notificationIsActive"
      class="notice notice-force-refresh"
      :class="notificationClass"
    >
      <p>{{ message }}</p>
      <button
        v-if="isDismissible"
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
    isDismissible: VueTypes.bool.def(true),
    message: VueTypes.string.isRequired,
    size: VueTypes.oneOf(['regular', 'large']).def('regular'),
    type: VueTypes.oneOf(['success', 'error', 'warning']).def('success'),
  },
  emits: [EVENT_NOTIFICATION_CLOSED],
  data() {
    return {
      notificationIsActive: false,
    };
  },
  computed: {
    notificationClass() {
      return [
        `notice-${this.type}`,
        `notice-force-refresh--${this.type}`,
        `notice-force-refresh--${this.size}`,
      ];
    },
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

  &.notice-force-refresh--large {
    padding: 0.5rem 0;

    p {
      padding: 0.75rem 1rem;
      font-size: 1.2rem;
    }
  }

  &.notice-force-refresh--warning.notice-force-refresh--large {
    border-left: none;
    color: white;
    background:
      repeating-linear-gradient(
        45deg,
        #FECB2E,
        #FECB2E 10px,
        #000 10px,
        #000 20px
      );

    p {
      background-color: #000;
      background-color: rgba(#000, 0.8);
      width: 100%;
      backdrop-filter: blur(5px);
    }
  }

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
