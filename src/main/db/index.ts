import Database from 'better-sqlite3'
import { runMigrations } from './migrationRunner'
import path from 'path'
import { app } from 'electron'
import type { Database as DatabaseType } from 'better-sqlite3'

const dbPath = path.join(app.getPath('userData'), 'app.db')
export class DatabaseManager {
  private static instance: DatabaseType

  static init(): DatabaseType {
    if (this.instance) {
      return this.instance
    }

    this.instance = new Database(dbPath)

    this.instance.pragma('foreign_keys = ON')

    runMigrations(this.instance)

    return this.instance
  }

  static getDb(): DatabaseType {
    if (!this.instance) {
      throw new Error('Database not initialized. Call DatabaseManager.init() first.')
    }

    return this.instance
  }
}
