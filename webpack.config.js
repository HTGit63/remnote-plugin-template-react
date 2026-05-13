const { resolve } = require('path');
var glob = require('glob');
var path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ProvidePlugin, BannerPlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const CopyPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

const SANDBOX_SUFFIX = '-sandbox';

const config = {
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? false : 'cheap-module-source-map',
  entry: glob.sync('./src/widgets/**/*.tsx').reduce((obj, el) => {
    const rel = path
      .relative('src/widgets', el)
      .replace(/\.[tj]sx?$/, '')
      .replace(/\\/g, '/');

    obj[rel] = el;
    obj[`${rel}${SANDBOX_SUFFIX}`] = el;
    return obj;
  }, {}),

  output: {
    path: resolve(__dirname, 'dist'),
    filename: `[name].js`,
    publicPath: '',
  },
  performance: {
    maxAssetSize: 350000,
    maxEntrypointSize: 360000,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|jsx|js)?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2020',
          minify: false,
        },
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false } },
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new HtmlWebpackPlugin({
      templateContent: `
      <body></body>
      <script type="text/javascript">
      const urlSearchParams = new URLSearchParams(window.location.search);
      const queryParams = Object.fromEntries(urlSearchParams.entries());
      const widgetName = queryParams["widgetName"] || "bridge-status";
      if (widgetName == undefined) {document.body.innerHTML+="Widget ID not specified."}

      const css = document.createElement('link');
      css.rel = "stylesheet";
      css.href = widgetName+"${SANDBOX_SUFFIX}.css";
      css.onerror = () => {
        if (!css.dataset.fallback) {
          css.dataset.fallback = "true";
          css.href = widgetName+".css";
        }
      };
      document.head.appendChild(css);

      const s = document.createElement('script');
      s.type = "module";
      s.src = widgetName+"${SANDBOX_SUFFIX}.js";
      document.body.appendChild(s);
      </script>
    `,
      filename: 'index.html',
      inject: false,
    }),
    new ProvidePlugin({
      React: 'react',
      reactDOM: 'react-dom',
    }),
    new BannerPlugin({
      banner: (file) => {
        return !file.chunk.name.includes(SANDBOX_SUFFIX) ? 'const IMPORT_META=import.meta;' : '';
      },
      raw: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
        { from: 'README.md', to: '' },
      ],
    }),
  ].filter(Boolean),
};

module.exports = config;
