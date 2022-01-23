<template>
  <BaseDescriptiveList
    class="plugin-versions"
    :class="pluginInfoClasses"
  >
    <template #term>
      <div class="plugin-versions__label">
        <span v-if="versionRequired" class="version-status">
          <font-awesome-icon
            class="version-status__icon"
            :title="versionStatusMessage"
            :icon="versionStatus"
          />
        </span>
        {{ label }} {{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_VERSION') }}:
      </div>
    </template>
    <template #definition>
      <span class="plugin-versions__version">{{ version }}</span>
    </template>
  </BaseDescriptiveList>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckCircle, faTimesCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import BaseDescriptiveList from '@/components/BaseDescriptiveList/BaseDescriptiveList.vue';
import { versionSatisfies, isDevelopmentVersion, getSanitizedVersion } from '@/js/admin/compare-versions.js';

library.add([faCheckCircle, faTimesCircle, faQuestionCircle]);

export default {
  name: 'TroubleshootingVersions',
  components: {
    BaseDescriptiveList,
  },
  props: {
    label: VueTypes.string.isRequired,
    version: VueTypes.string.isRequired,
    versionRequired: VueTypes.oneOfType([String, null]),
  },
  computed: {
    pluginInfoClasses() {
      return [
        this.versionIsOutdated && 'plugin-info--is-outdated',
      ];
    },
    versionIsDevelopmentVersion() {
      return isDevelopmentVersion(this.version);
    },
    versionIsOutdated() {
      // In case the version is actually a development build
      const versionSanitized = getSanitizedVersion(this.version);
      return !versionSatisfies(this.versionRequired, versionSanitized);
    },
    versionStatus() {
      switch (true) {
        case this.versionIsDevelopmentVersion:
          return faQuestionCircle;
        case this.versionIsOutdated:
          return faTimesCircle;
        default:
          return faCheckCircle;
      }
    },
    versionStatusMessage() {
      switch (true) {
        case this.versionIsDevelopmentVersion:
          return this.$t(
            'ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VERSION_IS_DEVELOPMENT_VERSION',
            {
              label: this.label,
            },
          );
        case this.versionIsOutdated:
          return this.$t(
            'ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VERSION_IS_OUTDATED',
            {
              label: this.label,
              versionRequired: this.versionRequired,
            },
          );
        default:
          return this.$t(
            'ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VERSION_IS_UP_TO_DATE',
            {
              label: this.label,
            },
          );
      }
    },
  },
  methods: {
    compareVersion() {
      return false;
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

$icon-size: 1.125rem;

.version-status {
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  height: 100%;
  left: var.$space-medium;
  font-size: $icon-size;
  color: var.$status-success;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    display: block;
    border-radius: 100%;
    height: calc(#{$icon-size} - 2px);
    width: calc(#{$icon-size} - 2px);
    background-color: #fff;
    top: 0;
    bottom: 0;
    margin: 0;
    left: 0;
    z-index: 1;
  }
}

.version-status__icon {
  position: absolute;
  z-index: 2;
  cursor: help;

  &.fa-question-circle {
    color: var.$status-warning;
  }

  &.fa-times-circle {
    color: var.$status-error;
  }
}

.plugin-versions__label {
  margin-left: 1.825rem;
  display: inline-block;
}

.plugin-versions__version {
  @include utils.typeface-code;
}
</style>
