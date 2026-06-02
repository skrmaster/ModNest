import type { UserGame } from '@shared/entities/game'
import { DatabaseManager } from '..'

export class GameRepository {
  private get db() {
    return DatabaseManager.getDb()
  }

  create(data: UserGame) {
    const stmt = this.db.prepare(`
      INSERT INTO t_user_game (
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

    return stmt.run(data)
  }

  list(): UserGame[] {
    const rows = this.db
      .prepare(
        `
          SELECT *
          FROM t_user_game
          ORDER BY id
        `
      )
      .all() as UserGame[]

    return rows.map((row) => ({
      ...row,
      cover: row.cover ? `app-image://seed-images/${row.cover}` : null,
      id: row.id.toString()
    }))
  }

  update(id: string, data: Partial<UserGame>) {
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
    if (data.mod_root_path !== undefined) {
      fields.push('mod_root_path = @mod_root_path')
      params.mod_root_path = data.mod_root_path
    }

    if (fields.length === 0) return { changes: 0 }

    const stmt = this.db.prepare(`UPDATE t_user_game SET ${fields.join(', ')} WHERE id = @id`)
    return stmt.run(params)
  }

  remove(id: string) {
    const stmt = this.db.prepare('DELETE FROM t_user_game WHERE id = ?')
    return stmt.run(id)
  }

  findById(id: string): UserGame | null {
    const row = this.db
      .prepare(
        `
        SELECT *
        FROM t_user_game
        WHERE id = ?
        LIMIT 1
        `
      )
      .get(id) as UserGame | undefined

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
