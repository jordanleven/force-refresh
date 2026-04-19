<template>
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
@use "@/scss/variables" as var;

.descriptive-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1.125rem;
  font-size: 0.844rem;
  font-weight: 400;
  font-family: var.$font-family-system;
  border-bottom: 1px solid var.$border-subtle;
  margin: 0;

  dt,
  dd {
    display: flex;
    margin: 0;
    padding: 0;
  }

  dt {
    flex: 1;
    color: var.$text-primary;
  }

  dd {
    text-align: right;
    margin-left: auto;
    color: var.$text-secondary;
  }

  &:last-child {
    border-bottom: none;
  }
}
</style>
