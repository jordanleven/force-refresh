<template>
  <div class="force-refresh-troubleshooting">
    <TroubleshootingDebug
      :is-debug-active="isDebugActive"
      @toggled="toggleDebugMode"
    />

    <div
      class="content-grid"
      :class="contentGridClasses"
    >
      <div
        class="col-left"
        :class="contentColumnClasses"
      >
        <div class="info-card">
          <div class="info-card__header">
            <span class="card-title">{{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_HEADER_SITE_SETTINGS') }}</span>
          </div>
          <TroubleshootingSettings :settings="versionsTroubleshootingSettings" />
        </div>

        <div class="info-card">
          <div class="info-card__header">
            <span class="card-title">{{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_HEADER_HEALTH') }}</span>
          </div>
          <TroubleshootingVersionsList :versions="versionsTroubleshootingInformation" />
        </div>
      </div>

      <div
        v-if="isTerminalEnabled"
        class="col-right"
      >
        <div class="info-card info-card--terminal">
          <div class="info-card__header">
            <span class="card-title">{{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_HEADER_CONSOLE') }}</span>
          </div>
          <TroubleshootingConsole />
        </div>
      </div>
    </div>

    <div class="page-footer">
      <button
        class="button-primary"
        data-test="btn-exit-troubleshooting"
        @click="exitTroubleshooting"
      >
        {{ $t('ADMIN_TROUBLESHOOTING.BUTTON_EXIT_TROUBLESHOOTING_MODE') }}
      </button>
    </div>
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import { mapGetters } from 'vuex';
import TroubleshootingConsole from '@/components/TroubleshootingConsole/TroubleshootingConsole.vue';
import TroubleshootingDebug from '@/components/TroubleshootingDebug/TroubleshootingDebug.vue';
import TroubleshootingSettings from '@/components/TroubleshootingSettings/TroubleshootingSettings.vue';
import TroubleshootingVersionsList from '@/components/TroubleshootingVersionsList/TroubleshootingVersionsList.vue';

export default {
  name: 'AdminTroubleshooting',
  components: {
    TroubleshootingConsole,
    TroubleshootingDebug,
    TroubleshootingSettings,
    TroubleshootingVersionsList,
  },
  props: {
    isDebugActive: VueTypes.bool.isRequired,
    troubleshootingInfo: VueTypes.shape({
      currentSiteId: VueTypes.number.isRequired,
      isMultiSite: VueTypes.bool.isRequired,
      siteName: VueTypes.string.isRequired,
      versions: VueTypes.shape({
        forceRefresh: VueTypes.object.isRequired,
        php: VueTypes.object.isRequired,
        wordPress: VueTypes.object.isRequired,
      }),
    }),
  },
  emits: ['debug-mode-was-updated', 'exit-troubleshooting'],
  computed: {
    contentColumnClasses() {
      return [
        this.isTerminalEnabled && 'col-left--stacked',
      ];
    },
    contentGridClasses() {
      return [
        this.isTerminalEnabled && 'content-grid--with-terminal',
      ];
    },
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
    isTerminalEnabled() {
      return this.isFeatureEnabled('troubleshootingTerminal');
    },
    versionsTroubleshootingInformation() {
      const { forceRefresh, php, wordPress } = this.troubleshootingInfo.versions;
      return [
        {
          label: this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_PHP'),
          version: php.version,
          versionRequired: php.required,
        },
        {
          label: this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_WORDPRESS'),
          version: wordPress.version,
          versionRequired: wordPress.required,
        },
        {
          label: this.$t('PLUGIN_NAME_FORCE_REFRESH'),
          version: forceRefresh.version,
          versionRequired: forceRefresh.required,
        },
      ];
    },
    versionsTroubleshootingSettings() {
      return [
        {
          label: this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_SITE_NAME'),
          value: this.troubleshootingInfo.siteName,
        },
        {
          label: this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_MULTISITE_INSTALLATION'),
          value: this.troubleshootingInfo.isMultiSite
            ? this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VALUE_YES')
            : this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VALUE_NO'),
        },
        {
          label: this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_CURRENT_SITE_ID'),
          value: this.troubleshootingInfo.currentSiteId,
        },
      ];
    },
    ...mapGetters(['isFeatureEnabled']),
  },
  methods: {
    exitTroubleshooting() {
      this.$emit('exit-troubleshooting');
    },
    toggleDebugMode(val) {
      this.$emit('debug-mode-was-updated', val);
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

$card-radius: 1.25rem;

.force-refresh-troubleshooting {
  width: 100%;
  margin: -0.625rem -1.5rem 0;
  padding: var.$space-large var.$space-large 5rem;
  background: var.$surface-subtle;
}

.info-card {
  @include utils.card-surface;

  padding-bottom: 0.25rem;
}

.info-card__header {
  padding: 0.75rem var.$space-medium 0.625rem;
  border-bottom: 1px solid var.$border-subtle-strong;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var.$text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.debug-panel {
  margin-bottom: var.$space-medium;

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

.btn-frosted {
  background: rgba(var.$white, 0.6);
  backdrop-filter: blur(12px);
  color: var.$text-primary;
  border: 1px solid rgba(var.$white, 0.8);
  box-shadow: 0 2px 8px rgba(var.$black, 0.08), inset 0 1px 0 rgba(var.$white, 0.9);

  &:hover { background: rgba(var.$white, 0.75); }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var.$space-medium;
  align-items: start;

  &--with-terminal {
    grid-template-columns: 1fr 1.65fr;
    align-items: stretch;
  }
}

.col-left {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var.$space-medium;

  &--stacked {
    grid-template-columns: 1fr;
  }
}

.col-right {
  height: 100%;
}

.info-card--terminal {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.troubleshooting-console) {
    flex: 1;
    min-height: 0;
  }
}

.page-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: var.$space-large;
}
</style>
