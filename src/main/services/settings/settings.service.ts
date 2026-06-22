import { app, BrowserWindow, nativeTheme } from 'electron'
import { BaseStoreService } from '../core/base-store.service'
import type { SettingsStore } from '../settings/settings.type'
import { AppLang, AppTheme } from '@shared/types/settings'

export class SettingsService extends BaseStoreService<SettingsStore> {
  private static instance: SettingsService

  private constructor() {
    super('settings', {
      theme: 'system',
      language: 'system'
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

  public getSystemLanguage(): AppLang {
    const language = this.get('language')

    if (language !== 'system') {
      return language
    }

    const locale = app.getLocale().toLowerCase()
    return locale.startsWith('zh') ? 'zh-CN' : 'en-US'
  }
}
