import { ipcRenderer } from 'electron'
import type { CreateItemDto, UpdateItemDto } from '@shared/dto/item'
import { QueryParams } from '@shared/types/item'

export const itemApi = {
  create(data: CreateItemDto) {
    return ipcRenderer.invoke('item:create', data)
  },

  update(id: string, data: UpdateItemDto) {
    return ipcRenderer.invoke('item:update', {
      id,
      ...data
    })
  },

  remove(id: string) {
    return ipcRenderer.invoke('item:remove', id)
  },

  list(data: QueryParams) {
    return ipcRenderer.invoke('item:list', data)
  },

  getById(id: string) {
    return ipcRenderer.invoke('item:getInfoById', id)
  }
}
