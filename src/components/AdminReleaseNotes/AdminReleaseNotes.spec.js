import { mount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminReleaseNotes from './AdminReleaseNotes.vue';

const releaseNotes = {
  '3.2.1': {
    date: '2026-10-18',
    isCurrentVersion: true,
    notes: [{ sectionHeader: 'Changed', sectionNotes: ['Full release history remains available.'] }],
  },
};
const create = (props = {}) => mount(AdminReleaseNotes, {
  global: buildVueTestGlobals({ stubs: { teleport: true } }),
  props: { releaseNotes, ...props },
});

const feature = (versionNumber, title) => ({ description: `${title} details.`, title: `${title}.`, versionNumber });

it('titles a single release by its version and hides per-item version tags', () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign'), feature('3.3.0', 'Picker')] });
  expect(wrapper.find('.modal-window').classes()).toContain('whats-new');
  expect(wrapper.find('.whats-new__heading h2').text()).toBe('REDESIGN.WHATS_NEW_TITLE_SINGLE|version=3.3');
  expect(wrapper.find('.whats-new__heading p').exists()).toBe(false);
  expect(wrapper.findAll('.whats-new__highlights > li')).toHaveLength(2);
  expect(wrapper.find('.whats-new__version').exists()).toBe(false);
  expect(wrapper.find('.whats-new__history').exists()).toBe(false);
  wrapper.find('.whats-new__footer .button-primary').trigger('click');
  expect(wrapper.emitted('modal-was-closed')).toHaveLength(1);
  wrapper.unmount();
});

it('gathers several releases under one header, tags each item, and caps the list', async () => {
  const features = [
    feature('3.3.0', 'A'), feature('3.3.0', 'B'), feature('3.2.0', 'C'),
    feature('3.2.0', 'D'), feature('3.1.0', 'E'), feature('3.1.0', 'F'), feature('3.1.0', 'G'),
  ];
  const wrapper = create({ whatsNewFeatures: features });
  expect(wrapper.find('.whats-new__heading h2').text()).toBe('REDESIGN.WHATS_NEW_TITLE_MULTIPLE');
  expect(wrapper.find('.whats-new__heading p').text()).toBe('REDESIGN.WHATS_NEW_VERSION_RANGE|from=3.1,to=3.3');
  expect(wrapper.findAll('.whats-new__highlights > li')).toHaveLength(6);
  expect(wrapper.find('.whats-new__version').text()).toBe('3.3');
  const viewAll = wrapper.find('[data-test="btn-whats-new-view-all"]');
  expect(viewAll.text()).toBe('REDESIGN.WHATS_NEW_VIEW_MORE|count=1');
  await viewAll.trigger('click');
  expect(wrapper.emitted('view-release-history')).toHaveLength(1);
  wrapper.unmount();
});

it('preserves the complete release history in its dedicated view', () => {
  const wrapper = create({ historyOnly: true });
  expect(wrapper.find('.whats-new__highlights').exists()).toBe(false);
  expect(wrapper.find('.whats-new__history').text()).toContain('Full release history remains available.');
  wrapper.unmount();
});

it('forwards opening and closing from the parent to the teleported modal', async () => {
  const wrapper = create({ isOpen: false });
  expect(wrapper.find('.modal-window').classes()).not.toContain('modal-window--open');
  expect(wrapper.find('[role="dialog"]').classes()).not.toContain('modal--open');
  await wrapper.setProps({ isOpen: true });
  expect(wrapper.find('.modal-window').classes()).toContain('modal-window--open');
  expect(wrapper.find('[role="dialog"]').classes()).toContain('modal--open');
  expect(wrapper.find('[role="dialog"]').attributes('aria-modal')).toBe('true');
  await wrapper.setProps({ isOpen: false });
  expect(wrapper.find('.modal-window').classes()).not.toContain('modal-window--open');
  wrapper.unmount();
});
