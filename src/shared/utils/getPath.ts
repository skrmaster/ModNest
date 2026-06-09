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
