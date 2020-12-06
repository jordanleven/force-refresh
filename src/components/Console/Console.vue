<template>
  <div class="console-window">
    <highlightjs
      v-for="(codeOutput, index) in output"
      :key="index"
      class="console-window__code"
      language="verilog"
      :code="codeOutput"
    />
  </div>
</template>

<script>
import VueTypes from 'vue-types';

export default {
  name: 'Console',
  props: {
    output: VueTypes.array.def([]),
  },
};
</script>

<style lang="scss">
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;
@import 'highlight.js/styles/monokai-sublime.css';

pre,
code {
  margin: 0;
  padding: 0;
}

.console-window__code code {
  @include utils.typeface-code();
  background-color: transparent;
}
</style>

<style lang="scss" scoped>
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;

.console-window {
  border-radius: 5px;
  padding: var.$space-medium var.$space-small;
  background-color: #000;
}

</style>
