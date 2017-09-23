const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	entry: './source/main.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'build')
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: 'Replic8ors - Behavioral evolution in your browser',
			template: 'source/index.ejs'
		})
	],
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					{
						// creates style nodes from JS strings
						loader: "style-loader",
					}, {
						// translates CSS into CommonJS
						loader: "css-loader",
					}, {
						// compiles Sass to CSS
						loader: "sass-loader",
					},
				],
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
				options: {
					presets: [
						'es2015'
					],
				},
			},
		],
	},
};
