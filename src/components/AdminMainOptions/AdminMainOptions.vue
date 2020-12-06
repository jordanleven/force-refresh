<template>
  <div class="force-refresh-admin__options">
    <div class="force-refresh-admin__options-inner">
      <h3 class="force-refresh-options-header">
        {{ $t('ADMIN_SETTINGS.OPTIONS_HEADER') }}
      </h3>
      <div class="option-group">
        <label for="show-in-wp-admin-bar">{{ $t('ADMIN_SETTINGS.OPTION_REFRESH_FROM_ADMIN_BAR') }}</label>
        <select
          v-model="optionSelectedShowRefreshInMenuBar"
          type="select"
        >
          <option
            v-for="({ option, value }, index) in optionsForceRefreshInMenuBar"
            :key="index"
            :value="value"
          >
            {{ option }}
          </option>
        </select>
      </div>
      <div class="option-group">
        <label for="show-in-wp-admin-bar">{{ $t('ADMIN_SETTINGS.OPTION_REFRESH_INTERVAL') }}</label>
        <select
          v-model="optionSelectedRefreshInterval"
          type="select"
        >
          <option
            v-for="({ option, value }, index) in optionsRefreshIntervals"
            :key="index"
            :value="value"
          >
            {{ option }}
          </option>
        </select>
      </div>
      <div class="force-refresh-admin-options-footer">
        <hr>
        <button
          type="submit"
          class="button button-primary"
          @click="updateOptionsWasClicked"
        >
          {{ $t('FORM_BUTTONS_GENERIC.UPDATE') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import VueTypes from 'vue-types';

const OPTIONS_REFRESH_FROM_ADMIN_BAR = [
  {
    option: 'Show',
    value: true,
  },
  {
    option: 'Hide',
    value: false,
  },
];

const OPTIONS_REFRESH_INTERVALS = [
  {
    option: '30 seconds',
    value: 30,
  },
  {
    option: '60 seconds',
    value: 60,
  },
  {
    option: '90 seconds',
    value: 90,
  },
  {
    option: '120 seconds',
    value: 120,
  },
  {
    option: '180 seconds',
    value: 180,
  },
];

export default {
  name: 'AdminMainOptions',
  props: {
    refreshOptions: VueTypes.shape({
      refreshInterval: VueTypes.integer.isRequired,
      showRefreshInMenuBar: VueTypes.bool.isRequired,
    }),
  },
  emits: ['options-were-updated'],
  data() {
    return {
      optionSelectedRefreshInterval: null,
      optionSelectedShowRefreshInMenuBar: null,
      optionsForceRefreshInMenuBar: OPTIONS_REFRESH_FROM_ADMIN_BAR,
      optionsRefreshIntervals: OPTIONS_REFRESH_INTERVALS,
    };
  },
  created() {
    this.optionSelectedShowRefreshInMenuBar = this.refreshOptions?.showRefreshInMenuBar;
    this.optionSelectedRefreshInterval = this.refreshOptions?.refreshInterval;
  },
  methods: {
    updateOptionsWasClicked() {
      this.$emit('options-were-updated', {
        refreshInterval: this.optionSelectedRefreshInterval,
        showRefreshInMenuBar: this.optionSelectedShowRefreshInMenuBar,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;

.force-refresh-admin__options-inner {
  padding: 0 20px 10px;
  background-color: white;
  border: 2px solid var.$light_grey;
  border-radius: 10px;

  @include utils.small() {
    margin: 0 20px;
  }

  .force-refresh-options-header {
    text-align: center;
  }

  .option-group {
    margin-bottom: 10px;
  }
}

.force-refresh-admin-options-footer {
  margin-top: 20px;
  text-align: right;

  button {
    margin-top: 10px;
  }
}
</style>
