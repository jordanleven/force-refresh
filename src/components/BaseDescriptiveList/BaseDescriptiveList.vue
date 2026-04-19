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
.descriptive-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1.125rem;
  font-size: 0.844rem;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  border-bottom: 1px solid rgb(0, 0, 0, 4%);
  margin: 0;

  dt,
  dd {
    display: flex;
    margin: 0;
    padding: 0;
  }

  dt {
    flex: 1;
    color: #1d1d1f;
  }

  dd {
    text-align: right;
    margin-left: auto;
    color: #6e6e73;
  }

  &:last-child {
    border-bottom: none;
  }
}
</style>
