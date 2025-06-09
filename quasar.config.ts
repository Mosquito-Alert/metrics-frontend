// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app/wrappers';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Components from 'unplugin-vue-components/vite';

export default defineConfig((ctx) => {
  const isDev = ctx.dev;

  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['i18n', 'axios', 'openlayers'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      // 'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
      'material-icons-outlined',
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      env: {
        API_BASE_URL: isDev ? '/api' : undefined,
      },
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },

      typescript: {
        strict: true,
        vueShim: true,
        // extendTsConfig (tsConfig) {}
      },

      vueRouterMode: 'hash', // available values: 'hash', 'history'
      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,

      // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      // publicPath: process.env.NODE_ENV === 'production' ? '/anomaly_detection/' : '/',
      publicPath: '/',
      // analyze: true,
      // env: {},
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      extendViteConf(viteConf: any) {
        viteConf.resolve = viteConf.resolve || {};

        viteConf.resolve.alias = {
          ...(viteConf.resolve.alias || {}),
          components: path.resolve(__dirname, './src/components'),
        };

        viteConf.resolve.extensions = [
          '.vue',
          '.js',
          '.ts',
          '.jsx',
          '.tsx',
          '.json',
          ...(viteConf.resolve.extensions || []),
        ];

        viteConf.plugins = [
          ...(viteConf.plugins || []),
          Components({
            dirs: ['src/components'],
            extensions: ['vue'],
            deep: true,
            directoryAsNamespace: false,
          }),
        ];
      },
      // viteVuePluginOptions: {},

      vitePlugins: [
        [
          '@intlify/unplugin-vue-i18n/vite',
          {
            // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
            // compositionOnly: false,

            // if you want to use named tokens in your Vue I18n messages, such as 'Hello {name}',
            // you need to set `runtimeOnly: false`
            // runtimeOnly: false,

            ssr: ctx.modeName === 'ssr',

            // you need to set i18n resource including paths !
            include: [fileURLToPath(new URL('./src/i18n', import.meta.url))],
          },
        ],

        [
          'vite-plugin-checker',
          {
            vueTsc: true,
            // eslint: {
            //   lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
            //   useFlatConfig: true,
            // },
          },
          { server: false },
        ],
      ],
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devserver
    devServer: {
      // https: true,
      open: true, // opens browser window automatically
      ...(isDev && {
        proxy: {
          '/api': {
            target: 'http://api:8000/api/v1/',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
        },
      }),
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: {
        brand: {
          primary: '#edb20c',
          primary1: '#efba23',
          primary2: '#f3c954',
          primary3: '#f6d885',
          primary4: '#f9e7b5',
          primary5: '#fdf7e6',
          primaryBlack: '#000000',
          primaryBlack1: '#4a4a49',
          primaryBlack2: '#777776',
          primaryBlack3: '#8e8e8d',
          primaryBlack4: '#a5a5a4',
          primaryBlack5: '#d2d2d1',
          red: '#e94f37',
          red1: '#eb604a',
          red2: '#f08372',
          red3: '#f4a69a',
          red4: '#f8c9c2',
          red5: '#fcedea',
          blue: '#a3d9ff',
          blue1: '#acddff',
          blue2: '#bee4ff',
          blue3: '#d1ecff',
          blue4: '#e3f3ff',
          blue5: '#f5fbff',
          green: '#5bba6f',
          green1: '#6bc17d',
          green2: '#8ccf9a',
          green3: '#acdcb6',
          green4: '#cdead3',
          green5: '#eef8f0',
          purple: '#6b2d5c',
          purple1: '#79416c',
          purple2: '#976b8c',
          purple3: '#b495ad',
          purple4: '#d2bfcd',
          purple5: '#efe9ee',
          accent: '#6b2d5c',
          positive: '#5bba6f',
          negative: '#e94f37',
          info: '#a3d9ff',
          dark: '#282828',
        },
        loading: {
          delay: 400,
          spinnerColor: 'primary',
        },
      },

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: ['Loading'],
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
    //   pwaServiceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    //   bexManifestFile: 'src-bex/manifest.json
    // },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      prodPort: 3000, // The default port that the production server should use
      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        'render', // keep this as last one
      ],

      // extendPackageJson (json) {},
      // extendSSRWebserverConf (esbuildConf) {},

      // manualStoreSerialization: true,
      // manualStoreSsrContextInjection: true,
      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      pwa: false,
      // pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!

      // pwaExtendGenerateSWOptions (cfg) {},
      // pwaExtendInjectManifestOptions (cfg) {}
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
      injectPwaMetaTags: true,
      manifestFilename: 'manifest.json',
      swFilename: 'sw.js',
      useCredentialsForManifestTag: false,
      // extendManifestJson (json) {},
      // extendPWACustomSWConf (esbuildConf) {},
      // extendGenerateSWOptions (cfg) {},
      // extendInjectManifestOptions (cfg) {}
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf) {},
      // extendElectronPreloadConf (esbuildConf) {},

      // extendPackageJson (json) {},

      // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
      preloadScripts: ['electron-preload'],

      // specify the debugging port to use for the Electron app when running in development mode
      inspectPort: 5858,

      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',
        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration/configuration

        appId: 'anomaly-detection-map',
      },
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      // extendBexScriptsConf (esbuildConf) {},
      // extendBexManifestJson (json) {},

      /**
       * The list of extra scripts (js/ts) not in your bex manifest that you want to
       * compile and use in your browser extension. Maybe dynamic use them?
       *
       * Each entry in the list should be a relative filename to /src-bex/
       *
       * @example [ 'my-script.ts', 'sub-folder/my-other-script.js' ]
       */
      extraScripts: [],
    },
  };
});
