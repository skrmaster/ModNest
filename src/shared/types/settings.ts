export type ThemeMode = 'light' | 'dark' | 'system'

export type Language = 'en-US' | 'zh-CN'

export interface SettingsStore {
  themeMode: ThemeMode
  language: Language
}
