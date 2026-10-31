import { enableAutoUnmount, mount } from '@vue/test-utils';
import Icon from './Icon.vue';

enableAutoUnmount(afterEach);

it.each([
  ['refresh', 'arrows-rotate'], ['clock', 'clock'], ['close', 'xmark'], ['check', 'check'],
])('renders the %s symbol through the shared component', (name, expected) => {
  const wrapper = mount(Icon, { attrs: { class: 'example-icon' }, props: { name } });
  expect(wrapper.find('svg').attributes('data-icon')).toBe(expected);
});

it.each([
  ['refresh', 'arrows-rotate'], ['clock', 'clock'], ['close', 'xmark'], ['check', 'check'],
])('hides the decorative %s symbol from assistive technology', (name) => {
  const wrapper = mount(Icon, { attrs: { class: 'example-icon' }, props: { name } });
  expect(wrapper.attributes('aria-hidden')).toBe('true');
});

it.each([
  ['refresh', 'arrows-rotate'], ['clock', 'clock'], ['close', 'xmark'], ['check', 'check'],
])('forwards CSS classes to the %s symbol', (name) => {
  const wrapper = mount(Icon, { attrs: { class: 'example-icon' }, props: { name } });
  expect(wrapper.classes()).toContain('example-icon');
});

it('applies the requested visual size', () => {
  const wrapper = mount(Icon, { props: { name: 'close', size: 12 } });
  expect(wrapper.element.style.fontSize).toBe('12px');
});

it('adds the shared icon class', () => {
  const wrapper = mount(Icon, { props: { name: 'close', size: 12 } });
  expect(wrapper.classes()).toContain('icon');
});

it('leaves its width to CSS', () => {
  const wrapper = mount(Icon, { props: { name: 'close' } });
  expect(wrapper.element.style.width).toBe('');
});

it('leaves its height to CSS', () => {
  const wrapper = mount(Icon, { props: { name: 'close' } });
  expect(wrapper.element.style.height).toBe('');
});

it('uses the outline family for the schedule clock', () => {
  const wrapper = mount(Icon, { props: { name: 'clock-outline', size: 13 } });
  expect(wrapper.find('svg').attributes('data-prefix')).toBe('far');
});

it('uses the clock symbol for the schedule clock', () => {
  const wrapper = mount(Icon, { props: { name: 'clock-outline', size: 13 } });
  expect(wrapper.find('svg').attributes('data-icon')).toBe('clock');
});
