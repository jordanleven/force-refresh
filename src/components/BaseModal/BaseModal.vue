<template>
  <div class="modal-window">
    <div class="modal">
      <h2 v-if="header">
        {{ header }}
      </h2>
      <hr v-if="header">
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

.modal-window {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.modal {
  background-color: var.$white;
  width: 100%;
  max-width: 30rem + 1rem;
  max-height: 50vh;
  overflow: scroll;
  padding: 1rem;
  margin: 1rem;
  border-radius: var.$border-radius;
}

.modal__inner {
  overflow: scroll;
  max-height: 30vh;
  -webkit-overflow-scrolling: touch;
  background:
    linear-gradient(
      white 30%,
      rgba(255, 255, 255, 0%)
    ) center top,

    linear-gradient(
      rgba(255, 255, 255, 0%),
      white 70%
    ) center bottom,

    radial-gradient(
      farthest-side at 50% 0,
      rgba(0, 0, 0, 20%),
      rgba(0, 0, 0, 0%)
    ) center top,

    radial-gradient(
      farthest-side at 50% 100%,
      rgba(0, 0, 0, 20%),
      rgba(0, 0, 0, 0%)
    ) center bottom;
  background-repeat: no-repeat;
  background-size: 100% 40px, 100% 40px, 100% 14px, 100% 14px;
  background-attachment: local, local, scroll, scroll;
}

.modal__footer {
  margin-top: var.$side-padding;
  text-align: right;

  .button {
    margin-top: var.$side-padding;
  }
}
</style>
