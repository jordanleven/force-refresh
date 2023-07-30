<template>
  <div class="force-refresh-admin__options">
    <div class="force-refresh-admin__options-inner">
      <h3 class="force-refresh-options-header">
        {{ $t('ADMIN_SETTINGS.OPTIONS_HEADER') }}
      </h3>
      <form class="force-refresh-admin__options-form" @submit.prevent="">
        <div class="option-group">
          <label for="show-in-wp-admin-bar">{{ $t('ADMIN_SETTINGS.OPTION_REFRESH_FROM_ADMIN_BAR') }}</label>
          <select
            v-model="optionSelectedShowRefreshInMenuBar"
            type="select"
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
          <label for="refresh-interval">{{ $t('ADMIN_SETTINGS.OPTION_REFRESH_INTERVAL') }}</label>
          <select
            v-model="optionSelectedRefreshInterval"
            type="select"
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
          <label for="show-in-wp-admin-bar">{{ $t('ADMIN_SETTINGS.OPTION_REFRESH_INTERVAL_CUSTOM') }}</label>
          <input
            v-model="optionSelectedRefreshIntervalCustom"
            type="number"
            step="any"
            :max="refreshOptions.customRefreshIntervalMaximumInMinutes"
            :min="refreshOptions.customRefreshIntervalMinimumInMinutes"
          >
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
      </form>
    </div>
    <div class="force-refresh-admin__options-utilities">
      <div class="force-refresh-admin__options-utility">
        <button
          class="button button-secondary"
          @click="pageClickedTroubleshooting"
        >
          {{ $t("ADMIN_TROUBLESHOOTING.BUTTON_ENTER_TROUBLESHOOTING_MODE") }}
        </button>
      </div>
      <div class="force-refresh-admin__options-utility">
        <button
          class="button button-secondary"
          @click="pageClickedReleaseNotes"
        >
          {{ $t("ADMIN_SETTINGS.OPTIONS_UTILITY_VIEW_RELEASE_NOTES") }}
        </button>
      </div>
      <div class="force-refresh-admin__options-utility force-refresh-admin__options-utility-leave-review">
        <a href="https://wordpress.org/support/plugin/force-refresh/reviews/#new-post" target="_blank">
          <font-awesome-icon
            class="leave-review-icon"
            :icon="leaveReviewLogo"
          />
          {{ $t("ADMIN_SETTINGS.OPTIONS_UTILITY_LEAVE_REVIEW") }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';

library.add([faHeart]);

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
  props: {
    refreshOptions: VueTypes.shape({
      customRefreshIntervalMaximumInMinutes: VueTypes.isRequired,
      customRefreshIntervalMinimumInMinutes: VueTypes.isRequired,
      refreshInterval: VueTypes.number.isRequired,
      showRefreshInMenuBar: VueTypes.bool.isRequired,
    }),
  },
  emits: ['options-were-updated', 'troubleshooting-page-clicked', 'release-notes-page-clicked'],
  data() {
    return {
      isCustomIntervalWithinBounds: true,
      leaveReviewLogo: faHeart,
      optionSelectedRefreshInterval: null,
      optionSelectedRefreshIntervalCustom: null,
      optionSelectedShowRefreshInMenuBar: null,
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
  },
  created() {
    const existingRefreshInterval = this.refreshOptions?.refreshInterval;
    const isExistingRefreshIntervalCustom = !OPTIONS_REFRESH_INTERVALS_IN_SECONDS.includes(existingRefreshInterval);

    this.optionSelectedShowRefreshInMenuBar = this.refreshOptions?.showRefreshInMenuBar;
    this.optionSelectedRefreshIntervalCustom = this.getMinutesFromSeconds(existingRefreshInterval);

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
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

@include utils.generate-animation("logo-excited") {
  0% { transform: translateY(0) }
  25% { transform: translateY(2px) }
  50% { transform: translateY(-2px) }
  75% { transform: translateY(2px) }
  100% { transform: translateY(0) }
}

@include utils.generate-animation('line-grow-and-face') {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
    width: 100%;
  }
}

.force-refresh-admin__options-inner {
  padding: 0 20px 10px;
  background-color: white;
  border: 2px solid var.$light_grey;
  border-radius: 10px;

  @include utils.small {
    margin: 0 20px;
  }

  .force-refresh-options-header {
    text-align: center;
  }

  .option-group {
    margin-bottom: 10px;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    > label {
      flex: 1;
    }

    > input,
    > select {
      flex: 1;
    }

    &--error {
      color: var.$status-error;

      input {
        color: var.$status-error;
      }
    }
  }
}

.force-refresh-admin__options-utilities {
  text-align: right;

  @include utils.small {
    margin: 50px 20px 0;
  }

  .force-refresh-admin__options-utility {
    margin-bottom: 0.5rem;

    &.force-refresh-admin__options-utility-leave-review {
      margin-top: 2rem;

      a {
        color: var.$blue;
        text-decoration: none;
        display: inline-block;
        position: relative;

        &::after {
          display: block;
          right: left;
          left: 0;
          position: absolute;
          content: '';
          height: 1px;
          width: 0;
          background-color: var.$blue;
        }

        .leave-review-icon {
          transition: color var.$transition-short;
        }

        &:hover {
          .leave-review-icon {
            color: var.$red;

            @include utils.animation("logo-excited", var.$transition-medium, ease);
          }

          &::after {
            @include utils.animation('line-grow-and-face', var.$transition-medium, ease);

            animation-fill-mode: forwards;
          }
        }
      }
    }
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
