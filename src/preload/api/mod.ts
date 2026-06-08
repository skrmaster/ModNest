import { ipcRenderer } from 'electron'
import { InspectArchive, ListQuery, ModInstall, ModOpt, ModUninstall } from '@shared/types/mod'

export const modApi = {
  install(data: ModInstall) {
    return ipcRenderer.invoke('mod:install', data)
  },

  inspectArchive(data: InspectArchive) {
    return ipcRenderer.invoke('mod:inspectArchive', data)
  },

  list(data: ListQuery) {
    return ipcRenderer.invoke('mod:list', data)
  },

  enable(data: ModOpt) {
    return ipcRenderer.invoke('mod:enable', data)
  },

  disable(data: ModOpt) {
    return ipcRenderer.invoke('mod:disable', data)
  },

  uninstall(data: ModUninstall) {
    return ipcRenderer.invoke('mod:uninstall', data)
  }
}
