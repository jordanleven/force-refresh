<template>
  <Teleport to="body">
    <div
      v-bind="$attrs"
      class="modal-window"
      :class="classesModalWindow"
      @click.self="onOverlayClick"
    >
      <div
        ref="dialog"
        role="dialog"
        :aria-modal="isOpen ? 'true' : undefined"
        :aria-label="accessibleLabel || header || undefined"
        tabindex="-1"
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
          <button type="button" class="modal__close" :aria-label="$t('MODAL.CLOSE')" @click="close">
            <Icon name="close" :size="12" />
          </button>
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
import Icon from '@/components/Icon/Icon.vue';

export default {
  name: 'BaseModal',
  components: { Icon },
  inheritAttrs: false,
  props: {
    accessibleLabel: VueTypes.string,
    header: VueTypes.string,
    isOpen: VueTypes.bool.def(true),
    maxWidth: VueTypes.string,
    polished: VueTypes.bool.def(false),
    scrollInner: VueTypes.bool.def(true),
    showDefaultFooter: VueTypes.bool.def(true),
    showDivider: VueTypes.bool.def(true),
    variant: VueTypes.oneOf(['center', 'bottom-sheet']).def('center'),
  },
  emits: ['modal-was-closed'],
  data() {
    return { previousFocus: null };
  },
  computed: {
    classesInner() {
      return [
        this.scrollInner && 'modal__inner--scrollable',
      ];
    },
    classesModal() {
      return [
        `modal--${this.variant}`,
        this.polished && 'modal--polished',
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
  watch: {
    isOpen(open) {
      if (open) this.focusDialog();
      else this.restoreFocus();
    },
  },
  mounted() {
    this.keydownHandler = (e) => {
      if (this.isOpen && e.key === 'Tab') this.trapFocus(e);
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    };

    window.addEventListener('keydown', this.keydownHandler);
    if (this.isOpen) this.focusDialog();
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.keydownHandler);
    this.restoreFocus();
  },
  methods: {
    close() {
      this.$emit('modal-was-closed');
    },
    focusDialog() {
      this.previousFocus = document.activeElement;
      this.$nextTick(() => this.$refs.dialog?.focus());
    },
    onOverlayClick() {
      this.close();
    },
    restoreFocus() {
      if (this.previousFocus?.isConnected) this.previousFocus.focus();
      this.previousFocus = null;
    },
    trapFocus(event) {
      const elements = [...this.$refs.dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
        .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === this.$refs.dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === this.$refs.dialog)) {
        event.preventDefault();
        first.focus();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

$modal-enter-duration: 0.36s;
$modal-enter-easing: cubic-bezier(0.34, 1.1, 0.64, 1);
$modal-exit-duration: 0.2s;

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

  // Hold visibility until the closing animation finishes so the exit is seen.
  transition:
    -webkit-backdrop-filter $modal-exit-duration ease,
    backdrop-filter $modal-exit-duration ease,
    background-color $modal-exit-duration ease,
    visibility 0s linear $modal-exit-duration;

  &--center {
    align-items: center;
    padding: 1rem 0.5rem;

  }

  &--bottom-sheet {
    align-items: flex-end;
    transition:
      -webkit-backdrop-filter 0.44s ease,
      backdrop-filter 0.44s ease,
      background-color 0.44s ease,
      visibility 0s linear 0.44s;

  }

  &--open {
    visibility: visible;
    background-color: var.$overlay-backdrop-background;
    backdrop-filter: var.$overlay-backdrop-blur;
    pointer-events: all;
    transition:
      -webkit-backdrop-filter $modal-enter-duration ease,
      backdrop-filter $modal-enter-duration ease,
      background-color $modal-enter-duration ease,
      visibility 0s;

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
    transform: scale(0.94) translateY(0.5rem);
    transition:
      transform $modal-exit-duration ease-in,
      opacity $modal-exit-duration ease-in;
    margin: 0 auto;

    &.modal--open {
      transition:
        transform $modal-enter-duration $modal-enter-easing,
        opacity $modal-enter-duration ease-out;

    }

  }

  &--bottom-sheet {
    background: var.$surface-subtle;
    box-shadow: 0 -1px 0 rgba(var.$black, 0.05), 0 -0.75rem 3.75rem rgba(var.$black, 0.18);
    border-top: 1px solid rgba(var.$black, 0.06);
    max-height: 88vh;
    transform: translateY(100%);
    transition: transform 0.44s cubic-bezier(0.32, 0.72, 0, 1);

    @include utils.card-radius-top;

  }

  &--open {
    opacity: 1;
    transform: none;

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

.modal--polished {
  border-radius: 1.75rem;
  padding: 1.5rem;
  background: rgb(248, 248, 252, 97%);
  border: 1px solid rgb(255, 255, 255, 70%);
  box-shadow: 0 24px 80px rgb(0, 0, 0, 22%), 0 2px 12px rgb(0, 0, 0, 8%), inset 0 1px 0 rgb(255, 255, 255, 90%);
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  max-height: 88vh;
  box-sizing: border-box;
}

.modal--polished .modal__title {
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.035em;
}

.modal--polished .modal__header {
  margin-bottom: 0;
  gap: 0.75rem;
}

.modal--polished .modal__close {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.modal--polished .modal__inner--scrollable {
  flex: 1 1 auto;
  max-height: none;
  background: transparent;
  padding: 0;
}

.modal--polished .modal__footer {
  flex: none;
}

@media (width <= 540px) {
  .modal--polished {
    padding: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-window,
  .modal {
    transition: none;
  }
}
</style>
