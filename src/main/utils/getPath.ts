import { app } from 'electron'
import path from 'node:path'

export function getSeedImagePath(fileName: string) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'seed-images', fileName)
  }

  return path.join(process.cwd(), 'resources', 'seed-images', fileName)
}
