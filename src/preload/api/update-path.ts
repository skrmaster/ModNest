import { ipcRenderer } from 'electron'

export const updatePath = {
  updatePs1Path: (): Promise<[boolean, string]> => ipcRenderer.invoke('update:path-ps1')
}
