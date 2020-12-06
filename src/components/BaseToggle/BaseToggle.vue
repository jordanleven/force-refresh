<template>
  <div class="c-base-toggle">
    <input
      :id="id"
      :checked="checked"
      type="checkbox"
      @change="inputWasToggled"
    >
    <label :for="id">{{ $t('FORM_BUTTONS_GENERIC.TOGGLE') }}</label>
  </div>
</template>

<script>
import Uniqid from 'uniqid';
import VueTypes from 'vue-types';

export default {
  component: 'BaseToggle',
  props: {
    isChecked: VueTypes.bool.def(true),
  },
  data() {
    return {
      id: Uniqid(),
    };
  },
  computed: {
    checked() {
      return this.isChecked ? 'checked' : '';
    },
  },
  methods: {
    inputWasToggled() {
      this.$emit('toggled', !this.isChecked);
    },
  },
};
</script>

<style scoped lang="scss">
@use '@/scss/variables' as var;

$toggle-height: 30px;
$padding: $toggle-height * 0.1;

.c-base-toggle {
  position: relative;
}

label {
  cursor: pointer;
  text-indent: -9999px;
  width: $toggle-height * 2;
  height: $toggle-height;
  background: grey;
  display: block;
  border-radius: $toggle-height;
  position: relative;
  transition: all 200ms;

  &::after {
    content: '';
    position: absolute;
    top: $padding;
    left: $padding;
    width: $toggle-height - ($padding * 2);
    height: $toggle-height - ($padding * 2);
    background: #fff;
    border-radius: $toggle-height - ($padding * 2);
    transition: all 300ms;
  }
}

input[type=checkbox] {
  position: absolute;
  top: 0;
  left: 0;
  height: 0;
  width: 0;
  visibility: hidden;

  &:checked + label {
    background: var.$green;

    &::after {
      left: calc(100% - #{$padding});
      transform: translateX(-100%);
    }
  }
}

</style>
