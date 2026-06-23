import { exec, spawn } from 'child_process'
import { app, shell } from 'electron'
import { Dirent, existsSync, readdirSync, readFileSync, Stats, statSync, writeFileSync } from 'fs'
import { access, copyFile, mkdir, readFile, rm, unlink, writeFile } from 'fs/promises'
import path, { join } from 'path'
import { EventEmitter } from 'events'
import { TaskRunner } from '../task-engine/TaskRunner'
import type { StepDefinition, TaskSummary } from '@shared/types/task-engine'
import {
  findXXMIFromCommonDirs,
  findXXMIFromRegistry,
  findXXMIFromShortcut,
  findXXMIRoot
} from '../../utils/file'

function extractStrings(buf: Buffer, minLen = 4): string[] {
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
  if (!existsSync(miHoYoDir)) return null

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
      if (existsSync(targetFile)) return targetFile
    }
    for (const entry of entries) {
      if (entry.isDirectory()) stack.push(path.join(current, entry.name))
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
      let stat: Stats
      try {
        stat = statSync(full)
      } catch {
        continue
      }
      if (stat.isDirectory()) {
        stack.push(full)
      } else if (TARGETS.has(f.toLowerCase())) {
        return full
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
  }
  console.log('turn up:', settingsPath)
  const buf = readFileSync(settingsPath)
  const strings = extractStrings(buf)
  const gamePathArr = [...new Set(strings)].filter((s) => s.includes(':\\'))
  return findGenshinExe(gamePathArr[0])
}

async function createZip(files: string[], outputDir: string): Promise<string> {
  const _47Path = join(outputDir, 'd3dcompiler_47.dll')

  const candidates = [...files, _47Path]
  const existPaths = candidates.filter(existsSync)
  const zipFile = join(outputDir, 'copy_file.zip')

  if (existPaths.length === 0) return ''

  const paths = existPaths.map((f) => `'${f}'`).join(',')
  const cmd =
    `powershell -NoProfile -Command ` +
    `"Compress-Archive -Path @(${paths}) -DestinationPath '${zipFile}' -Force"`

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(error, stderr)
        return reject(stderr || error.message)
      }
      rm(_47Path).catch(() => {})
      resolve(stdout || 'Compression complete')
    })
  })
}

function unzipToCurrentDir(zipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
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
      code === 0 ? resolve() : reject(new Error(`Decompression failed with code: ${code}`))
    })
  })
}

interface GenshinCtx {
  XXMIPath: string
  GIMIDir: string
  replaceFileNames: string[]
}

function buildGenshinSteps(instance: Genshin): StepDefinition<Partial<GenshinCtx>>[] {
  return [
    {
      id: 'getPath',
      name: 'getPath',
      maxRetries: 2,
      async execute(ctx, signal) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
        ctx.XXMIPath = await instance.getXXMIPath()
      }
    },
    {
      id: 'resolveDir',
      name: 'resolveDir',
      dependsOn: ['getPath'],
      async execute(ctx, signal) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
        const XXMIRootDir = findXXMIRoot(ctx.XXMIPath!)

        ctx.GIMIDir = join(XXMIRootDir, 'GIMI')
      }
    },
    {
      id: 'prepareFiles',
      name: 'prepareFiles',
      dependsOn: ['resolveDir'],
      async execute(ctx, signal) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
        ctx.replaceFileNames = [
          join(ctx.GIMIDir!, '3DMigoto Loader.exe'),
          join(ctx.GIMIDir!, 'd3dcompiler_46.dll'),
          join(ctx.GIMIDir!, 'd3d11.dll')
        ]
      }
    },
    {
      id: 'pack',
      name: 'pack',
      dependsOn: ['prepareFiles'],
      maxRetries: 1,
      async execute(ctx, signal) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
        await createZip(ctx.replaceFileNames!, ctx.GIMIDir!)
      }
    },
    {
      id: 'prerequisite',
      name: 'prerequisite',
      dependsOn: ['pack'],
      async execute(ctx, signal) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
        await instance.prerequisite(ctx.replaceFileNames!)
      }
    },
    {
      id: 'updateConfig',
      name: 'updateConfig',
      dependsOn: ['prerequisite'],
      async execute(ctx, signal) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
        await instance.updateConfig(ctx.GIMIDir!)
      }
    },
    {
      id: 'launch',
      name: 'launch',
      dependsOn: ['updateConfig'],
      async execute(ctx, signal) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
        await shell.openPath(ctx.replaceFileNames![0])
      }
    }
  ]
}

export class Genshin extends EventEmitter {
  private readonly gamePath: string
  private runner = new TaskRunner<Partial<GenshinCtx>>()

  constructor() {
    super()
    const res = setFilePath()
    if (!res) throw new Error('no game path: usersettings.dat not found or game exe not found')
    this.gamePath = res
    this.runner.on('event', (e) => this.emit('task:event', e))
  }
  async startGame(): Promise<TaskSummary> {
    const ctx: Partial<GenshinCtx> = {}
    return this.runner.run('genshin:startGame', buildGenshinSteps(this), ctx)
  }

  cancel(): void {
    this.runner.cancel()
  }

  async prerequisite(replaceFileName: string[]): Promise<void> {
    const downloadDir = app.isPackaged
      ? path.join(process.resourcesPath, 'download')
      : path.join(process.cwd(), 'resources', 'download')

    const _3dmigotoZip = app.isPackaged
      ? path.join(process.resourcesPath, 'download', '3dmigoto-GIMI-for-playing-mods.zip')
      : path.join(process.cwd(), 'resources', 'download', '3dmigoto-GIMI-for-playing-mods.zip')

    await unzipToCurrentDir(_3dmigotoZip)
    const zipRoot = join(downloadDir, '3dmigoto')

    const sourceFiles = [
      join(zipRoot, '3DMigoto Loader.exe'),
      join(zipRoot, 'd3dcompiler_46.dll'),
      join(zipRoot, 'd3d11.dll')
    ]

    for (let i = 0; i < sourceFiles.length; i++) {
      const source = sourceFiles[i]
      const target = replaceFileName[i]
      await access(source)
      await mkdir(path.dirname(target), { recursive: true })
      await copyFile(source, target)
      await unlink(source)
    }
  }

  async updateConfig(GIMIPath: string): Promise<void> {
    const d3dxini = join(GIMIPath, 'd3dx.ini')
    const targetExe = path.basename(this.gamePath)

    if (!existsSync(d3dxini)) return

    let content = await readFile(d3dxini, 'utf8')
    content = content
      .replace(/^(target\s*=\s*).*/gm, `$1${targetExe}`)
      .replace(/^(launch\s*=\s*).*/gm, `$1${this.gamePath}`)
    await writeFile(d3dxini, content, 'utf8')
  }

  async getXXMIPath(): Promise<string> {
    let path = await findXXMIFromRegistry()

    console.log(path, '1')

    if (path) return path

    path = await findXXMIFromShortcut()
    console.log(path, '2')

    if (path) return path

    path = await findXXMIFromCommonDirs()
    console.log(path, '3')

    if (path) return path

    throw new Error('xxmiNotFound')
  }

  getPs1Path(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'download', 'genshin_bad_network.ps1')
      : path.join(process.cwd(), 'resources', 'download', 'genshin_bad_network.ps1')
  }

  updatePs1Content(): void {
    const ps1Path = this.getPs1Path()
    const processName = path.parse(this.gamePath).name

    let content = readFileSync(ps1Path, 'utf8')
    content = content.replace(/^\$programPath\s*=.*$/m, `$programPath = "${this.gamePath}"`)
    content = content.replace(
      /^\s*\$processName\s*=\s*["']?.*?["']?\s*$/m,
      `$processName = "${processName}"`
    )
    writeFileSync(ps1Path, content, 'utf8')
  }

  static runBadworkBat(): void {
    const pathBat = app.isPackaged
      ? path.join(process.resourcesPath, 'download', 'badwork.bat')
      : path.join(process.cwd(), 'resources', 'download', 'badwork.bat')
    shell.openPath(pathBat)
  }

  static installXXMI(): void {
    const msi = app.isPackaged
      ? path.join(process.resourcesPath, 'download', 'XXMI-Launcher-Installer-Online-v2.2.1.msi')
      : path.join(
          process.cwd(),
          'resources',
          'download',
          'XXMI-Launcher-Installer-Online-v2.2.1.msi'
        )
    shell.openPath(msi)
  }
}
