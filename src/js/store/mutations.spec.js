import mutations from './mutations.js';

describe('Store Mutations', () => {
  describe('ADD_SCHEDULED_REFRESH', () => {
    it('adds a scheduled refresh to the state', () => {
      const state = {
        site: {
          scheduledRefreshes: [],
        },
      };
      const newRefresh = {
        id: '12345-67890',
        timestamp: 1719792000,
      };

      mutations.ADD_SCHEDULED_REFRESH(state, newRefresh);

      expect(state.site.scheduledRefreshes).toHaveLength(1);
      expect(state.site.scheduledRefreshes[0]).toEqual(newRefresh);
    });

    it('adds multiple scheduled refreshes to the state', () => {
      const state = {
        site: {
          scheduledRefreshes: [{ id: 'first', timestamp: 1719792000 }],
        },
      };
      const newRefresh = {
        id: 'second',
        timestamp: 1719878400,
      };

      mutations.ADD_SCHEDULED_REFRESH(state, newRefresh);

      expect(state.site.scheduledRefreshes).toHaveLength(2);
      expect(state.site.scheduledRefreshes[1]).toEqual(newRefresh);
    });
  });

  describe('DELETE_SCHEDULED_REFRESH', () => {
    it('deletes a scheduled refresh by id', () => {
      const state = {
        site: {
          scheduledRefreshes: [
            { id: 'first', timestamp: 1719792000 },
            { id: 'second', timestamp: 1719878400 },
            { id: 'third', timestamp: 1719964800 },
          ],
        },
      };

      mutations.DELETE_SCHEDULED_REFRESH(state, 'second');

      expect(state.site.scheduledRefreshes).toHaveLength(2);
      expect(state.site.scheduledRefreshes[0].id).toBe('first');
      expect(state.site.scheduledRefreshes[1].id).toBe('third');
    });

    it('does not modify state if id does not exist', () => {
      const state = {
        site: {
          scheduledRefreshes: [
            { id: 'first', timestamp: 1719792000 },
            { id: 'second', timestamp: 1719878400 },
          ],
        },
      };

      mutations.DELETE_SCHEDULED_REFRESH(state, 'non-existent');

      expect(state.site.scheduledRefreshes).toHaveLength(2);
    });

    it('removes all items when deleting from single-item array', () => {
      const state = {
        site: {
          scheduledRefreshes: [{ id: 'only', timestamp: 1719792000 }],
        },
      };

      mutations.DELETE_SCHEDULED_REFRESH(state, 'only');

      expect(state.site.scheduledRefreshes).toHaveLength(0);
    });
  });

  describe('SET_DEBUG_MODE', () => {
    it('updates debug mode in state', () => {
      const state = {
        settings: {
          isDebugActive: false,
        },
      };

      mutations.SET_DEBUG_MODE(state, true);

      expect(state.settings.isDebugActive).toBe(true);
    });

    it('sets debug mode to false', () => {
      const state = {
        settings: {
          isDebugActive: true,
        },
      };

      mutations.SET_DEBUG_MODE(state, false);

      expect(state.settings.isDebugActive).toBe(false);
    });
  });

  describe('SET_SCHEDULED_REFRESHES', () => {
    it('replaces the scheduled refreshes in state', () => {
      const state = {
        site: {
          scheduledRefreshes: [{ id: 'old', timestamp: 1719792000 }],
        },
      };
      const scheduledRefreshes = [{ id: 'new', timestamp: 1719878400 }];

      mutations.SET_SCHEDULED_REFRESHES(state, scheduledRefreshes);

      expect(state.site.scheduledRefreshes).toEqual(scheduledRefreshes);
    });
  });
});
