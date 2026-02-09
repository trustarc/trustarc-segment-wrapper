const path = require('path');
const { version } = require('./package.json');

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: `trustarc-segment-wrapper-v${version}.js`,
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'TrustArcWrapper',
            type: 'umd',
        },
        globalObject: 'this',
    },
    resolve: {
        extensions: ['.ts', '.js'], // Resolve these extensions
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader', // Use ts-loader for TypeScript files
                exclude: /node_modules/,
            },
        ],
    },
    mode: 'production', // Set to 'development' for development mode
};
