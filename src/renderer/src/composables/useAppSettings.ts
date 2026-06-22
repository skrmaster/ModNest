import { ref, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import i18n from '@renderer/i18n'
import type { Ref } from 'vue'
import type { ThemeMode, Language, AppTheme, AppLang } from '@shared/types/settings'

const theme = (await window.api.settingsApi.getSystemTheme()) as AppTheme
const lang = await window.api.settingsApi.getSystemLanguage()

const themeMode = ref<ThemeMode>('system')
const appTheme = ref<AppTheme>(theme)
const language = ref<AppLang>(lang)

const getSystemTheme = () => window.api.settingsApi.getSystemTheme()

export function useAppSettings(): {
  themeMode: Ref<ThemeMode>
  appTheme: Ref<AppTheme>
  language: Ref<Language>
} {
  const theme = useTheme()

  window.api.settingsApi.onSystemThemeChanged((t) => {
    theme.change(t)
  })

  const applyTheme = async (): Promise<void> => {
    const currentT = await getSystemTheme()

    appTheme.value = currentT
    theme.change(currentT)
  }

  watch(themeMode, async (value) => {
    await window.api.settingsApi.set('theme', value)

    applyTheme()
  })

  watch(language, async (value) => {
    await window.api.settingsApi.set('language', value)

    i18n.global.locale.value = value
  })

  onMounted(() => {
    applyTheme()
  })

  return {
    themeMode,

    appTheme,

    language
  }
}
