import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { setupRouter } from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#FFFFFF',
          surface: '#F5F5F5',
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#B00020',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00'
        }
      },
      dark: {
        dark: true,
        colors: {
          background: '#121212',
          surface: '#1E1E1E',
          primary: '#90CAF9',
          secondary: '#EEEEEE',
          accent: '#82B1FF',
          error: '#CF6679',
          info: '#64B5F6',
          success: '#81C784',
          warning: '#FFB74D'
        }
      }
    }
  }
})

const app = createApp(App)
setupRouter(app)
app.use(vuetify)
app.mount('#app')
