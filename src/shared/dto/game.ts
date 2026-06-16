export interface CreateGameDto {
  id?: string

  name: string

  name_zh_cn: string

  cover?: string

  mod_root_path: string

  is_custom: number
}

export type UpdateDto = Partial<CreateGameDto>
