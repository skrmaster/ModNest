import { ipcRenderer } from 'electron'

export const settingsApi = {
  get: (key: string) => ipcRenderer.invoke('settings:get', key),
  set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  getSystemTheme: () => ipcRenderer.invoke('settings:getSystemTheme'),
  getSystemLanguage: () => ipcRenderer.invoke('settings:getSystemLanguage'),
  onSystemThemeChanged: (callback: (theme: 'light' | 'dark') => void) => {
    const listener = (_: unknown, theme: 'light' | 'dark') => {
      callback(theme)
    }

    ipcRenderer.on('system-theme-changed', listener)

    return () => {
      ipcRenderer.removeListener('system-theme-changed', listener)
    }
  }
}
