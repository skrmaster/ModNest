import { ipcMain } from 'electron'
import { Genshin } from '../services/genshin/genshin.service'

export function register(): void {
  ipcMain.handle('genshin:closeNetwork', () => {
    const gamePath = new Genshin()
    return gamePath.runBadworkBat()
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
