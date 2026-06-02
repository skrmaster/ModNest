import { UserGame } from '@shared/entities/game'

export async function apiGetGameList(): Promise<UserGame[]> {
  return await window.api.gameApi.list()
}

export async function apiGetGameById(id: string): Promise<UserGame> {
  return await window.api.gameApi.getById(id)
}
