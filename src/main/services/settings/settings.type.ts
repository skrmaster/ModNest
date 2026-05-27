import { ThemeMode, Language } from '@shared/types/settings'

export interface SettingsStore {
  theme: ThemeMode
  accentColor: string
  language: Language
  modRootPath: string
  windowBounds: {
    width: number
    height: number
  }
}
