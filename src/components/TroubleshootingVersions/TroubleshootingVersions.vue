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
import {
  faCheck,
  faInfo,
  faExclamation,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import BaseDescriptiveList from '@/components/BaseDescriptiveList/BaseDescriptiveList.vue';
import BaseTooltip from '@/components/BaseTooltip/BaseTooltip.vue';
import { versionSatisfies, isDevelopmentVersion, getSanitizedVersion } from '@/js/admin/compare-versions.js';

library.add(faCheck, faInfo, faExclamation, faExclamationTriangle);

export default {
  name: 'TroubleshootingVersions',
  components: {
    BaseDescriptiveList,
    BaseTooltip,
  },
  props: {
    eolDate: VueTypes.oneOfType([String, null]).def(null),
    label: VueTypes.string.isRequired,
    version: VueTypes.string.isRequired,
    versionRequired: VueTypes.oneOfType([String, null]),
  },
  methods: {
    getEolDateObject() {
      if (!this.eolDate) return null;

      const [year, month, day] = this.eolDate.split('-').map(Number);

      if (!year || !month || !day) return null;

      return new Date(year, month - 1, day);
    },
  },
  computed: {
    eolDateFormatted() {
      const eolDate = this.getEolDateObject();

      if (!eolDate) return null;

      return eolDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    },
    statusClass() {
      if (this.versionIsOutdated) return 'status-indicator--error';
      if (this.versionIsDevelopmentVersion || this.versionIsEol) return 'status-indicator--warning';
      return 'status-indicator--okay';
    },
    statusIcon() {
      if (this.versionIsOutdated) return faExclamation;
      if (this.versionIsDevelopmentVersion) return faInfo;
      if (this.versionIsEol) return faExclamationTriangle;
      return faCheck;
    },
    versionIsDevelopmentVersion() {
      return isDevelopmentVersion(this.version);
    },
    versionIsEol() {
      const eolDate = this.getEolDateObject();

      if (!eolDate) return false;

      const today = new Date();
      const todayAtMidnight = new Date( today.getFullYear(), today.getMonth(), today.getDate() );

      return eolDate < todayAtMidnight;
    },
    versionIsOutdated() {
      const versionSanitized = getSanitizedVersion(this.version);
      return !versionSatisfies(this.versionRequired, versionSanitized);
    },
    versionTip() {
      if (this.versionIsOutdated) {
        return this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VERSION_IS_OUTDATED', {
          label: this.label,
          versionRequired: this.versionRequired,
        });
      }
      if (this.versionIsDevelopmentVersion) {
        return this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VERSION_IS_DEVELOPMENT_VERSION', { label: this.label });
      }
      if (this.versionIsEol) {
        return this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VERSION_IS_EOL', {
          eolDate: this.eolDateFormatted,
          label: this.label,
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
