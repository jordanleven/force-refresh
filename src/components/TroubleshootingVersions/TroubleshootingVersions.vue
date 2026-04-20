<template>
  <BaseDescriptiveList>
    <template #term>
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
    </template>
    <template #definition>
      <span class="plugin-versions__version">{{ version }}</span>
    </template>
  </BaseDescriptiveList>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import BaseDescriptiveList from '@/components/BaseDescriptiveList/BaseDescriptiveList.vue';
import BaseTooltip from '@/components/BaseTooltip/BaseTooltip.vue';
import { versionSatisfies, isDevelopmentVersion, getSanitizedVersion } from '@/js/admin/compare-versions.js';

library.add(faTriangleExclamation);

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

.tip-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 0.25rem;
}

/* Green — circle with checkmark */
.tip-dot--green {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: var.$green;
  box-shadow: 0 0 0 2.5px rgba(var.$green, 0.2);

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
  background: var.$red;
  color: #fff;
  font-size: 0.5625rem;
  font-weight: 800;
  box-shadow: 0 0 0 0 rgba(var.$red, 0.4);
  animation: pulse-red 1.6s ease-out infinite;

  &::after {
    content: "!";
    line-height: 1;
  }
}

@keyframes pulse-red {
  0%   { box-shadow: 0 0 0 0 rgba(var.$red, 0.45); }
  70%  { box-shadow: 0 0 0 0.375rem rgba(var.$red, 0); }
  100% { box-shadow: 0 0 0 0 rgba(var.$red, 0); }
}

/* Orange — FA triangle for pre-release */
.tip-dot--prerelease {
  color: var.$orange;
  font-size: 0.875rem;
  flex-shrink: 0;
}
</style>
