import Seven from 'node-7z'
import { path7za } from '7zip-bin'
import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { ModInstallPreview } from '@shared/types/mod'

const { extractFull, list } = Seven

export function extract(archivePath: string, targetDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = extractFull(archivePath, targetDir, {
      $bin: path7za
    })

    stream.on('end', () => resolve())

    stream.on('error', (error) => reject(error))
  })
}

export async function inspectArchive(
  archivePath: string,
  category: string,
  itemName: string,
  modsRoot: string
): Promise<ModInstallPreview> {
  const archiveExt = path.extname(archivePath)
  const modName = path.basename(archivePath, archiveExt)
  const normalizedItemName = itemName.toLowerCase()
  const targetModDir = path.join(modsRoot, category, normalizedItemName, modName)

  const exists = existsSync(targetModDir)

  const archiveStat = await fs.stat(archivePath)
  const createdAt = archiveStat.birthtime.toISOString()

  let previewImage: string | undefined
  const previewImageNames = ['preview.png', 'preview.jpg', 'preview.jpeg', 'preview.webp']

  try {
    const archiveFiles: string[] = []
    for await (const file of list(archivePath, { recursive: false })) {
      if (file.type === 'file') {
        archiveFiles.push(file.name.toLowerCase())
      }
    }

    const matchedPreview = previewImageNames.find((name) =>
      archiveFiles.includes(name.toLowerCase())
    )
    if (matchedPreview) {
      previewImage = matchedPreview
    }
  } catch (error) {
    console.error('解析压缩包文件列表失败:', error)
  }

  return {
    archivePath,
    category,
    itemName: normalizedItemName,
    modName,
    createdAt,
    exists,
    previewImage
  }
}

export function isSupportedArchive(archivePath: string): boolean {
  const supportedExts = ['.zip', '.7z', '.rar', '.tar', '.gz', '.xz']
  const ext = path.extname(archivePath).toLowerCase()
  return supportedExts.includes(ext)
}
