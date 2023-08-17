<template>
  <div class="release-notes-window">
    <div class="release-notes">
      <h2>{{ $t("RELEASE_NOTES.HEADER") }}</h2>
      <hr>
      <div v-if="!releaseNotes">
        {{ $t("RELEASE_NOTES.RELEASE_NOTES_UNAVAILABLE") }}
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
  </div>
</template>

<script>
import VueTypes from 'vue-types';

export default {
  name: 'AdminReleaseNotes',
  props: {
    releaseNotes: VueTypes.object,
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/utilities" as utils;
@use "@/scss/variables" as var;

.release-notes-window {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.release-notes__unavailable {
  text-align: center;
}

.release-notes__unavailable-link {
  margin-top: 2rem;
  display: inline-block;
}

.release-notes {
  background-color: var.$white;
  width: 100%;
  max-width: 30rem + 1rem;
  max-height: 50vh;
  padding: 1rem;
  margin: 1rem;
  border-radius: var.$border-radius;
  overflow: scroll;
}

.release-note {
  margin: 0;
  position: relative;

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
}

.release-notes-header__date {
  color: var.$dark-grey;
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
