import { Category } from '@shared/entities/category'

export interface CreateItemDto {
  id?: string
  name: string
  name_zh_cn: string
  cover: string | null
  mod_count: number
  mod_count_enable: number
  game_id: string
  is_custom: number
  category_ids: string[]
}

export interface GameItemRow {
  id: string
  name: string
  name_zh_cn: string
  cover: string | null
  mod_count: number
  mod_count_enable: number
  game_id: string
  is_custom: number
  categoryDtos?: Category[]
}

export type GameItemList = Array<GameItemRow>

export type ItemDto = CreateItemDto & { id: string }

export type UpdateItemDto = Partial<CreateItemDto>
