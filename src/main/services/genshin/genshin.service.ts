import { exec, spawn } from 'child_process'
import { app, shell } from 'electron'
import { Dirent, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { access, copyFile, mkdir, readFile, rm, unlink, writeFile } from 'fs/promises'
import path, { join } from 'path'

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

function findGenshinExe(root: string): string | null {
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

function setFilePath(): string | null {
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

async function createZip(files: string[], outputZip: string): Promise<string> {
  const _47Path = join(outputZip, 'd3dcompiler_47.dll')

  files.push(_47Path)

  const existPaths = files.filter(existsSync)
  const zipFile = join(outputZip, 'copy_file.zip')

  if (existPaths.length === 0) {
    return ''
  }

  const paths = existPaths.map((file) => `'${file}'`).join(',')

  const cmd =
    `powershell -NoProfile -Command ` +
    `"Compress-Archive -Path @(${paths}) -DestinationPath ${zipFile} -Force"`

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.log(error, stderr)

        return reject(stderr || error.message)
      }

      rm(_47Path)

      resolve(stdout || 'Compression complete')
    })
  })
}

function unzipToCurrentDir(zipPath: string) {
  return new Promise<void>((resolve, reject) => {
    const outputDir = path.dirname(zipPath)

    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-Command',
      'Expand-Archive',
      '-Path',
      zipPath,
      '-DestinationPath',
      outputDir,
      '-Force'
    ])

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Decompression failed: ${code}`))
      }
    })
  })
}

export class Genshin {
  private path: string

  constructor() {
    const res = setFilePath()
    if (res) {
      this.path = res
    } else {
      throw new Error('no game path')
    }
  }

  async startGame(): Promise<[boolean, string]> {
    let status = true
    let errorStr = ''

    try {
      const [XXMIPath] = await this.getXXMIPath()

      const XXMIRootDir = path.dirname(path.dirname(path.dirname(XXMIPath)))
      const GIMIDir = join(XXMIRootDir, 'GIMI')

      const replaceFileNames = [
        join(GIMIDir, '3DMigoto Loader.exe'),
        join(GIMIDir, 'd3dcompiler_46.dll'),
        join(GIMIDir, 'd3d11.dll')
      ]

      await createZip(replaceFileNames, GIMIDir)

      await this.prerequisite(replaceFileNames)
      await this.updateConfig(GIMIDir)

      await shell.openPath(replaceFileNames[0])

      Genshin.closeXXMI()
    } catch (e) {
      console.log(e, 'XXMI')

      errorStr = 'XXMIPathNull'
      status = false
    }

    return [status, errorStr]
  }

  async prerequisite(replaceFileName: string[]) {
    const downloadDir = app.isPackaged
      ? path.join(process.resourcesPath, 'download')
      : path.join(process.cwd(), 'resources', 'download')

    const _3dmigotoZip = app.isPackaged
      ? path.join(process.resourcesPath, 'download', '3dmigoto-GIMI-for-playing-mods.zip')
      : path.join(process.cwd(), 'resources', 'download', '3dmigoto-GIMI-for-playing-mods.zip')

    await unzipToCurrentDir(_3dmigotoZip)
    const zipRoot = join(downloadDir, '3dmigoto')

    const currentFileNames = [
      join(zipRoot, '3DMigoto Loader.exe'),
      join(zipRoot, 'd3dcompiler_46.dll'),
      join(zipRoot, 'd3d11.dll')
    ]

    for (let i = 0; i < currentFileNames.length; i++) {
      const source = currentFileNames[i]
      const target = replaceFileName[i]

      await access(source)

      await mkdir(path.dirname(target), { recursive: true })

      await copyFile(source, target)

      await unlink(source)
    }
  }

  async updateConfig(GIMIPath: string) {
    const d3dxini = join(GIMIPath, 'd3dx.ini')

    const targetExe = path.basename(this.path)

    if (existsSync(d3dxini)) {
      let content = await readFile(d3dxini, 'utf8')

      content = content
        .replace(/^(target\s*=\s*).*/gm, `$1${targetExe}`)
        .replace(/^(launch\s*=\s*).*/gm, `$1${this.path}`)

      await writeFile(d3dxini, content, 'utf8')
    }
  }

  async getXXMIPath(): Promise<[string, boolean, string]> {
    const cmd = `powershell -Command "Get-Process | Where-Object {$_.ProcessName -like '*XXMI*'} | Select-Object -ExpandProperty Path"`
    let status = true
    let errorStr = ''
    let XXMIPath = ''

    return new Promise<[string, boolean, string]>((resolve, reject) => {
      exec(cmd, { windowsHide: true }, (error, stdout) => {
        if (error) {
          errorStr = error.message
          reject([XXMIPath, status, errorStr])
        }

        const path = stdout.trim()

        if (!path) {
          status = false
          reject([XXMIPath, status, errorStr])
        }
        status = true
        XXMIPath = path

        resolve([XXMIPath, status, errorStr])
      })
    })
  }

  getPs1Path(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'download', 'genshin_bad_network.ps1')
      : path.join(process.cwd(), 'resources', 'download', 'genshin_bad_network.ps1')
  }

  updatePs1Content() {
    const ps1Path = this.getPs1Path()
    const exePath = this.path as string

    const processName = path.parse(exePath).name

    let content = readFileSync(ps1Path, 'utf8')

    content = content.replace(/^\$programPath\s*=.*$/m, `$programPath = "${exePath}"`)

    content = content.replace(
      /^\s*\$processName\s*=\s*["']?.*?["']?\s*$/m,
      `$processName = "${processName}"`
    )

    writeFileSync(ps1Path, content, 'utf8')
  }

  static runBadworkBat() {
    const pathBat = app.isPackaged
      ? path.join(process.resourcesPath, 'download', 'badwork.bat')
      : path.join(process.cwd(), 'resources', 'download', 'badwork.bat')
    shell.openPath(pathBat)
  }

  static installXXMI() {
    const pathBat = app.isPackaged
      ? path.join(process.resourcesPath, 'download', 'XXMI-Launcher-Installer-Online-v2.2.1.msi')
      : path.join(
          process.cwd(),
          'resources',
          'download',
          'XXMI-Launcher-Installer-Online-v2.2.1.msi'
        )
    shell.openPath(pathBat)
  }

  static closeXXMI() {
    exec(`taskkill /F /T /IM "XXMI Launcher.exe"`, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr || err.message)
        return
      }
      console.log(stdout)
    })
  }
}
