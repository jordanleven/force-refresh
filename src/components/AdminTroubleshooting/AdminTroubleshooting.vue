<template>
  <div class="force-refresh-troubleshooting">
    <TroubleshootingDebug
      :debug-info="debugInfo"
      :is-debug-active="isDebugActive"
      @toggled="toggleDebugMode"
    />

    <div
      class="troubleshooting__content"
      :class="classesContentGrid"
    >
      <div
        class="troubleshooting__col-left"
        :class="classesContentColumn"
      >
        <div class="troubleshooting__card">
          <div class="troubleshooting__card-header">
            <span class="troubleshooting__card-title">{{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_HEADER_SITE_SETTINGS') }}</span>
          </div>
          <TroubleshootingSettings :settings="versionsTroubleshootingSettings" />
        </div>

        <div class="troubleshooting__card">
          <div class="troubleshooting__card-header">
            <span class="troubleshooting__card-title">{{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_HEADER_HEALTH') }}</span>
          </div>
          <TroubleshootingVersionsList :versions="versionsTroubleshootingInformation" />
        </div>
      </div>

      <div
        v-if="isTerminalEnabled"
        class="troubleshooting__col-right"
      >
        <div class="troubleshooting__card troubleshooting__card--terminal">
          <div class="troubleshooting__card-header">
            <span class="troubleshooting__card-title">{{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_HEADER_CONSOLE') }}</span>
          </div>
          <TroubleshootingConsole />
        </div>
      </div>
    </div>

    <div class="troubleshooting__footer">
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
      siteUrl: VueTypes.string.isRequired,
      versions: VueTypes.shape({
        forceRefresh: VueTypes.object.isRequired,
        php: VueTypes.object.isRequired,
        wordPress: VueTypes.object.isRequired,
      }),
    }),
  },
  emits: ['debug-mode-was-updated', 'exit-troubleshooting'],
  computed: {
    classesContentColumn() {
      return [
        this.isTerminalEnabled && 'troubleshooting__col-left--stacked',
      ];
    },
    classesContentGrid() {
      return [
        this.isTerminalEnabled && 'troubleshooting__content--with-terminal',
      ];
    },
    debugInfo() {
      return {
        siteName: this.troubleshootingInfo.siteName,
        siteUrl: this.troubleshootingInfo.siteUrl,
        versions: this.troubleshootingInfo.versions,
      };
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

.force-refresh-troubleshooting {
  width: 100%;
  background: var.$surface-subtle;
}

.troubleshooting {
  &__content {
    display: grid;
    grid-template-columns: 1fr;
    gap: var.$space-medium;
    align-items: start;

    &--with-terminal {
      grid-template-columns: 1fr 1.65fr;
      align-items: stretch;
    }
  }

  &__col-left {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var.$space-medium;

    &--stacked {
      grid-template-columns: 1fr;
    }
  }

  &__col-right {
    height: 100%;
  }

  &__card {
    @include utils.card-surface;

    padding-bottom: 0.25rem;

    &--terminal {
      height: 100%;
      display: flex;
      flex-direction: column;

      :deep(.troubleshooting-console) {
        flex: 1;
        min-height: 0;
      }
    }
  }

  &__card-header {
    padding: 0.75rem var.$space-medium 0.625rem;
    border-bottom: 1px solid var.$border-subtle-strong;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__card-title {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var.$text-tertiary;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    margin-top: var.$space-large;
  }
}
</style>
