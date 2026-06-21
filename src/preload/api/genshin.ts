import { ipcRenderer } from 'electron'

export const genshinApi = {
  startGame: (): Promise<[boolean, string]> => ipcRenderer.invoke('genshin:start'),
  closeNetwork: () => ipcRenderer.invoke('genshin:closeNetwork'),
  installXXMI: () => ipcRenderer.invoke('genshin:installXXMI'),
  updatePs1Path: (): Promise<[boolean, string]> => ipcRenderer.invoke('genshin:path-ps1')
}
