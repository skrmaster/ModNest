import { ipcMain } from 'electron'
import { Genshin } from '../services/genshin/genshin.service'

export function register(): void {
  ipcMain.handle('genshin:closeNetwork', () => {
    return Genshin.runBadworkBat()
  })

  ipcMain.handle('genshin:installXXMI', () => {
    return Genshin.installXXMI()
  })

  ipcMain.handle('genshin:path-ps1', (): [boolean, string] => {
    let status = false
    let error = ''
    try {
      const gamePath = new Genshin()
      status = true
      gamePath.updatePs1Content()
    } catch {
      status = false
      error = 'Failed to obtain game path'
    }
    return [status, error]
  })
}
