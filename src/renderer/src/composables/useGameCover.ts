import { downloadGameCover } from '@renderer/api/file'

export function useGameCover() {
  const selectCover = async () => {
    const path = await window.api.fileApi.selectImage()

    return path ? `file:///${path.replace(/\\/g, '/')}` : ''
  }

  const downloadCover = (imageUrl: string, gameName?: string) => {
    return downloadGameCover(imageUrl, gameName)
  }

  return {
    selectCover,
    downloadCover
  }
}
