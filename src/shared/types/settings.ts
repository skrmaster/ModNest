export type ThemeMode = 'light' | 'dark' | 'system'

export type AppTheme = 'light' | 'dark'

export type Language = 'en-US' | 'zh-CN' | 'system'

export type AppLang = 'en-US' | 'zh-CN'

export interface GameConfig {
  id: string
  nameZh: string
  nameEn: string
  modPath: string
  image: string
  imageUrl?: string
  isDefault?: boolean
}

export interface SettingsStore {
  themeMode: ThemeMode
  language: Language
  gameConfigs?: GameConfig[]
}
