<template>
  <transition
    name="fade-and-slide"
    @enter="fadeAndScaleAnimationEnter"
    @after-enter="fadeAndScaleAnimationAfterEnter"
    @leave="fadeAndScaleAnimationLeave"
  >
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
          {{ $t('ADMIN_NOTIFICATIONS.DISMISS_NOTIFICATION') }}
        </span>
      </button>
    </div>
  </transition>
</template>

<script>
import VueTypes from 'vue-types';

const EVENT_NOTIFICATION_CLOSED = 'notification-closed';

export default {
  name: 'AdminNotification',
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
    fadeAndScaleAnimationAfterEnter(element) {
      const adminNotification = element;
      adminNotification.style.height = 'auto';
    },
    fadeAndScaleAnimationEnter(element) {
      const adminNotification = element;
      adminNotification.style.position = 'absolute';
      adminNotification.style.visibility = 'hidden';
      adminNotification.style.height = 'auto';

      const { height } = getComputedStyle(adminNotification);

      adminNotification.style.width = null;
      adminNotification.style.position = null;
      adminNotification.style.visibility = null;
      adminNotification.style.height = 0;

      requestAnimationFrame(() => {
        adminNotification.style.height = height;
      });
    },
    fadeAndScaleAnimationLeave(element) {
      const adminNotification = element;
      const { height } = getComputedStyle(element);

      adminNotification.style.height = height;

      requestAnimationFrame(() => {
        adminNotification.style.height = 0;
      });
    },
    notificationClosed() {
      this.notificationIsActive = false;
      this.$emit(EVENT_NOTIFICATION_CLOSED);
    },
  },
};
</script>

<style lang="scss">
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;

.notice-force-refresh {
  margin: 0 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.notice-force-refresh--large {
    padding: 0;

    p {
      margin: 0.5rem 0;
      padding: 0.5rem 1rem;
      font-size: 1rem;
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

@include utils.generate-animation('force-refresh-fade-and-scale-admin-notification') {
  0% {
    transform: translateX(5rem);
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

.notice-force-refresh--is-hidden {
  visibility: hidden;
  position: absolute;
  left: 0;
  top: 0;
}

.fade-and-slide {
  &-enter-active {
    opacity: 0;
    @include utils.animation('force-refresh-fade-and-scale-admin-notification', 500ms, ease, 250ms);
  }

  &-enter-active,
  &-leave-active {
    transition: all 250ms ease-in-out;
    overflow: hidden;
  }

  &-enter,
  &-leave-to {
    height: 0;
    opacity: 0;
  }

  &-leave-to {
    height: 0;
    opacity: 0;
  }
}
</style>
