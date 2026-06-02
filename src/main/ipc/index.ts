const modules = import.meta.glob('./*.ipc.ts', {
  eager: true
})

export function registerIpcHandlers() {
  Object.values(modules).forEach((module) => {
    if (
      typeof module === 'object' &&
      module &&
      'register' in module &&
      typeof module.register === 'function'
    ) {
      module.register()
    }
  })
}
