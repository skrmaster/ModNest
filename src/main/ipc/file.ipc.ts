import { pathToFileURL } from 'url'
import { ipcMain, protocol, net } from 'electron'
import { join } from 'path'
import { IMAGE_PROTOCOL, MOD_IMAGE_PROTOCOL } from '@constants/index'
import { FileService } from '../services/file/file.service'

export function register(): void {
  const fileServices = new FileService()

  protocol.handle(IMAGE_PROTOCOL, async (request) => {
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

      console.log(pathToFileURL(filePath).toString())

      return net.fetch(pathToFileURL(filePath).toString())
    } catch (error) {
      console.error('[mod-preview] load failed:', error)

      return new Response('Not Found', {
        status: 404
      })
    }
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
}
