import Vue from 'vue';
import AdminMetaBox from '../components/AdminMetaBox.vue';
// This data are localized from the functions file
// eslint-disable-next-line no-undef
const localizedData = forceRefreshLocalJs.localData;
const { targetClass } = localizedData;

// eslint-disable-next-line no-new
new Vue({
  el: `.${targetClass}`,
  render: (createElement) => createElement(
    AdminMetaBox,
    {
      props: localizedData,
    },
  ),
});
