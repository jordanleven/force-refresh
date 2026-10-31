<template>
  <FontAwesomeIcon class="icon" :icon="definition" :style="iconStyle" aria-hidden="true" focusable="false" />
</template>

<script>
import { faClock as clockOutline } from '@fortawesome/free-regular-svg-icons';
import {
  faArrowsRotate, faCheck, faSpinner, faChevronLeft, faChevronRight,
  faChevronDown, faXmark, faStar, faArrowUpRightFromSquare,
  faCircleInfo, faCircleExclamation, faPaperPlane, faBug, faTriangleExclamation, faInfo, faExclamation, faArrowUp, faFlask,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const icons = {
  'arrow-up': faArrowUp,
  'arrow-up-right': faArrowUpRightFromSquare,
  bug: faBug,
  check: faCheck,
  'chevron-down': faChevronDown,
  'chevron-left': faChevronLeft,
  'chevron-right': faChevronRight,
  'circle-exclamation': faCircleExclamation,
  'circle-info': faCircleInfo,
  'clock-outline': clockOutline,
  close: faXmark,
  exclamation: faExclamation,
  flask: faFlask,
  info: faInfo,
  'paper-plane': faPaperPlane,
  refresh: faArrowsRotate,
  spinner: faSpinner,
  star: faStar,
  'triangle-exclamation': faTriangleExclamation,
};

export default {
  // Public component name follows the product's shared Icon API.
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Icon',
  components: { FontAwesomeIcon },
  props: {
    name: { type: String, required: true, validator: (value) => Object.hasOwn(icons, value) },
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
