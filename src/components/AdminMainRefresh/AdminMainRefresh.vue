<template>
  <div class="admin__container">
    <font-awesome-icon
      class="admin__refresh-logo"
      :class="refreshLogoClass"
      :icon="refreshLogo"
    />
    <p>Here, you can force all user to manually reload the site "{{ siteName }}".</p>
    <button
      type="submit"
      class="button button-primary admin__refresh-button"
      @click="refreshButtonClicked"
    >
      Refresh site
    </button>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';

library.add([faSyncAlt]);

export default {
  name: 'AdminMainRefresh',
  props: {
    siteName: VueTypes.string.isRequired,
  },
  emits: [
    'refresh-requested',
  ],
  data() {
    return {
      refreshLogo: faSyncAlt,
      refreshTriggered: false,
    };
  },
  computed: {
    refreshLogoClass() {
      return {
        'admin__refresh-logo--active': this.refreshTriggered,
      };
    },
  },
  methods: {
    animateLogo() {
      this.refreshTriggered = true;
      setTimeout(() => {
        this.refreshTriggered = false;
      }, 2000);
    },
    emitEventButtonClicked() {
      this.$emit('refresh-requested');
    },
    refreshButtonClicked() {
      this.animateLogo();
      this.emitEventButtonClicked();
    },
  },
};
</script>

<style lang="scss">
@use '@/scss/utilities' as utils;

@include utils.generate-animation('force-refresh--active') {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(180deg);
  }
}

</style>

<style lang="scss" scoped>
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;

.admin__container {
  width: 100%;
  padding: 20px 0 30px;
  text-align: center;
  border: 2px solid var.$light_grey;
  border-radius: 10px;
  background-color: white;
}

.admin__refresh-logo {
  font-size: 40px;
  width: 40px;
  height: 40px;
  margin: 0;

  &.admin__refresh-logo--active {
    @include utils.animation('force-refresh--active', 1000ms, ease);
  }
}

.admin__refresh-button {
  font-size: 1rem;
  display: inline;
  cursor: pointer;
}
</style>
