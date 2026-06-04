import type Database from 'better-sqlite3'
import items from '../seed/category.json'

export function up(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "main"."t_game_category" (
      "id" integer NOT NULL ON CONFLICT ABORT PRIMARY KEY AUTOINCREMENT,
      "name" text NOT NULL,
      "icon" text,
      "name_zh_cn" text NOT NULL,
      "level" integer,
      "cover" text,
      UNIQUE ("name")
    );
  `)

  const stmt = db.prepare(`
    INSERT INTO t_game_category (
      name,
      name_zh_cn,
      icon,
      level,
      cover
    )
    VALUES (?, ?, ?, ?, ?)
  `)

  for (const category of items) {
    stmt.run(category.name, category.name_zh_cn, category.icon, category.level, category.cover)
  }
}
