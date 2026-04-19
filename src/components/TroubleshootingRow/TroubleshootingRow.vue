<template>
  <div class="troubleshooting-row">
    <div class="troubleshooting-row__label">
      <slot name="label" />
    </div>
    <div class="troubleshooting-row__value">
      <slot name="value" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'TroubleshootingRow',
};
</script>

<style lang="scss" scoped>
.troubleshooting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1.125rem;
  font-size: 0.844rem;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  border-bottom: 1px solid rgb(0, 0, 0, 4%);

  &:last-child {
    border-bottom: none;
  }
}

.troubleshooting-row__label {
  color: #1d1d1f;
}

.troubleshooting-row__value {
  color: #6e6e73;
}
</style>
