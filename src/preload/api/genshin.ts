import { ipcRenderer } from 'electron'

export const genshinApi = {
  startGame: (): Promise<[boolean, string]> => ipcRenderer.invoke('genshin:start'),
  closeNetwork: () => ipcRenderer.invoke('genshin:closeNetwork'),
  updatePs1Path: (): Promise<[boolean, string]> => ipcRenderer.invoke('genshin:path-ps1')
}
