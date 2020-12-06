<template>
  <div>
    <TroubleshootingVersions
      v-for="({ label, version, versionRequired }, index) in versions"
      :key="index"
      :label="label"
      :version="version"
      :version-required="versionRequired"
    />
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import TroubleshootingVersions from '@/components/TroubleshootingVersions/TroubleshootingVersions.vue';

export default {
  name: 'TroubleshootingVersionsList',
  components: {
    TroubleshootingVersions,
  },
  props: {
    versions: VueTypes.arrayOf(
      VueTypes.shape(TroubleshootingVersions.props),
    ),
  },
};
</script>
