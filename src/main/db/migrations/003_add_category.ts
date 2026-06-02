import type Database from 'better-sqlite3'
import items from '../seed/category.json'

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
      id,
      name,
      name_zh_cn,
      icon
    )
    VALUES (
      @id,
      @name,
      @name_zh_cn,
      @icon
    )
  `)

  const transaction = db.transaction(() => {
    for (const item of items) {
      stmt.run(item)
    }
  })

  transaction()
}
