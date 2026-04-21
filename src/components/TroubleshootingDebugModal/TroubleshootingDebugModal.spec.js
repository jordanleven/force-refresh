import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { mount } from '@vue/test-utils';
import { getDebugEmailData, sendDebugEmail } from '@/js/services/admin/refreshService.js';
import TroubleshootingDebugModal from './TroubleshootingDebugModal.vue';

jest.mock('@/js/services/admin/refreshService.js', () => ({
  getDebugEmailData: jest.fn(),
  sendDebugEmail: jest.fn(),
}));

library.add(faCheck, faCircleInfo, faXmark);

const mockPayload = {
  siteName: 'Test Site',
  siteUrl: 'https://example.com',
  forceRefreshVersion: '2.0.0',
  wordPressVersion: '6.5.0',
  phpVersion: '8.2.0',
};

const getWrapper = ({ isOpen = false } = {}) => mount(TroubleshootingDebugModal, {
  attachTo: document.body,
  global: {
    components: { FontAwesomeIcon },
    mocks: {
      $t: (key) => key,
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

      expect(wrapper.find('.debug-modal__overlay').classes()).not.toContain('debug-modal__overlay--open');
    });

    it('applies the open modifier when open', () => {
      const wrapper = getWrapper({ isOpen: true });

      expect(wrapper.find('.debug-modal__overlay').classes()).toContain('debug-modal__overlay--open');
    });
  });

  describe('Sheet classes', () => {
    it('does not apply the open modifier when closed', () => {
      const wrapper = getWrapper({ isOpen: false });

      expect(wrapper.find('.debug-modal__sheet').classes()).not.toContain('debug-modal__sheet--open');
    });

    it('applies the open modifier when open', () => {
      const wrapper = getWrapper({ isOpen: true });

      expect(wrapper.find('.debug-modal__sheet').classes()).toContain('debug-modal__sheet--open');
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

      expect(wrapper.findAll('.debug-modal__row')).toHaveLength(5);
    });

    it('displays the fetched values in each row', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();

      const values = wrapper.findAll('.debug-modal__row-value').map((el) => el.text());
      expect(values).toEqual([
        mockPayload.siteName,
        mockPayload.siteUrl,
        mockPayload.forceRefreshVersion,
        mockPayload.wordPressVersion,
        mockPayload.phpVersion,
      ]);
    });
  });

  describe('Close button', () => {
    it('emits close when the close button is clicked', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();
      await wrapper.find('.debug-modal__close').trigger('click');

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('Overlay click', () => {
    it('emits close when the overlay is clicked', async () => {
      const wrapper = getWrapper({ isOpen: true });

      await wrapper.find('.debug-modal__overlay').trigger('click');

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

  describe('Send flow', () => {
    it('shows the sent state after a successful send', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      sendDebugEmail.mockResolvedValueOnce({ code: 200 });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();
      await wrapper.find('.debug-modal__footer .button-primary').trigger('click');
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.debug-modal__sent').exists()).toBe(true);
    });

    it('shows the error message after a failed send', async () => {
      getDebugEmailData.mockResolvedValueOnce({ code: 200, data: mockPayload });
      sendDebugEmail.mockResolvedValueOnce({ code: 500 });
      const wrapper = getWrapper({ isOpen: false });

      await wrapper.setProps({ isOpen: true });
      await wrapper.vm.$nextTick();
      await wrapper.find('.debug-modal__footer .button-primary').trigger('click');
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.debug-modal__error').exists()).toBe(true);
    });
  });
});
