import './assets/main.css'
import 'md-editor-v3/lib/style.css'

import { createApp } from 'vue'
import App from './App.vue'
import { setupRouter } from './router'
import i18n from './i18n'
import { createPinia } from 'pinia'
import { vuetify, vuetifyLocaleMap } from './plugins/vuetify'
import { AppLang, ThemeMode } from '@shared/types/settings'

async function bootstrap(): Promise<void> {
  const theme = (await window.api.settingsApi.getSystemTheme()) as ThemeMode
  const language = (await window.api.settingsApi.getSystemLanguage()) as AppLang

  vuetify.theme.change(theme)
  vuetify.locale.current.value = vuetifyLocaleMap[language]
  i18n.global.locale.value = language

  const app = createApp(App)
  const pinia = createPinia()

  setupRouter(app)

  app.use(vuetify)
  app.use(i18n)
  app.use(pinia)

  app.mount('#app')
}

bootstrap()
