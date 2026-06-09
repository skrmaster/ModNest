import { ItemEntity } from '@shared/entities/item'

export async function apiGetItemById(id: string): Promise<ItemEntity> {
  return await window.api.itemApi.getById(id)
}
