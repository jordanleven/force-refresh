<template functional>
  <dl class="descriptive-list">
    <dt>
      <slot name="term" />
    </dt>
    <dd>
      <slot name="definition" />
    </dd>
  </dl>
</template>

<script>
export default {
  name: 'BaseDescriptiveList',
};
</script>

<style lang="scss" scoped>
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;

$ICON_SIZE: 1.125rem;

.descriptive-list {
  padding: var.$space-medium;
  font-size: 0.825rem;
  margin: 0;
  position: relative;
  display: flex;

  &:nth-child(odd) {
    background-color: rgba(var.$medium-grey, 0.5);
  }

  dt,
  dd {
    display: flex;
    margin: 0;
    padding: 0;
  }

  dt {
    flex: 1;
  }

  dd {
    text-align: right;
    margin-left: auto;
  }
}
</style>
