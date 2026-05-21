import { defineConfig } from 'vite'
import ViteFonts from 'unplugin-fonts/vite'

export default defineConfig({
  plugins: [
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
