import { readonly, shallowReactive } from 'vue'

export interface BaseState<T> {
  items: T[]
  loaded: boolean
}

export abstract class BaseStore<T extends { id: string }> {
  protected state = shallowReactive<BaseState<T>>({
    items: [],
    loaded: false
  })

  protected abstract fetchData(): Promise<T[]>

  async load(): Promise<T[]> {
    if (this.state.loaded && this.state.items.length > 0) {
      return this.state.items
    }

    this.state.items = await this.fetchData()
    this.state.loaded = true

    return this.state.items
  }

  async refresh(): Promise<T[]> {
    this.state.items = await this.fetchData()
    this.state.loaded = true

    return this.state.items
  }

  getById(id: string): T | undefined {
    return this.state.items.find((item) => item.id === id)
  }

  getState() {
    return readonly(this.state)
  }
}
