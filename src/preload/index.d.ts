import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    fileApi: {
      selectDirectory: () => Promise<string | null>
      selectImage: () => Promise<string | null>
      downloadImage: (url: string, gameId: string) => Promise<string>
    }
  }
}
