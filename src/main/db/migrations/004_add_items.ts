import type Database from 'better-sqlite3'
import items from '../seed/items_genshin_characters.json'

export function up(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "main"."t_game_item" (
      "id" integer NOT NULL ON CONFLICT ABORT PRIMARY KEY AUTOINCREMENT,
      "name" text,
      "name_zh_cn" text,
      "cover" text NOT NULL,
      "mod_count" integer NOT NULL,
      "category_id" integer,
      "game_id" integer NOT NULL,
      FOREIGN KEY ("category_id") REFERENCES "t_game_category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY ("game_id") REFERENCES "t_user_game" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `)

  const stmt = db.prepare(`
  INSERT OR IGNORE INTO t_game_item (
    name,
    name_zh_cn,
    cover,
    mod_count,
    category_id,
    game_id
  )
  VALUES (
    @name,
    @name_zh_cn,
    @cover,
    @mod_count,
    @category_id,
    @game_id
  )
`)

  for (const item of items) {
    stmt.run({
      name: item.name,
      name_zh_cn: item.zhCn,
      cover: item.image,
      mod_count: 0,
      category_id: 1,
      game_id: 1
    })
  }
}
