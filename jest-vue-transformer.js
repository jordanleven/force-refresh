const path = require('path');
const {
  parse,
  compileScript,
  compileTemplate,
  rewriteDefault,
} = require('@vue/compiler-sfc');
// eslint-disable-next-line import/no-extraneous-dependencies
const babelJest = require('babel-jest').default;

const babelTransform = babelJest.createTransformer();

module.exports = {
  process(source, filename, options) {
    const { descriptor } = parse(source, { filename });
    const id = path.basename(filename, '.vue');

    const script = compileScript(descriptor, { id });

    const template = compileTemplate({
      filename,
      id,
      scoped: false,
      source: descriptor.template.content,
    });

    const scriptCode = rewriteDefault(script.content, '__component__');

    const combined = [
      scriptCode,
      template.code,
      '__component__.render = render;',
      'module.exports = __component__;',
    ].join('\n');

    return babelTransform.process(combined, filename, options);
  },
};
