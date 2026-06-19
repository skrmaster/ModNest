import { ipcMain } from 'electron'
import { ModRepository } from './ModRepository'
import {
  InspectArchive,
  ListQuery,
  ModInstall,
  ModOpt,
  ModUninstall,
  UpdateModPreview
} from '@shared/types/mod'

export function registerModIpc(): void {
  const repo = new ModRepository()

  ipcMain.handle('mod:install', (_, payload: ModInstall) => {
    return repo.install(
      payload.itemData,
      payload.modRootPath,
      payload.itemName,
      payload.modName,
      payload.archivePath,
      payload.categoryPathString
    )
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
    return repo.list(payload.modRootPath, payload.itemName, payload.categoryPathString)
  })

  ipcMain.handle('mod:enable', (_, payload: ModOpt) => {
    return repo.enable(
      payload.itemData,
      payload.modRootPath,
      payload.itemName,
      payload.modName,
      payload.categoryPathString
    )
  })

  ipcMain.handle('mod:disable', (_, payload: ModOpt) => {
    return repo.disable(
      payload.itemData,
      payload.modRootPath,
      payload.itemName,
      payload.modName,
      payload.categoryPathString
    )
  })

  ipcMain.handle('mod:uninstall', (_, payload: ModUninstall) => {
    return repo.uninstall(
      payload.itemData,
      payload.modRootPath,
      payload.itemName,
      payload.modName,
      payload.categoryPathString,
      payload.toTrash
    )
  })

  ipcMain.handle('mod:updatePreview', (_, payload: UpdateModPreview) => {
    return repo.updateModPreview(payload)
  })
}
