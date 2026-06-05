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
}

export interface ModOpt {
  modRootPath: string
  itemName: string
  modName: string
}

export interface ModInstall {
  modRootPath: string
  itemName: string
  archivePath: string
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
