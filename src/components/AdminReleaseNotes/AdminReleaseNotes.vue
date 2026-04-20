<template>
  <BaseModal
    :header="$t('RELEASE_NOTES.HEADER')"
    v-bind="$attrs"
  >
    <div data-test="release-notes-modal-content">
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
              <font-awesome-icon
                class="release-note-group__chevron"
                :icon="minorVersionChevronIcon"
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
  </BaseModal>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
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

library.add([faChevronDown]);

export default {
  name: 'AdminReleaseNotes',
  components: {
    BaseModal,
  },
  inheritAttrs: false,
  props: {
    releaseNotes: VueTypes.object,
  },
  data() {
    return {
      minorVersionChevronIcon: faChevronDown,
      ...createReleaseNotesData(),
    };
  },
  computed: {
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
  position: relative;
  list-style: none;

  & + & {
    margin-top: 3rem;

    &::before {
      height: 1px;
      background-color: var.$light-grey;
      width: 90%;
      left: 0;
      right: 0;
      margin: auto;
      content: '';
      display: block;
      position: absolute;
      top: calc(-3rem / 2);
    }
  }
}

.release-note-group {
  border-top: 1px solid var.$light-grey;
  padding: 0.5rem 0;

  &:first-child {
    border-top: 0;
  }
}

.release-note-group__toggle {
  width: 100%;
  border: 0;
  background-color: var.$white;
  padding: 0.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 0;
  position: sticky;
  top: 0;
  z-index: var.$z-index-sticky;
}

.release-note-group__title {
  font-weight: bold;
  font-size: 1rem;
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
  opacity: 0.75;
  transition: transform 0.22s ease;
}

.release-note-group__action--expanded {
  transform: rotate(180deg);
}

.release-note-group__chevron {
  font-size: 0.75rem;
}

.release-note-group__list {
  margin: 1rem 0 0;
  padding: 0;
  transform-origin: top center;
  will-change: height, opacity, transform;
}

.release-note-group-collapse-enter-active,
.release-note-group-collapse-leave-active {
  transition:
    height 0.24s ease,
    opacity 0.2s ease,
    transform 0.24s ease;
  overflow: hidden;
}

.release-notes-header {
  display: flex;
  justify-content: space-between;
}

.release-notes-header__version,
.release-notes-header__date {
  font-size: 0.825rem;
}

.release-notes-header__version {
  font-weight: bold;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.release-notes-header__badge {
  border-radius: 999px;
  background-color: var.$blue-dark;
  color: var.$white;
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: normal;
  letter-spacing: 0.02em;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  text-transform: uppercase;

  &--prerelease {
    background-color: var.$orange;
  }
}

.release-notes-section-header {
  font-weight: bold;
  font-size: 0.8rem;
  text-transform: uppercase;
  margin-bottom: 0.125rem;
  opacity: 0.9;
}

.release-notes-note {
  padding-left: 1rem;
  list-style-type: square;

  li {
    margin-bottom: 0.125rem;
    padding: 0;
  }
}
</style>
