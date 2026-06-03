import { Category } from '@shared/entities/category'

export async function apiGetCategoryList(): Promise<Category[]> {
  return await window.api.categoryApi.list()
}

export async function apiGetCategoryById(id: string): Promise<Category> {
  return await window.api.categoryApi.getById(id)
}
