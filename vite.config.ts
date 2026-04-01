import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import os from 'os'

import legacy from '@vitejs/plugin-legacy'

import compressPlugin from 'vite-plugin-compression'

import cesium from 'vite-plugin-cesium';

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const isServer = os.hostname() === 'iZbp13zz30pkzwq0nftqr0Z'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    server: {
      host: true,
      port: 8888,
      open: true,
      cors: true,
      proxy: {
        '/data': {
          target: isServer
            ? 'http://127.0.0.1:8090'
            : `http://${env.VITE_SERVER_HOST}:8090`,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'modules',
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString()
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.b3dm', '.terrain'],
    },
    plugins: [
      vue(),
      cesium(),
      legacy({
        targets: ['defaults', 'not IE 11'],
      }),
      compressPlugin({
        verbose: false,
        disable: false,
        threshold: 1024,
        algorithm: 'gzip',
        ext: '.gz',
      }),
      AutoImport({
        dts: './src/auto-imports.d.ts',
        imports: [
          'vue',
          'vue-router',
          'pinia',
          {
            axios: [
              ['default', 'axios'],
            ],
          },
        ],
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json',
          globalsPropValue: true,
        },
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        dts: './src/components.d.ts',
        dirs: ['src/components/', 'src/views/components/'],
        extensions: ['vue'],
        resolvers: [ElementPlusResolver()],
      }),
    ],
  }
})
