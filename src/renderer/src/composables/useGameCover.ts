export function useGameCover() {
  const selectCover = async () => {
    const path = await window.api.fileApi.selectImage()

    return path ? `file:///${path.replace(/\\/g, '/')}` : ''
  }

  const downloadCover = (imageUrl: string, gameName?: string) => {
    return window.api.fileApi.downloadImage(imageUrl, gameName)
  }

  return {
    selectCover,
    downloadCover
  }
}
