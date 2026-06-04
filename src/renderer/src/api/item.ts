import { ItemEntity } from '@shared/entities/item'
import type { QueryParams } from '@shared/types/item'
import { toRaw } from 'vue'

export async function apiGetItemList(data: QueryParams): Promise<ItemEntity[]> {
  return await window.api.itemApi.list(toRaw(data))
}

export async function apiGetItemById(id: string): Promise<ItemEntity> {
  return await window.api.itemApi.getById(id)
}
