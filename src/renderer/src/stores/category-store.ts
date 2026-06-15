import { BaseStore } from './base-store'
import type { Category } from '@shared/entities/category'

export class CategoryStore extends BaseStore<Category> {
  protected fetchData() {
    return window.api.categoryApi.list()
  }
}

export const categoryStore = new CategoryStore()
