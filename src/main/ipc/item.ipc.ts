import { UpdateCategoryDto } from '@shared/dto/category'
import { ipcMain } from 'electron'
import { ItemRepo } from '../db/repo/item.repo'
import { QueryParams } from '@shared/types/item'

export function register(): void {
  const repo = new ItemRepo()

  ipcMain.handle('item:create', (_, payload) => {
    const result = repo.create(payload)

    return {
      id: result.lastInsertRowid
    }
  })

  ipcMain.handle('item:list', (_, payload: QueryParams) => {
    const result = repo.list(payload.gameId, payload.primaryCategoryId, payload.secondaryCategoryId)
    return result
  })

  ipcMain.handle('item:update', (_, { id, ...data }: UpdateCategoryDto) => {
    const result = repo.update(id as string, data)
    return result
  })

  ipcMain.handle('item:remove', (_, id: string) => {
    const result = repo.remove(id)
    return result
  })

  ipcMain.handle('item:getInfoById', (_, id: string) => {
    const result = repo.findById(id)
    return result
  })
}
