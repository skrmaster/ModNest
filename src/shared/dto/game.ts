export interface CreateGameDto {
  id?: number

  name: string

  name_zh_cn: string

  cover?: string

  mod_root_path: string
}

export type UpdateDto = Partial<CreateGameDto>
