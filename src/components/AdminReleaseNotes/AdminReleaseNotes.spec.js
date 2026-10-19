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

it('shows concise feature highlights and the installed version without a duplicate changelog', () => {
  const wrapper = create();
  expect(wrapper.find('.modal-window').classes()).toContain('whats-new');
  expect(wrapper.findAll('.whats-new__highlights > li')).toHaveLength(2);
  expect(wrapper.find('.whats-new__heading').text()).toContain('3.2.1');
  expect(wrapper.find('.whats-new__history').exists()).toBe(false);
  wrapper.find('.whats-new__footer button').trigger('click');
  expect(wrapper.emitted('modal-was-closed')).toHaveLength(1);
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
