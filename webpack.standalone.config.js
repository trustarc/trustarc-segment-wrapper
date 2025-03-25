const path = require("path");
const packageJson = require("./package.json");

module.exports = {
    entry: "./src/index.ts",
    output: {
        filename: `trustarc-segment-wrapper-v${packageJson.version}.js`,
        path: path.resolve(__dirname, "dist/standalone"),
        library: "TrustArcWrapper",
        libraryTarget: "umd",
        globalObject: "this",
        umdNamedDefine: true,
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    mode: "production",
    externals: {
        // Add any external dependencies here
    },
    experiments: {
        outputModule: true,
    },
}; 