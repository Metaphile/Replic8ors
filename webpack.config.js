const path = require('path');

module.exports = {
	entry: './source/main.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'build')
	},
	module: {
		rules: [{
				test: /\.scss$/,
				use: [{
						loader: "style-loader" // creates style nodes from JS strings
				}, {
						loader: "css-loader" // translates CSS into CommonJS
				}, {
						loader: "sass-loader" // compiles Sass to CSS
				}]
		}]
	}
};
