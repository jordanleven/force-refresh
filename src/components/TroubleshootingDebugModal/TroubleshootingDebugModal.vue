<template>
  <Teleport to="body">
    <div
      class="debug-modal__overlay"
      :class="classesOverlay"
      @click.self="onClose"
    >
      <div
        class="debug-modal__sheet"
        :class="classesSheet"
      >
        <div
          v-if="status === 'sent'"
          class="debug-modal__sent"
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
            @click="onClose"
          >
            {{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_BUTTON_DONE') }}
          </button>
        </div>

        <template v-else>
          <div class="debug-modal__header">
            <div>
              <p class="debug-modal__title">
                {{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_TITLE') }}
              </p>
            </div>
            <button
              class="debug-modal__close"
              @click="onClose"
            >
              <font-awesome-icon :icon="faXmark" />
            </button>
          </div>

          <div
            v-if="fetchedData"
            class="debug-modal__note"
          >
            <font-awesome-icon
              class="debug-modal__note-icon"
              :icon="faCircleInfo"
            />
            <span>{{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_NOTE', { email: submitterEmail }) }}</span>
          </div>

          <div class="debug-modal__divider" />

          <div class="debug-modal__body">
            <template v-if="status === 'loading'">
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
                v-if="status === 'error' && requestError"
                class="debug-modal__error"
              >
                {{ requestError }}
              </p>
            </template>
          </div>

          <div class="debug-modal__footer">
            <button
              class="button"
              @click="onClose"
            >
              {{ $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_BUTTON_CANCEL') }}
            </button>
            <button
              class="button-primary"
              :disabled="status === 'loading' || status === 'sending' || !supportTopicUrl"
              @click="onSend"
            >
              {{ status === 'sending'
                ? $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_BUTTON_SENDING')
                : $t('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_BUTTON_SEND') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons';
import VueTypes from 'vue-types';
import { getDebugEmailData, sendDebugEmail } from '@/js/services/admin/refreshService.js';

library.add(faCheck, faCircleInfo, faXmark);

const STATUS_IDLE = 'idle';
const STATUS_LOADING = 'loading';
const STATUS_SENDING = 'sending';
const STATUS_SENT = 'sent';
const STATUS_ERROR = 'error';

export default {
  name: 'TroubleshootingDebugModal',
  props: {
    isOpen: VueTypes.bool.isRequired,
  },
  emits: ['close'],
  data() {
    return {
      fetchedData: null,
      requestError: '',
      status: STATUS_IDLE,
      supportTopicUrl: '',
      supportTopicUrlError: '',
    };
  },
  computed: {
    classesOverlay() {
      return [this.isOpen && 'debug-modal__overlay--open'];
    },
    classesSheet() {
      return [this.isOpen && 'debug-modal__sheet--open'];
    },
    payloadRowCount() {
      return this.payloadRows.length || 7;
    },
    payloadRows() {
      if (!this.fetchedData) return [];
      return this.fetchedData.rows.map((row) => ({
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
        this.status = STATUS_LOADING;
        const result = await getDebugEmailData();
        const data = result?.data ?? null;
        if (!data?.submitterEmail) {
          this.onClose();
          return;
        }
        this.fetchedData = data;
        this.requestError = '';
        this.supportTopicUrlError = '';
        this.status = STATUS_IDLE;
      } else {
        setTimeout(() => {
          this.requestError = '';
          this.status = STATUS_IDLE;
          this.fetchedData = null;
          this.supportTopicUrl = '';
          this.supportTopicUrlError = '';
        }, 450);
      }
    },
  },
  mounted() {
    this.keydownHandler = (e) => { if (e.key === 'Escape') this.onClose(); };
    window.addEventListener('keydown', this.keydownHandler);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.keydownHandler);
  },
  created() {
    this.faCheck = faCheck;
    this.faCircleInfo = faCircleInfo;
    this.faXmark = faXmark;
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
      this.status = STATUS_SENDING;
      const result = await sendDebugEmail({ supportTopicUrl: this.supportTopicUrl });
      const succeeded = result?.code >= 200 && result?.code < 300;

      if (succeeded) {
        this.status = STATUS_SENT;
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

      this.status = STATUS_ERROR;
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

.debug-modal {
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(var.$black, 0);
    z-index: 100000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    pointer-events: none;
    transition: background 0.3s ease;

    &--open {
      background: rgba(var.$black, 0.35);
      pointer-events: all;
    }
  }

  &__sheet {
    background: rgb(245, 245, 247, 92%);
    backdrop-filter: blur(60px) saturate(2.2);

    @include utils.card-radius-top(utils.$card-radius-sheet);

    width: 100%;
    max-width: 40rem;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    transform: translateY(100%);
    transition: transform 0.44s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 -1px 0 rgba(var.$black, 0.05), 0 -0.75rem 3.75rem rgba(var.$black, 0.18);
    border-top: 1px solid rgba(var.$white, 0.7);

    &--open {
      transform: translateY(0);
    }
  }

  &__header {
    padding: 0.875rem 1.375rem 0.75rem;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var.$text-primary;
    letter-spacing: -0.02em;
  }

  &__close {
    width: 1.875rem;
    height: 1.875rem;
    border-radius: 50%;
    background: rgb(118, 118, 128, 14%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    color: var.$text-secondary;
    font-size: 0.875rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
    transition: background 0.12s;

    &:hover {
      background: rgb(118, 118, 128, 22%);
    }
  }

  &__divider {
    height: 1px;
    background: rgba(var.$black, 0.06);
    margin: 0 1.375rem;
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
    margin: 0 1.375rem 0.875rem;
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
    font-size: 0.8125rem;
    color: var.$red;
    margin-top: 0.5rem;
  }

  &__rows {
    border-radius: utils.$card-radius-default;
    overflow: hidden;
    border: 1px solid rgba(var.$black, 0.06);
    background: rgba(var.$white, 0.6);
  }

  &__loading {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-radius: utils.$card-radius-default;
    overflow: hidden;
    border: 1px solid rgba(var.$black, 0.06);
    background: rgba(var.$white, 0.6);
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
    word-break: break-all;
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
