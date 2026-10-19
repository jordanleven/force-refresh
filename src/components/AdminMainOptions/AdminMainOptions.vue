<template>
  <div class="force-refresh-admin__options">
    <div class="force-refresh-admin__options-inner">
      <form class="force-refresh-admin__options-form" @submit.prevent="updateOptionsWasClicked">
        <div class="option-group">
          <label for="show-in-wp-admin-bar">{{ $t('ADMIN_SETTINGS.OPTION_REFRESH_FROM_ADMIN_BAR') }}
            <span>{{ $t('REDESIGN.ADMIN_BAR_DESCRIPTION') }}</span>
          </label>
          <select
            id="show-in-wp-admin-bar"
            v-model="optionSelectedShowRefreshInMenuBar"
            name="show-in-wp-admin-bar"
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
          <label for="refresh-interval">{{ $t('ADMIN_SETTINGS.OPTION_REFRESH_INTERVAL') }}
            <span>{{ $t('REDESIGN.INTERVAL_DESCRIPTION') }}</span>
          </label>
          <select
            id="refresh-interval"
            v-model="optionSelectedRefreshInterval"
            name="refresh-interval"
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
        <div v-if="isSelectedRefreshIntervalCustom" class="option-group" :class="classCustomRefreshInterval">
          <label for="custom-refresh-interval">{{ $t('ADMIN_SETTINGS.OPTION_REFRESH_INTERVAL_CUSTOM') }}</label>
          <input
            id="custom-refresh-interval"
            v-model="optionSelectedRefreshIntervalCustom"
            type="number"
            step="any"
            :max="refreshOptions.customRefreshIntervalMaximumInMinutes"
            :min="refreshOptions.customRefreshIntervalMinimumInMinutes"
          >
        </div>
        <details class="advanced-options">
          <summary>
            <Icon class="advanced-options__chevron" name="chevron-right" /> {{ $t('REDESIGN.ADVANCED') }}
          </summary>
          <div class="option-group">
            <label for="use-static-file-polling">
              {{ $t('ADMIN_SETTINGS.OPTION_UPDATE_METHOD') }}
              <BaseTooltip :content="staticFilePollingTooltip">
                <Icon class="option-group__info-icon" name="circle-info" />
              </BaseTooltip>
            </label>
            <select
              id="use-static-file-polling"
              v-model="optionSelectedUseStaticFilePolling"
              name="use-static-file-polling"
              data-test="select-static-file-polling"
              :disabled="isUsingCdn"
            >
              <option :value="true">
                {{ $t('ADMIN_SETTINGS.OPTION_UPDATE_METHOD_STATIC_FILE') }}
              </option>
              <option :value="false">
                {{ $t('ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WORDPRESS_API') }}
              </option>
            </select>
          </div>
        </details>
        <div class="force-refresh-admin-options-footer">
          <button
            type="submit"
            class="button button-primary"
            data-test="btn-update-options"
          >
            {{ $t('REDESIGN.SAVE_SETTINGS') }}
          </button>
        </div>
      </form>
    </div>
    <div class="force-refresh-admin__options-utilities">
      <div class="force-refresh-admin__options-utility">
        <button
          class="button button-secondary"
          data-test="btn-whats-new"
          @click="pageClickedWhatsNew"
        >
          <Icon name="star" :size="12" /> {{ $t("REDESIGN.WHATS_NEW") }}
        </button>
      </div>
      <div class="force-refresh-admin__options-utility">
        <button
          class="button button-secondary"
          data-test="btn-release-notes"
          @click="pageClickedReleaseNotes"
        >
          {{ $t("ADMIN_SETTINGS.OPTIONS_UTILITY_VIEW_RELEASE_NOTES") }}
        </button>
      </div>
      <div class="force-refresh-admin__options-utility">
        <button
          class="button button-secondary"
          data-test="btn-troubleshooting"
          @click="pageClickedTroubleshooting"
        >
          {{ $t("ADMIN_TROUBLESHOOTING.BUTTON_ENTER_TROUBLESHOOTING_MODE") }}
        </button>
      </div>
      <a class="options-review" href="https://wordpress.org/support/plugin/force-refresh/reviews/#new-post" target="_blank" rel="noopener noreferrer">{{ $t('ADMIN_SETTINGS.OPTIONS_UTILITY_LEAVE_REVIEW') }} <Icon name="arrow-up-right" :size="11" /></a>
    </div>
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import BaseTooltip from '@/components/BaseTooltip/BaseTooltip.vue';
import Icon from '@/components/Icon/Icon.vue';

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

const OPTIONS_REFRESH_INTERVAL_CUSTOM = 'custom';

const OPTIONS_REFRESH_INTERVALS_IN_SECONDS = [
  30,
  60,
  90,
  120,
  180,
];

export default {
  name: 'AdminMainOptions',
  components: {
    BaseTooltip,
    Icon,
  },
  props: {
    detectedCdn: VueTypes.string.def(null),
    refreshOptions: VueTypes.shape({
      customRefreshIntervalMaximumInMinutes: VueTypes.isRequired,
      customRefreshIntervalMinimumInMinutes: VueTypes.isRequired,
      refreshInterval: VueTypes.number.isRequired,
      showRefreshInMenuBar: VueTypes.bool.isRequired,
      useStaticFilePolling: VueTypes.bool.isRequired,
    }),
  },
  emits: [
    'notify-user-of-error',
    'options-were-updated',
    'release-notes-page-clicked',
    'troubleshooting-page-clicked',
    'whats-new-page-clicked',
  ],
  data() {
    return {
      isCustomIntervalWithinBounds: true,
      optionSelectedRefreshInterval: null,
      optionSelectedRefreshIntervalCustom: null,
      optionSelectedShowRefreshInMenuBar: null,
      optionSelectedUseStaticFilePolling: false,
      optionsForceRefreshInMenuBar: OPTIONS_REFRESH_FROM_ADMIN_BAR,
    };
  },
  computed: {

    classCustomRefreshInterval() {
      return [
        !this.isCustomIntervalWithinBounds && 'option-group--error',
      ];
    },
    customRefreshIntervalInMinutes() {
      return this.optionSelectedRefreshIntervalCustom;
    },
    customRefreshIntervalInSeconds() {
      return this.optionSelectedRefreshIntervalCustom * 60;
    },
    isSelectedRefreshIntervalCustom() {
      return this.optionSelectedRefreshInterval === OPTIONS_REFRESH_INTERVAL_CUSTOM;
    },
    isUsingCdn() {
      return this.detectedCdn !== null;
    },
    optionsRefreshIntervals() {
      const coreOptions = OPTIONS_REFRESH_INTERVALS_IN_SECONDS.map((value) => {
        const valueInMinutes = this.getMinutesFromSeconds(value, 10);
        const displayInSeconds = valueInMinutes < 1;
        const displayedValue = displayInSeconds ? value : valueInMinutes;
        const displayedUnit = displayInSeconds
          ? this.$t('ADMIN_SETTINGS.OPTION_REFRESH_INTERVAL_UNIT_SECOND_SINGULAR')
          : this.$t('ADMIN_SETTINGS.OPTION_REFRESH_INTERVAL_UNIT_MINUTE_SINGULAR');

        const pluralModifier = displayedValue === 1 ? '' : this.$t('ADMIN_SETTINGS.OPTION_REFRESH_INTERVAL_UNIT_MODIFIER_PLURAL');

        return {
          option: `${displayedValue} ${displayedUnit}${pluralModifier}`,
          value,
        };
      });

      // Add custom option
      return [
        ...coreOptions,
        {
          option: 'Custom',
          value: 'custom',
        },
      ];
    },
    staticFilePollingTooltip() {
      return this.isUsingCdn
        ? this.$t('ADMIN_SETTINGS.OPTION_UPDATE_METHOD_DISABLED_CDN')
        : this.$t('ADMIN_SETTINGS.OPTION_UPDATE_METHOD_DESCRIPTION');
    },
  },
  created() {
    const existingRefreshInterval = this.refreshOptions?.refreshInterval;
    const isExistingRefreshIntervalCustom = !OPTIONS_REFRESH_INTERVALS_IN_SECONDS.includes(existingRefreshInterval);

    this.optionSelectedShowRefreshInMenuBar = this.refreshOptions?.showRefreshInMenuBar;
    this.optionSelectedRefreshIntervalCustom = this.getMinutesFromSeconds(existingRefreshInterval);
    this.optionSelectedUseStaticFilePolling = this.refreshOptions?.useStaticFilePolling ?? false;

    // If the currently-selected option isn't one of our selections, then we can assume it's a custom
    // value.
    this.optionSelectedRefreshInterval = isExistingRefreshIntervalCustom ? OPTIONS_REFRESH_INTERVAL_CUSTOM : existingRefreshInterval;
  },
  methods: {
    getMinutesFromSeconds(seconds, precision = 10) {
      return Math.floor((seconds * precision) / 60) / precision;
    },
    isCustomRefreshIntervalWithinMinimumAndMaximum(customRefreshInterval) {
      const { customRefreshIntervalMinimumInMinutes, customRefreshIntervalMaximumInMinutes } = this.refreshOptions;
      const isCustomRefreshIntervalAboveMinimum = customRefreshInterval >= customRefreshIntervalMinimumInMinutes;
      const isCustomRefreshIntervalBelowMaximum = customRefreshInterval <= customRefreshIntervalMaximumInMinutes;
      return isCustomRefreshIntervalAboveMinimum && isCustomRefreshIntervalBelowMaximum;
    },
    pageClickedReleaseNotes() {
      this.$emit('release-notes-page-clicked');
    },
    pageClickedTroubleshooting() {
      this.$emit('troubleshooting-page-clicked');
    },
    pageClickedWhatsNew() {
      this.$emit('whats-new-page-clicked');
    },
    updateOptionsWasClicked() {
      const refreshInterval = this.isSelectedRefreshIntervalCustom ? this.customRefreshIntervalInSeconds : this.optionSelectedRefreshInterval;

      // If we're using a custom refresh interval, then check to make sure the interval is within the set minimum and maximum values.
      if (this.isSelectedRefreshIntervalCustom) {
        const { customRefreshIntervalInMinutes } = this;
        this.isCustomIntervalWithinBounds = this.isCustomRefreshIntervalWithinMinimumAndMaximum(customRefreshIntervalInMinutes);

        // Requested custom interval must be within specific set bounds.
        if (!this.isCustomIntervalWithinBounds) {
          const { customRefreshIntervalMinimumInMinutes, customRefreshIntervalMaximumInMinutes } = this.refreshOptions;
          const leadingZero = String(customRefreshIntervalInMinutes)[0] === '.' ? '0' : '';
          const errorMessage = this.$t('ADMIN_NOTIFICATIONS.CUSTOM_INTERVAL_SET_FAILURE', {
            refreshInterval: `${leadingZero}${customRefreshIntervalInMinutes}`,
            refreshIntervalMaximum: customRefreshIntervalMaximumInMinutes,
            refreshIntervalMinimum: customRefreshIntervalMinimumInMinutes,
          });
          this.$emit('notify-user-of-error', errorMessage);
          return;
        }
      }

      this.optionSelectedRefreshIntervalCustom = this.getMinutesFromSeconds(refreshInterval);

      this.$emit('options-were-updated', {
        refreshInterval,
        showRefreshInMenuBar: this.optionSelectedShowRefreshInMenuBar,
        useStaticFilePolling: this.optionSelectedUseStaticFilePolling,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;

.force-refresh-admin__options-inner {
  @include utils.card-surface-raised;
}

.option-group {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 11px 18px;
  border-bottom: 1px solid rgb(0, 0, 0, 4%);
}

.option-group label {
  flex: 1;
  font-size: 13.5px;
  font-weight: 400;
}

.option-group label span {
  display: block;
  color: #6e6e73;
  font-weight: 400;
  font-size: 12px;
  margin-top: 2px;
}

.option-group select, .option-group input {
  width: auto;
  max-width: 45%;
  min-height: 30px;
  height: 30px;
  box-sizing: border-box;
  line-height: 1.3;
  font-size: 13px;
  font-family: inherit;
  color: #1d1d1f;
  background-color: rgb(255, 255, 255, 60%);
  border: 1px solid rgb(0, 0, 0, 10%);
  border-radius: 8px;
  padding: 4px 24px 4px 10px;
  cursor: pointer;
}

.option-group__info-icon {
  margin-left: 4px;
  color: #86868b;
}

.option-group--error {
  color: #d63638;
}

.advanced-options__chevron {
  margin-right: 5px;
  transition: transform 0.15s;
}

.advanced-options[open] .advanced-options__chevron {
  transform: rotate(90deg);
}

.advanced-options summary::marker {
  content: "";
}

.advanced-options summary::-webkit-details-marker {
  display: none;
}

.advanced-options summary {
  list-style: none;
  padding: 10px 18px;
  color: #6e6e73;
  font-size: 12px;
  cursor: pointer;
}

.force-refresh-admin-options-footer {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.force-refresh-admin-options-footer .button, .force-refresh-admin__options-utility .button, .options-review {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  min-height: 30px;
  box-sizing: border-box;
  padding: 0 10px;
  font: inherit;
  font-size: 13px;
  border-radius: 3px;
  background: #f6f7f7;
  border: 1px solid #2271b1;
  color: #2271b1;
  text-decoration: none;
  box-shadow: none;
  cursor: pointer;
}

.force-refresh-admin-options-footer .button {
  color: #fff;
  background: #2271b1;
  box-shadow: 0 1px 0 rgb(0, 0, 0, 10%);
}

.force-refresh-admin__options-utilities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}

.options-review {
  color: #0071e3;
}

@media (width <= 600px) {
  .option-group {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .option-group select, .option-group input {
    width: 100%;
    max-width: 100%;
  }
}
</style>
