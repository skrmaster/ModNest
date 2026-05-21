import { defineConfig } from 'vite'
import ViteFonts from 'unplugin-fonts/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
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
    })
  ]
})
