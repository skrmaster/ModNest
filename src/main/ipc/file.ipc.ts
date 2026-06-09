import { createHash } from 'crypto'
import { pathToFileURL } from 'url'
import { app, ipcMain, protocol, net, dialog } from 'electron'
import { extname, join, resolve } from 'path'
import { promises as fsPromises } from 'fs'

const gameImageProtocol = 'app-image'
function getGameImageDirectory(): string {
  return join(app.getPath('userData'), 'game-images')
}

export function register(): void {
  protocol.handle(gameImageProtocol, async (request) => {
    try {
      const url = new URL(request.url)

      let filePath = ''

      if (url.hostname === 'seed-images') {
        filePath = join(
          process.cwd(),
          'resources',
          'seed-images',
          decodeURIComponent(url.pathname.replace(/^\//, ''))
        )
      } else if (url.hostname === 'user-images') {
        filePath = join(getGameImageDirectory(), decodeURIComponent(url.pathname.slice(1)))
      } else {
        return new Response('not found', {
          status: 404
        })
      }

      return net.fetch(pathToFileURL(filePath).toString())
    } catch (e) {
      console.error('protocol error:', e)

      return new Response(String(e), {
        status: 500
      })
    }
  })

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
      gameName = !gameName ? (+Date.now()).toString() : gameName
      const hash = createHash('sha1').update(`${gameName}:${url}`).digest('hex').slice(0, 12)
      const imageDirectory = getGameImageDirectory()
      const fileName = `${gameName}-${hash}${extension}`
      const imagePath = join(imageDirectory, fileName)

      await fsPromises.mkdir(imageDirectory, { recursive: true })
      await fsPromises.writeFile(imagePath, Buffer.from(await response.arrayBuffer()))

      return fileName
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
