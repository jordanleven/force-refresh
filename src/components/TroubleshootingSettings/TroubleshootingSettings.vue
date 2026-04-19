<template>
  <div>
    <TroubleshootingRow
      v-for="({ label, value }, index) in settings"
      :key="index"
    >
      <template #label>
        {{ label }}
      </template>
      <template #value>
        <span class="setting-value">
          {{ value }}
        </span>
      </template>
    </TroubleshootingRow>
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import TroubleshootingRow from '@/components/TroubleshootingRow/TroubleshootingRow.vue';

export default {
  name: 'TroubleshootingSettings',
  components: {
    TroubleshootingRow,
  },
  props: {
    settings: VueTypes.array.def([]),
  },
};
</script>

<style lang="scss" scoped>
.setting-value {
  color: #6e6e73;
}
</style>
