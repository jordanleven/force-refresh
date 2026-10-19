import { mount } from '@vue/test-utils';
import Icon from './Icon.vue';

it.each([
  ['refresh', 'arrows-rotate'], ['clock', 'clock'], ['close', 'xmark'], ['check', 'check'],
])('renders the %s symbol through the shared component', (name, expected) => {
  const wrapper = mount(Icon, { attrs: { class: 'example-icon' }, props: { name } });
  expect(wrapper.find('svg').attributes('data-icon')).toBe(expected);
  expect(wrapper.attributes('aria-hidden')).toBe('true');
  expect(wrapper.classes()).toContain('example-icon');
});

it('applies the requested visual size without inheriting a surrounding button font size', () => {
  const wrapper = mount(Icon, { props: { name: 'close', size: 12 } });
  expect(wrapper.element.style.fontSize).toBe('12px');
  expect(wrapper.classes()).toContain('icon');
});

it('leaves its dimensions to CSS so consumers can override them', () => {
  const wrapper = mount(Icon, { props: { name: 'close' } });
  expect(wrapper.element.style.width).toBe('');
  expect(wrapper.element.style.height).toBe('');
});

it('renders the schedule clock using the outline icon family', () => {
  const wrapper = mount(Icon, { props: { name: 'clock-outline', size: 13 } });
  expect(wrapper.find('svg').attributes('data-prefix')).toBe('far');
  expect(wrapper.find('svg').attributes('data-icon')).toBe('clock');
});
