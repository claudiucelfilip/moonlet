import common from "./common.config";
import {resolve} from "path";

import WriteFilePlugin from "write-file-webpack-plugin";
import CopyWebpackPlugin from 'copy-webpack-plugin';
/**
 * Function that mutates original webpack config.
 * Supports asynchronous changes when promise is returned.
 *
 * @param {object} config original webpack config.
 * @param {object} env options passed to CLI.
 * @param {WebpackConfigHelpers} helpers object with useful helpers when working with config.
 **/
export default function (config, env, helpers) {
    // apply common config
    config.output.publicPath = './';
    common(config, env, helpers);    

    // customize config
    config.resolve.alias['preact-cli-entrypoint'] = resolve(process.cwd(), 'src', 'extension', 'index');

    // add background script
    config.output.filename = "[name].js";
    config.entry["background"] = resolve(process.cwd(), 'src', 'extension', 'background');

    // overwrite manifest.json 
    config.plugins.unshift(new CopyWebpackPlugin([
        {
            from: resolve(process.cwd(), 'src', 'extension', 'manifest.json'),
            to: "manifest.json"
        }
    ]));

    // used for dev to load component in browser
    config.plugins.push(
        new WriteFilePlugin()
    );
}

