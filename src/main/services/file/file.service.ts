import { USER_IMAGE_NAME } from '@shared/constants/index'
import { createHash } from 'crypto'
import { app, dialog } from 'electron'
import { join, extname, resolve, dirname, basename } from 'path'
import { promises as fsPromises } from 'fs'
import { access, copyFile } from 'fs/promises'

export class FileService {
  private imageDir: string

  constructor() {
    this.imageDir = join(app.getPath('userData'), USER_IMAGE_NAME)
  }

  getImageProtocol() {
    return this.imageDir
  }

  async openDialog() {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  }

  async downloadImage(url: string, gameName?: string) {
    const imageUrl = new URL(url)

    if (!['http:', 'https:'].includes(imageUrl.protocol)) {
      throw new Error('Only HTTP and HTTPS image URLs are supported')
    }

    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') ?? ''

    if (!contentType.startsWith('image/')) {
      throw new Error('URL did not return an image')
    }

    const extensionFromUrl = extname(imageUrl.pathname).toLowerCase()
    const extensionFromType = contentType.includes('png')
      ? '.png'
      : contentType.includes('webp')
        ? '.webp'
        : contentType.includes('gif')
          ? '.gif'
          : '.jpg'
    const extension = extensionFromUrl || extensionFromType
    gameName = !gameName ? (+Date.now()).toString() : gameName
    const hash = createHash('sha1').update(`${gameName}:${url}`).digest('hex').slice(0, 12)

    const fileName = `${gameName}-${hash}${extension}`
    const imagePath = join(this.imageDir, fileName)

    await fsPromises.mkdir(this.imageDir, { recursive: true })
    await fsPromises.writeFile(imagePath, Buffer.from(await response.arrayBuffer()))

    return fileName
  }

  async copyLocalImage(sourcePath: string, gameName?: string): Promise<string> {
    await access(sourcePath)

    if (dirname(sourcePath) === this.imageDir) {
      return basename(sourcePath)
    }

    const sourceFileName = basename(sourcePath)

    try {
      await access(join(this.imageDir, sourceFileName))
      return sourceFileName
    } catch (err) {
      console.log(err)
    }

    const ext = extname(sourcePath)

    const hash = createHash('sha1')
      .update(gameName ? `${gameName}-${Date.now()}` : `${sourcePath}-${Date.now()}`)
      .digest('hex')
      .slice(0, 12)

    const fileName = `${hash}${ext}`

    const target = join(this.imageDir, fileName)

    await copyFile(sourcePath, target)

    return fileName
  }

  async importImage(pathOrUrl: string, gameName?: string): Promise<string> {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return this.downloadImage(pathOrUrl, gameName)
    }

    return this.copyLocalImage(pathOrUrl, gameName)
  }

  async chooseImage(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  }

  async createDir(path: string) {
    try {
      const resolvedPath = resolve(path)
      const pathExists = await fsPromises
        .stat(resolvedPath)
        .then((stats) => stats.isDirectory())
        .catch(() => false)

      if (!pathExists) {
        await fsPromises.mkdir(resolvedPath, { recursive: true })
      }

      return { success: true, path: resolvedPath }
    } catch (err: unknown) {
      console.error('Error creating directory:', err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      return { success: false, error: `创建目录失败: ${errorMsg}` }
    }
  }
}
