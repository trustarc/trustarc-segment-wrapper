const path = require('path');

module.exports = {
    entry: './src/index.ts', // Your main file
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'var', // Expose as a global variable
        library: 'TrustArcWrapper' // The name of the global variable
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
