import { cp, rename, access, rm } from 'node:fs/promises'
import fs from 'fs/promises'
import path from 'node:path'
import { exec } from 'node:child_process'
import ws from 'windows-shortcuts'
import { existsSync, readdirSync } from 'node:fs'

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function isDirExists(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath)
    const stat = await fs.stat(dirPath)
    return stat.isDirectory()
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

function execAsync(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout) => {
      if (err) reject(err)
      else resolve(stdout)
    })
  })
}

export async function findXXMIFromRegistry(): Promise<string | null> {
  const cmd = `
    powershell -Command "
      $keys=@(
        'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
        'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
        'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
      )

      Get-ItemProperty $keys |
      Where-Object { $_.DisplayName -like '*XXMI*' } |
      Select-Object -First 1 InstallLocation,DisplayIcon |
      ConvertTo-Json -Compress
    "
  `

  try {
    const result = await execAsync(cmd)

    if (!result.trim()) return null

    const item = JSON.parse(result)

    if (item.InstallLocation) {
      return item.InstallLocation
    }

    if (item.DisplayIcon) {
      return path.dirname(item.DisplayIcon.replace(/,.*/, ''))
    }

    return null
  } catch {
    return null
  }
}

export async function findXXMIFromShortcut(): Promise<string | null> {
  const dirs = [
    path.join(process.env.APPDATA!, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    path.join(process.env.ProgramData!, 'Microsoft', 'Windows', 'Start Menu', 'Programs')
  ]

  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir, { recursive: true })

      for (const file of files) {
        if (file.toLowerCase().includes('xxmi') && file.endsWith('.lnk')) {
          const fullPath = path.join(dir, file)

          const target = await new Promise<string | null>((resolve) => {
            ws.query(fullPath, (err, options) => {
              resolve(err ? null : (options?.target ?? null))
            })
          })

          if (target) {
            return path.dirname(target)
          }
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  return null
}

export function findXXMIRoot(startDir: string): string {
  let current = startDir

  while (true) {
    if (existsSync(path.join(current, 'Resources')) && existsSync(path.join(current, 'Themes'))) {
      return current
    }

    const parent = path.dirname(current)

    if (parent === current) {
      return startDir
    }

    current = parent
  }
}

export async function findXXMIFromCommonDirs(): Promise<string | null> {
  const dirs = [
    process.env.LOCALAPPDATA,
    process.env.PROGRAMFILES,
    process.env['PROGRAMFILES(X86)'],
    'D:\\Games',
    'E:\\Games'
  ].filter(Boolean) as string[]

  for (const dir of dirs) {
    try {
      const entries = readdirSync(dir)

      for (const entry of entries) {
        if (entry.toLowerCase().includes('xxmi')) {
          return path.join(dir, entry)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  return null
}
