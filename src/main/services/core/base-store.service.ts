import Store from 'electron-store'

export abstract class BaseStoreService<T extends object> {
  protected store: Store<T>

  protected constructor(name: string, defaults: T) {
    this.store = new Store<T>({
      name,
      defaults
    })
  }

  public get<K extends keyof T>(key: K): T[K] {
    return this.store.get(key)
  }

  public set<K extends keyof T>(key: K, value: T[K]): void {
    this.store.set(key, value)
  }

  public delete<K extends keyof T>(key: K): void {
    this.store.delete(key)
  }

  public has<K extends keyof T>(key: K): boolean {
    return this.store.has(key)
  }

  public getAll(): T {
    return this.store.store
  }

  public setAll(data: T): void {
    this.store.store = data
  }

  public clear(): void {
    this.store.clear()
  }
}
