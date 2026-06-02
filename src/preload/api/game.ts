import { ipcRenderer } from 'electron'
import type { CreateGameDto, UpdateDto } from '@shared/dto/game'

export const gameApi = {
  create(data: CreateGameDto) {
    return ipcRenderer.invoke('game:create', data)
  },

  update(id: number, data: UpdateDto) {
    return ipcRenderer.invoke('game:update', {
      id,
      ...data
    })
  },

  remove(id: number) {
    return ipcRenderer.invoke('game:remove', id)
  },

  list() {
    return ipcRenderer.invoke('game:list')
  }
}
