import { ipcRenderer } from 'electron'
import type { CreateGameDto, UpdateDto } from '@shared/dto/game'
import { QueryParams } from '@shared/types/item'

export const itemApi = {
  create(data: CreateGameDto) {
    return ipcRenderer.invoke('item:create', data)
  },

  update(id: string, data: UpdateDto) {
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
