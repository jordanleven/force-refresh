<template>
  <transition name="admin-notice">
    <div v-if="showNotice" class="admin-notice--force-refresh">
      <div class="admin-notice--force-refresh__inner">
        <p>{{ message }}</p>
        <div class="admin-notice--force-refresh__button-container">
          <button
            type="button"
            class="admin-notice--force-refresh__button"
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
      </div>
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
      showNotice: false,
    };
  },
  created() {
    this.$nextTick(() => {
      this.showNotice = true;
    });
  },
  methods: {
    notificationClosed() {
      this.$emit(EVENT_NOTIFICATION_CLOSED);
    },
  },
};
</script>

<style lang="scss">
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

@include utils.generate-animation("force-refresh-notification-enter") {
  0% {
    transform: translateY(200px);
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  70% {
    transform: translateY(-40px);
  }

  100% {
    transform: translateY(0);
  }
}

@include utils.generate-animation("force-refresh-notification-leave") {
  0% {
    transform: translateY(0);
    opacity: 1;
  }

  30% {
    transform: translateY(-40px);
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateY(200px);
  }
}

</style>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

.admin-notice-enter-active {
  @include utils.animation("force-refresh-notification-enter", 350ms, ease);
}

.admin-notice-leave-active {
  @include utils.animation("force-refresh-notification-leave", 350ms, ease);
}

.admin-notice--force-refresh {
  position: fixed;
  z-index: 9999;
  bottom: 0;
  display: flex;
  margin: var.$side-padding auto;

  body.block-editor-page & {
    margin-left: var.$side-padding;
  }
}

.admin-notice--force-refresh__inner {
  color: #fff;
  padding: calc(var.$side-padding / 2) var.$side-padding;
  border-radius: var.$border-radius;
  background-color: var.$black;
  display: flex;

  @supports (backdrop-filter: blur(2px)) {
    backdrop-filter: blur(2px);
    background-color: rgba(var.$black, 0.7);
  }

  width: auto;
}

.admin-notice--force-refresh__button-container {
  display: flex;
}

.admin-notice--force-refresh__button {
  background: none;
  border: none;
  color: #fff;
}
</style>
