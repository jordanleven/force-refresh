import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import AdminMain from '@/layouts/AdminMain.vue';

// This data are localized from the functions file
// eslint-disable-next-line no-undef
const localizedData = forceRefreshMain.localData;
const { target } = localizedData;

Vue.component('FontAwesomeIcon', FontAwesomeIcon);

// eslint-disable-next-line no-new
new Vue({
  el: target,
  render: (createElement) => createElement(
    AdminMain,
    {
      props: localizedData,
    },
  ),
});
