import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

export class DatabaseManager {
  private static instance: DatabaseType

  static init(): DatabaseType {
    const dbPath = path.join(app.getPath('userData'), 'app.db')

    const isFirstRun = !fs.existsSync(dbPath)

    const db = new Database(dbPath)

    if (isFirstRun) {
      console.log('首次启动，创建数据库')
      this.createTables(db)
      this.seedData(db)
    }

    this.instance = db

    return db
  }

  static getDB(): DatabaseType {
    return this.instance
  }

  private static createTables(db: Database.Database) {
    db.exec(`
      CREATE TABLE characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        element TEXT NOT NULL
      )
    `)

    db.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `)
  }

  private static seedData(db: Database.Database) {
    const stmt = db.prepare(`
      INSERT INTO settings
      (key, value)
      VALUES (?, ?)
    `)

    stmt.run('theme', 'dark')
    stmt.run('language', 'zh-CN')
  }
}
