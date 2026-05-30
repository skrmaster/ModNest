export type SectionKey = 'characters' | 'weapons' | 'custom'
export type CharacterCategory = 'all' | 'attack' | 'support' | 'defense'

export interface ManagedMod {
  id: string
  enabled: boolean
  addedAt: string
  name: string
  author: string
  version: string
  preview: string
}

export interface ManagedItem {
  id: string
  nameZh: string
  nameEn: string
  image: string
  category?: Exclude<CharacterCategory, 'all'>
  isDefault?: boolean
  mods?: ManagedMod[]
}
