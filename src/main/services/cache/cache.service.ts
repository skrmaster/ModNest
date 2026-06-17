import { MOD_PREVIEW_TMP } from '@shared/constants'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

export async function clearPreviewCache(): Promise<void> {
  const cacheDir = path.join(os.tmpdir(), MOD_PREVIEW_TMP)

  await fs.rm(cacheDir, {
    recursive: true,
    force: true
  })
}
