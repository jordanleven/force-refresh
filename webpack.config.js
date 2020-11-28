const path = require('path');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  entry: {
    './js/force-refresh': './src/js/client/client.js',
    './js/force-refresh-admin-bar': './src/js/admin/admin-bar.js',
    './js/force-refresh-meta-box-admin': './src/js/admin/admin-meta-box',
    './js/force-refresh-main': './src/js/admin/admin-main',
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.scss$/,
        exclude: [
          path.resolve(__dirname, 'src/scss'),
          /node_modules/,
        ],
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new LiveReloadPlugin({
      appendScriptTag: true,
    }),
    new VueLoaderPlugin(),
  ],
};
