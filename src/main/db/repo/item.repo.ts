import { ItemEntity } from '@shared/entities/item'
import { DatabaseManager } from '..'
import { getAppImageUrl, getUserImageUrl } from '@shared/utils/url'
import { CreateItemDto, GameItemList, UpdateItemDto } from '@shared/dto/item'
import type Database from 'better-sqlite3'
import { UserGame } from '@shared/entities/game'
import { readdir } from 'fs/promises'
import path from 'path'
import { isDirExists } from '../../utils/file'
import { Category } from '@shared/entities/category'
import { splitBatch } from '@shared/utils/split'

type List = Array<ItemEntity & { categoryDtos?: Category[] }>

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

  list(gameId: string, primaryCategoryId: string, secondaryCategoryId?: string): GameItemList {
    let rows: List | undefined

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
        .all(gameId, primaryCategoryId, secondaryCategoryId) as List
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
        .all(gameId, primaryCategoryId) as List
    }

    const res = rows.map((row) => ({
      ...row,
      cover: row.is_custom ? getUserImageUrl(row.cover) : getAppImageUrl(row.cover),
      id: row.id.toString()
    }))

    const rawItemIds = res.map((item) => item.id)
    if (rawItemIds.length === 0) {
      res.forEach((item) => (item.categoryDtos = []))
      return []
    }

    // 2. 分批（每批400个，避开SQLite参数限制）
    const idBatches = splitBatch(rawItemIds, 400)
    const allRecords: Array<{ item_id: number; category_id: number }> = []

    // 3. 逐批查询关联表
    for (const batchIds of idBatches) {
      const ph = batchIds.map(() => '?').join(',')
      const sql = `SELECT item_id, category_id FROM t_category_records WHERE item_id IN (${ph})`

      const rows = this.db.prepare(sql).all(batchIds) as Array<{
        item_id: number
        category_id: number
      }>
      allRecords.push(...rows)
    }

    // 无关联数据直接返回
    if (allRecords.length === 0) {
      res.forEach((item) => (item.categoryDtos = []))
      return res
    }

    // 4. 提取所有分类ID，同样分批查询
    const catIds = [...new Set(allRecords.map((r) => r.category_id))]
    const catBatches = splitBatch(catIds, 400)
    const allCategories: Category[] = []

    for (const batchCatIds of catBatches) {
      const ph = batchCatIds.map(() => '?').join(',')
      const sql = `SELECT * FROM t_game_category WHERE id IN (${ph})`
      const rows = this.db.prepare(sql).all(batchCatIds) as Category[]
      allCategories.push(...rows)
    }

    // 5. 构建Map映射
    const categoryMap = new Map<string, Category>()
    allCategories.forEach((cat) => categoryMap.set(cat.id.toString(), cat))

    const itemCatMap = new Map<string, Category[]>()
    allRecords.forEach((rec) => {
      const itemId = rec.item_id.toString()
      const catId = rec.category_id.toString()

      const cat = categoryMap.get(catId)
      if (!cat) return

      if (!itemCatMap.has(itemId)) {
        itemCatMap.set(itemId, [])
      }
      itemCatMap.get(itemId)!.push(cat)
    })

    // 6. 回填数据
    res.forEach((item) => {
      const key = String(item.id)
      item.categoryDtos = itemCatMap.get(key) || []
    })

    return res
  }

  update(id: string, data: Partial<UpdateItemDto>) {
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

    if (data.category_ids) {
      const stmt = this.db.prepare('DELETE FROM t_category_records WHERE item_id = ?')
      const deleteRes = stmt.run(id)

      if (deleteRes.changes <= 0) {
        return deleteRes
      }

      const loopData = data.category_ids || []
      const len = loopData.length
      const relativeResList: Database.RunResult[] = []
      for (let i = 0; i < len; i++) {
        const relationStmt = this.db.prepare(`
          INSERT INTO t_category_records (
            category_id,
            item_id
          )
          VALUES (?, ?)
        `)
        const relationRes = relationStmt.run(loopData[i], id)
        relativeResList.push(relationRes)
      }
      if (!relativeResList.every((e) => e.changes !== 0)) {
        return { changes: 0 }
      }
    }

    if (fields.length === 0) return { changes: 0 }

    const stmt = this.db.prepare(`UPDATE t_game_item SET ${fields.join(', ')} WHERE id = @id`)
    return stmt.run(params)
  }

  async checkMod(gameId: string) {
    const row = this.db
      .prepare(
        `SELECT *
            FROM t_user_game
            WHERE id = ?
            LIMIT 1`
      )
      .get(gameId) as UserGame | undefined

    if (!row || !row.mod_root_path) {
      return
    }

    const items = this.db
      .prepare(
        `
        SELECT *
        FROM t_game_item
        WHERE game_id = ?
      `
      )
      .all(gameId) as ItemEntity[]

    for (let i = 0; i < items.length; i++) {
      const e = items[i]
      let enabledCount = 0
      let modCount = 0

      const targetPath = path.join(row.mod_root_path, 'character', e.name.toLocaleLowerCase())

      const res = await isDirExists(targetPath)

      if (!res) {
        continue
      }

      const entries = await readdir(targetPath, {
        withFileTypes: true
      })

      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        if (!entry.name.startsWith('DISABLED_')) {
          enabledCount++
          this.update(e.id, { mod_count_enable: enabledCount })
        }
        modCount++
        this.update(e.id, { mod_count: modCount })
      }
    }
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
