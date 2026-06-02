<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { apiGetGameList } from '@renderer/api/game'
import type { UserGame } from '@shared/entities/game'
import type { ManagedItem, SectionKey, CharacterCategory } from '#types/game-manager'
import characterData from '@renderer/assets/games/genshin/characters.json'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import GenshinElements from '@renderer/components/genshin-elements.vue'

gsap.registerPlugin(Flip)

type ManagedCatalog = Record<SectionKey, ManagedItem[]>
type StoredCatalogs = Record<string, ManagedCatalog>

const route = useRoute()
const { locale, t } = useI18n()

const activeSection = ref<SectionKey>('characters')
const activeCategory = ref<CharacterCategory>('all')
const games = ref<UserGame[]>([])
const catalog = ref<ManagedCatalog>({
  characters: [],
  weapons: [],
  custom: []
})
const selectedItemId = ref<string>()
const itemDialog = ref(false)
const itemFormError = ref('')
const editingItemId = ref<string>()

type Character = {
  image: string
  element: string
  class: string
  avatar: string
  zhCn: string
  name: string
}
const imageMap: Record<string, string> = {}
const imageModules = import.meta.glob(
  '@renderer/assets/games/genshin/images/characters/*.{png,jpg,jpeg,webp}',
  {
    eager: true,
    import: 'default'
  }
)

function charactersList(): Character[] {
  for (const path in imageModules) {
    const match = path.match(/\/([^/]+)\.(png|jpg|jpeg|webp)$/)

    if (!match) continue

    const fileName = match[1]

    imageMap[fileName] = imageModules[path] as string
  }

  return (characterData as Character[]).map((item) => {
    return {
      ...item,
      avatar: imageMap[item.image.split('.')[0]]
    }
  })
}

const dataList = charactersList()

const fallbackPreview =
  'https://fastcdn.mihoyo.com/static-resource-v2/2025/07/03/516186272072a512a460c81222aecf1d_5955932201223190759.jpg'

const itemForm = reactive<ManagedItem>({
  id: '',
  nameZh: '',
  nameEn: '',
  image: '',
  category: 'attack',
  isDefault: false,
  mods: []
})

const characterCategories: Array<{ key: CharacterCategory }> = []

const sections: Array<{ key: SectionKey; icon: string }> = [
  { key: 'characters', icon: 'mdi-account-group-outline' },
  { key: 'weapons', icon: 'mdi-sword' },
  { key: 'custom', icon: 'mdi-shape-outline' }
]

const gameTitle = computed(() => {
  if (!game.value) {
    return t('gameManager.unknownGame')
  }

  return locale.value === 'zh-CN'
    ? game.value.name_zh_cn || game.value.name
    : game.value.name || game.value.name_zh_cn
})

const game = computed(() => games.value.find((item) => item.id === Number(route.params.gameId)))

const defaultCatalog = computed<ManagedCatalog>(() => {
  const preview = game.value?.cover || fallbackPreview
  const isZzz = game.value?.id === 2
  const characterDefaults: ManagedItem[] = dataList.map((item) => ({
    id: `default-character-${item.name}`,
    nameZh: item.zhCn,
    nameEn: item.name,
    image: item.avatar || preview,
    category: 'attack',
    isDefault: true,
    mods: []
  }))

  return {
    characters: characterDefaults.length ? characterDefaults : [
      {
        id: 'default-character-1',
        nameZh: isZzz ? '安比' : '荧',
        nameEn: isZzz ? 'Anby' : 'Lumine',
        image: preview,
        category: 'attack',
        isDefault: true,
        mods: [
          {
            id: 'mod-1',
            enabled: true,
            addedAt: '2026-05-28',
            name: 'Classic outfit replacement',
            author: 'Local',
            version: '1.0.0',
            preview
          },
          {
            id: 'mod-2',
            enabled: false,
            addedAt: '2026-05-27',
            name: 'High resolution texture pack',
            author: 'Local',
            version: '1.2.0',
            preview
          }
        ]
      },
      {
        id: 'default-character-2',
        nameZh: isZzz ? '妮可' : '派蒙',
        nameEn: isZzz ? 'Nicole' : 'Paimon',
        image: preview,
        category: 'support',
        isDefault: true,
        mods: [
          {
            id: 'mod-3',
            enabled: true,
            addedAt: '2026-05-26',
            name: 'Voice line helper',
            author: 'Local',
            version: '0.9.1',
            preview
          }
        ]
      },
      {
        id: 'default-character-3',
        nameZh: isZzz ? '本' : '诺艾尔',
        nameEn: isZzz ? 'Ben' : 'Noelle',
        image: preview,
        category: 'defense',
        isDefault: true,
        mods: []
      }
    ],
    weapons: [
      {
        id: 'default-weapon-1',
        nameZh: isZzz ? '音擎 A' : '单手剑',
        nameEn: isZzz ? 'W-Engine A' : 'Sword',
        image: preview,
        isDefault: true
      },
      {
        id: 'default-weapon-2',
        nameZh: isZzz ? '音擎 B' : '弓',
        nameEn: isZzz ? 'W-Engine B' : 'Bow',
        image: preview,
        isDefault: true
      }
    ],
    custom: [
      {
        id: 'default-custom-1',
        nameZh: '材质',
        nameEn: 'Textures',
        image: preview,
        isDefault: true
      },
      {
        id: 'default-custom-2',
        nameZh: '界面',
        nameEn: 'UI',
        image: preview,
        isDefault: true
      }
    ]
  }
})

const activeItems = computed(() => catalog.value[activeSection.value])

const filteredItems = computed(() => {
  if (activeSection.value !== 'characters' || activeCategory.value === 'all') {
    return activeItems.value
  }

  return activeItems.value.filter((item) => item.category === activeCategory.value)
})

const selectedItem = computed(() =>
  catalog.value.characters.find((item) => item.id === selectedItemId.value)
)

const selectedPreview = computed(() => {
  return selectedItem.value?.mods?.find((mod) => mod.enabled)?.preview || selectedItem.value?.image
})

const getItemName = (item: ManagedItem): string => {
  return locale.value === 'zh-CN' ? item.nameZh || item.nameEn : item.nameEn || item.nameZh
}

const cloneCatalog = (source: ManagedCatalog): ManagedCatalog => ({
  characters: source.characters.map((item) => ({
    ...item,
    mods: item.mods?.map((mod) => ({ ...mod })) ?? []
  })),
  weapons: source.weapons.map((item) => ({ ...item })),
  custom: source.custom.map((item) => ({ ...item }))
})

const mergeCatalog = (savedCatalog?: ManagedCatalog): ManagedCatalog => {
  const defaults = cloneCatalog(defaultCatalog.value)

  if (!savedCatalog) {
    return defaults
  }

  const mergeSection = (section: SectionKey): ManagedItem[] => {
    const savedItems = Array.isArray(savedCatalog[section]) ? savedCatalog[section] : []
    const savedById = new Map(savedItems.map((item) => [item.id, item]))
    const defaultItems = defaults[section].map((item) => ({
      ...item,
      ...savedById.get(item.id),
      isDefault: true
    }))
    const customItems = savedItems.filter(
      (item) => !defaults[section].some((defaultItem) => defaultItem.id === item.id)
    )

    return [...defaultItems, ...customItems]
  }

  return {
    characters: mergeSection('characters'),
    weapons: mergeSection('weapons'),
    custom: mergeSection('custom')
  }
}

const toPlainCatalog = (source: ManagedCatalog): ManagedCatalog => ({
  characters: source.characters.map((item) => ({
    id: item.id,
    nameZh: item.nameZh,
    nameEn: item.nameEn,
    image: item.image,
    category: item.category ?? 'attack',
    isDefault: item.isDefault,
    mods: item.mods?.map((mod) => ({ ...mod })) ?? []
  })),
  weapons: source.weapons.map((item) => ({
    id: item.id,
    nameZh: item.nameZh,
    nameEn: item.nameEn,
    image: item.image,
    isDefault: item.isDefault
  })),
  custom: source.custom.map((item) => ({
    id: item.id,
    nameZh: item.nameZh,
    nameEn: item.nameEn,
    image: item.image,
    isDefault: item.isDefault
  }))
})

const persistCatalog = async (): Promise<void> => {
  const gameId = String(route.params.gameId)
  const storedCatalogs = (await window.api.settingsApi.get('gameManagedCatalogs')) as StoredCatalogs
  const nextCatalogs = {
    ...(storedCatalogs && typeof storedCatalogs === 'object' ? storedCatalogs : {}),
    [gameId]: toPlainCatalog(catalog.value)
  }

  await window.api.settingsApi.set('gameManagedCatalogs', nextCatalogs)
}

const loadCatalog = async (): Promise<void> => {
  const gameId = String(route.params.gameId)
  const storedCatalogs = (await window.api.settingsApi.get('gameManagedCatalogs')) as StoredCatalogs
  catalog.value = mergeCatalog(storedCatalogs?.[gameId])
  await persistCatalog()
}

const loadGames = async (): Promise<void> => {
  games.value = await apiGetGameList()
}

const openItemDialog = (item?: ManagedItem): void => {
  editingItemId.value = item?.id
  itemFormError.value = ''
  Object.assign(itemForm, {
    id: item?.id ?? `${activeSection.value}-${Date.now()}`,
    nameZh: item?.nameZh ?? '',
    nameEn: item?.nameEn ?? '',
    image: item?.image ?? '',
    category: item?.category ?? 'attack',
    isDefault: item?.isDefault ?? false,
    mods: item?.mods?.map((mod) => ({ ...mod })) ?? []
  })
  itemDialog.value = true
}

const saveItem = async (): Promise<void> => {
  itemForm.nameZh = itemForm.nameZh.trim()
  itemForm.nameEn = itemForm.nameEn.trim()
  itemForm.image = itemForm.image.trim()

  if (!itemForm.nameZh || !itemForm.nameEn || !itemForm.image) {
    itemFormError.value = t('gameManager.itemRequiredError')
    return
  }

  const item: ManagedItem = {
    id: itemForm.id,
    nameZh: itemForm.nameZh,
    nameEn: itemForm.nameEn,
    image: itemForm.image,
    isDefault: itemForm.isDefault,
    category: activeSection.value === 'characters' ? itemForm.category : undefined,
    mods: activeSection.value === 'characters' ? (itemForm.mods ?? []) : undefined
  }
  const items = catalog.value[activeSection.value]
  const existingIndex = items.findIndex((currentItem) => currentItem.id === item.id)

  if (existingIndex >= 0) {
    items[existingIndex] = item
  } else {
    items.push(item)
  }

  await persistCatalog()
  itemDialog.value = false
}

const deleteItem = async (item: ManagedItem): Promise<void> => {
  catalog.value[activeSection.value] = catalog.value[activeSection.value].filter(
    (currentItem) => currentItem.id !== item.id
  )

  if (selectedItemId.value === item.id) {
    selectedItemId.value = undefined
  }

  await persistCatalog()
}

const showItemDetail = (item: ManagedItem): void => {
  if (activeSection.value !== 'characters') {
    openItemDialog(item)
    return
  }

  selectedItemId.value = item.id
}

const backToItems = (): void => {
  selectedItemId.value = undefined
}

async function animateLayout(): Promise<void> {
  const state = Flip.getState('.card')

  await nextTick()

  Flip.from(state, {
    duration: 0.2,
    ease: 'power1.out',
    absolute: true
  })
}

function handleElementSelect(v?: string): void {
  console.log(v)
}

watch(
  () => route.params.gameId,
  async () => {
    selectedItemId.value = undefined
    activeSection.value = 'characters'
    activeCategory.value = 'all'
    await loadGames()
    await loadCatalog()
  }
)

watch(activeSection, () => {
  selectedItemId.value = undefined
})

onMounted(async () => {
  await loadGames()
  await loadCatalog()
  window.addEventListener('resize', animateLayout)
})

onUnmounted(() => {
  window.removeEventListener('resize', animateLayout)
})

onBeforeUnmount(() => {})
</script>

<template>
  <div class="h-full min-h-0 flex bg-background">
    <aside class="w-44 shrink-0 border-r border-black/10 py-4 pr-3">
      <div class="px-2 pb-4">
        <div class="text-subtitle-1 font-medium truncate">{{ gameTitle }}</div>
        <div class="text-caption opacity-70 truncate">{{ game?.mod_root_path }}</div>
      </div>

      <v-list nav density="compact">
        <v-list-item
          v-for="section in sections"
          :key="section.key"
          :active="activeSection === section.key"
          rounded="sm"
          @click="activeSection = section.key"
        >
          <template #prepend>
            <v-icon :icon="section.icon" />
          </template>
          <v-list-item-title>{{ t(`gameManager.sections.${section.key}`) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </aside>

    <section class="min-w-0 flex-1 overflow-auto p-5">
      <div v-if="!selectedItem" class="grid gap-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1>角色</h1>
          </div>

          <div class="flex items-center gap-3">
            <genshin-elements
              v-if="activeSection === 'characters'"
              @select="handleElementSelect"
            ></genshin-elements>

            <v-btn-toggle
              v-if="activeSection === 'characters'"
              v-model="activeCategory"
              mandatory
              density="comfortable"
              variant="outlined"
            >
              <v-btn
                v-for="category in characterCategories"
                :key="category.key"
                :value="category.key"
              >
                {{ t(`gameManager.categories.${category.key}`) }}
              </v-btn>
            </v-btn-toggle>
          </div>
        </div>

        <div>
          <div class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            <v-tooltip key="add" text="添加" location="top">
              <template #activator>
                <v-card
                  class="character-card cursor-pointer"
                  variant="tonal"
                  @click="openItemDialog()"
                >
                  <div class="flex items-center justify-center w-full h-full">
                    <v-icon :size="40" color="ffffff">mdi-plus</v-icon>
                  </div>
                </v-card>
              </template>
            </v-tooltip>
            <div v-for="item in filteredItems" :key="item.id" class="card height-20">
              <v-card
                class="character-card cursor-pointer"
                variant="tonal"
                @click="showItemDetail(item)"
              >
                <div class="w-full p-3">
                  <div class="w-50 mx-auto">
                    <v-img :src="item.image" cover />
                  </div>
                </div>
                <v-card-text class="character-card__body">
                  <div class="w-full gap-3">
                    <div class="min-w-0 text-center">
                      <div class="text-subtitle-1 truncate">{{ item.nameEn }}</div>
                      <div class="text-body-2 opacity-70 truncate">{{ item.nameZh }}</div>
                    </div>
                    <div class="flex shrink-0 items-center gap-1">
                      <v-chip
                        v-if="activeSection === 'characters'"
                        size="small"
                        color="primary"
                        variant="tonal"
                      >
                        {{ t('gameManager.modCount', { count: item.mods?.length ?? 0 }) }}
                      </v-chip>
                      <v-btn
                        icon="mdi-pencil-outline"
                        size="small"
                        variant="text"
                        @click.stop="openItemDialog(item)"
                      />
                      <v-btn
                        icon="mdi-delete-outline"
                        size="small"
                        variant="text"
                        @click.stop="deleteItem(item)"
                      />
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="grid gap-4">
        <div class="flex items-center gap-3">
          <v-btn icon="mdi-arrow-left" variant="text" @click="backToItems" />
          <div>
            <h1 class="text-h6">{{ getItemName(selectedItem) }}</h1>
            <div class="text-body-2 opacity-70">{{ selectedItem.nameEn }}</div>
          </div>
        </div>

        <div class="grid min-h-130 gap-4 xl:grid-cols-[280px_1fr_320px]">
          <section class="border-r border-black/10 pr-4">
            <v-img :src="selectedItem.image" aspect-ratio="1" cover />
            <div class="mt-3 text-subtitle-1">{{ selectedItem.nameZh }}</div>
            <div class="text-body-2 opacity-70">{{ selectedItem.nameEn }}</div>
          </section>

          <section class="min-w-0 overflow-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b text-left">
                  <th class="w-12 py-3">{{ t('gameManager.enabled') }}</th>
                  <th class="py-3">{{ t('gameManager.addedAt') }}</th>
                  <th class="py-3">{{ t('gameManager.modName') }}</th>
                  <th class="py-3">{{ t('gameManager.author') }}</th>
                  <th class="py-3">{{ t('gameManager.version') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mod in selectedItem.mods" :key="mod.id" class="border-b">
                  <td class="py-2">
                    <v-checkbox-btn v-model="mod.enabled" density="compact" />
                  </td>
                  <td class="py-2">{{ mod.addedAt }}</td>
                  <td class="py-2">{{ mod.name }}</td>
                  <td class="py-2">{{ mod.author }}</td>
                  <td class="py-2">{{ mod.version }}</td>
                </tr>
                <tr v-if="!selectedItem.mods?.length">
                  <td colspan="5" class="py-8 text-center opacity-70">
                    {{ t('gameManager.emptyMods') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="border-l border-black/10 pl-4">
            <div class="mb-3 text-subtitle-1">{{ t('gameManager.modConfig') }}</div>
            <v-img v-if="selectedPreview" :src="selectedPreview" aspect-ratio="1" cover />
            <div class="mt-3 text-body-2 opacity-70">{{ t('gameManager.previewHint') }}</div>
          </section>
        </div>
      </div>
    </section>

    <v-dialog v-model="itemDialog" max-width="560">
      <v-card>
        <v-card-title>
          {{ editingItemId ? t('gameManager.editItem') : t('gameManager.addItem') }}
        </v-card-title>
        <v-card-text>
          <div class="grid gap-3">
            <v-img v-if="itemForm.image" :src="itemForm.image" height="180" cover />
            <div class="grid gap-3 md:grid-cols-2">
              <v-text-field
                v-model="itemForm.nameZh"
                :label="t('games.nameZh')"
                density="compact"
              />
              <v-text-field
                v-model="itemForm.nameEn"
                :label="t('games.nameEn')"
                density="compact"
              />
            </div>
            <v-text-field v-model="itemForm.image" :label="t('games.image')" density="compact" />
            <v-select
              v-if="activeSection === 'characters'"
              v-model="itemForm.category"
              :items="characterCategories.filter((category) => category.key !== 'all')"
              :label="t('gameManager.category')"
              item-value="key"
              density="compact"
            >
              <template #selection="{ item }">
                {{ t(`gameManager.categories.${item.key}`) }}
              </template>
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :title="t(`gameManager.categories.${item.key}`)" />
              </template>
            </v-select>
            <v-alert v-if="itemFormError" type="error" variant="tonal" density="compact">
              {{ itemFormError }}
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="itemDialog = false">{{ t('games.close') }}</v-btn>
          <v-btn color="primary" @click="saveItem">{{ t('games.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.character-grid {
  display: grid;
  gap: 16px;
  align-items: start;
  justify-content: start;
  position: relative;
  transition: grid-template-columns 120ms ease;
}

.character-card {
  width: 100%;
  height: var(--character-card-height, 260px);
  overflow: hidden;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.character-card:hover {
  transform: translateY(-2px);
}

.card {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.character-card__body {
  height: 82px;
  display: flex;
  align-items: center;
}

.character-shuffle-move,
.character-shuffle-enter-active,
.character-shuffle-leave-active {
  transition:
    transform 170ms cubic-bezier(0.2, 0.9, 0.2, 1),
    opacity 120ms ease;
}

.character-shuffle-enter-from,
.character-shuffle-leave-to {
  opacity: 0;
  transform: translateX(42px) scale(0.96);
}

.character-shuffle-leave-active {
  position: absolute;
}

.card-move,
.card-enter-active,
.card-leave-active {
  transition: all 0.35s ease;
}

.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.card-leave-active {
  position: absolute;
}
</style>
