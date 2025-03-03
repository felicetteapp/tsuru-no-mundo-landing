const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "bundle.[contenthash].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "public/img", to: "img" },
        { from: "public/fonts", to: "fonts" },
        { from: "public/data", to: "data" },
        {
            from: "public/favicon.ico",
            to: "favicon.ico",
        },
        {
            from: "public/style.css",
            to: "style.css",
        },
        {
            from:   "public/site.webmanifest",
            to:     "site.webmanifest",
        }
      ],
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 9000,
    historyApiFallback: true,
  },
};
