import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { createApp } from 'vue';
import i18n from '@/js/i18n/index.js';
import Store from '@/js/store/index.js';
import LayoutAdminBar from '@/layouts/LayoutAdminBar.vue';
import LayoutAdminMain from '@/layouts/LayoutAdminMain.vue';
import LayoutAdminMetaBox from '@/layouts/LayoutAdminMetaBox.vue';

// This data are localized from the functions file
// eslint-disable-next-line no-undef
const localizedData = forceRefreshMain.localData;
const {
  targetMain,
  targetAdminBar,
  targetNotificationContainer,
  targetAdminMetaBox,
  postId,
  postName,
  postType,
  releaseNotes,
} = localizedData;

const releaseNotesAreValid = (a) => {
  const isObject = typeof a === 'object';
  const isNotArray = !Array.isArray(a);
  return isObject && isNotArray;
};

const storeInitialized = Store(localizedData);
const i18nInitialized = i18n();

const maybeRenderVueInstance = ({ target, layout, props }) => {
  const isTargetOnPage = !!document.querySelector(target);
  if (!isTargetOnPage) return;

  const app = createApp(layout, props);
  app.use(storeInitialized);
  app.use(i18nInitialized);
  app.component('FontAwesomeIcon', FontAwesomeIcon);
  app.provide('fontAwesomeLibrary', library);
  app.mount(target);
};

maybeRenderVueInstance({
  layout: LayoutAdminMain,
  props: {
    releaseNotes: releaseNotesAreValid(releaseNotes) ? releaseNotes : null,
  },
  target: targetMain,
});

maybeRenderVueInstance({
  layout: LayoutAdminBar,
  props: {
    targetNotificationContainer,
  },
  target: targetAdminBar,
});

maybeRenderVueInstance({
  layout: LayoutAdminMetaBox,
  props: {
    postId,
    postName,
    postType,
  },
  target: targetAdminMetaBox,
});
