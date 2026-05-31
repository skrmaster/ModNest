import { up as migration001 } from './001_init'
import { up as migration002 } from './002_add_games'
import { up as migration003 } from './003_add_category'
import { up as migration004 } from './004_add_items'

export const migrations = [
  {
    version: 1,
    up: migration001
  },
  {
    version: 2,
    up: migration002
  },
  {
    version: 3,
    up: migration003
  },
  {
    version: 4,
    up: migration004
  }
]
