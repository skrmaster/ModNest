import { ipcMain } from 'electron'
import { ModRepository } from './ModRepository'
import { InspectArchive, ListQuery, ModInstall, ModOpt } from '@shared/types/mod'

export function registerModIpc(): void {
  const repo = new ModRepository()

  ipcMain.handle('mod:install', (_, payload: ModInstall) => {
    return repo.install(payload.modRootPath, payload.itemName, payload.archivePath)
  })

  ipcMain.handle('mod:inspectArchive', (_, payload: InspectArchive) => {
    return repo.inspectArchive(
      payload.archivePath,
      payload.category,
      payload.itemName,
      payload.modsRoot
    )
  })

  ipcMain.handle('mod:list', (_, payload: ListQuery) => {
    return repo.list(payload.modRootPath, payload.itemName)
  })

  ipcMain.handle('mod:enable', (_, payload: ModOpt) => {
    return repo.enable(payload.modRootPath, payload.itemName, payload.modName)
  })

  ipcMain.handle('mod:disable', (_, payload: ModOpt) => {
    return repo.disable(payload.modRootPath, payload.itemName, payload.modName)
  })
}
