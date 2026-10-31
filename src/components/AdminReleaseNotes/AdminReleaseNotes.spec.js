import { enableAutoUnmount, mount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import AdminReleaseNotes from './AdminReleaseNotes.vue';

enableAutoUnmount(afterEach);

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
const feature = (versionNumber, title, icon = 'star') => ({
  description: `${title} details.`, icon, title: `${title}.`, versionNumber,
});

const features = [
  feature('3.3.0', 'A'), feature('3.3.0', 'B'), feature('3.2.0', 'C'),
  feature('3.2.0', 'D'), feature('3.1.0', 'E'), feature('3.1.0', 'F'), feature('3.1.0', 'G'),
];

it('applies the modal styling hook', () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign'), feature('3.3.0', 'Picker')] });
  expect(wrapper.find('.modal-window').classes()).toContain('whats-new');
});

it('titles a single release with its minor version', () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign'), feature('3.3.0', 'Picker')] });
  expect(wrapper.find('.whats-new__heading h2').text()).toBe('REDESIGN.WHATS_NEW_TITLE_SINGLE|version=3.3');
});

it('omits the version range for a single release', () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign'), feature('3.3.0', 'Picker')] });
  expect(wrapper.find('.whats-new__heading p').exists()).toBe(false);
});

it('shows each feature for a single release', () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign'), feature('3.3.0', 'Picker')] });
  expect(wrapper.findAll('.whats-new__highlights > li')).toHaveLength(2);
});

it('omits per-item version tags for a single release', () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign'), feature('3.3.0', 'Picker')] });
  expect(wrapper.find('.whats-new__version').exists()).toBe(false);
});

it('hides full history in the highlights view', () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign'), feature('3.3.0', 'Picker')] });
  expect(wrapper.find('.whats-new__history').exists()).toBe(false);
});

it('shows each feature with its own icon', () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign', 'palette'), feature('3.3.0', 'Picker', 'calendar')] });
  const icons = wrapper.findAll('.whats-new__bullet svg').map((icon) => icon.attributes('data-icon'));
  expect(icons).toEqual(['palette', 'calendar-days']);
});

it('hides feature icons from assistive technology', () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign', 'palette')] });
  expect(wrapper.find('.whats-new__bullet').attributes('aria-hidden')).toBe('true');
});

it('closes highlights from the primary footer button', async () => {
  const wrapper = create({ whatsNewFeatures: [feature('3.3.0', 'Redesign'), feature('3.3.0', 'Picker')] });
  await wrapper.find('.whats-new__footer .button-primary').trigger('click');
  expect(wrapper.emitted('modal-was-closed')).toHaveLength(1);
});

it('titles highlights spanning multiple releases', async () => {
  const wrapper = create({ whatsNewFeatures: features });
  expect(wrapper.find('.whats-new__heading h2').text()).toBe('REDESIGN.WHATS_NEW_TITLE_MULTIPLE');
});

it('shows the highlighted version range', async () => {
  const wrapper = create({ whatsNewFeatures: features });
  expect(wrapper.find('.whats-new__heading p').text()).toBe('REDESIGN.WHATS_NEW_VERSION_RANGE|from=3.1,to=3.3');
});

it('caps highlights at six features', async () => {
  const wrapper = create({ whatsNewFeatures: features });
  expect(wrapper.findAll('.whats-new__highlights > li')).toHaveLength(6);
});

it('tags highlights with their minor version', async () => {
  const wrapper = create({ whatsNewFeatures: features });
  expect(wrapper.find('.whats-new__version').text()).toBe('3.3');
});

it('shows the remaining feature count', async () => {
  const wrapper = create({ whatsNewFeatures: features });
  const viewAll = wrapper.find('[data-test="btn-whats-new-view-all"]');
  expect(viewAll.text()).toBe('REDESIGN.WHATS_NEW_VIEW_MORE|count=1');
});

it('opens full history from View more', async () => {
  const wrapper = create({ whatsNewFeatures: features });
  const viewAll = wrapper.find('[data-test="btn-whats-new-view-all"]');
  await viewAll.trigger('click');
  expect(wrapper.emitted('view-release-history')).toHaveLength(1);
});

it('hides highlights in the history view', () => {
  const wrapper = create({ historyOnly: true });
  expect(wrapper.find('.whats-new__highlights').exists()).toBe(false);
});

it('preserves the complete release history', () => {
  const wrapper = create({ historyOnly: true });
  expect(wrapper.find('.whats-new__history').text()).toContain('Full release history remains available.');
});

it('hides icon comments in the release history', () => {
  const wrapper = create({
    historyOnly: true,
    releaseNotes: {
      '3.3.0': {
        date: '2026-10-31',
        notes: [{ sectionHeader: 'New Features', sectionNotes: ['Redesigned admin. <!-- icon: palette -->'] }],
      },
    },
  });
  expect(wrapper.find('.release-notes-note li').text()).toBe('Redesigned admin.');
});

it('keeps the closed overlay hidden', async () => {
  const wrapper = create({ isOpen: false });
  expect(wrapper.find('.modal-window').classes()).not.toContain('modal-window--open');
});

it('keeps the closed dialog hidden', async () => {
  const wrapper = create({ isOpen: false });
  expect(wrapper.find('[role="dialog"]').classes()).not.toContain('modal--open');
});

it('opens the overlay with its parent', async () => {
  const wrapper = create({ isOpen: false });
  await wrapper.setProps({ isOpen: true });
  expect(wrapper.find('.modal-window').classes()).toContain('modal-window--open');
});

it('opens the dialog with its parent', async () => {
  const wrapper = create({ isOpen: false });
  await wrapper.setProps({ isOpen: true });
  expect(wrapper.find('[role="dialog"]').classes()).toContain('modal--open');
});

it('marks an open dialog modal', async () => {
  const wrapper = create({ isOpen: false });
  await wrapper.setProps({ isOpen: true });
  expect(wrapper.find('[role="dialog"]').attributes('aria-modal')).toBe('true');
});

it('closes the overlay with its parent', async () => {
  const wrapper = create({ isOpen: false });
  await wrapper.setProps({ isOpen: true });
  await wrapper.setProps({ isOpen: false });
  expect(wrapper.find('.modal-window').classes()).not.toContain('modal-window--open');
});
