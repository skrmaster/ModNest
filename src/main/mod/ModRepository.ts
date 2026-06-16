import { join } from 'node:path'
import { mkdir, readdir, rename, mkdtemp, stat, rm } from 'node:fs/promises'
import { access } from 'node:fs/promises'
import { ModInfo, ModInstallPreview } from '@shared/types/mod'
import { basename, extname } from 'node:path'
import { extract, inspectArchive } from '../utils/zip'
import { ensureOverwrite, exists } from '../utils/file'
import { existsSync } from 'node:fs'
import { ItemRepo } from '../db/repo/item.repo'
import { ItemEntity } from '@shared/entities/item'
import trash from 'trash'
import { MOD_IMAGE_PROTOCOL } from '@shared/constants/index'

export class ModRepository {
  private getCategoryPath(modRootPath: string, categoryPathString: string[]): string {
    return join(modRootPath, ...categoryPathString)
  }

  private getItemPath(modRootPath: string, itemName: string): string {
    return join(modRootPath, itemName.trim().toLowerCase())
  }

  private async getModIni(modPath: string): Promise<string | null> {
    const file = join(modPath, 'mod.ini')

    try {
      await access(file)

      return file
    } catch {
      return null
    }
  }

  private async getModifiedAt(modPath: string): Promise<Date> {
    const stats = await stat(modPath)

    return stats.mtime
  }

  private async getDirectorySize(dir: string): Promise<number> {
    const entries = await readdir(dir, {
      withFileTypes: true
    })

    let total = 0

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        total += await this.getDirectorySize(fullPath)
      } else {
        total += (await stat(fullPath)).size
      }
    }

    return total
  }

  public static async countMod(path: string) {
    const entries = await readdir(path, {
      withFileTypes: true
    })

    let total = 0
    let disabled = 0

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      total++

      if (entry.name.startsWith('DISABLED_')) {
        disabled++
      }
    }

    return {
      total,
      disabled
    }
  }

  private async getPreview(modPath: string): Promise<string | null> {
    const candidates = ['preview.png', 'preview.jpg', 'preview.jpeg']

    for (const file of candidates) {
      const fullPath = join(modPath, file)

      try {
        await access(fullPath)

        return `${MOD_IMAGE_PROTOCOL}:///` + encodeURI(fullPath.replaceAll('\\', '/'))
      } catch (e) {
        console.log('get preview png failure. ' + e)
      }
    }

    return null
  }

  async createItemFolder(modRootPath: string, itemName: string): Promise<string> {
    const itemPath = this.getItemPath(modRootPath, itemName)

    await mkdir(itemPath, {
      recursive: true
    })

    return itemPath
  }

  async install(
    itemData: ItemEntity,
    modRootPath: string,
    itemName: string,
    archivePath: string,
    categoryPathString: string[],
    overwrite = false
  ) {
    const categoryPath = this.getCategoryPath(modRootPath, categoryPathString)
    const itemPath = await this.createItemFolder(categoryPath, itemName)
    const tempDir = await mkdtemp(join(itemPath, '.tmp-'))

    try {
      await extract(archivePath, tempDir)

      const entries = await readdir(tempDir, {
        withFileTypes: true
      })

      let sourcePath: string
      let modName: string

      if (entries.length === 1 && entries[0].isDirectory()) {
        modName = entries[0].name

        sourcePath = join(tempDir, modName)
      } else {
        modName = basename(archivePath, extname(archivePath))

        sourcePath = tempDir
      }

      const targetPath = join(itemPath, modName)

      await ensureOverwrite(targetPath, overwrite, modName)

      await rename(sourcePath, targetPath)
    } finally {
      await rm(tempDir, {
        recursive: true,
        force: true
      }).catch(() => {})

      const item = new ItemRepo()
      const { total, disabled } = await ModRepository.countMod(itemPath)

      item.update(itemData.id, {
        mod_count: total || 0,
        mod_count_enable: Math.abs(total - disabled)
      })
    }
  }

  async inspectArchive(
    archivePath: string,
    category: string,
    itemName: string,
    modsRoot: string
  ): Promise<ModInstallPreview> {
    return inspectArchive(archivePath, category, itemName, modsRoot)
  }

  async list(
    modRootPath: string,
    itemName: string,
    categoryPathString: string[]
  ): Promise<ModInfo[]> {
    const categoryPath = join(modRootPath, ...categoryPathString)

    if (!existsSync(categoryPath)) {
      return []
    }

    const itemPath = join(categoryPath, itemName.trim().toLowerCase())

    if (!existsSync(itemPath)) {
      return []
    }

    const entries = await readdir(itemPath, {
      withFileTypes: true
    })

    return Promise.all(
      entries
        .filter((e) => e.isDirectory())
        .map(async (e) => {
          const modPath = join(itemPath, e.name)

          return {
            name: e.name.replace(/^DISABLED_/, ''),
            enabled: !e.name.startsWith('DISABLED_'),
            cover: await this.getPreview(modPath),
            configPath: await this.getModIni(modPath),
            size: await this.getDirectorySize(modPath),
            modifiedAt: await this.getModifiedAt(modPath)
          }
        })
    )
  }

  async enable(
    itemData: ItemEntity,
    modRootPath: string,
    itemName: string,
    modName: string,
    categoryPathString: string[]
  ): Promise<void> {
    const categoryPath = this.getCategoryPath(modRootPath, categoryPathString)
    const itemPath = await this.createItemFolder(categoryPath, itemName)

    await rename(join(itemPath, `DISABLED_${modName}`), join(itemPath, modName))

    const item = new ItemRepo()
    item.update(itemData.id, {
      mod_count_enable: itemData.mod_count_enable + 1
    })
  }

  async disable(
    itemData: ItemEntity,
    modRootPath: string,
    itemName: string,
    modName: string,
    categoryPathString: string[]
  ): Promise<void> {
    const categoryPath = this.getCategoryPath(modRootPath, categoryPathString)
    const itemPath = await this.createItemFolder(categoryPath, itemName)

    await rename(join(itemPath, modName), join(itemPath, `DISABLED_${modName}`))
    const item = new ItemRepo()

    item.update(itemData.id, {
      mod_count_enable: itemData.mod_count_enable - 1
    })
  }

  async uninstall(
    itemData: ItemEntity,
    modRootPath: string,
    itemName: string,
    modName: string,
    categoryPathString: string[],
    toTrash: boolean = false
  ): Promise<[boolean, string]> {
    const categoryPath = this.getCategoryPath(modRootPath, categoryPathString)
    const itemPath = this.getItemPath(categoryPath, itemName)

    const enabledPath = join(itemPath, modName)
    const disabledPath = join(itemPath, `DISABLED_${modName}`)

    const itemRepo = new ItemRepo()
    let targetPath: string | null = null

    if (await exists(enabledPath)) {
      targetPath = enabledPath
    } else if (await exists(disabledPath)) {
      targetPath = disabledPath
    }

    if (!targetPath) {
      return [false, `Mod不存在: ${modName}`]
    }
    let res = false
    try {
      if (toTrash) {
        await trash(targetPath)
      } else {
        await rm(targetPath, { recursive: true, force: true })
      }

      if (targetPath.includes('DISABLED_')) {
        itemRepo.update(itemData.id, {
          mod_count: itemData.mod_count_enable - 1
        })
      } else {
        itemRepo.update(itemData.id, {
          mod_count: itemData.mod_count_enable - 1,
          mod_count_enable: itemData.mod_count_enable - 1
        })
      }

      res = true
    } catch (err) {
      res = false
      console.log(`删除失败: ${(err as Error).message}`)
    }

    return [res, '删除失败']
  }
}
