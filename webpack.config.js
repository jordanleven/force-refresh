const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = {
  entry: {
    './js/force-refresh': './src/js/client/client.js',
    './js/force-refresh-admin-bar': './src/js/admin/admin-bar.js',
    './js/force-refresh-main': './src/js/admin/admin-main',
    './js/force-refresh-meta-box-admin': './src/js/admin/admin-meta-box',
  },
  module: {
    rules: [
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/',
            },
          },
        ],
      },
      {
        exclude: /node_modules/,
        test: /\.js$/,
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
        loader: 'vue-loader',
        test: /\.vue$/,
      },
      {
        exclude: [
          path.resolve(__dirname, 'src/scss'),
          /node_modules/,
        ],
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
  },
  plugins: [
    new LiveReloadPlugin({
      appendScriptTag: true,
    }),
    new VueLoaderPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
};
