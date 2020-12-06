import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import highlightJs from 'highlight.js';
import Vue from 'vue';
import Vuex from 'vuex';
import Store from '@/js/store';
import LayoutAdminMain from '@/layouts/LayoutAdminMain.vue';

// This data are localized from the functions file
// eslint-disable-next-line no-undef
const localizedData = forceRefreshMain.localData;
const { target } = localizedData;

Vue.component('FontAwesomeIcon', FontAwesomeIcon);
Vue.use(highlightJs.vuePlugin);
Vue.use(Vuex);

// eslint-disable-next-line no-new
new Vue({
  el: target,
  store: Store(localizedData),
  render: (createElement) => createElement(
    LayoutAdminMain,
  ),
});
