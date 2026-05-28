import { ThemeMode, Language, GameConfig } from '@shared/types/settings'

export interface SettingsStore {
  theme: ThemeMode
  accentColor: string
  language: Language
  modRootPath: string
  gameConfigs: GameConfig[]
  windowBounds: {
    width: number
    height: number
  }
}
