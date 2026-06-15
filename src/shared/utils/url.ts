export const getUserImageUrl = (name: string | null): string => {
  if (!name) {
    return ''
  }
  return `app-image://user-images/${name}`
}

export const getAppImageUrl = (name: string | null): string => {
  if (!name) {
    return ''
  }
  return `app-image://seed-images/${name}`
}

export function extractImageFileName(url?: string | null): string {
  if (!url) return ''

  const prefix = 'app-image://seed-images/'

  return url.startsWith(prefix) ? url.slice(prefix.length) : url
}
