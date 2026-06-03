import { apiGetGameList } from '@renderer/api/game'
import { BaseStore } from './base-store'
import type { UserGame } from '@shared/entities/game'

export class GameStore extends BaseStore<UserGame> {
  protected fetchData() {
    return apiGetGameList()
  }
}

export const gameStore = new GameStore()
