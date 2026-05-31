import type Database from 'better-sqlite3'
import { migrations } from './migrations'

export function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      executed_at TEXT NOT NULL
    )
  `)

  const executed = db
    .prepare(
      `
      SELECT version
      FROM migrations
    `
    )
    .all() as { version: number }[]

  const executedVersions = new Set(executed.map((v) => v.version))

  for (const migration of migrations) {
    if (executedVersions.has(migration.version)) {
      continue
    }

    migration.up(db)

    db.prepare(
      `
      INSERT INTO migrations (
        version,
        executed_at
      )
      VALUES (?, datetime('now'))
    `
    ).run(migration.version)

    console.log(`Migration ${migration.version} executed`)
  }
}
