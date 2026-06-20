import { ipcMain } from 'electron'
import { Genshin } from '../services/genshin/genshin.service'

export function register(): void {
  ipcMain.handle('genshin:start', (): Promise<[boolean, string]> => {
    const GenShin = new Genshin()
    return GenShin.startGame()
  })

  ipcMain.handle('genshin:closeNetwork', () => {
    return Genshin.runBadworkBat()
  })

  ipcMain.handle('genshin:installXXMI', () => {
    return Genshin.installXXMI()
  })
}
