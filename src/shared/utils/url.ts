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

  if (url.includes('app-image:')) {
    const parts = url.split('/')
    return parts[parts.length - 1] || ''
  }

  return url
}
