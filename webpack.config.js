const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = {
  entry: {
    './js/force-refresh': './src/js/force-refresh.js',
    './js/force-refresh-main-admin': './src/js/force-refresh-main-admin.js',
    './js/force-refresh-meta-box-admin': './src/js/force-refresh-meta-box-admin.js',
    './css/force-refresh-admin': './src/scss/force-refresh-admin.scss',
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
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
        test: /\.scss$/,
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
  ],
};
