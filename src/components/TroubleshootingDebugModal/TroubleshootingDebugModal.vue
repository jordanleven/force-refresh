<template>
  <BaseModal
    :is-open="isOpen"
    variant="bottom-sheet"
    max-width="40rem"
    :show-default-footer="false"
    :show-divider="status !== 'sent'"
    :show-header-close-button="status !== 'sent'"
    :scroll-inner="false"
    @close="onClose"
  >
    <template
      v-if="!isStatusSent"
      #header
    >
      <p class="debug-modal__title">
        {{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_TITLE') }}
      </p>
    </template>

    <template
      v-if="!isStatusSent && isFetchedDataAvailable"
      #subheader
    >
      <div class="debug-modal__note">
        <font-awesome-icon
          class="debug-modal__note-icon"
          :icon="faCircleInfo"
        />
        <span>{{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_NOTE', { email: submitterEmail }) }}</span>
      </div>
    </template>

    <div
      v-if="isStatusSent"
      class="debug-modal__sent"
      data-test="debug-email-sent"
    >
      <div class="debug-modal__sent-icon">
        <font-awesome-icon :icon="faCheck" />
      </div>
      <p class="debug-modal__sent-title">
        {{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SENT_TITLE') }}
      </p>
      <p class="debug-modal__sent-subtitle">
        {{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SENT_SUBTITLE') }}
      </p>
      <button
        class="button-primary"
        data-test="btn-debug-email-done"
        @click="onClose"
      >
        {{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_BUTTON_DONE') }}
      </button>
    </div>

    <div
      v-else
      class="debug-modal__body"
    >
      <template v-if="isStatusLoading">
        <div class="debug-modal__loading">
          <div
            v-for="n in payloadRowCount"
            :key="n"
            class="debug-modal__skeleton-row"
          />
        </div>
      </template>

      <template v-else>
        <div class="debug-modal__field">
          <p class="debug-modal__field-description">
            {{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_DESCRIPTION') }}
          </p>
          <input
            id="debug-support-topic-url"
            v-model.trim="supportTopicUrl"
            class="debug-modal__field-input"
            :class="supportTopicUrlError && 'debug-modal__field-input--error'"
            type="url"
            :placeholder="$t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_PLACEHOLDER')"
            @input="onSupportTopicUrlInput"
          >
          <p
            v-if="supportTopicUrlError"
            class="debug-modal__field-error"
          >
            <font-awesome-icon :icon="faCircleExclamation" />
            {{ supportTopicUrlError }}
          </p>
        </div>

        <div class="debug-modal__rows">
          <div
            v-for="row in payloadRows"
            :key="row.label"
            class="debug-modal__row"
          >
            <span class="debug-modal__row-label">{{ row.label }}</span>
            <span class="debug-modal__row-value">{{ row.value }}</span>
          </div>
        </div>

        <p
          v-if="isStatusError && requestError"
          class="debug-modal__error"
        >
          {{ requestError }}
        </p>
      </template>
    </div>

    <template
      v-if="status !== 'sent'"
      #footer
    >
      <div class="debug-modal__footer">
        <button
          class="button"
          data-test="btn-cancel-debug-email"
          @click="onClose"
        >
          {{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_BUTTON_CANCEL') }}
        </button>
        <button
          class="button-primary"
          data-test="btn-send-debug-email"
          :disabled="isSendButtonDisabled"
          @click="onSend"
        >
          {{ status === 'sending'
            ? $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_BUTTON_SENDING')
            : $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_BUTTON_SEND') }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faCircleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import BaseModal from '@/components/BaseModal/BaseModal.vue';
import { getDebugEmailData, sendDebugEmail } from '@/js/services/admin/forceRefreshAdminService.js';

library.add(faCheck, faCircleExclamation, faCircleInfo);

const STATUS = {
  ERROR: 'error',
  IDLE: 'idle',
  LOADING: 'loading',
  SENDING: 'sending',
  SENT: 'sent',
};

export default {
  name: 'TroubleshootingDebugModal',
  components: {
    BaseModal,
  },
  props: {
    isOpen: VueTypes.bool.isRequired,
  },
  emits: ['close'],
  data() {
    return {
      fetchedData: null,
      requestError: '',
      status: STATUS.IDLE,
      supportTopicUrl: '',
      supportTopicUrlError: '',
    };
  },
  computed: {
    isFetchedDataAvailable() {
      return !!this.fetchedData;
    },
    isSendButtonDisabled() {
      const allowedStatuses = [STATUS.LOADING, STATUS.SENDING];
      return allowedStatuses.includes(this.status) || !this.supportTopicUrl;
    },
    isStatusError() {
      return this.status === STATUS.ERROR;
    },
    isStatusLoading() {
      return this.status === STATUS.LOADING;
    },
    isStatusSent() {
      return this.status === STATUS.SENT;
    },
    payloadRowCount() {
      return this.payloadRows.length || 7;
    },
    payloadRows() {
      if (!this.fetchedData) return [];
      return this.fetchedData.debugData.map((row) => ({
        label: this.$t(row.key),
        value: row.value,
      }));
    },
    submitterEmail() {
      return this.fetchedData?.submitterEmail ?? '';
    },
  },
  watch: {
    async isOpen(val) {
      if (val) {
        this.status = STATUS.LOADING;
        const result = await getDebugEmailData();
        const data = result?.data ?? null;
        if (!data?.submitterEmail) {
          this.onClose();
          return;
        }
        this.fetchedData = data;
        this.requestError = '';
        this.supportTopicUrlError = '';
        this.status = STATUS.IDLE;
      } else {
        setTimeout(() => {
          this.requestError = '';
          this.status = STATUS.IDLE;
          this.fetchedData = null;
          this.supportTopicUrl = '';
          this.supportTopicUrlError = '';
        }, 450);
      }
    },
  },
  created() {
    this.faCheck = faCheck;
    this.faCircleExclamation = faCircleExclamation;
    this.faCircleInfo = faCircleInfo;
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    async onSend() {
      if (!this.supportTopicUrl) {
        this.supportTopicUrlError = this.$t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_REQUIRED');
        return;
      }

      this.requestError = '';
      this.supportTopicUrlError = '';
      this.status = STATUS.SENDING;
      const result = await sendDebugEmail({ supportTopicUrl: this.supportTopicUrl });
      const succeeded = result?.code >= 200 && result?.code < 300;

      if (succeeded) {
        this.status = STATUS.SENT;
        return;
      }

      if (result?.data?.field === 'supportTopicUrl') {
        this.supportTopicUrlError = result?.message
          ? this.$t(result.message)
          : this.$t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_ERROR');
      } else {
        this.requestError = result?.message
          ? this.$t(result.message)
          : this.$t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_ERROR');
      }

      this.status = STATUS.ERROR;
    },
    onSupportTopicUrlInput() {
      this.requestError = '';
      this.supportTopicUrlError = '';
    },
  },
};
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

@mixin debug-modal-panel {
  border-radius: utils.$card-radius-default;
  overflow: hidden;
  border: 1px solid rgba(var.$black, 0.06);
  background: rgba(var.$white, 0.6);
}

.debug-modal {
  &__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var.$text-primary;
    letter-spacing: -0.02em;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.375rem;
  }

  &__note {
    background: rgba(var.$blue, 0.08);
    border-radius: utils.$card-radius-default;
    padding: 0.625rem 0.875rem;
    font-size: 0.8125rem;
    color: color.adjust(var.$blue, $lightness: -15%);
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    line-height: 1.5;
    border: 1px solid rgba(var.$blue, 0.12);
  }

  &__note-icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  &__field {
    margin-bottom: 0.875rem;
  }

  &__field-description {
    font-size: 0.8125rem;
    color: var.$text-secondary;
    margin-bottom: 0.5rem;
    line-height: 1.45;
  }

  &__field-input {
    width: 100%;
    border: 1px solid rgba(var.$black, 0.1);
    border-radius: utils.$card-radius-default;
    background: rgba(var.$white, 0.82);
    color: var.$text-primary;
    font-size: 0.875rem;
    padding: 0.75rem 0.875rem;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;

    &:focus {
      outline: none;
      border-color: rgba(var.$blue, 0.55);
      box-shadow: 0 0 0 3px rgba(var.$blue, 0.16);
    }

    &--error {
      border-color: rgba(var.$red, 0.4);
      box-shadow: 0 0 0 3px rgba(var.$red, 0.1);
    }
  }

  &__field-error {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var.$red;
    margin-top: 0.5rem;
  }

  &__rows {
    @include debug-modal-panel;
  }

  &__loading {
    @include debug-modal-panel;

    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.625rem 0.875rem;
  }

  &__skeleton-row {
    height: 0.8125rem;
    border-radius: 0.375rem;
    background: rgba(var.$black, 0.07);
    animation: debug-modal-shimmer 1.4s ease-in-out infinite;

    &:nth-child(odd) { width: 60%; }
    &:nth-child(even) { width: 80%; }
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0.875rem;
    border-bottom: 1px solid rgba(var.$black, 0.05);
    gap: 1rem;

    &:last-child {
      border-bottom: none;
    }
  }

  &__row-label {
    font-size: 0.8125rem;
    color: var.$text-secondary;
    flex-shrink: 0;
  }

  &__row-value {
    font-size: 0.8125rem;
    color: var.$text-primary;
    font-weight: 500;
    text-align: right;
    overflow-wrap: anywhere;
  }

  &__error {
    font-size: 0.8125rem;
    color: var.$red;
    margin-top: 0.75rem;
    text-align: center;
  }

  &__footer {
    padding: 0.75rem 1.375rem 2.25rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  &__sent {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.875rem;
    padding: 3.25rem 1.25rem 2.5rem;
  }

  &__sent-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: var.$green;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var.$white;
    font-size: 1.375rem;
    animation: debug-modal-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 0.5rem 1.5rem rgba(var.$green, 0.4);
  }

  &__sent-title {
    font-size: 1.1875rem;
    font-weight: 600;
    color: var.$text-primary;
    letter-spacing: -0.015em;
  }

  &__sent-subtitle {
    font-size: 0.875rem;
    color: var.$text-secondary;
  }
}

@keyframes debug-modal-pop-in {
  from {
    transform: scale(0);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes debug-modal-shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
