import type Database from 'better-sqlite3'

export function up(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "main"."t_game_item" (
      "id" integer NOT NULL ON CONFLICT ABORT PRIMARY KEY AUTOINCREMENT,
      "name" text,
      "name_zh_cn" text,
      "cover" text NOT NULL,
      "mod_count" integer NOT NULL,
      "mod_count_enable" integer NOT NULL,
      "game_id" integer NOT NULL,
      "is_custom" interger NOT NULL,
      FOREIGN KEY ("game_id") REFERENCES "t_user_game" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `)
}
