module.exports = {
    mode: 'production',
    entry: "./src/distools.js",
    output: {
        path: __dirname + "/dist",
        filename: "[name].js"
    },
    devtool: false
};