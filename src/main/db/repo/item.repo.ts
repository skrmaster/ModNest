import { ItemEntity } from '@shared/entities/item'
import { DatabaseManager } from '..'
import { getAppImageUrl, getUserImageUrl } from '@shared/utils/getPath'
import { CreateItemDto } from '@shared/dto/item'
import type Database from 'better-sqlite3'

export class ItemRepo {
  private get db() {
    return DatabaseManager.getDb()
  }

  create(data: CreateItemDto) {
    const stmt = this.db.prepare(`
      INSERT INTO t_game_item (
        name,
        name_zh_cn,
        cover,
        mod_count,
        mod_count_enable,
        game_id,
        is_custom
      )
      VALUES (
        @name,
        @name_zh_cn,
        @cover,
        @mod_count,
        @mod_count_enable,
        @game_id,
        @is_custom
      )
    `)

    const res = stmt.run(data)

    if (res.changes === 0) {
      return res
    }

    const loopData = data.category_ids || []
    const relativeResList: Database.RunResult[] = []
    for (let i = 0; i < loopData.length; i++) {
      const relationStmt = this.db.prepare(`
        INSERT INTO t_category_records (
          category_id,
          item_id
        )
        VALUES (?, ?)
      `)

      const relationRes = relationStmt.run(loopData[i], res.lastInsertRowid)
      relativeResList.push(relationRes)
    }

    return relativeResList.every((e) => e.changes !== 0) ? { changes: 1 } : { changes: 0 }
  }

  list(gameId: string, primaryCategoryId: string, secondaryCategoryId?: string): ItemEntity[] {
    let rows

    if (secondaryCategoryId) {
      rows = this.db
        .prepare(
          `
      SELECT DISTINCT gi.*
      FROM t_game_item gi
      WHERE gi.game_id = ?
        AND EXISTS (
          SELECT 1 FROM t_category_records cr
          WHERE cr.item_id = gi.id AND cr.category_id = ?
        )
        AND EXISTS (
          SELECT 1 FROM t_category_records cr
          WHERE cr.item_id = gi.id AND cr.category_id = ?
        )
      ORDER BY gi.id
    `
        )
        .all(gameId, primaryCategoryId, secondaryCategoryId)
    } else {
      rows = this.db
        .prepare(
          `
      SELECT DISTINCT gi.*
      FROM t_game_item gi
      WHERE gi.game_id = ?
        AND EXISTS (
          SELECT 1 FROM t_category_records cr
          WHERE cr.item_id = gi.id AND cr.category_id = ?
        )
      ORDER BY gi.id
    `
        )
        .all(gameId, primaryCategoryId)
    }

    return (rows as ItemEntity[]).map((row) => ({
      ...row,
      cover: row.is_custom ? getUserImageUrl(row.cover) : getAppImageUrl(row.cover),
      id: row.id.toString()
    }))
  }

  update(id: string, data: Partial<ItemEntity>) {
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    if (data.name !== undefined) {
      fields.push('name = @name')
      params.name = data.name
    }
    if (data.name_zh_cn !== undefined) {
      fields.push('name_zh_cn = @name_zh_cn')
      params.name_zh_cn = data.name_zh_cn
    }
    if (data.cover !== undefined) {
      fields.push('cover = @cover')
      params.cover = data.cover
    }
    if (data.mod_count !== undefined) {
      fields.push('mod_count = @mod_count')
      params.mod_count = data.mod_count
    }
    if (data.mod_count_enable !== undefined) {
      fields.push('mod_count_enable = @mod_count_enable')
      params.mod_count_enable = data.mod_count_enable
    }
    if (data.game_id !== undefined) {
      fields.push('game_id = @game_id')
      params.game_id = data.game_id
    }

    if (fields.length === 0) return { changes: 0 }

    const stmt = this.db.prepare(`UPDATE t_game_item SET ${fields.join(', ')} WHERE id = @id`)
    return stmt.run(params)
  }

  remove(id: string) {
    const stmt = this.db.prepare('DELETE FROM t_game_item WHERE id = ?')
    return stmt.run(id)
  }

  findById(id: string): ItemEntity | null {
    const row = this.db
      .prepare(
        `
            SELECT *
            FROM t_game_item
            WHERE id = ?
            LIMIT 1
            `
      )
      .get(id) as ItemEntity | undefined

    if (!row) {
      return null
    }

    return {
      ...row,
      cover: row.is_custom ? getUserImageUrl(row.cover) : getAppImageUrl(row.cover),
      id: row.id.toString()
    }
  }
}
