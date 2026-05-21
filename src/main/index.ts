import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import extract from 'extract-zip'
import { join, resolve } from 'path'
import { promises as fsPromises } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1536,
    height: 864,
    show: false,
    autoHideMenuBar: true,

    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

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

  createWindow()

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
