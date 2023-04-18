const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
    entry: path.resolve(__dirname, 'src/index.ts'),
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    target: 'webworker',
    output: {
        filename: 'worker.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'production',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            fs: false,
        },
    },
    plugins: [new NodePolyfillPlugin()],
    performance: {
        hints: false,
    },
};