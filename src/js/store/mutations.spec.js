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
        timestamp: 1719792000,
        id: '12345-67890',
      };

      mutations.ADD_SCHEDULED_REFRESH(state, newRefresh);

      expect(state.site.scheduledRefreshes).toHaveLength(1);
      expect(state.site.scheduledRefreshes[0]).toEqual(newRefresh);
    });

    it('adds multiple scheduled refreshes to the state', () => {
      const state = {
        site: {
          scheduledRefreshes: [{ timestamp: 1719792000, id: 'first' }],
        },
      };
      const newRefresh = {
        timestamp: 1719878400,
        id: 'second',
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
            { timestamp: 1719792000, id: 'first' },
            { timestamp: 1719878400, id: 'second' },
            { timestamp: 1719964800, id: 'third' },
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
            { timestamp: 1719792000, id: 'first' },
            { timestamp: 1719878400, id: 'second' },
          ],
        },
      };

      mutations.DELETE_SCHEDULED_REFRESH(state, 'non-existent');

      expect(state.site.scheduledRefreshes).toHaveLength(2);
    });

    it('removes all items when deleting from single-item array', () => {
      const state = {
        site: {
          scheduledRefreshes: [{ timestamp: 1719792000, id: 'only' }],
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
});
