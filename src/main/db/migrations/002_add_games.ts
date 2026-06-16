import type Database from 'better-sqlite3'
import items from '../seed/games.json'

export function up(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "main"."t_user_game" (
      "id" integer NOT NULL ON CONFLICT ABORT PRIMARY KEY AUTOINCREMENT,
      "name" text,
      "name_zh_cn" text,
      "cover" text,
      "mod_root_path" text,
      "is_custom" integer,
      UNIQUE ("name")
    );
  `)

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO t_user_game (
      id,
      name,
      name_zh_cn,
      cover,
      mod_root_path,
      is_custom
    )
    VALUES (
      @id,
      @name,
      @name_zh_cn,
      @cover,
      @mod_root_path,
      @is_custom
    )
  `)

  const transaction = db.transaction(() => {
    for (const item of items) {
      stmt.run(item)
    }
  })

  transaction()
}
