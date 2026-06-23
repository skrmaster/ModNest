import Seven from 'node-7z'
import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { ModInstallPreview } from '@shared/types/mod'
import { spawn } from 'child_process'
import os from 'os'
import { MOD_IMAGE_PROTOCOL, MOD_PREVIEW_TMP } from '@shared/constants'
import { app } from 'electron'

const sevenZipPath = app.isPackaged
  ? path.join(process.resourcesPath, '7zip', '7z.exe')
  : path.join(process.cwd(), 'resources', '7zip', '7z.exe')

const { extractFull, list } = Seven

export function extractAll(archivePath: string, targetDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = extractFull(archivePath, targetDir, {
      $bin: sevenZipPath
    })

    stream.on('end', () => resolve())

    stream.on('error', (error) => reject(error))
  })
}

export async function getArchiveFiles(archivePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const files: string[] = []

    const stream = list(archivePath, {
      $bin: sevenZipPath
    })

    stream.on('data', (data) => {
      if (data.file) {
        files.push(data.file.toLowerCase())
      }
    })

    stream.on('end', () => {
      resolve(files)
    })

    stream.on('error', reject)
  })
}

export async function extractPreviewImage(
  archivePath: string,
  previewPathInArchive: string
): Promise<string> {
  const tempDir = path.join(os.tmpdir(), MOD_PREVIEW_TMP, crypto.randomUUID())
  await fs.mkdir(tempDir, { recursive: true })

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(sevenZipPath, [
        'e',
        archivePath,
        previewPathInArchive,
        `-o${tempDir}`,
        '-y'
      ])
      child.on('error', reject)
      child.on('exit', (code) => {
        code === 0 ? resolve() : reject(new Error(`7za exited with code ${code}`))
      })
    })

    const outPath = path.join(tempDir, path.basename(previewPathInArchive))
    return outPath
  } catch (err) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw err
  }
}

export async function cleanPreviewTemp(filePath: string) {
  const tempDir = path.dirname(filePath)
  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
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
    const archiveFiles = await getArchiveFiles(archivePath)

    const matchedPreview = archiveFiles.find((file) =>
      previewImageNames.some((preview) => file.endsWith(preview.toLowerCase()))
    )

    if (matchedPreview) {
      const previewImagePath = await extractPreviewImage(archivePath, matchedPreview)

      previewImage = `${MOD_IMAGE_PROTOCOL}:///` + encodeURI(previewImagePath.replaceAll('\\', '/'))
    }
  } catch (error) {
    console.error(error)
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
