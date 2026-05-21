import { computed, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { useTheme } from 'vuetify'

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'en' | 'zh'

const STORAGE_THEME_KEY = 'app-theme-mode'
const STORAGE_LANGUAGE_KEY = 'app-language'

const defaultThemeMode: ThemeMode = 'system'
const defaultLanguage: Language = 'zh'

const savedTheme = (window.localStorage.getItem(STORAGE_THEME_KEY) as ThemeMode) || defaultThemeMode
const savedLanguage =
  (window.localStorage.getItem(STORAGE_LANGUAGE_KEY) as Language) || defaultLanguage

const themeMode = ref<ThemeMode>(savedTheme)
const language = ref<Language>(savedLanguage)

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function useAppSettings(): {
  themeMode: typeof themeMode
  language: typeof language
  themeModeOptions: ComputedRef<Array<{ label: string; value: ThemeMode }>>
  languageOptions: ComputedRef<Array<{ label: string; value: Language }>>
} {
  const theme = useTheme()

  const applyTheme = (): void => {
    if (themeMode.value === 'system') {
      theme.global.name.value = getSystemTheme()
    } else {
      theme.global.name.value = themeMode.value
    }
  }

  applyTheme()

  watch(themeMode, (value) => {
    window.localStorage.setItem(STORAGE_THEME_KEY, value)
    applyTheme()
  })

  watch(language, (value) => {
    window.localStorage.setItem(STORAGE_LANGUAGE_KEY, value)
  })

  if ('matchMedia' in window) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (themeMode.value === 'system') {
        applyTheme()
      }
    })
  }

  const themeModeOptions: ComputedRef<Array<{ label: string; value: ThemeMode }>> = computed(() => [
    { label: '浅色', value: 'light' },
    { label: '深色', value: 'dark' },
    { label: '跟随系统', value: 'system' }
  ])

  const languageOptions: ComputedRef<Array<{ label: string; value: Language }>> = computed(() => [
    { label: '中文', value: 'zh' },
    { label: 'English', value: 'en' }
  ])

  return {
    themeMode,
    language,
    themeModeOptions,
    languageOptions
  }
}
