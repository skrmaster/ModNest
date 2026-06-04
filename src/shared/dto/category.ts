export interface CreateCategoryDto {
  id: string

  name: string

  name_zh_cn: string

  icon: string

  level: number
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>
