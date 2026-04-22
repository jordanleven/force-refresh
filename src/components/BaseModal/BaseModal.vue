<template>
  <Teleport to="body">
    <div
      class="modal-window"
      :class="classesModalWindow"
      @click.self="onOverlayClick"
    >
      <div
        class="modal"
        :class="classesModal"
        :style="modalStyles"
      >
        <div
          v-if="hasHeader"
          class="modal__header"
        >
          <div class="modal__header-copy">
            <slot name="header">
              <h2
                v-if="header"
                class="modal__title"
              >
                {{ header }}
              </h2>
            </slot>
          </div>
        </div>

        <div
          v-if="$slots.subheader"
          class="modal__subheader"
        >
          <slot name="subheader" />
        </div>

        <hr
          v-if="showDivider"
          class="modal__divider"
        >

        <div
          class="modal__inner"
          :class="classesInner"
        >
          <slot />
        </div>

        <div
          v-if="$slots.footer || showDefaultFooter"
          class="modal__footer"
        >
          <slot name="footer">
            <button
              class="button"
              @click="close"
            >
              {{ $t("MODAL.CLOSE") }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import VueTypes from 'vue-types';

export default {
  name: 'BaseModal',
  props: {
    header: VueTypes.string,
    isOpen: VueTypes.bool.def(true),
    maxWidth: VueTypes.string,
    scrollInner: VueTypes.bool.def(true),
    showDefaultFooter: VueTypes.bool.def(true),
    showDivider: VueTypes.bool.def(true),
    variant: VueTypes.oneOf(['center', 'bottom-sheet']).def('center'),
  },
  emits: ['modal-was-closed'],
  computed: {
    classesInner() {
      return [
        this.scrollInner && 'modal__inner--scrollable',
      ];
    },
    classesModal() {
      return [
        `modal--${this.variant}`,
        this.isOpen && 'modal--open',
      ];
    },
    classesModalWindow() {
      return [
        `modal-window--${this.variant}`,
        this.isOpen && 'modal-window--open',
      ];
    },
    hasHeader() {
      return !!this.header || !!this.$slots.header;
    },
    modalStyles() {
      return this.maxWidth ? { '--modal-max-width': this.maxWidth } : {};
    },
  },
  mounted() {
    this.keydownHandler = (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    };

    window.addEventListener('keydown', this.keydownHandler);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.keydownHandler);
  },
  methods: {
    close() {
      this.$emit('modal-was-closed');
    },
    onOverlayClick() {
      this.close();
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

.modal-window {
  position: fixed;
  inset: 0;
  z-index: var.$z-index-modal;
  display: flex;
  visibility: hidden;
  justify-content: center;
  background-color: rgba(var.$black, 0);
  backdrop-filter: blur(0);
  pointer-events: none;
  transition:
    -webkit-backdrop-filter var.$transition-medium,
    backdrop-filter var.$transition-medium,
    background-color var.$transition-medium;

  &--center {
    align-items: center;
    padding: 1rem 0.5rem;
  }

  &--bottom-sheet {
    align-items: flex-end;
  }

  &--open {
    visibility: visible;
    background-color: var.$overlay-backdrop-background;
    backdrop-filter: var.$overlay-backdrop-blur;
    pointer-events: all;
  }
}

.modal {
  width: min(var(--modal-max-width, 50rem), 100%);
  display: flex;
  flex-direction: column;
  pointer-events: auto;

  &--center {
    max-height: min(70vh, 52rem);
    background-color: var.$white;
    border-radius: utils.$card-radius-default;
    padding: 1rem;
    box-shadow: 0 1rem 3rem rgba(var.$black, 0.16);
    opacity: 0;
    transform: translateY(1.25rem);
    transition: transform var.$transition-medium, opacity var.$transition-medium;
    margin: 0 auto;
  }

  &--bottom-sheet {
    background: rgb(245, 245, 247, 92%);
    backdrop-filter: blur(60px) saturate(2.2);
    box-shadow: 0 -1px 0 rgba(var.$black, 0.05), 0 -0.75rem 3.75rem rgba(var.$black, 0.18);
    border-top: 1px solid rgba(var.$white, 0.7);
    max-height: 88vh;
    transform: translateY(100%);
    transition: transform 0.44s cubic-bezier(0.32, 0.72, 0, 1);

    @include utils.card-radius-top;
  }

  &--open {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.modal__header-copy {
  flex: 1;
  min-width: 0;
}

.modal__title {
  margin: 0;
  font-size: 1.125rem;
}

.modal__close {
  width: 1.875rem;
  height: 1.875rem;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var.$text-secondary;
  background: rgb(118, 118, 128, 14%);
  font-size: 1.25rem;
  line-height: 1;
  transition: background 0.12s;

  &:hover {
    background: rgb(118, 118, 128, 22%);
  }
}

.modal__subheader {
  min-width: 0;
}

.modal__divider {
  margin: 0;
  border: 0;
  border-top: 1px solid rgba(var.$black, 0.06);
}

.modal__inner {
  min-height: 0;
}

.modal__inner--scrollable {
  overflow: scroll;
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
}

.modal--center .modal__header {
  margin-bottom: 1rem;
}

.modal--center .modal__subheader {
  margin-bottom: 1rem;
}

.modal--center .modal__divider {
  margin-bottom: 1rem;
}

.modal--center .modal__inner--scrollable {
  max-height: 70vh;
  padding-right: 10px;
}

.modal--center .modal__footer .button {
  margin-top: 1rem;
}

.modal--bottom-sheet .modal__header {
  padding: 0.875rem 1.375rem 0.75rem;
}

.modal--bottom-sheet .modal__title {
  font-weight: 600;
  color: var.$text-primary;
  letter-spacing: -0.02em;
}

.modal--bottom-sheet .modal__close {
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.modal--bottom-sheet .modal__subheader {
  padding: 0 1.375rem 0.875rem;
}

.modal--bottom-sheet .modal__divider {
  margin: 0 1.375rem;
}

.modal--bottom-sheet .modal__inner {
  flex: 1;
}
</style>
