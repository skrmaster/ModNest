import { computed, ref, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import i18n from '@renderer/i18n'
import type { ComputedRef, Ref } from 'vue'
import type { ThemeMode, Language } from '@shared/types/settings'

const theme = (await window.api.settingsApi.get('theme')) as ThemeMode
const lang = (await window.api.settingsApi.get('language')) as Language

const themeMode = ref<ThemeMode>(theme)
const language = ref<Language>(lang)

const getSystemTheme = async (): Promise<ThemeMode> => await window.api.settingsApi.getSystemTheme()

export function useAppSettings(): {
  themeMode: Ref<ThemeMode>
  language: Ref<Language>
  themeModeOptions: ComputedRef<
    Array<{
      label: string
      value: ThemeMode
    }>
  >
  languageOptions: ComputedRef<
    Array<{
      label: string
      value: Language
    }>
  >

  initialize: () => Promise<void>
} {
  const theme = useTheme()

  const applyTheme = async (): Promise<void> => {
    if (themeMode.value === 'system') {
      theme.change(await getSystemTheme())
    } else {
      theme.change(themeMode.value)
    }
  }

  const initialize = async (): Promise<void> => {
    const savedTheme = await window.api.settingsApi.getSystemTheme()

    const savedLanguage = await window.api.settingsApi.getSystemLanguage()

    if (savedTheme) {
      themeMode.value = savedTheme as ThemeMode
    }

    if (savedLanguage) {
      language.value = savedLanguage as Language
    }

    i18n.global.locale.value = language.value

    applyTheme()
  }

  watch(themeMode, async (value) => {
    await window.api.settingsApi.set('themeMode', value)

    applyTheme()
  })

  watch(language, async (value) => {
    await window.api.settingsApi.set('language', value)

    i18n.global.locale.value = value
  })

  onMounted(() => {
    if ('matchMedia' in window) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      mediaQuery.addEventListener('change', () => {
        if (themeMode.value === 'system') {
          applyTheme()
        }
      })
    }
  })

  const themeModeOptions = computed(() => {
    return [
      {
        label: i18n.global.t('theme.light') as string,
        value: 'light' as ThemeMode
      },

      {
        label: i18n.global.t('theme.dark') as string,
        value: 'dark' as ThemeMode
      },

      {
        label: i18n.global.t('theme.system') as string,
        value: 'system' as ThemeMode
      }
    ]
  })

  const languageOptions = computed(() => {
    return [
      {
        label: i18n.global.t('language.zh') as string,
        value: 'zh' as Language
      },

      {
        label: i18n.global.t('language.en') as string,
        value: 'en' as Language
      }
    ]
  })

  return {
    themeMode,

    language,

    themeModeOptions,

    languageOptions,

    initialize
  }
}
