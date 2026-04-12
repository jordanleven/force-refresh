<template>
  <div
    ref="reference"
    class="tooltip-wrapper"
    @mouseenter="isVisible = true"
    @mouseleave="isVisible = false"
  >
    <slot />
    <Teleport to="body">
      <div
        v-if="content"
        ref="floating"
        class="tooltip"
        :class="{ 'tooltip--visible': isVisible }"
        :style="floatingStyles"
      >
        {{ content }}
      </div>
    </Teleport>
  </div>
</template>

<script>
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from '@floating-ui/vue';
import { ref } from 'vue';
import VueTypes from 'vue-types';

export default {
  name: 'BaseTooltip',
  props: {
    content: VueTypes.string,
  },
  setup() {
    const reference = ref(null);
    const floating = ref(null);
    const isVisible = ref(false);

    const { floatingStyles } = useFloating(reference, floating, {
      middleware: [offset(8), flip(), shift({ padding: 8 })],
      placement: 'bottom',
      whileElementsMounted: autoUpdate,
    });

    return {
      floating,
      floatingStyles,
      isVisible,
      reference,
    };
  },
};
</script>

<style lang="scss">
@use "@/scss/variables" as var;

.tooltip-wrapper {
  display: inline-flex;
  align-items: center;
  cursor: help;
}

.tooltip {
  position: absolute;
  max-width: 18rem;
  padding: var.$space-small var.$space-medium;
  border-radius: calc(var.$border-radius / 2);
  background-color: rgba(var.$black, 0.85);
  color: var.$white;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
  pointer-events: none;
  opacity: 0;
  transition: opacity var.$transition-short;
  z-index: 9999;

  &.tooltip--visible {
    opacity: 1;
  }
}
</style>
