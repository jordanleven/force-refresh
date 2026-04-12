<template>
  <Tooltip :content="tooltip">
    <component
      :is="componentTag"
      :class="componentClass"
      :href="componentHref"
    >
      <font-awesome-icon class="admin-header-badge__icon" :icon="icon" />
      <span class="admin-header-badge__label">{{ label }}</span>
    </component>
  </Tooltip>
</template>

<script>
import VueTypes from 'vue-types';
import Tooltip from '@/components/Tooltip/Tooltip.vue';

export default {
  name: 'AdminHeaderBadge',
  components: {
    Tooltip,
  },
  props: {
    href: VueTypes.string,
    icon: VueTypes.object.isRequired,
    label: VueTypes.string.isRequired,
    tooltip: VueTypes.string,
    variant: VueTypes.oneOf(['update', 'prerelease', 'debug']).isRequired,
  },
  computed: {
    componentClass() {
      return [
        'admin-header-badge',
        `admin-header-badge--${this.variant}`,
      ];
    },
    componentHref() {
      return this.href || undefined;
    },
    componentTag() {
      return this.href ? 'a' : 'span';
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as var;
@use "@/scss/utilities" as utils;

@include utils.generate-animation("admin-header-badge-arrow-bounce") {
  0%   { transform: translateY(0); }
  25%  { transform: translateY(-4px); }
  50%  { transform: translateY(0); }
  75%  { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}

@include utils.generate-animation("admin-header-badge-debug-glow") {
  0%, 100% {
    box-shadow: 0 0 4px 2px rgba(var.$red, 0.3);
  }

  50% {
    box-shadow: 0 0 15px 4px rgba(var.$red, 0.6);
  }
}

.admin-header-badge {
  display: inline-flex;
  align-items: center;
  gap: var.$space-small;
  padding: 0.5rem 1rem;
  border-radius: var.$border-radius;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  user-select: none;

  &.admin-header-badge--update {
    color: var.$blue;
    background-color: rgba(var.$blue, 0.1);
    transition: background-color var.$transition-short;

    .admin-header-badge__icon {
      transition: transform var.$transition-short;
    }

    &:hover {
      background-color: rgba(var.$blue, 0.2);

      .admin-header-badge__icon {
        @include utils.animation("admin-header-badge-arrow-bounce", var.$transition-medium, ease);
      }
    }
  }

  &.admin-header-badge--prerelease {
    color: var.$orange;
    background-color: rgba(var.$orange, 0.1);
  }

  &.admin-header-badge--debug {
    position: relative;
    color: var.$white;
    background:
      repeating-linear-gradient(
        45deg,
        var.$yellow,
        var.$yellow 6px,
        var.$black 6px,
        var.$black 12px
      );
    animation: admin-header-badge-debug-glow 2s ease-in-out infinite;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background-color: rgba(var.$black, 0.65);
      backdrop-filter: blur(1px);
    }

    .admin-header-badge__icon,
    .admin-header-badge__label {
      position: relative;
      z-index: 1;
    }
  }
}

.admin-header-badge__icon {
  font-size: 0.85em;
}
</style>
