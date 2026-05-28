import { app, shell, BrowserWindow, ipcMain, dialog, session, protocol, net } from 'electron'
import extract from 'extract-zip'
import { basename, extname, join, resolve } from 'path'
import { promises as fsPromises } from 'fs'
import { createHash } from 'crypto'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerSettingsIpc } from './ipc/settings.ipc'
import electronLocalshortcut from 'electron-localshortcut'
import icon from '../../resources/icon.png?asset'

const gameImageProtocol = 'app-image'

function getGameImageDirectory(): string {
  return join(app.getPath('userData'), 'game-images')
}

function getGameImageUrl(fileName: string): string {
  return `${gameImageProtocol}://cache/${encodeURIComponent(fileName)}`
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
}

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1536,
    height: 864,
    show: false,
    autoHideMenuBar: true,

    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function createCsp(): void {
  const isDev = process.env.NODE_ENV === 'development'

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? `
          default-src 'self';
          script-src 'self';
          style-src 'self' 'unsafe-inline';
          connect-src 'self' ws://localhost:5173 http://localhost:5173;
          img-src 'self' data: blob: https: app-image:;
          font-src 'self' data:;
          object-src 'none';
          base-uri 'self';
          form-action 'self';
        `
      : `
          default-src 'self';
          script-src 'self';
          style-src 'self' 'unsafe-inline';
          connect-src 'self';
          img-src 'self' data: https: app-image:;
          font-src 'self' data:;
          object-src 'none';
          base-uri 'self';
          form-action 'self';
          frame-ancestors 'none';
        `

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp.replace(/\n/g, ' ')]
      }
    })
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  //set csp
  createCsp()
  registerGameImageProtocol()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register settings IPC
  registerSettingsIpc()

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

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

  ipcMain.handle('download-image', async (_event, { url, gameId }: { url: string; gameId: string }) => {
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
    const hash = createHash('sha1').update(`${gameId}:${url}`).digest('hex').slice(0, 12)
    const imageDirectory = getGameImageDirectory()
    const fileName = `${gameId}-${hash}${extension}`
    const imagePath = join(imageDirectory, fileName)

    await fsPromises.mkdir(imageDirectory, { recursive: true })
    await fsPromises.writeFile(imagePath, Buffer.from(await response.arrayBuffer()))

    return getGameImageUrl(fileName)
  })

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

  // Handle zip extraction from renderer
  ipcMain.handle(
    'extract-zip',
    async (_event, { zipPath, destPath }: { zipPath: string; destPath?: string }) => {
      const zipExists = await fsPromises
        .stat(zipPath)
        .then(() => true)
        .catch(() => false)
      if (!zipExists) throw new Error('Zip file not found')
      const dest = destPath ? resolve(destPath) : app.getPath('downloads')
      await fsPromises.mkdir(dest, { recursive: true })
      try {
        await extract(zipPath, { dir: dest })
        return { ok: true, dest }
      } catch (err: unknown) {
        console.error(err)
        throw err
      }
    }
  )

  const win = createWindow()

  electronLocalshortcut.register(win, 'F12', () => {
    win.webContents.toggleDevTools()
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
