import { app } from 'electron'
import path from 'path'

export function getResourcePath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(process.cwd(), 'resources')
}
