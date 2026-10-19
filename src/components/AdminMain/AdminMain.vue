<template>
  <div class="force-refresh__container">
    <div class="admin-tabs" role="tablist" :aria-label="$t('REDESIGN.SECTIONS')">
      <button
        v-for="tab in ['refresh', 'settings']"
        :id="`force-refresh-tab-${tab}`"
        :key="tab"
        :ref="`tab-${tab}`"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab"
        :aria-controls="`force-refresh-panel-${tab}`"
        :tabindex="activeTab === tab ? 0 : -1"
        @click="selectTab(tab)"
        @keydown.right.prevent="selectTab(activeTab === 'refresh' ? 'settings' : 'refresh', true)"
        @keydown.left.prevent="selectTab(activeTab === 'refresh' ? 'settings' : 'refresh', true)"
        @keydown.home.prevent="selectTab('refresh', true)"
        @keydown.end.prevent="selectTab('settings', true)"
      >
        {{ $t(`REDESIGN.TAB_${tab.toUpperCase()}`) }}
      </button>
    </div>
    <div v-show="activeTab === 'refresh'" id="force-refresh-panel-refresh" role="tabpanel" aria-labelledby="force-refresh-tab-refresh">
      <AdminMainRefresh
        class="force-refresh__main"
        :site-name="siteName"
        :last-refresh-at="lastRefreshAt"
        :refresh-interval="refreshInterval"
        :is-refreshing="isRefreshing"
        :scheduled-refreshes="scheduledRefreshes"
        v-bind="$attrs"
      />
    </div>
    <div v-show="activeTab === 'settings'" id="force-refresh-panel-settings" role="tabpanel" aria-labelledby="force-refresh-tab-settings">
      <AdminMainOptions
        v-if="refreshOptions"
        class="force-refresh__options"
        :refresh-options="refreshOptions"
        v-bind="$attrs"
      />
    </div>
    <footer v-if="activeTab === 'refresh'" class="admin-review">
      <a href="https://wordpress.org/support/plugin/force-refresh/reviews/#new-post" target="_blank" rel="noopener noreferrer">
        {{ $t('ADMIN_SETTINGS.OPTIONS_UTILITY_LEAVE_REVIEW') }} <Icon name="arrow-up-right" :size="11" />
      </a>
    </footer>
  </div>
</template>

<script>
import VueTypes from 'vue-types';
import AdminMainOptions from '@/components/AdminMainOptions/AdminMainOptions.vue';
import AdminMainRefresh from '@/components/AdminMainRefresh/AdminMainRefresh.vue';
import Icon from '@/components/Icon/Icon.vue';

export default {
  name: 'AdminMain',
  components: { AdminMainOptions, AdminMainRefresh, Icon },
  inheritAttrs: false,
  props: {
    initialTab: VueTypes.oneOf(['refresh', 'settings']).def('refresh'),
    isRefreshing: VueTypes.bool.def(false),
    lastRefreshAt: VueTypes.object.def(null),
    refreshInterval: VueTypes.number,
    refreshOptions: VueTypes.object.isRequired,
    scheduledRefreshes: VueTypes.array,
    siteName: VueTypes.string.isRequired,
  },
  emits: ['tab-changed'],
  data() {
    return { activeTab: this.initialTab };
  },
  methods: {
    selectTab(tab, focus = false) {
      this.activeTab = tab;
      this.$emit('tab-changed', tab);
      if (focus) this.$nextTick(() => this.$refs[`tab-${tab}`][0].focus());
    },
  },
};
</script>

<style lang="scss" scoped>
.force-refresh__container {
  width: 100%;
}

.admin-tabs {
  display: flex;
  border-bottom: 1px solid rgb(0, 0, 0, 8%);
  margin-bottom: 20px;
}

.admin-tabs button {
  padding: 0 0 12px;
  margin-right: 24px;
  margin-bottom: -1px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.1px;
  color: #6e6e73;
  cursor: pointer;
  transition: all 0.15s;
}

.admin-tabs button[aria-selected="true"] {
  color: #1d1d1f;
  font-weight: 600;
  border-bottom-color: #2271b1;
}

.admin-tabs button:focus-visible {
  outline: 2px solid #0071e3;
  outline-offset: 2px;
}

.admin-review {
  margin-top: 16px;
  text-align: right;
}

.admin-review a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  box-sizing: border-box;
  padding: 0 10px;
  font-size: 13px;
  border-radius: 3px;
  background: #f6f7f7;
  border: 1px solid #2271b1;
  color: #0071e3;
  text-decoration: none;
}
</style>
