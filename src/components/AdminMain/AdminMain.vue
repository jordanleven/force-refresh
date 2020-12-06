<template>
  <div class="force-refresh__container">
    <AdminMainRefresh
      class="force-refresh__main"
      :site-name="siteName"
      v-on="$listeners"
    />
    <AdminMainOptions
      v-if="refreshOptions"
      class="force-refresh__options"
      :refresh-options="refreshOptions"
      v-on="$listeners"
    />
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import AdminMainOptions from '@/components/AdminMainOptions/AdminMainOptions.vue';
import AdminMainRefresh from '@/components/AdminMainRefresh/AdminMainRefresh.vue';

export default {
  name: 'AdminMain',
  components: {
    AdminMainOptions,
    AdminMainRefresh,
  },
  props: {
    refreshOptions: VueTypes.object.isRequired,
    siteName: VueTypes.string.isRequired,
  },
};
</script>

<style lang="scss" scoped>
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;

$MAIN_WINDOW_WIDTH: 65%;

.force-refresh__container {
  @include utils.small() {
    align-items: flex-start;
    display: flex;
  }
}

.force-refresh__main,
.force-refresh-admin__options {
  width: 100%;
}

@include utils.small() {
  .force-refresh__main {
    width: $MAIN_WINDOW_WIDTH;
  }

  .force-refresh-admin__options {
    width: 100% - $MAIN_WINDOW_WIDTH;
  }
}
</style>
