<template>
  <div class="debug-panel">
    <div
      class="debug-panel__banner"
      :class="debugBannerClasses"
    >
      <div
        class="debug-panel__icon-wrap"
        :class="debugIconWrapClasses"
      >
        <font-awesome-icon
          class="debug-panel__icon"
          :class="debugIconClasses"
          :icon="faBug"
        />
      </div>
      <div class="debug-panel__body">
        <div class="debug-panel__title">
          {{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_DEBUG_MODE') }}
        </div>
        <div class="debug-panel__subtitle">
          {{ debugCopy }}
        </div>
      </div>
      <div class="debug-panel__actions">
        <BaseToggle
          data-test="toggle-debug-mode"
          :is-checked="isDebugActive"
          @toggled="$emit('toggled', $event)"
        />
      </div>
    </div>

    <div
      v-if="isSubmitDebugRowVisible"
      class="debug-panel__submit-row"
    >
      <span class="debug-panel__submit-label">
        {{ $t('ADMIN_TROUBLESHOOTING.SUBMIT_DEBUG_LABEL') }}
      </span>
      <button class="btn btn-blue">
        {{ $t('ADMIN_TROUBLESHOOTING.BUTTON_SUBMIT_DEBUG_INFO') }}
      </button>
    </div>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBug } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import { mapGetters } from 'vuex';
import BaseToggle from '@/components/BaseToggle/BaseToggle.vue';

library.add(faBug);

export default {
  name: 'TroubleshootingDebug',
  components: {
    BaseToggle,
  },
  props: {
    isDebugActive: VueTypes.bool.isRequired,
  },
  emits: ['toggled'],
  computed: {
    debugBannerClasses() {
      return [
        this.isSubmitDebugRowVisible && 'debug-panel__banner--open',
      ];
    },
    debugCopy() {
      return this.isDebugActive
        ? this.$t('ADMIN_TROUBLESHOOTING.DEBUG_MODE_DESCRIPTION_ACTIVE')
        : this.$t('ADMIN_TROUBLESHOOTING.DEBUG_MODE_DESCRIPTION_INACTIVE');
    },
    debugIconClasses() {
      return [
        this.isDebugActive && 'debug-panel__icon--active',
      ];
    },
    debugIconWrapClasses() {
      return [
        this.isDebugActive && 'debug-panel__icon-wrap--active',
      ];
    },
    isSubmitDebugEnabled() {
      return this.isFeatureEnabled('troubleshootingSubmitDebug');
    },
    isSubmitDebugRowVisible() {
      return this.isDebugActive && this.isSubmitDebugEnabled;
    },
    ...mapGetters(['isFeatureEnabled']),
  },
  created() {
    this.faBug = faBug;
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

$card-radius: 1.25rem;

.debug-panel {
  &__banner {
    @include utils.card-surface(var.$surface-frosted-heavy);

    padding: var.$space-medium 1.375rem;
    display: flex;
    align-items: center;
    gap: var.$space-medium;

    &--open {
      border-radius: $card-radius $card-radius 0 0;
      margin-bottom: 0;
    }
  }

  &__icon-wrap {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    background: rgba(var.$blue, 0.12);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(var.$blue, 0.15);
    box-shadow: inset 0 1px 0 rgba(var.$white, 0.5);
    transition: background 0.2s ease, border-color 0.2s ease;

    &--active {
      background: rgba(var.$red, 0.12);
      border-color: rgba(var.$red, 0.2);
    }
  }

  &__icon {
    color: var.$blue;
    font-size: 1.125rem;
    opacity: 0.2;
    transition: color 0.2s ease, opacity 0.2s ease;

    &--active {
      color: var.$red;
      opacity: 1;
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var.$text-primary;
    letter-spacing: -0.0125rem;
    margin-bottom: 0.0625rem;
  }

  &__subtitle {
    font-size: 0.8125rem;
    color: var.$text-secondary;
    line-height: 1.45;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var.$space-small;
    flex-shrink: 0;
  }

  &__submit-row {
    background: rgba(var.$blue, 0.06);
    backdrop-filter: blur(28px) saturate(1.8);
    border: 1px solid rgba(var.$white, 0.6);
    border-top: 1px solid rgba(var.$blue, 0.1);
    border-radius: 0 0 $card-radius $card-radius;
    padding: 0.75rem 1.375rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: -1px;
    box-shadow: 0 8px 24px rgba(var.$black, 0.07), inset 0 -1px 0 rgba(var.$white, 0.5);
  }

  &__submit-label {
    font-size: 0.8125rem;
    color: var.$text-secondary;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var.$space-small;
  padding: 0 var.$space-medium;
  height: 2.125rem;
  font-size: 0.844rem;
  font-weight: 500;
  border-radius: 980px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  letter-spacing: -0.0063rem;
}

.btn-blue {
  background: var.$blue;
  color: var.$white;
  box-shadow: 0 2px 8px rgba(var.$blue, 0.35), inset 0 1px 0 rgba(var.$white, 0.2);

  &:hover { filter: brightness(1.07); }
  &:active { transform: scale(0.97); }
}
</style>
