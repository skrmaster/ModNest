import { ipcRenderer } from 'electron'

export const fileApi = {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectImage: () => ipcRenderer.invoke('select-image'),
  downloadImage: (url: string, gameName?: string) =>
    ipcRenderer.invoke('download-image', { url, gameName })
}
