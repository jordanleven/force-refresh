<template>
  <BaseModal
    :header="historyOnly ? $t('ADMIN_SETTINGS.OPTIONS_UTILITY_VIEW_RELEASE_NOTES') : $t('RELEASE_NOTES.HEADER')"
    class="whats-new"
    :max-width="historyOnly ? '40rem' : '400px'"
    :polished="true"
    :show-divider="false"
    :show-default-footer="false"
    v-bind="$attrs"
    @modal-was-closed="$emit('modal-was-closed')"
  >
    <template v-if="!historyOnly" #header>
      <div class="whats-new__heading">
        <span class="whats-new__icon" aria-hidden="true">
          <Icon name="star" :size="24" />
        </span>
        <div>
          <h2>{{ $t('RELEASE_NOTES.HEADER') }}</h2>
          <p v-if="currentRelease">
            {{ $t('PLUGIN_NAME_FORCE_REFRESH') }} {{ currentRelease.versionNumber }}
          </p>
        </div>
      </div>
    </template>
    <div data-test="release-notes-modal-content">
      <ul v-if="!historyOnly" class="whats-new__highlights">
        <li v-for="feature in features" :key="feature.key">
          <span class="whats-new__bullet" aria-hidden="true">
            <Icon :size="14" :name="feature.icon" />
          </span>
          <div><h3>{{ $t(`REDESIGN.WHATS_NEW_${feature.key}_TITLE`) }}</h3><p>{{ $t(`REDESIGN.WHATS_NEW_${feature.key}_BODY`) }}</p></div>
        </li>
      </ul>
      <div v-else class="whats-new__history">
        <div v-if="!releaseNotes">
          <p>{{ $t("RELEASE_NOTES.RELEASE_NOTES_UNAVAILABLE") }}</p>
          <div class="release-notes__unavailable">
            <a class="release-notes__unavailable-link button button-primary" href="https://wordpress.org/plugins/force-refresh/#developers" target="_blank">
              {{ $t("RELEASE_NOTES.RELEASE_NOTES_PLUGIN_LINK_TITLE") }}
            </a>
          </div>
        </div>
        <div v-else-if="hasMinorVersionGrouping">
          <section
            v-for="group, groupIndex in groupedReleaseNotes"
            :key="group.minorVersion"
            class="release-note-group"
            :data-test="`release-note-group-${groupIndex}`"
          >
            <button
              type="button"
              class="release-note-group__toggle"
              :aria-label="getMinorVersionToggleLabel(group.minorVersion)"
              :aria-expanded="isMinorVersionExpanded(group.minorVersion)"
              :data-test="`toggle-release-note-group-${groupIndex}`"
              @click="toggleMinorVersionGroup(group.minorVersion)"
            >
              <span class="release-note-group__header">
                <span
                  class="release-note-group__title"
                  :data-test="`release-note-group-title-${groupIndex}`"
                >
                  {{ getMinorVersionLabel(group.minorVersion) }}
                </span>
              </span>
              <span
                class="release-note-group__action"
                :class="{ 'release-note-group__action--expanded': isMinorVersionExpanded(group.minorVersion) }"
                aria-hidden="true"
              >
                <Icon
                  class="release-note-group__chevron"
                  :name="minorVersionChevronIcon" :size="12"
                />
              </span>
            </button>
            <transition
              name="release-note-group-collapse"
              @before-enter="onBeforeReleaseGroupEnter"
              @enter="onReleaseGroupEnter"
              @after-enter="onAfterReleaseGroupEnter"
              @before-leave="onBeforeReleaseGroupLeave"
              @leave="onReleaseGroupLeave"
              @after-leave="onAfterReleaseGroupLeave"
            >
              <ul
                v-if="isMinorVersionExpanded(group.minorVersion)"
                class="release-note-group__list"
                :data-test="`release-note-group-panel-${groupIndex}`"
              >
                <li
                  v-for="{ release, versionNumber } in group.releases"
                  :key="versionNumber"
                  class="release-note"
                  :class="getReleaseNotesClass(release)"
                  :data-test="`release-note-${versionNumber}`"
                >
                  <div class="release-notes-header">
                    <span class="release-notes-header__version">
                      <a
                        :href="getReleaseUrlByVersionNumber(versionNumber)"
                        :data-test="`release-note-link-${versionNumber}`"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {{ versionNumber }}
                      </a>
                      <span
                        v-if="isPrereleaseVersion(versionNumber)"
                        class="release-notes-header__badge release-notes-header__badge--prerelease"
                      >
                        {{ $t("RELEASE_NOTES.BADGE_PRERELEASE") }}
                      </span>
                      <span
                        v-if="release?.isCurrentVersion"
                        class="release-notes-header__badge"
                      >
                        {{ $t("RELEASE_NOTES.BADGE_CURRENT") }}
                      </span>
                    </span>
                    <span class="release-notes-header__date">{{ release.date }}</span>
                  </div>
                  <div
                    v-for="releaseNote, noteIndex in release.notes"
                    :key="noteIndex"
                  >
                    <p class="release-notes-section-header">
                      {{ releaseNote.sectionHeader }}
                    </p>
                    <ul class="release-notes-note">
                      <li
                        v-for="sectionNote, sectionNoteIndex in releaseNote.sectionNotes"
                        :key="sectionNoteIndex"
                      >
                        {{ sectionNote }}
                      </li>
                    </ul>
                  </div>
                </li>
              </ul>
            </transition>
          </section>
        </div>
        <ul v-else>
          <li
            v-for="{ release, versionNumber } in flatReleaseNotes"
            :key="versionNumber"
            class="release-note"
            :class="getReleaseNotesClass(release)"
          >
            <div class="release-notes-header">
              <span class="release-notes-header__version">
                <a
                  :href="getReleaseUrlByVersionNumber(versionNumber)"
                  :data-test="`release-note-link-${versionNumber}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ versionNumber }}
                </a>
                <span
                  v-if="isPrereleaseVersion(versionNumber)"
                  class="release-notes-header__badge release-notes-header__badge--prerelease"
                >
                  {{ $t("RELEASE_NOTES.BADGE_PRERELEASE") }}
                </span>
                <span
                  v-if="release?.isCurrentVersion"
                  class="release-notes-header__badge"
                >
                  {{ $t("RELEASE_NOTES.BADGE_CURRENT") }}
                </span>
              </span>
              <span class="release-notes-header__date">{{ release.date }}</span>
            </div>
            <div
              v-for="releaseNote, noteIndex in release.notes"
              :key="noteIndex"
            >
              <p class="release-notes-section-header">
                {{ releaseNote.sectionHeader }}
              </p>
              <ul class="release-notes-note">
                <li
                  v-for="sectionNote, sectionNoteIndex in releaseNote.sectionNotes"
                  :key="sectionNoteIndex"
                >
                  {{ sectionNote }}
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
      <div v-if="!historyOnly" class="whats-new__footer">
        <button type="button" class="button button-primary" @click="$emit('modal-was-closed')">
          {{ $t('REDESIGN.GET_STARTED') }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script>

import VueTypes from 'vue-types';
import {
  createReleaseNotesData,
  getFlatReleaseNotes,
  getGroupedMinorReleaseNotes,
  getMinorVersionLabel,
  getMinorVersionToggleLabel,
  hasMinorVersionGrouping,
  isMinorVersionExpanded,
  syncExpandedMinorVersions,
  toggleMinorVersionGroup,
  WHATS_NEW_FEATURES,
} from '@/components/AdminReleaseNotes/AdminReleaseNotesConfig.js';
import {
  onAfterReleaseGroupEnter as handleAfterReleaseGroupEnter,
  onAfterReleaseGroupLeave as handleAfterReleaseGroupLeave,
  onBeforeReleaseGroupEnter as handleBeforeReleaseGroupEnter,
  onBeforeReleaseGroupLeave as handleBeforeReleaseGroupLeave,
  onReleaseGroupEnter as handleReleaseGroupEnter,
  onReleaseGroupLeave as handleReleaseGroupLeave,
} from '@/components/AdminReleaseNotes/AdminReleaseNotesTransitions.js';
import { getReleaseUrlByVersionNumber, isPrereleaseVersion } from '@/components/AdminReleaseNotes/AdminReleaseNotesUtils.js';
import BaseModal from '@/components/BaseModal/BaseModal.vue';
import Icon from '@/components/Icon/Icon.vue';

export default {
  name: 'AdminReleaseNotes',
  components: { BaseModal, Icon },
  inheritAttrs: false,
  props: {
    historyOnly: VueTypes.bool.def(false),
    releaseNotes: VueTypes.object,
  },
  emits: ['modal-was-closed'],
  data() {
    return {
      features: WHATS_NEW_FEATURES,
      minorVersionChevronIcon: 'chevron-down',
      ...createReleaseNotesData(),
    };
  },
  computed: {
    currentRelease() {
      return this.flatReleaseNotes.find(({ release }) => release?.isCurrentVersion) ?? this.flatReleaseNotes[0];
    },
    flatReleaseNotes() {
      return getFlatReleaseNotes(this.releaseNotes);
    },
    groupedReleaseNotes() {
      return getGroupedMinorReleaseNotes(this.releaseNotes);
    },
    hasMinorVersionGrouping() {
      return hasMinorVersionGrouping(this.releaseNotes);
    },
  },
  watch: {
    releaseNotes: {
      handler(newReleaseNotes) {
        this.expandedMinorVersions = syncExpandedMinorVersions(newReleaseNotes);
      },
      immediate: true,
    },
  },
  methods: {
    getMinorVersionLabel(minorVersion) {
      return getMinorVersionLabel(this, minorVersion);
    },
    getMinorVersionToggleLabel(minorVersion) {
      return getMinorVersionToggleLabel(this, minorVersion);
    },
    getReleaseNotesClass(release) {
      return [
        release?.isCurrentVersion && 'release-note--current-version',
      ];
    },
    getReleaseUrlByVersionNumber(versionNumber) {
      return getReleaseUrlByVersionNumber(versionNumber);
    },
    isMinorVersionExpanded(minorVersion) {
      return isMinorVersionExpanded(this, minorVersion);
    },
    isPrereleaseVersion(versionNumber) {
      return isPrereleaseVersion(versionNumber);
    },
    onAfterReleaseGroupEnter(element) {
      handleAfterReleaseGroupEnter(element);
    },
    onAfterReleaseGroupLeave(element) {
      handleAfterReleaseGroupLeave(element);
    },
    onBeforeReleaseGroupEnter(element) {
      handleBeforeReleaseGroupEnter(element);
    },
    onBeforeReleaseGroupLeave(element) {
      handleBeforeReleaseGroupLeave(element);
    },
    onReleaseGroupEnter(element) {
      handleReleaseGroupEnter(element);
    },
    onReleaseGroupLeave(element) {
      handleReleaseGroupLeave(element);
    },
    toggleMinorVersionGroup(minorVersion) {
      this.expandedMinorVersions = toggleMinorVersionGroup(this, minorVersion);
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

.release-notes__unavailable {
  text-align: center;
}

.release-notes__unavailable-link {
  margin-top: 2rem;
  display: inline-block;
}

.release-note {
  margin: 0;
  padding: 12px 0;
  list-style: none;

  & + & {
    border-top: 1px solid rgb(0, 0, 0, 5%);

  }
}

.release-note-group {
  background: rgb(255, 255, 255, 55%);
  border: 1px solid rgb(255, 255, 255, 70%);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgb(0, 0, 0, 6%);

  & + & {
    margin-top: 8px;

  }
}

.release-note-group__toggle {
  width: 100%;
  border: 0;
  border-radius: 14px;

  // Opaque so release notes don't show through while the header is stuck.
  background-color: #fcfcfd;
  color: inherit;
  font: inherit;
  padding: 11px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  position: sticky;
  top: 0;
  z-index: var.$z-index-sticky;

  &:focus-visible {
    outline: 2px solid #0071e3;
    outline-offset: -2px;

  }
}

.release-note-group__title {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.release-note-group__header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.release-note-group__action {
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6e6e73;
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.release-note-group__action--expanded {
  transform: rotate(180deg);
}

.release-note-group__list {
  // Padding rather than margin so the spacing is part of the animated height.
  margin: 0;
  padding: 0 18px 6px;
  will-change: height, opacity;
}

.release-note-group-collapse-enter-active,
.release-note-group-collapse-leave-active {
  transition:
    height 0.28s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease;
  overflow: hidden;
}

.release-notes-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}

.release-notes-header__version {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;

  a {
    color: #0071e3;
    text-decoration: none;

    &:hover {
      color: #0058b0;
      text-decoration: underline;

    }

    &:focus-visible {
      outline: 2px solid #0071e3;
      outline-offset: 2px;
      border-radius: 2px;

    }
  }
}

.release-notes-header__date {
  font-size: 12px;
  color: #6e6e73;
  white-space: nowrap;
}

// Solid fills keep white badge text above 4.5:1 at this size.
.release-notes-header__badge {
  border-radius: 999px;
  background-color: #0071e3;
  color: var.$white;
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1;
  padding: 3px 7px;
  text-transform: uppercase;

  &--prerelease {
    background-color: #c93400;

  }
}

.release-notes-section-header {
  margin: 8px 0 2px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #6e6e73;
}

.release-notes-note {
  margin: 0;
  padding-left: 18px;
  list-style-type: disc;
  font-size: 12.5px;
  line-height: 1.5;

  li {
    margin-bottom: 2px;
    padding: 0;

  }
}

@media (width <= 600px) {
  // Enlarge the tap area without changing the visual layout.
  .release-notes-header__version a {
    padding: 10px 0;
    margin: -10px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .release-note-group__action,
  .release-note-group-collapse-enter-active,
  .release-note-group-collapse-leave-active {
    transition: none;
  }
}

.whats-new__heading {
  display: flex;
  align-items: center;
  gap: 14px;
}

.whats-new__heading h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.4px;
}

.whats-new__heading p {
  margin: 3px 0 0;
  font-size: 13px;
  color: #6e6e73;
}

.whats-new__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(145deg, rgb(0, 113, 227, 15%), rgb(0, 113, 227, 6%));
  border: 1px solid rgb(0, 113, 227, 15%);
  box-shadow: inset 0 1px 0 rgb(255, 255, 255, 80%);
  color: #0071e3;
  box-sizing: content-box;
}

.whats-new__highlights {
  padding: 8px 0 4px;
  margin: 0;
  list-style: none;
}

.whats-new__highlights > li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  margin: 0;
}

.whats-new__highlights > li + li {
  border-top: 1px solid rgb(0, 0, 0, 5%);
}

.whats-new__highlights h3 {
  font-size: 13.5px;
  font-weight: 600;
  margin: 0 0 2px;
  line-height: 1.45;
}

.whats-new__highlights p {
  font-size: 12.5px;
  color: #6e6e73;
  line-height: 1.5;
  margin: 0;
}

.whats-new__bullet {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgb(0, 113, 227, 10%);
  margin-top: 1px;
  color: #0071e3;
}

.whats-new__history {
  margin-top: 16px;
}

.whats-new__footer {
  padding: 8px 0 0;
  display: flex;
  justify-content: center;
}

.whats-new__footer .button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 34px;
  padding: 0 16px;
  font: inherit;
  font-size: 13.5px;
  font-weight: 500;
  border-radius: 980px;
  border: none;
  background: #0071e3;
  color: #fff;
  box-shadow: 0 2px 8px rgb(0, 113, 227, 35%), inset 0 1px 0 rgb(255, 255, 255, 20%);
  cursor: pointer;
}
</style>
