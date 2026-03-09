import { createStore } from 'vuex';
import actions from './actions.js';
import getters from './getters.js';
import mutations from './mutations.js';
import state from './state.js';

export default (localizedData) => createStore({
  actions,
  getters,
  mutations,
  state: state(localizedData),
});
