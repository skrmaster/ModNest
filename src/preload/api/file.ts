import { ModOpenFolder } from '@shared/types/mod'
import { ipcRenderer, webUtils } from 'electron'

export const fileApi = {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectImage: () => ipcRenderer.invoke('select-image'),
  downloadImage: (url: string, gameName?: string): Promise<string> =>
    ipcRenderer.invoke('download-image', { url, gameName }),

  getPathForFile(file: File) {
    return webUtils.getPathForFile(file)
  },

  openFolder: (data: ModOpenFolder): Promise<[boolean, string]> =>
    ipcRenderer.invoke('open-folder', data),

  openLink: (url: string) => ipcRenderer.invoke('open-link', url),

  openDownload: () => ipcRenderer.invoke('open-download')
}
