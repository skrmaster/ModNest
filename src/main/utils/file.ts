import { cp, rename, access, rm } from 'node:fs/promises'

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function ensureOverwrite(
  path: string,
  overwrite: boolean,
  name: string
): Promise<void> {
  const pathExists = await exists(path)

  if (!pathExists) {
    return
  }

  if (!overwrite) {
    throw new Error(`MOD_EXISTS:${name}`)
  }

  await rm(path, {
    recursive: true,
    force: true
  })
}

export async function moveDirectory(source: string, target: string) {
  try {
    await rename(source, target)
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err
    }

    const code = (err as NodeJS.ErrnoException).code

    if (code !== 'EXDEV') {
      throw err
    }

    await cp(source, target, {
      recursive: true,
      force: true
    })

    await rm(source, {
      recursive: true,
      force: true
    })
  }
}
