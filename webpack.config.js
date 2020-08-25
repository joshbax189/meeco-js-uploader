const path = require("path");
// const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  devServer: {
    port: 1234,
  },
  watchOptions: {
    ignored: ['src/**/.#*', 'src/.#*']
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "fonts/[name].[ext]",
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  // output: {
  //   path: path.resolve(__dirname, "./dist"),
  //   filename: "index_bundle.js",
  // },
  plugins: [
  //   new HtmlWebpackPlugin({
  //     template: path.resolve(__dirname, "./dist/index.html"),
    //   }),
  ],
};