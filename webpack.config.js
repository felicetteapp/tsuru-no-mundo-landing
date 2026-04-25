const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const {
  getTsurusInfo,
  compileHomePageTemplate,
} = require("./utils/tsurus.cjs");
const fs = require("fs");
const { compileDetailTemplate } = require("./utils/detail.js");
const Handlebars = require("handlebars");

Handlebars.registerHelper("pathFromRoot", function (relativePath) {
  return path.join("..", relativePath).replace(/\\/g, "/");
});

Handlebars.registerPartial("header", () =>
  fs.readFileSync(path.resolve(__dirname, "public/header.handlebars"), "utf8"),
);

Handlebars.registerPartial("footer", () =>
  fs.readFileSync(path.resolve(__dirname, "public/footer.handlebars"), "utf8"),
);

Handlebars.registerPartial(
  "layout",
  fs.readFileSync(path.resolve(__dirname, "public/layout.handlebars"), "utf8"),
);

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
      templateContent: () => {
        const aboutTemplateRaw = fs.readFileSync(
          path.resolve(__dirname, "public/about.handlebars"),
          "utf8",
        );
        return Handlebars.compile(aboutTemplateRaw)();
      },
      filename: "about.html",
      inject: false,
    }),
    new HtmlWebpackPlugin({
      templateContent: () =>
        compileHomePageTemplate(Handlebars, getTsurusInfo()),
      filename: "index.html",
      inject: false,
    }),
    ...getTsurusInfo().map((tsuru, _, tsurus) => {
      const biggerNumber = Math.max(...tsurus.map((t) => t.number));
      const smallerNumber = Math.min(...tsurus.map((t) => t.number));
      const previousTsuruNumber =
        tsuru.number === smallerNumber ? biggerNumber : tsuru.number - 1;
      const nextTsuruNumber =
        tsuru.number === biggerNumber ? smallerNumber : tsuru.number + 1;

      tsuru.previous = {
        number: previousTsuruNumber,
        url: `/tsurus/${previousTsuruNumber}`,
      };

      tsuru.next = {
        number: nextTsuruNumber,
        url: `/tsurus/${nextTsuruNumber}`,
      };

      return new HtmlWebpackPlugin({
        templateContent: () => compileDetailTemplate(Handlebars, tsuru),
        filename: `tsurus/${tsuru.number}.html`,
        inject: false,
      });
    }),
    {
      apply(compiler) {
        compiler.hooks.thisCompilation.tap("WatchHandlebars", (compilation) => {
          compilation.fileDependencies.add(
            path.resolve(__dirname, "public/detail.handlebars"),
          );
          compilation.fileDependencies.add(
            path.resolve(__dirname, "public/header.handlebars"),
          );
          compilation.fileDependencies.add(
            path.resolve(__dirname, "public/footer.handlebars"),
          );
          compilation.fileDependencies.add(
            path.resolve(__dirname, "public/layout.handlebars"),
          );
          compilation.fileDependencies.add(
            path.resolve(__dirname, "public/home.handlebars"),
          );
          compilation.fileDependencies.add(
            path.resolve(__dirname, "public/about.handlebars"),
          );
          compilation.fileDependencies.add(
            path.resolve(__dirname, "utils/tsurus.cjs"),
          );
          compilation.fileDependencies.add(
            path.resolve(__dirname, "utils/detail.js"),
          );
        });
      },
    },
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "public/.well-known",
          to: ".well-known",
        },
        {
          from: "public/img",
          to: "img",
          globOptions: { ignore: ["**/tsurus/full/**"] },
        },
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
          from: "public/site.webmanifest",
          to: "site.webmanifest",
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 9000,
    watchFiles: ["src/**/*", "public/**/*"],
  },
};
