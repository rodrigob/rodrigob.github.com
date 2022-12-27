import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import html from '@web/rollup-plugin-html';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import { litCss } from 'rollup-plugin-css-lit';
import { terser } from 'rollup-plugin-terser';
// import summary from 'rollup-plugin-summary';
import { generateSW } from 'rollup-plugin-workbox';
import path from 'path';


const isProd = process.env.NODE_ENV === 'production';

const litCssConfig = {
  minify: isProd,
  include: ['**/*.css'],
  exclude: undefined,
  uglify: isProd
};

export default {
  input: 'index.html',
  output: {
    entryFileNames: '[hash].js',
    chunkFileNames: '[hash].js',
    assetFileNames: '[hash][extname]',
    format: 'es',
    dir: 'dist',
    sourcemap: isProd ? false : true 
  },
  preserveEntrySignatures: false,

  plugins: [
    /** Resolve bare module imports */
    nodeResolve({
      dedupe: [
        'lit-element',
        'lit-html',
      ]
    }),
    /** Handle lit css imports */
    litCss(litCssConfig),

    /** Enable using HTML as rollup entrypoint */
    html({
      minify: isProd,
      injectServiceWorker: true,
      serviceWorkerPath: 'dist/sw.js',
    }),

    /** Minify JS */
    isProd? terser(): null,
    
    /** Bundle assets references via import.meta.url */
    importMetaAssets(),

    // /** Compile JS to a lower language target */
    // babel({
    //   babelHelpers: 'bundled',
    //   presets: [
    //     [
    //       require.resolve('@babel/preset-env'),
    //       {
    //         targets: [
    //           'last 3 Chrome major versions',
    //           'last 3 Firefox major versions',
    //           'last 3 Edge major versions',
    //           'last 3 Safari major versions',
    //         ],
    //         modules: false,
    //         bugfixes: true,
    //       },
    //     ],
    //   ],
    //   plugins: [
    //     [
    //       require.resolve('babel-plugin-template-html-minifier'),
    //       {
    //         modules: { lit: ['html', { name: 'css', encapsulation: 'style' }] },
    //         failOnError: false,
    //         strictCSS: true,
    //         htmlMinifier: {
    //           collapseWhitespace: true,
    //           conservativeCollapse: true,
    //           removeComments: true,
    //           caseSensitive: true,
    //           minifyCSS: true,
    //         },
    //       },
    //     ],
    //   ],
    // }),
    /** Create and inject a service worker */
    generateSW({
      globIgnores: ['polyfills/*.js', 'nomodule-*.js'],
      navigateFallback: '/index.html',
      // where to output the generated sw
      swDest: path.join('dist', 'sw.js'),
      // directory to match patterns against to be precached
      globDirectory: path.join('dist'),
      // cache any html js and css by default
      globPatterns: ['**/*.{html,js,css,webmanifest}'],
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [{ urlPattern: 'polyfills/*.js', handler: 'CacheFirst' }],
    }),
    // /** Print a summary of the bundle */
    // // summary(),
  ],
};
