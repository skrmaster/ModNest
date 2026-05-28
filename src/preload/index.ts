import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('settingsApi', {
      get: (key: string) => ipcRenderer.invoke('settings:get', key),
      set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value)
    })
    contextBridge.exposeInMainWorld('fileApi', {
      selectDirectory: () => ipcRenderer.invoke('select-directory'),
      selectImage: () => ipcRenderer.invoke('select-image'),
      downloadImage: (url: string, gameId: string) =>
        ipcRenderer.invoke('download-image', { url, gameId })
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.settingsApi = {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value)
  }
  // @ts-ignore (define in dts)
  window.fileApi = {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    selectImage: () => ipcRenderer.invoke('select-image'),
    downloadImage: (url: string, gameId: string) =>
      ipcRenderer.invoke('download-image', { url, gameId })
  }
}
