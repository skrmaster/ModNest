import { apiGetCategoryList } from '@renderer/api/category'
import { BaseStore } from './base-store'
import type { Category } from '@shared/entities/category'

export class CategoryStore extends BaseStore<Category> {
  protected fetchData() {
    return apiGetCategoryList()
  }
}

export const categoryStore = new CategoryStore()
