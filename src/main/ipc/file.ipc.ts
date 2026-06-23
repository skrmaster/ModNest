import { pathToFileURL } from 'url'
import { ipcMain, protocol, net } from 'electron'
import { extname, join } from 'path'
import {
  IMAGE_PROTOCOL,
  MOD_IMAGE_PROTOCOL,
  NO_CACHE_MOD_PREVIEW_IMAGE
} from '@shared/constants/index'
import { FileService } from '../services/file/file.service'
import { readFile } from 'fs/promises'
import { ModOpenFolder } from '@shared/types/mod'
import { getResourcePath } from '../utils/resource-path'

const basePath = getResourcePath()

export function register(): void {
  const fileServices = new FileService()

  protocol.handle(IMAGE_PROTOCOL, async (request) => {
    try {
      const url = new URL(request.url)

      let filePath = ''

      if (url.hostname === 'seed-images') {
        filePath = join(
          basePath,
          'seed-images',
          decodeURIComponent(url.pathname.replace(/^\//, ''))
        )
      } else if (url.hostname === 'user-images') {
        filePath = join(fileServices.getImageProtocol(), decodeURIComponent(url.pathname.slice(1)))
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

  protocol.handle(MOD_IMAGE_PROTOCOL, async (request) => {
    try {
      const encodedPath = request.url.replace(`${MOD_IMAGE_PROTOCOL}:///`, '')

      const filePath = decodeURIComponent(encodedPath)

      return net.fetch(pathToFileURL(filePath).toString())
    } catch (error) {
      console.error('[mod-preview] load failed:', error)

      return new Response('Not Found', {
        status: 404
      })
    }
  })

  protocol.handle(NO_CACHE_MOD_PREVIEW_IMAGE, async (request) => {
    try {
      const encodedPath = request.url.replace(`${NO_CACHE_MOD_PREVIEW_IMAGE}:///`, '')

      const filePath = decodeURIComponent(encodedPath)

      const buffer = await readFile(filePath)

      const ext = extname(filePath).toLowerCase()

      const contentType =
        ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : ext === '.webp'
              ? 'image/webp'
              : 'application/octet-stream'

      return new Response(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      })
    } catch (error) {
      console.error('[mod-preview] load failed:', error)

      return new Response('Not Found', {
        status: 404
      })
    }
  })

  ipcMain.handle('open-folder', async (_, data: ModOpenFolder): Promise<[boolean, string]> => {
    return fileServices.openModFolder(data)
  })

  ipcMain.handle('select-directory', () => {
    return fileServices.openDialog()
  })

  ipcMain.handle('select-image', () => {
    return fileServices.chooseImage()
  })

  ipcMain.handle(
    'download-image',
    async (_event, { url, gameName }: { url: string; gameName?: string }) => {
      return fileServices.importImage(url, gameName)
    }
  )

  ipcMain.handle('create-mod-directory', async (_event, { path }: { path: string }) => {
    fileServices.createDir(path)
  })

  ipcMain.handle('open-link', (_, url: string) => {
    return fileServices.openLink(url)
  })

  ipcMain.handle('open-download', () => {
    const downloadPath = join(getResourcePath(), 'download')

    return fileServices.openInExplorer(downloadPath)
  })
}
