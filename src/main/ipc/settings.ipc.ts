import { ipcMain } from 'electron'
import { SettingsService } from '../services/settings/settings.service'

export function register(): void {
  const settings = SettingsService.getInstance()

  ipcMain.handle('settings:get', (_, key) => {
    return settings.get(key)
  })

  ipcMain.handle('settings:set', (_, key, value) => {
    settings.set(key, value)
  })

  ipcMain.handle('settings:getSystemTheme', () => SettingsService.getSystemTheme())
  ipcMain.handle('settings:getSystemLanguage', () => SettingsService.getSystemLanguage())
}
