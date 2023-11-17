<template>
  <BaseModal
    :header="$t('RELEASE_NOTES.HEADER')"
    v-on="$listeners"
  >
    <div>
      <div v-if="!releaseNotes">
        <p>{{ $t("RELEASE_NOTES.RELEASE_NOTES_UNAVAILABLE") }}</p>
        <div class="release-notes__unavailable">
          <a class="release-notes__unavailable-link button button-primary" href="https://wordpress.org/plugins/force-refresh/#developers" target="_blank">
            {{ $t("RELEASE_NOTES.RELEASE_NOTES_PLUGIN_LINK_TITLE") }}
          </a>
        </div>
      </div>
      <ul v-else>
        <li
          v-for="release, versionNumber in releaseNotes"
          :key="versionNumber"
          class="release-note"
          :class="getReleaseNotesClass(release)"
        >
          <div class="release-notes-header">
            <span class="release-notes-header__version">{{ versionNumber }}</span>
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
import VueTypes from 'vue-types';
import BaseModal from '@/components/BaseModal/BaseModal.vue';

export default {
  name: 'AdminReleaseNotes',
  components: {
    BaseModal,
  },
  props: {
    releaseNotes: VueTypes.object,
  },
  methods: {
    getReleaseNotesClass(release) {
      return [
        release?.isCurrentVersion && 'release-note--current-version',
      ];
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
  opacity: 0.65;

  &:nth-child(n+2) {
    margin: 2rem 0;

    &::before{
      height: 1px;
      background-color: var.$light-grey;
      width: 90%;
      left: 0;
      right: 0;
      margin: auto;
      content: '';
      display: block;
      position: absolute;
      top: calc(-2rem / 2);
    }
  }

  &.release-note--current-version {
    opacity: 1;
  }
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
  justify-content: space-between;
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
