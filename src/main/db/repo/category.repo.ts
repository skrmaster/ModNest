import { DatabaseManager } from '..'
import { Category } from '@shared/entities/category'

export class CategoryRepository {
  private get db() {
    return DatabaseManager.getDb()
  }

  create(data: Category) {
    const stmt = this.db.prepare(`
      INSERT INTO t_game_category (
        name,
        name_zh_cn,
        icon
      )
      VALUES (
        @name,
        @name_zh_cn,
        @icon
      )
    `)

    return stmt.run(data)
  }

  list(): Category[] {
    const rows = this.db
      .prepare(
        `
          SELECT *
          FROM t_game_category
          ORDER BY id
        `
      )
      .all() as Category[]

    return rows.map((row) => ({
      ...row,
      id: row.id.toString()
    }))
  }

  update(id: string, data: Partial<Category>) {
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
    if (data.icon !== undefined) {
      fields.push('icon = @icon')
      params.icon = data.icon
    }

    if (fields.length === 0) return { changes: 0 }

    const stmt = this.db.prepare(`UPDATE t_game_category SET ${fields.join(', ')} WHERE id = @id`)
    return stmt.run(params)
  }

  remove(id: string) {
    const stmt = this.db.prepare('DELETE FROM t_game_category WHERE id = ?')
    return stmt.run(id)
  }

  findById(id: string): Category | null {
    const row = this.db
      .prepare(
        `
        SELECT *
        FROM t_game_category
        WHERE id = ?
        LIMIT 1
        `
      )
      .get(id) as Category | undefined

    if (!row) {
      return null
    }

    return {
      ...row,
      id: row.id.toString()
    }
  }
}
