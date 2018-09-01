const webpack = require('webpack');
const uglify = require('uglifyjs-webpack-plugin');
const { removeEmpty } = require('webpack-config-utils');
const { resolve } = require('path');

/**
 * @param {string} env
 * @param {*} argv 
 * @see https://webpack.js.org/configuration/configuration-types/#exporting-a-function-to-use-env
 * @example webpack --env=dev
 */
const config = (env, argv) => {
    const ifProduction = (trueValue, falseValue) => (argv.mode === 'production' ? trueValue : falseValue);

    /**
     * UMD bundling configs
     */
    return [{

        // Use special name suffix for production entry point `.min` to uglify it
        entry: {
            ['index' + ifProduction('.min', '')]: ['./src/index.ts'],
        },

        output: {
            path: resolve(__dirname, 'lib', 'umd'),
            libraryTarget: 'umd',
            library: 'iching',
            umdNamedDefine: true
        },

        // `.ts` resolver in order for webpack to look for typescript files
        resolve: {
            extensions: ['.ts'],
        },
        
        optimization: {
            splitChunks: {
                chunks: 'all'
            }
        },

        // Add source maps to the bundles for user debugging
        devtool: 'source-map',

        plugins: removeEmpty([

            // Enable scope hoisting
            new webpack.optimize.ModuleConcatenationPlugin(),

            // Uglify the production bundle
            ifProduction(
                new uglify({
                    sourceMap: true,
                    uglifyOptions: {
                        compress: true,
                        output: {
                            comments: false
                        }
                    }
                })
            ),

            // Adds environment variables
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: argv.mode
                },
            }),

        ]),

        module: {
            rules: [{
                test: /\.ts?$/,
                include: /src/,
                exclude: /src\/test/,
                loader: 'awesome-typescript-loader',
            }],
        },
    }];
};

module.exports = config;