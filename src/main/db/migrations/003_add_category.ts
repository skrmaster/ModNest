import type Database from 'better-sqlite3'
import data from '../seed/category.json'

export function up(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "main"."t_game_category" (
      "id" integer NOT NULL ON CONFLICT ABORT PRIMARY KEY AUTOINCREMENT,
      "name" text NOT NULL,
      "icon" text,
      "name_zh_cn" text NOT NULL,
      UNIQUE ("name")
    );
  `)

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO t_game_category (
      name,
      name_zh_cn,
      icon
    )
    VALUES (
      @name,
      @name_zh_cn,
      @icon
    )
  `)

  const transaction = db.transaction(() => {
    for (const item of data) {
      stmt.run(item)
    }
  })

  transaction()
}
