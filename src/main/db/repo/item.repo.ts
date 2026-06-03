import { ItemEntity } from '@shared/entities/item'
import { DatabaseManager } from '..'

export class ItemRepo {
  private get db() {
    return DatabaseManager.getDb()
  }

  create(data: ItemEntity) {
    const stmt = this.db.prepare(`
      INSERT INTO t_game_item (
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

    return stmt.run(data)
  }

  list(gameId: string, categoryId: string): ItemEntity[] {
    const rows = this.db
      .prepare(
        `
      SELECT *
      FROM t_game_item
      WHERE game_id = ?
        AND category_id = ?
      ORDER BY id
      `
      )
      .all(gameId, categoryId) as ItemEntity[]

    return rows.map((row) => ({
      ...row,
      cover: row.cover ? `app-image://seed-images/${row.cover}` : null,
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

    if (data.category_id !== undefined) {
      fields.push('category_id = @category_id')
      params.category_id = data.category_id
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
      cover: row.cover ? `app-image://seed-images/${row.cover}` : null,
      id: row.id.toString()
    }
  }
}
