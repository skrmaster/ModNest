import { GameRepository } from '../db/repo/game.repo'
import { ipcMain } from 'electron'

export function register(): void {
  const gameRepository = new GameRepository()

  ipcMain.handle('game:create', (_, payload) => {
    const result = gameRepository.create(payload)

    return {
      id: result.lastInsertRowid
    }
  })

  ipcMain.handle('game:list', () => {
    const result = gameRepository.list()

    return result
  })

  ipcMain.handle('game:update', (_, { id, ...data }: { id: number } & Record<string, unknown>) => {
    const result = gameRepository.update(id, data)
    return result
  })

  ipcMain.handle('game:remove', (_, id: number) => {
    const result = gameRepository.remove(id)
    return result
  })
}
