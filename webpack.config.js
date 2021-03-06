module.exports = {
  entry: "./public/app.js",
  output: {
    filename: "./public/bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /\.scss$/,
        loader: 'style!css!sass'
      }
    ]
  }
}
