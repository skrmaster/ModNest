import { app } from 'electron'
import { Dirent, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import path from 'path'

function extractStrings(buf: Buffer, minLen = 4) {
  const result: string[] = []
  let current = ''

  for (const byte of buf) {
    if (byte >= 32 && byte <= 126) {
      current += String.fromCharCode(byte)
    } else {
      if (current.length >= minLen) result.push(current)
      current = ''
    }
  }

  if (current.length >= minLen) result.push(current)

  return result
}

export function findGenshinExe(root: string): string | null {
  const TARGETS = new Set(['yuanshen.exe', 'genshinimpact.exe', 'genshin impact.exe'])
  const stack = [root]

  while (stack.length) {
    const dir = stack.pop()!

    let files: string[] = []
    try {
      files = readdirSync(dir)
    } catch {
      continue
    }

    for (const f of files) {
      const full = path.join(dir, f)

      let stat
      try {
        stat = statSync(full)
      } catch {
        continue
      }

      if (stat.isDirectory()) {
        stack.push(full)
      } else {
        if (TARGETS.has(f.toLowerCase())) {
          return full
        }
      }
    }
  }

  return null
}

function findUserSettingsDat(): string | null {
  const appData = app.getPath('appData')
  const miHoYoDir = path.join(appData, 'miHoYo')

  if (!existsSync(miHoYoDir)) {
    return null
  }

  const stack = [miHoYoDir]

  while (stack.length > 0) {
    const current = stack.pop()!

    let entries: Dirent<string>[]
    try {
      entries = readdirSync(current, { withFileTypes: true })
    } catch {
      continue
    }

    if (path.basename(current).toLowerCase() === 'data') {
      const targetFile = path.join(current, 'usersettings.dat')

      if (existsSync(targetFile)) {
        return targetFile
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        stack.push(path.join(current, entry.name))
      }
    }
  }

  return null
}

export function setFilePath(): string | null {
  const settingsPath = findUserSettingsDat()

  if (!settingsPath) {
    console.log('not found usersettings.dat')
    return null
  } else {
    console.log('turn up:', settingsPath)
    const buf = readFileSync(settingsPath)
    const strings = extractStrings(buf)
    const gamePathArrr = [...new Set(strings)].filter((s) => s.includes(':\\'))

    return findGenshinExe(gamePathArrr[0])
  }
}

export class ChangeFilePath {
  private gamePath: string | null

  constructor() {
    this.gamePath = setFilePath()
  }

  getPs1Path(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'download', 'genshin_bad_network.ps1')
      : path.join(process.cwd(), 'resources', 'download', 'genshin_bad_network.ps1')
  }

  updatePs1Content() {
    const ps1Path = this.getPs1Path()
    const exePath = this.gamePath as string

    const processName = path.parse(exePath).name

    let content = readFileSync(ps1Path, 'utf8')

    content = content.replace(/^\$programPath\s*=.*$/m, `$programPath = "${exePath}"`)

    content = content.replace(
      /^\s*\$processName\s*=\s*["']?.*?["']?\s*$/m,
      `$processName = "${processName}"`
    )

    writeFileSync(ps1Path, content, 'utf8')
  }
}
