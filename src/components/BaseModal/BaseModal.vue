<template>
  <div class="modal-window">
    <div class="modal">
      <h2 v-if="header">
        {{ header }}
      </h2>
      <hr v-if="header" class="modal__divider">
      <div class="modal__inner">
        <slot />
      </div>
      <div class="modal__footer">
        <button class="button" @click="close">
          {{ $t("MODAL.CLOSE") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import VueTypes from 'vue-types';

export default {
  name: 'BaseModal',
  props: {
    header: VueTypes.string,
  },
  emits: ['modal-was-closed'],
  methods: {
    close() {
      this.$emit('modal-was-closed');
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

$wp-admin-header-height-desktop: 32px;
$wp-admin-header-height-mobile: 46px;
$modal-height-desktop: var.$viewport-height-large;

.modal-window {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;

  @include utils.resp-height(1px, $modal-height-desktop) {
    position: absolute;
    top: $wp-admin-header-height-desktop;
    bottom: 0;
  }
}

.modal {
  background-color: var.$white;
  width: 100%;
  overflow: scroll;
  border-radius: var.$border-radius;
  padding: 1rem;
  margin: 0 0.5rem;

  @include utils.resp-height($modal-height-desktop) {
    max-width: calc(50rem + 1rem);
    margin: 1rem;
  }
}

.modal__divider {
  margin: 0;
  border-bottom: 0;
}

.modal__inner {
  overflow: scroll;
  max-height: 70vh;
  padding-right: 10px;
  -webkit-overflow-scrolling: touch;
  background:
    linear-gradient(
      white 30%,
      rgb(255, 255, 255, 0%)
    ) center top,

    linear-gradient(
      rgb(255, 255, 255, 0%),
      white 70%
    ) center bottom,

    radial-gradient(
      farthest-side at 50% 0,
      rgb(0, 0, 0, 20%),
      rgb(0, 0, 0, 0%)
    ) center top,

    radial-gradient(
      farthest-side at 50% 100%,
      rgb(0, 0, 0, 20%),
      rgb(0, 0, 0, 0%)
    ) center bottom;
  background-repeat: no-repeat;
  background-size: 100% 40px, 100% 40px, 100% 14px, 100% 14px;
  background-attachment: local, local, scroll, scroll;
}

.modal__footer {
  text-align: right;

  .button {
    margin-top: 1rem;
  }
}
</style>
