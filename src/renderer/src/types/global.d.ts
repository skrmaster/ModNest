declare global {
  interface Window {
    settingsApi: {
      get: <T = unknown>(key: string) => Promise<T>
      set: (key: string, value: unknown) => Promise<void>
    }
    fileApi: {
      selectDirectory: () => Promise<string | null>
      selectImage: () => Promise<string | null>
      downloadImage: (url: string, gameId: string) => Promise<string>
    }
  }
}

export {}
