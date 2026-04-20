<template>
  <BaseDescriptiveList>
    <template #term>
      <div class="plugin-versions__label">
        <BaseTooltip :content="versionTip">
          <span class="status-indicator" :class="statusClass">
            <font-awesome-icon :icon="statusIcon" />
          </span>
        </BaseTooltip>
        {{ label }} {{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_VERSION') }}
      </div>
    </template>
    <template #definition>
      <span class="plugin-versions__version">{{ version }}</span>
    </template>
  </BaseDescriptiveList>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faInfo, faExclamation } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import BaseDescriptiveList from '@/components/BaseDescriptiveList/BaseDescriptiveList.vue';
import BaseTooltip from '@/components/BaseTooltip/BaseTooltip.vue';
import { versionSatisfies, isDevelopmentVersion, getSanitizedVersion } from '@/js/admin/compare-versions.js';

library.add(faCheck, faInfo, faExclamation);

export default {
  name: 'TroubleshootingVersions',
  components: {
    BaseDescriptiveList,
    BaseTooltip,
  },
  props: {
    label: VueTypes.string.isRequired,
    version: VueTypes.string.isRequired,
    versionRequired: VueTypes.oneOfType([String, null]),
  },
  computed: {
    statusClass() {
      if (this.versionIsDevelopmentVersion) return 'status-indicator--warning';
      if (this.versionIsOutdated) return 'status-indicator--error';
      return 'status-indicator--okay';
    },
    statusIcon() {
      if (this.versionIsDevelopmentVersion) return faInfo;
      return this.versionIsOutdated ? faExclamation : faCheck;
    },
    versionIsDevelopmentVersion() {
      return isDevelopmentVersion(this.version);
    },
    versionIsOutdated() {
      const versionSanitized = getSanitizedVersion(this.version);
      return !versionSatisfies(this.versionRequired, versionSanitized);
    },
    versionTip() {
      if (this.versionIsDevelopmentVersion) {
        return this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VERSION_IS_DEVELOPMENT_VERSION', { label: this.label });
      }
      if (this.versionIsOutdated) {
        return this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VERSION_IS_OUTDATED', {
          label: this.label,
          versionRequired: this.versionRequired,
        });
      }
      return this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VERSION_IS_UP_TO_DATE', { label: this.label });
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

.plugin-versions__label {
  display: flex;
  align-items: center;
  gap: var.$space-small;
  color: var.$text-primary;
}

.plugin-versions__version {
  color: var.$text-secondary;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 0.25rem;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  color: #fff;
  font-size: 0.5rem;
  background: var.$dark-grey;

  &--okay {
    background: var.$green;
    box-shadow: 0 0 0 2.5px rgba(var.$green, 0.2);
  }

  &--error {
    background: var.$red;
    box-shadow: 0 0 0 0 rgba(var.$red, 0.4);
    @include utils.animation('sonar-error', 1.6s, ease-out infinite);
    @include utils.generate-animation('sonar-error') {
      0%   { box-shadow: 0 0 0 0 rgba(var.$red, 0.45); }
      70%  { box-shadow: 0 0 0 0.375rem rgba(var.$red, 0); }
      100% { box-shadow: 0 0 0 0 rgba(var.$red, 0); }
    }
  }

  &--warning {
    background: var.$orange;
    box-shadow: 0 0 0 0 rgba(var.$orange, 0.4);
    @include utils.animation('sonar-warning', 1.6s, ease-out infinite);
    @include utils.generate-animation('sonar-warning') {
      0%   { box-shadow: 0 0 0 0 rgba(var.$orange, 0.45); }
      70%  { box-shadow: 0 0 0 0.375rem rgba(var.$orange, 0); }
      100% { box-shadow: 0 0 0 0 rgba(var.$orange, 0); }
    }
  }
}
</style>
