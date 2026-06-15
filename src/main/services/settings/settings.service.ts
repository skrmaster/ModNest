import { app, nativeTheme } from 'electron'
import { BaseStoreService } from '../core/base-store.service'
import type { SettingsStore } from '../settings/settings.type'

export class SettingsService extends BaseStoreService<SettingsStore> {
  private static instance: SettingsService

  private constructor() {
    super('settings', {
      theme: SettingsService.getSystemTheme(),
      language: SettingsService.getSystemLanguage()
    })
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }

    return SettingsService.instance
  }

  public static getSystemTheme(): SettingsStore['theme'] {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  }

  public static getSystemLanguage(): SettingsStore['language'] {
    const locale = app.getLocale().toLowerCase()

    return locale.startsWith('zh') ? 'zh-CN' : 'en-US'
  }
}
