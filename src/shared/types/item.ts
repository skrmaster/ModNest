export type QueryParams = {
  gameId: string
  primaryCategoryId: string
  secondaryCategoryId?: string
}
export type GameGenshinElement = 'hydro' | 'anemo' | 'electro' | 'dendro' | 'cryo' | 'geo' | 'pyro'
export type GameZZZElement =
  | 'physical'
  | 'ice'
  | 'fire'
  | 'ether'
  | 'electric'
  | 'frost'
  | 'auric ink'
  | 'honed edge'
  | 'wind'
