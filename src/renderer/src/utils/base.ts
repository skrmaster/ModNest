export const debounce = <T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay = 300
) => {
  let timer: number | null = null
  return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    return new Promise((resolve, reject) => {
      if (timer) clearTimeout(timer)
      timer = window.setTimeout(async () => {
        try {
          const result = await fn(...args)
          resolve(result as Awaited<ReturnType<T>>)
        } catch (e) {
          reject(e)
        }
      }, delay)
    })
  }
}
