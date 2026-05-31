import type Database from 'better-sqlite3'

export function up(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "main"."t_user_setting" (
      "id" integer NOT NULL,
      "language" text,
      "theme" text,
      "window_width" integer,
      "window_height" integer,
      PRIMARY KEY ("id")
    );
  `)
}
