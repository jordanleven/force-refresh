<template>
  <div class="force-refresh-troubleshooting">
    <h2 class="header">
      {{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_HEADER') }}
    </h2>
    <ul class="plugin-info__container">
      <li class="plugin-info">
        <h4 class="plugin-info__header">
          {{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_HEADER_HEALTH') }}
        </h4>
        <div class="plugin-info__inner">
          <TroubleshootingVersionsList :versions="versionsTroubleshootingInformation" />
        </div>
      </li>
      <li class="plugin-info">
        <h4 class="plugin-info__header">
          {{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_HEADER_SITE_SETTINGS') }}
        </h4>
        <div class="plugin-info__inner">
          <TroubleshootingSettings :settings="versionsTroubleshootingSettings" />
        </div>
      </li>
    </ul>
    <hr>
    <h2 class="header">
      {{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_DEBUG_MODE') }}
    </h2>
    <p>{{ debugCopy }}</p>
    <BaseToggle :is-checked="isDebugActive" @toggled="toggleDebugMode" />
    <hr>
    <template v-if="false">
      <h4>
        Console
      </h4>
      <TroubleshootingConsole />
      <hr>
    </template>
    <button class="button-primary" @click="exitTroubleshooting">
      {{ $t('ADMIN_TROUBLESHOOTING.BUTTON_EXIT_TROUBLESHOOTING_MODE') }}
    </button>
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import BaseToggle from '@/components/BaseToggle/BaseToggle.vue';
import TroubleshootingConsole from '@/components/TroubleshootingConsole/TroubleshootingConsole.vue';
import TroubleshootingSettings from '@/components/TroubleshootingSettings/TroubleshootingSettings.vue';
import TroubleshootingVersionsList from '@/components/TroubleshootingVersionsList/TroubleshootingVersionsList.vue';

export default {
  name: 'AdminTroubleshooting',
  components: {
    BaseToggle,
    TroubleshootingConsole,
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
  computed: {
    debugCopy() {
      return this.isDebugActive
        ? this.$t('ADMIN_TROUBLESHOOTING.DEBUG_MODE_DESCRIPTION_ACTIVE')
        : this.$t('ADMIN_TROUBLESHOOTING.DEBUG_MODE_DESCRIPTION_INACTIVE');
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
          value: this.troubleshootingInfo.isMultiSite,
        },
        {
          label: this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_CURRENT_SITE_ID'),
          value: this.troubleshootingInfo.currentSiteId,
        },
      ];
    },
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
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;

.force-refresh-troubleshooting {
  width: 100%;
}

.plugin-info__container {
  display: flex;
}

.plugin-info {
  width: 50%;

  &:nth-child(odd) {
    padding-right: var.$space-medium;
  }

  &:nth-child(even) {
    padding-left: var.$space-medium;
  }
}

.plugin-info__header {
  margin: 0;
}

.plugin-info__inner {
  margin-top: var.$space-small;
  padding: var.$space-medium 0;
  text-align: left;
  border: 2px solid var.$light_grey;
  border-radius: 10px;
  background-color: white;
}
</style>
