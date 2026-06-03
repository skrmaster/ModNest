export interface CreateCategoryDto {
  id: string

  name: string

  name_zh_cn: string

  icon: string
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>
