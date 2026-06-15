import { BaseStore } from './base-store'
import type { UserGame } from '@shared/entities/game'

export class GameStore extends BaseStore<UserGame> {
  protected fetchData() {
    return window.api.gameApi.list()
  }
}

export const gameStore = new GameStore()
