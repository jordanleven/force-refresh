import { mount } from '@vue/test-utils';
import { buildVueTestGlobals } from '../../../test/helpers/vue.js';
import TroubleshootingDebugModal from '../TroubleshootingDebugModal/TroubleshootingDebugModal.vue';
import BaseModal from './BaseModal.vue';

jest.mock('@/js/services/admin/forceRefreshAdminService.js', () => ({
  getDebugEmailData: jest.fn(),
  sendDebugEmail: jest.fn(),
}));

const getWrapper = (component = BaseModal, props = {}) => mount(component, {
  attachTo: document.body,
  global: buildVueTestGlobals({ stubs: { teleport: true } }),
  props: { ...props },
});

describe('BaseModal accessibility', () => {
  let wrapper;
  let trigger;

  beforeEach(() => {
    trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
  });

  afterEach(() => {
    wrapper?.unmount();
    trigger.remove();
  });

  it('names the dialog from its header', () => {
    wrapper = getWrapper(BaseModal, { header: 'Schedule a Refresh' });

    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('Schedule a Refresh');
  });

  it('allows a dialog name independent of the visible header', () => {
    wrapper = getWrapper(BaseModal, { accessibleLabel: 'Contact Support' });

    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('Contact Support');
  });

  it('focuses the dialog when opened', async () => {
    wrapper = getWrapper();
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(wrapper.find('[role="dialog"]').element);
  });

  it('requests closing when Escape is pressed', () => {
    wrapper = getWrapper();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(wrapper.emitted('modal-was-closed')).toHaveLength(1);
  });

  it('restores focus to the trigger when closed', async () => {
    wrapper = getWrapper();
    await wrapper.vm.$nextTick();
    await wrapper.setProps({ isOpen: false });

    expect(document.activeElement).toBe(trigger);
  });

  it.each(['idle', 'sent'])('names the support dialog in its %s state', async (status) => {
    wrapper = getWrapper(TroubleshootingDebugModal, { isOpen: true });
    await wrapper.setData({ status });

    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_TITLE');
  });
});
