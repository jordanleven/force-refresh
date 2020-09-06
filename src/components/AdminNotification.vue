<template>
  <div class="notice notice-success notice-force-refresh is-dismissible">
    <p>{{ message }}</p>
    <button
      type="button"
      class="notice-dismiss"
      @click="notificationClosed"
    >
      <span
        class="screen-reader-text"
      >
        Dismiss this notice.
      </span>
    </button>
  </div>
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
  methods: {
    notificationClosed() {
      this.$emit(EVENT_NOTIFICATION_CLOSED);
    },
  },
};
</script>

<style lang="scss" scoped>
.notice {
  margin: 0 0 20px;
}
</style>
