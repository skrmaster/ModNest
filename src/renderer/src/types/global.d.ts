declare global {
  interface Window {
    settingsApi: {
      get: <T = unknown>(key: string) => Promise<T>
      set: (key: string, value: unknown) => Promise<void>
    }
  }
}

export {}
