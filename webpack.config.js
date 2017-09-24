const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	entry: './source/main.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'build')
	},
	devtool: 'cheap-module-eval-source-map',
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
				include: path.resolve(__dirname, 'source'),
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
				include: path.resolve(__dirname, 'source'),
				loader: 'babel-loader',
				options: {
					presets: [
						'es2015'
					],
				},
			},
			{
				test: /\.html$/,
				include: path.resolve(__dirname, 'source'),
				loader: 'html-loader',
			},
			{
				test: /\.png$/,
				include: path.resolve(__dirname, 'source'),
				loader: 'base64-image-loader',
			},
		],
	},
};
