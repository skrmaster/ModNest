import { ipcRenderer, webUtils } from 'electron'

export const fileApi = {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectImage: () => ipcRenderer.invoke('select-image'),
  downloadImage: (url: string, gameName?: string) =>
    ipcRenderer.invoke('download-image', { url, gameName }),

  getPathForFile(file: File) {
    return webUtils.getPathForFile(file)
  }
}
