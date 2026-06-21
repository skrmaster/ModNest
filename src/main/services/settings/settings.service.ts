import { app, BrowserWindow, nativeTheme } from 'electron'
import { BaseStoreService } from '../core/base-store.service'
import type { SettingsStore } from '../settings/settings.type'
import { AppTheme } from '@shared/types/settings'

export class SettingsService extends BaseStoreService<SettingsStore> {
  private static instance: SettingsService

  private constructor() {
    super('settings', {
      theme: 'light',
      language: 'en-US'
    })
  }
  public initialize(): void {
    nativeTheme.on('updated', () => {
      const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'

      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send('system-theme-changed', theme)
      })
    })
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }

    return SettingsService.instance
  }

  public getSystemTheme(): AppTheme {
    const theme = this.get('theme')

    if (theme === 'system') {
      return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    }

    return theme
  }

  public getSystemLanguage(): SettingsStore['language'] {
    const language = this.get('language')

    if (language) {
      return language
    }

    const locale = app.getLocale().toLowerCase()
    return locale.startsWith('zh') ? 'zh-CN' : 'en-US'
  }
}
