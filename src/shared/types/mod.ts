import { ItemEntity } from '@shared/entities/item'

export interface ModInfo {
  name: string
  enabled: boolean

  cover: string | null

  configPath: string | null

  size: number

  modifiedAt: Date
}

export interface ListQuery {
  modRootPath: string
  itemName: string
  categoryPathString: string[]
}

export interface ModOpt {
  itemData: ItemEntity
  modRootPath: string
  itemName: string
  modName: string
  categoryPathString: string[]
}

export interface ModInstall {
  itemData: ItemEntity
  modRootPath: string
  itemName: string
  modName: string
  archivePath: string
  categoryPathString: string[]
}

export interface ModUninstall {
  itemData: ItemEntity
  modRootPath: string
  itemName: string
  modName: string
  categoryPathString: string[]
  toTrash: boolean
}

export interface InspectArchive {
  archivePath: string
  category: string
  itemName: string
  modsRoot: string
}

export interface ModInstallPreview {
  archivePath: string
  category: string
  itemName: string
  modName: string
  createdAt: string
  exists: boolean
  previewImage?: string
}

export interface ModPreviewData {
  archivePath: string
  category: string
  itemName: string
  modName: string
  createdAt: string
  exists: boolean
  previewImage?: string
}

export interface UpdateModPreview {
  modRootPath: string
  itemName: string
  modeName: string
  oldName?: string
  downloadUrl: string
  categoryPathString: string[]
  enable: boolean
}

export interface ModOpenFolder {
  modRootPath: string
  itemName: string
  modeName: string
  categoryPathString: string[]
  enable: boolean
}
