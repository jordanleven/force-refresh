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
        {{ label }} Version:
      </div>
    </template>
    <template #definition>
      <span class="plugin-versions__version">{{ version }}</span>
    </template>
  </BaseDescriptiveList>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import compareVersions from 'compare-versions';
import VueTypes from 'vue-types';
import BaseDescriptiveList from '@/components/BaseDescriptiveList/BaseDescriptiveList.vue';

library.add([faCheckCircle, faTimesCircle]);

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
    versionIsOutdated() {
      return compareVersions(this.version, this.versionRequired) === -1;
    },
    versionStatus() {
      return this.versionIsOutdated ? faTimesCircle : faCheckCircle;
    },
    versionStatusMessage() {
      return this.versionIsOutdated
        ? `Your version of ${this.label} is outdated. Please update to version ${this.versionRequired}.`
        : `Your version of ${this.label} is up-to-date.`;
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
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;

$ICON_SIZE: 1.125rem;

.version-status {
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  height: 100%;
  left: var.$space-medium;
  font-size: $ICON_SIZE;
  color: var.$status-success;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    display: block;
    border-radius: 100%;
    height: calc(#{$ICON_SIZE} - 2px);
    width: calc(#{$ICON_SIZE} - 2px);
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

  &.fa-times-circle {
    color: var.$status-error;
  }
}

.plugin-versions__label {
  margin-left: 1.825rem;
  display: inline-block;
}

.plugin-versions__version {
  @include utils.typeface-code();
}
</style>
