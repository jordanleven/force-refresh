<template>
  <div>
    <BaseDescriptiveList
      v-for="({ label, value }, index) in settings"
      :key="index"
    >
      <template #term>
        {{ label }}
      </template>
      <template #definition>
        <span class="setting-value">
          {{ value }}
        </span>
      </template>
    </BaseDescriptiveList>
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import BaseDescriptiveList from '@/components/BaseDescriptiveList/BaseDescriptiveList.vue';

export default {
  name: 'TroubleshootingSettings',
  components: {
    BaseDescriptiveList,
  },
  props: {
    settings: VueTypes.array.def([]),
  },
};
</script>

<style lang="scss" scoped>
@use '@/scss/utilities' as utils;

.setting-value {
  @include utils.typeface-code();
}
</style>
