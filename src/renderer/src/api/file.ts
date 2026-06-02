export async function downloadImage(imageUrl: string, imageName?: string): Promise<string> {
  if (!imageUrl) {
    return ''
  }

  return window.api.fileApi.downloadImage(imageUrl, imageName)
}

export async function downloadGameCover(imageUrl: string, gameName?: string): Promise<string> {
  if (!imageUrl) {
    return ''
  }

  return downloadImage(imageUrl, gameName)
}
