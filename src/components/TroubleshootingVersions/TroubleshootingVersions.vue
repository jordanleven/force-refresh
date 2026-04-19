<template>
  <div class="plugin-versions">
    <div class="plugin-versions__label">
      <BaseTooltip :content="versionTip">
        <span
          v-if="!versionIsDevelopmentVersion"
          class="tip-dot"
          :class="statusDotClass"
        />
        <font-awesome-icon
          v-else
          class="tip-dot--prerelease"
          :icon="faTriangleExclamation"
        />
      </BaseTooltip>
      {{ label }} {{ $t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_LABEL_VERSION') }}
    </div>
    <span class="plugin-versions__version">{{ version }}</span>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import BaseTooltip from '@/components/BaseTooltip/BaseTooltip.vue';
import { versionSatisfies, isDevelopmentVersion, getSanitizedVersion } from '@/js/admin/compare-versions.js';

library.add(faTriangleExclamation);

export default {
  name: 'TroubleshootingVersions',
  components: {
    BaseTooltip,
  },
  props: {
    label: VueTypes.string.isRequired,
    version: VueTypes.string.isRequired,
    versionRequired: VueTypes.oneOfType([String, null]),
  },
  data() {
    return {
      faTriangleExclamation,
    };
  },
  computed: {
    statusDotClass() {
      if (this.versionIsOutdated) return 'tip-dot--red';
      return 'tip-dot--green';
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

.plugin-versions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1.125rem;
  font-size: 0.844rem;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  border-bottom: 1px solid rgb(0, 0, 0, 4%);

  &:last-child {
    border-bottom: none;
  }
}

.plugin-versions__label {
  display: flex;
  align-items: center;
  gap: var.$space-small;
  color: #1d1d1f;
}

.plugin-versions__version {
  color: #6e6e73;
}

.tip-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Green — circle with checkmark */
.tip-dot--green {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: #34c759;
  box-shadow: 0 0 0 2.5px rgb(52, 199, 89, 20%);

  &::after {
    content: "✓";
    color: #fff;
    font-size: 0.5rem;
    font-weight: 900;
    line-height: 1;
  }
}

/* Red — filled circle with ! */
.tip-dot--red {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: #ff3b30;
  color: #fff;
  font-size: 0.5625rem;
  font-weight: 800;
  box-shadow: 0 0 0 0 rgb(255, 59, 48, 40%);
  animation: pulse-red 1.6s ease-out infinite;

  &::after {
    content: "!";
    line-height: 1;
  }
}

@keyframes pulse-red {
  0%   { box-shadow: 0 0 0 0 rgb(255, 59, 48, 45%); }
  70%  { box-shadow: 0 0 0 0.375rem rgb(255, 59, 48, 0%); }
  100% { box-shadow: 0 0 0 0 rgb(255, 59, 48, 0%); }
}

/* Orange — FA triangle for pre-release */
.tip-dot--prerelease {
  color: #ff9f0a;
  font-size: 0.875rem;
  flex-shrink: 0;
}
</style>
