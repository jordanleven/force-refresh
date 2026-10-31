<template>
  <FontAwesomeIcon class="icon" :icon="definition" :style="iconStyle" aria-hidden="true" focusable="false" />
</template>

<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { icons, isIconName } from '@/components/Icon/IconConfig.js';

export default {
  // Public component name follows the product's shared Icon API.
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Icon',
  components: { FontAwesomeIcon },
  props: {
    name: { type: String, required: true, validator: isIconName },
    size: { type: [Number, String], default: null },
  },
  computed: {
    definition() { return icons[this.name]; },
    iconStyle() {
      if (this.size === null) return {};
      return { fontSize: typeof this.size === 'number' ? `${this.size}px` : this.size };
    },
  },
};
</script>

<style lang="scss" scoped>
// Sizing lives in CSS rather than inline styles so consumers can override it.
.icon {
  flex-shrink: 0;
  width: 1em;
  height: 1em;
}
</style>
