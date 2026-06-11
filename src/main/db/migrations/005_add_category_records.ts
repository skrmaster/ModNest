import type Database from 'better-sqlite3'
import items from '../seed/items_genshin_characters.json'
import items_zzz from '../seed/items_zzz_characters.json'
import { UserGame } from '@shared/entities/game'

interface Character {
  image: string
  element: string
  name: string
  zhCn: string
  rarity: number
}

function setCharacterSeedData(
  db: Database.Database,
  stmt: Database.Statement<unknown[], unknown>,
  gameId: string,
  characterData: Character[]
) {
  const gameInfo = db
    .prepare(
      `SELECT *
        FROM t_user_game
        WHERE id = ?
        LIMIT 1`
    )
    .get(gameId) as UserGame
  if (!gameInfo) throw new Error(`未找到游戏: ${gameId}`)

  const categoryMap = new Map<string, number>()

  const categoryRows = db.prepare(`SELECT id,name FROM t_game_category`).all() as {
    id: number
    name: string
  }[]

  for (const row of categoryRows) {
    categoryMap.set(row.name, row.id)
  }

  const relationStmt = db.prepare(`
    INSERT INTO t_category_records (
      category_id,
      item_id
    )
    VALUES (?, ?)
  `)

  for (const character of characterData) {
    stmt.run(
      character.name,
      character.zhCn,
      `${gameInfo.name}/characters/${character.image}`,
      0,
      0,
      gameId,
      0
    )

    const row = db
      .prepare(
        `
        SELECT id
        FROM t_game_item
        WHERE name = ?
      `
      )
      .get(character.name) as { id: number }

    const itemId = row.id

    const categoryNames = ['character', character.element]

    for (const categoryName of categoryNames) {
      const categoryId = categoryMap.get(categoryName)

      if (!categoryId) {
        throw new Error(`category not exist: ${categoryName}`)
      }

      relationStmt.run(categoryId, itemId)
    }
  }
}

export function up(db: Database.Database) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO t_game_item (
      name,
      name_zh_cn,
      cover,
      mod_count,
      mod_count_enable,
      game_id,
      is_custom
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS "main"."t_category_records" (
      "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
      "category_id" INTEGER NOT NULL,
      "item_id" INTEGER NOT NULL,
      FOREIGN KEY ("item_id") REFERENCES "t_game_item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `)

  setCharacterSeedData(db, stmt, '1', items)
  setCharacterSeedData(db, stmt, '2', items_zzz)
}
