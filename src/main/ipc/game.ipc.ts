import { UpdateDto } from '@shared/dto/game'
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

  ipcMain.handle('game:update', (_, { id, ...data }: UpdateDto) => {
    const result = gameRepository.update(id as string, data)
    return result
  })

  ipcMain.handle('game:remove', (_, id: string) => {
    const result = gameRepository.remove(id)
    return result
  })

  ipcMain.handle('game:getInfoById', (_, id: string) => {
    const result = gameRepository.findById(id)
    return result
  })
}
