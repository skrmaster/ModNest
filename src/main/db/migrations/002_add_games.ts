import type Database from 'better-sqlite3'
import data from '../seed/games.json'

export function up(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "main"."t_user_game" (
      "id" integer NOT NULL ON CONFLICT ABORT PRIMARY KEY AUTOINCREMENT,
      "name" text,
      "name_zh_cn" text,
      "cover" text,
      "mod_root_path" text,
      UNIQUE ("name")
    );
  `)

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO t_user_game (
      name,
      name_zh_cn,
      cover,
      mod_root_path
    )
    VALUES (
      @name,
      @name_zh_cn,
      @cover,
      @mod_root_path
    )
  `)

  const transaction = db.transaction(() => {
    for (const item of data) {
      stmt.run(item)
    }
  })

  transaction()
}
