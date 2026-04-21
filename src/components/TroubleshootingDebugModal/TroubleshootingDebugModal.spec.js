import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { mount } from '@vue/test-utils';
import { getDebugEmailData, sendDebugEmail } from '@/js/services/admin/forceRefreshAdminService.js';
import TroubleshootingDebugModal from './TroubleshootingDebugModal.vue';

jest.mock('@/js/services/admin/forceRefreshAdminService.js', () => ({
  getDebugEmailData: jest.fn(),
  sendDebugEmail: jest.fn(),
}));

library.add(faCheck, faCircleInfo);

const mockDebugData = [
  { key: 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_SITE_NAME', value: 'Test Site' },
  { key: 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_SITE_URL', value: 'https://my-great-site.com' },
  { key: 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_FR_VERSION', value: '2.0.0' },
  { key: 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_SITE_VERSION', value: '06292007' },
  { key: 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_REFRESH_INTERVAL', value: '1984s' },
  { key: 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_WP_VERSION', value: '6.5.0' },
  { key: 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_PHP_VERSION', value: '8.2.0' },
];

const mockPayload = {
  debugData: mockDebugData,
  submitterEmail: 'johnny-appleseed@example.com',
};

const getWrapper = ({ isOpen = false } = {}) => mount(TroubleshootingDebugModal, {
  attachTo: document.body,
  global: {
    components: { FontAwesomeIcon },
    mocks: {
      $t: (key, values = {}) => {
        if (!Object.keys(values).length) return key;
        return `${key}:${JSON.stringify(values)}`;
      },
    },
    stubs: {
      teleport: true,
    },
  },
  props: {
    isOpen,
  },
});

describe('TroubleshootingDebugModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Overlay classes', () => {
    it('does not apply the open modifier when closed', () => {
      const wrapper = getWrapper({ isOpen: false });

      expect(wrapper.find('.modal-window').classes()).not.toContain('modal-window--open');
    });

    it('applies the open modifier when open', () => {
      const wrapper = getWrapper({ isOpen: true });

      expect(wrapper.find('.modal-window').classes()).toContain('modal-window--open');
    });
  });

  describe('Sheet classes', () => {
    it('does not apply the open modifier when closed', () => {
      const wrapper = getWrapper({ isOpen: false });

      expect(wrapper.find('.modal').classes()).not.toContain('modal--open');
    });

    it('applies the open modifier when open', () => {
      const wrapper = getWrapper({ isOpen: true });

      expect(wrapper.find('.modal').classes()).toContain('modal--open');
    });
  });

  describe('Loading state', () => {
    it('shows skeleton rows while fetching', async () => {
      getDebugEmailData.mockReturnValue(new Promise(() => {}));
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });

      expect(wrapper.find('.debug-modal__loading').exists()).toBe(true);
      expect(wrapper.find('.debug-modal__rows').exists()).toBe(false);
    });

    it('disables the send button while loading', async () => {
      getDebugEmailData.mockReturnValue(new Promise(() => {}));
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });

      expect(wrapper.find('.debug-modal__footer .button-primary').attributes('disabled')).toBeDefined();
    });
  });

  describe('Payload rows', () => {
    it('renders a row for each debug field after fetch', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.findAll('.debug-modal__row')).toHaveLength(7);
    });

    it('displays the fetched values in each row', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();

      const values = wrapper.findAll('.debug-modal__row-value').map((el) => el.text());
      expect(values).toEqual(mockDebugData.map((row) => row.value));
    });
  });

  describe('Support topic URL', () => {
    it('disables send until a support topic URL is provided', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.debug-modal__footer .button-primary').attributes('disabled')).toBeDefined();
    });

    it('sends the entered support topic URL with the report request', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      sendDebugEmail.mockResolvedValueOnce({ code: 200 });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();
      await wrapper.find('.debug-modal__field-input').setValue('https://wordpress.org/support/topic/test-topic/');
      await wrapper.find('.debug-modal__footer .button-primary').trigger('click');

      expect(sendDebugEmail).toHaveBeenCalledWith({
        supportTopicUrl: 'https://wordpress.org/support/topic/test-topic/',
      });
    });

    it('shows the API validation error under the field when URL validation fails', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      sendDebugEmail.mockResolvedValueOnce({
        code: 400,
        data: { field: 'supportTopicUrl' },
        message: 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_INVALID',
      });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();
      await wrapper.find('.debug-modal__field-input').setValue('https://example.com/topic/test-topic/');
      await wrapper.find('.debug-modal__footer .button-primary').trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.debug-modal__field-error').text()).toBe('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_INVALID');
    });
  });

  describe('Overlay click', () => {
    it('emits close when the overlay is clicked', async () => {
      const wrapper = getWrapper({ isOpen: true });

      await wrapper.find('.modal-window').trigger('click');

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('Escape key', () => {
    it('emits close when Escape is pressed', async () => {
      const wrapper = getWrapper({ isOpen: true });

      await window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('does not emit close for other keys', async () => {
      const wrapper = getWrapper({ isOpen: true });

      await window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(wrapper.emitted('close')).toBeFalsy();
    });

    it('removes the keydown listener on unmount', async () => {
      const wrapper = getWrapper({ isOpen: true });

      wrapper.unmount();
      await window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(wrapper.emitted('close')).toBeFalsy();
    });
  });

  describe('No submitter email', () => {
    it('keeps the modal open when submitterEmail is null', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: { ...mockPayload, submitterEmail: null } });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('close')).toBeFalsy();
    });

    it('shows the no-email note when submitterEmail is null', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: { ...mockPayload, submitterEmail: null } });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.debug-modal__note span').text()).toBe('ADMIN_TROUBLESHOOTING.DEBUG_MODAL_NOTE_NO_EMAIL');
    });
  });

  describe('Send flow', () => {
    it('shows the sent state after a successful send', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      sendDebugEmail.mockResolvedValueOnce({ code: 200 });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();
      await wrapper.find('.debug-modal__field-input').setValue('https://wordpress.org/support/topic/test-topic/');
      await wrapper.vm.onSend();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.debug-modal__sent').exists()).toBe(true);
    });

    it('shows the error message after a failed send', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      sendDebugEmail.mockResolvedValueOnce({ code: 500, message: 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SEND_FAILED' });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();
      await wrapper.find('.debug-modal__field-input').setValue('https://wordpress.org/support/topic/test-topic/');
      await wrapper.vm.onSend();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.debug-modal__error').exists()).toBe(true);
    });
  });
});
