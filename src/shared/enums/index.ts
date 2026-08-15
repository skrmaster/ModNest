import { GameGenshinElement, GameZZZElement } from '@shared/types/item'

export const gameGenshinElementList: GameGenshinElement[] = [
  'anemo',
  'cryo',
  'dendro',
  'electro',
  'geo',
  'hydro',
  'pyro'
]
export const gameZZZElementList: GameZZZElement[] = [
  'physical',
  'ice',
  'fire',
  'ether',
  'electric',
  'frost',
  'auric ink',
  'honed edge',
  'wind',
  'lumen'
]

export const gameImageMap: Record<
  string,
  {
    elementList: string[]
    rarityList: string[]
  }
> = {
  1: {
    elementList: gameGenshinElementList,
    rarityList: ['rarity3', 'rarity4', 'rarity5']
  },
  2: {
    elementList: gameZZZElementList,
    rarityList: ['rarity3', 'rarity4', 'rarity5']
  }
}
