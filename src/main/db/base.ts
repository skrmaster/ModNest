import Database from 'better-sqlite3'
import { runMigrations } from './migrationRunner'
import path from 'path'
import { app } from 'electron'
import type { Database as DatabaseType } from 'better-sqlite3'

const dbPath = path.join(app.getPath('userData'), 'app.db')
export class DatabaseManager {
  static init(): DatabaseType {
    const db = new Database(dbPath)

    db.pragma('foreign_keys = ON')

    runMigrations(db)

    return db
  }
}
