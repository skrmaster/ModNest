import { app, ipcMain } from 'electron'
import { promises as fsPromises } from 'fs'
import { resolve } from 'path'
import extract from 'extract-zip'

export function register(): void {
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
}
