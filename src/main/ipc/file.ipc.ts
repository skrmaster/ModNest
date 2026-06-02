import { createHash } from 'crypto'
import { pathToFileURL } from 'url'
import { app, ipcMain, protocol, net, dialog } from 'electron'
import { basename, extname, join, resolve } from 'path'
import { promises as fsPromises } from 'fs'

const gameImageProtocol = 'app-image'
function getGameImageDirectory(): string {
  return join(app.getPath('userData'), 'game-images')
}

function getGameImageUrl(fileName: string): string {
  return `${gameImageProtocol}://cache/${encodeURIComponent(fileName)}`
}

export function register(): void {
  registerGameImageProtocol()

  // Handle directory selection
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle(
    'download-image',
    async (_event, { url, gameName }: { url: string; gameName?: string }) => {
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
      const hash = createHash('sha1').update(`${gameName}:${url}`).digest('hex').slice(0, 12)
      const imageDirectory = getGameImageDirectory()
      const fileName = `${gameName}-${hash}${extension}`
      const imagePath = join(imageDirectory, fileName)

      await fsPromises.mkdir(imageDirectory, { recursive: true })
      await fsPromises.writeFile(imagePath, Buffer.from(await response.arrayBuffer()))

      return getGameImageUrl(fileName)
    }
  )

  // Handle mod directory creation
  ipcMain.handle('create-mod-directory', async (_event, { path }: { path: string }) => {
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
  })
}

function registerGameImageProtocol(): void {
  protocol.handle(gameImageProtocol, (request) => {
    const url = new URL(request.url)
    const fileName = decodeURIComponent(url.pathname.replace(/^\//, ''))

    if (!fileName || fileName !== basename(fileName)) {
      return new Response(null, { status: 400 })
    }

    return net.fetch(pathToFileURL(join(getGameImageDirectory(), fileName)).toString())
  })

  // protocol.handle('app-image', async (request) => {
  //   const url = new URL(request.url)

  //   const filePath = path.join(
  //     process.resourcesPath,
  //     'seed-images',
  //     decodeURIComponent(url.pathname)
  //   )

  //   return Response.json(filePath)
  // })
}
