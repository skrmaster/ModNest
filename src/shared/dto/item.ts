export interface CreateItemDto {
  id?: string
  name: string
  name_zh_cn: string
  cover: string | null
  mod_count: number
  game_id: string
}

export type UpdateItemDto = Partial<CreateItemDto>
