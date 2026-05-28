import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import ViteFonts from 'unplugin-fonts/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig(() => ({
  main: {},
  preload: {},
  renderer: {
    define: {
      __INTLIFY_JIT_COMPILATION__: true
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
      }
    },
    plugins: [
      tailwindcss(),
      vue(),
      ViteFonts({
        fontsource: {
          families: [
            {
              name: 'Roboto',
              weights: [100, 300, 400, 500, 700, 900],
              styles: ['normal', 'italic']
            }
          ]
        }
      }),
      VueI18nPlugin({
        include: resolve(__dirname, './src/renderer/src/i18n/locales/**/*.json'),
        runtimeOnly: true,
        strictMessage: false,
        compositionOnly: true
      })
    ]
  }
}))
