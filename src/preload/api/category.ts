import { ipcRenderer } from 'electron'
import type { CreateCategoryDto, UpdateCategoryDto } from '@shared/dto/category'

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

  getById(id: string) {
    return ipcRenderer.invoke('category:getInfoById', id)
  }
}
