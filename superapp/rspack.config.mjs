import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as Repack from '@callstack/repack';
import {withZephyr} from 'zephyr-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USE_ZEPHYR = Boolean(process.env.ZC);

/**
 * Rspack configuration enhanced with Re.Pack defaults for React Native.
 *
 * Learn about Rspack configuration: https://rspack.dev/config/
 * Learn about Re.Pack configuration: https://re-pack.dev/docs/guides/configuration
 */

export default env => {
  const {mode, platform = process.env.PLATFORM} = env;
  const config = {
    context: __dirname,
    entry: './index.js',
    experiments: {
      incremental: mode === 'development',
    },
    resolve: {
      // 1. Understand the file path of ios and android file extensions
      // 2. Configure the output to be as close to Metro as possible
      ...Repack.getResolveOptions(),
    },
    output: {
      // Unsure - for module federation HMR and runtime?
      uniqueName: 'super-host-app',
    },
    module: {
      rules: [
        ...Repack.getJsTransformRules(),
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin({
        platform,
      }),
      new Repack.plugins.ModuleFederationPluginV2({
        name: 'superapp',
        dts: false,
        remotes: {
          miniapp: `miniapp@http://localhost:9001/${platform}/miniapp.container.js.bundle`,
        },
        shared: {
          react: {
            singleton: true,
            version: '19.0.0',
            eager: true,
          },
          'react-native': {
            singleton: true,
            version: '0.78.2',
            eager: true,
          },
        },
      }),
      // Supports for new architecture - Hermes can also use JS, it's not a requirement, it will still work the same but it's for performance optimization
      new Repack.plugins.HermesBytecodePlugin({
        enabled: mode === 'production',
        test: /\.(js)?bundle$/,
        exclude: /index.bundle$/,
      }),
    ],
  };
  return withZephyr()(config);
};
