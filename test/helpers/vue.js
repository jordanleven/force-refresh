export const createTranslationMock = () => (key, values = {}) => {
  const entries = Object.entries(values);

  if (!entries.length) return key;

  return `${key}|${entries.map(([name, value]) => `${name}=${value}`).join(',')}`;
};

export const buildVueTestGlobals = ({
  components = {},
  mocks = {},
  plugins = [],
  stubs = {},
} = {}) => ({
  components,
  mocks: {
    $t: createTranslationMock(),
    ...mocks,
  },
  plugins,
  stubs,
});

export const BaseDescriptiveListStub = {
  name: 'BaseDescriptiveList',
  template: '<div><slot name="term" /><slot name="definition" /></div>',
};

export const BaseTooltipStub = {
  name: 'BaseTooltip',
  props: ['content'],
  template: '<div><slot /><span data-test="tooltip-content">{{ content }}</span></div>',
};
