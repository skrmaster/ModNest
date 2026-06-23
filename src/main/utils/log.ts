import { app } from 'electron'
import { appendFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

export function writeLog(...args) {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs')

    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }

    const logFile = path.join(logDir, 'app.log')

    const content =
      `[${new Date().toISOString()}] ` + args.map((v) => JSON.stringify(v)).join(' ') + '\n'

    appendFileSync(logFile, content)
  } catch (err) {
    console.error(err)
  }
}
