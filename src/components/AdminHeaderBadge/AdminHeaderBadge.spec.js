import { library } from '@fortawesome/fontawesome-svg-core';
import { faBug } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowMount } from '@vue/test-utils';
import AdminHeaderBadge from './AdminHeaderBadge.vue';

library.add(faBug);

const getWrapper = (props = {}) => shallowMount(AdminHeaderBadge, {
  global: {
    components: { FontAwesomeIcon },
  },
  props: {
    icon: faBug,
    label: 'Debug mode active',
    variant: 'debug',
    ...props,
  },
});

describe('Admin header badge', () => {
  describe('Element tag', () => {
    it('renders as a span when no href is provided', () => {
      const wrapper = getWrapper();

      expect(wrapper.element.tagName).toBe('span');
    });

    it('renders as an anchor when an href is provided', () => {
      const wrapper = getWrapper({ href: '/wp-admin/plugins.php' });

      expect(wrapper.element.tagName).toBe('a');
    });
  });

  describe('Anchor tags', () => {
    it('sets the href attribute when provided', () => {
      const wrapper = getWrapper({ href: '/wp-admin/plugins.php' });

      expect(wrapper.attributes('href')).toBe('/wp-admin/plugins.php');
    });

    it('omits the href attribute when not provided', () => {
      const wrapper = getWrapper();

      expect(wrapper.attributes('href')).toBeUndefined();
    });
  });

  describe('Label', () => {
    it('renders the label text', () => {
      const wrapper = getWrapper({ label: 'Update available' });

      expect(wrapper.find('.admin-header-badge__label').text()).toBe('Update available');
    });
  });

  describe('Variant', () => {
    it('applies the variant modifier class', () => {
      const wrapper = getWrapper({ variant: 'update' });

      expect(wrapper.classes()).toContain('admin-header-badge--update');
    });

    it('always includes the base class', () => {
      const wrapper = getWrapper({ variant: 'debug' });

      expect(wrapper.classes()).toContain('admin-header-badge');
    });
  });

  describe('Tooltip', () => {
    it('sets the title attribute when a tooltip is provided', () => {
      const wrapper = getWrapper({ tooltip: 'Debug mode is active' });

      expect(wrapper.attributes('title')).toBe('Debug mode is active');
    });

    it('omits the title attribute when no tooltip is provided', () => {
      const wrapper = getWrapper();

      expect(wrapper.attributes('title')).toBeUndefined();
    });
  });
});
