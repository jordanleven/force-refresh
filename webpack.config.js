const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  entry: {
    './js/force-refresh': './src/js/client/client.js',
    './js/force-refresh-main-admin': './src/js/admin/admin.js',
    './js/force-refresh-meta-box-admin': './src/layouts/admin-meta-box',
    './css/force-refresh-admin': './src/scss/force-refresh-admin.scss',
    './': './node_modules/font-awesome/fonts/fontawesome-webfont.woff2',
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
      {
        test: /\.scss$/,
        include: [
          path.resolve(__dirname, 'src/scss'),
        ],
        exclude: /node_modules/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'css/',
              name: '[name].css',
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.(woff|woff2)(\?.*$|$)/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: '/fonts/',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: './src/handlebars',
          to: './handlebars',
        },
      ],
    }),
    new LiveReloadPlugin({
      appendScriptTag: true,
    }),
    new VueLoaderPlugin(),
  ],
};
