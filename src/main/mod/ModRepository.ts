import { join } from 'node:path'
import { mkdir, readdir, rename, mkdtemp, stat, rm } from 'node:fs/promises'
import { access } from 'node:fs/promises'
import { ModInfo, ModInstallPreview } from '@shared/types/mod'
import { basename, extname } from 'node:path'
import { extract, inspectArchive } from '../utils/zip'
import { ensureOverwrite } from '../utils/file'

export class ModRepository {
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

  private async getPreview(modPath: string): Promise<string | null> {
    const candidates = ['preview.png', 'preview.jpg', 'preview.jpeg']

    for (const file of candidates) {
      const fullPath = join(modPath, file)

      try {
        await access(fullPath)

        return fullPath
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

  async install(modRootPath: string, itemName: string, archivePath: string, overwrite = false) {
    const itemPath = await this.createItemFolder(modRootPath, itemName)

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

  async list(modRootPath: string, itemName: string): Promise<ModInfo[]> {
    const itemPath = await this.createItemFolder(modRootPath, itemName)

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

  async enable(modRootPath: string, itemName: string, modName: string): Promise<void> {
    const itemPath = this.getItemPath(modRootPath, itemName)

    await rename(join(itemPath, `DISABLED_${modName}`), join(itemPath, modName))
  }

  async disable(modRootPath: string, itemName: string, modName: string): Promise<void> {
    const itemPath = this.getItemPath(modRootPath, itemName)

    await rename(join(itemPath, modName), join(itemPath, `DISABLED_${modName}`))
  }
}
