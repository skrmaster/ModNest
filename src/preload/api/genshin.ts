import { ipcRenderer } from 'electron'

export const genshinApi = {
  startGame: (): Promise<[boolean, string]> => ipcRenderer.invoke('genshin:start'),
  closeNetwork: () => ipcRenderer.invoke('genshin:closeNetwork'),
  installXXMI: () => ipcRenderer.invoke('genshin:installXXMI')
}
