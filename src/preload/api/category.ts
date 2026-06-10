import { ipcRenderer } from 'electron'
import type { CreateCategoryDto, UpdateCategoryDto } from '@shared/dto/category'
import { Category } from '@shared/entities/category'

export const categoryApi = {
  create(data: CreateCategoryDto) {
    return ipcRenderer.invoke('category:create', data)
  },

  update(id: string, data: UpdateCategoryDto) {
    return ipcRenderer.invoke('category:update', {
      id,
      ...data
    })
  },

  remove(id: string) {
    return ipcRenderer.invoke('category:remove', id)
  },

  list() {
    return ipcRenderer.invoke('category:list')
  },

  findCategoriesByItemId(id: string): Promise<Category[]> {
    return ipcRenderer.invoke('category:findCategoriesByItemId', id)
  }
}
