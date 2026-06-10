import { UpdateCategoryDto } from '@shared/dto/category'
import { CategoryRepository } from '../db/repo/category.repo'
import { ipcMain } from 'electron'

export function register(): void {
  const repo = new CategoryRepository()

  ipcMain.handle('category:create', (_, payload) => {
    const result = repo.create(payload)

    return {
      id: result.lastInsertRowid
    }
  })

  ipcMain.handle('category:list', () => {
    const result = repo.list()

    return result
  })

  ipcMain.handle('category:update', (_, { id, ...data }: UpdateCategoryDto) => {
    const result = repo.update(id as string, data)
    return result
  })

  ipcMain.handle('category:remove', (_, id: string) => {
    const result = repo.remove(id)
    return result
  })

  ipcMain.handle('category:findCategoriesByItemId', (_, id: string) => {
    const result = repo.findCategoriesByItemId(id)
    return result
  })
}
