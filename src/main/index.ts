import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import electronLocalshortcut from 'electron-localshortcut'
import icon from '../../resources/icon.png?asset'
import { DatabaseManager } from './db'
import { registerIpcHandlers } from './ipc'
import { registerModIpc } from './mod/Mod.ipc'

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1536,
    height: 864,
    show: false,
    autoHideMenuBar: true,
    minWidth: 500,
    minHeight: 500,

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
app.whenReady().then(async () => {
  DatabaseManager.init()

  //set csp
  createCsp()

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

  //set ipc
  registerIpcHandlers()
  registerModIpc()

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
