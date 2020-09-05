const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = {
  entry: {
    './js/force-refresh': './library/src/js/force-refresh.js',
    './js/force-refresh-main-admin': './library/src/js/force-refresh-main-admin.js',
    './js/force-refresh-meta-box-admin': './library/src/js/force-refresh-meta-box-admin.js',
    './css/force-refresh-admin': './library/src/sass/force-refresh-admin.scss',
  },
  output: {
    path: path.resolve(__dirname, 'library/dist/'),
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
              presets: ['@babel/preset-env']
            },
          },
        ]
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'css/',
              name: '[name].css'
            }
          },
          'sass-loader'
        ]
      }
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: './library/src/handlebars',
          to: './handlebars',
        },
      ],
    }),
    new LiveReloadPlugin({
      appendScriptTag: true,
    })
  ]
};
