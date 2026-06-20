import { ipcMain } from 'electron'
import { ChangeFilePath } from '../services/genshin-path/genshin-path.service'

export function register(): void {
  ipcMain.handle('update:path-ps1', (): [boolean, string] => {
    let status = false
    let error = ''
    try {
      const gamePath = new ChangeFilePath()
      status = true
      gamePath.updatePs1Content()
    } catch {
      status = false
      error = 'Failed to obtain game path'
    }
    return [status, error]
  })
}
