<template>
  <BaseDescriptiveList>
    <template #term>
      <div class="health-check__label">
        <BaseTooltip :content="tooltipContent">
          <span class="status-indicator" :class="statusClass">
            <font-awesome-icon :icon="statusIcon" />
          </span>
        </BaseTooltip>
        {{ label }}
      </div>
    </template>
    <template #definition>
      <span class="health-check__value">{{ valueLabel }}</span>
    </template>
  </BaseDescriptiveList>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faExclamation, faMinus } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import BaseDescriptiveList from '@/components/BaseDescriptiveList/BaseDescriptiveList.vue';
import BaseTooltip from '@/components/BaseTooltip/BaseTooltip.vue';

library.add(faCheck, faExclamation, faMinus);

export default {
  name: 'TroubleshootingHealthCheck',
  components: {
    BaseDescriptiveList,
    BaseTooltip,
  },
  props: {
    label: VueTypes.string.isRequired,
    supported: VueTypes.oneOfType([Boolean, null]).def(null),
    tooltipNotSupported: VueTypes.string.def(''),
    tooltipSupported: VueTypes.string.def(''),
    unsupportedVariant: VueTypes.oneOf(['error', 'neutral']).def('error'),
  },
  computed: {
    statusClass() {
      if (this.supported === null) return 'status-indicator--loading';
      if (this.supported) return 'status-indicator--okay';
      return this.unsupportedVariant === 'neutral'
        ? 'status-indicator--neutral'
        : 'status-indicator--error';
    },
    statusIcon() {
      if (this.supported === null) return faMinus;
      if (this.supported) return faCheck;
      return this.unsupportedVariant === 'neutral' ? faMinus : faExclamation;
    },
    tooltipContent() {
      if (this.supported === null) return '';
      return this.supported ? this.tooltipSupported : this.tooltipNotSupported;
    },
    valueLabel() {
      if (this.supported === null) return this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VALUE_CHECKING');
      return this.supported
        ? this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VALUE_SUPPORTED')
        : this.$t('ADMIN_TROUBLESHOOTING.TROUBLESHOOTING_VALUE_NOT_SUPPORTED');
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

.health-check__label {
  display: flex;
  align-items: center;
  gap: var.$space-small;
  color: var.$text-primary;
}

.health-check__value {
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

  &--loading {
    background: var.$dark-grey;
    opacity: 0.4;
  }

  &--neutral {
    background: var.$dark-grey;
    box-shadow: 0 0 0 2.5px rgba(var.$dark-grey, 0.16);
  }
}
</style>
