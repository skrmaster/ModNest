<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  toRaw,
  useTemplateRef,
  watch
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gameStore } from '@renderer/stores/game-store'
import { categoryStore } from '@renderer/stores/category-store'
import GenshinElements from '@renderer/components/elements-genshin.vue'
import { ItemEntity } from '@shared/entities/item'
import type { ItemDto, GameItemRow } from '@shared/dto/item'
import { GameGenshinElement, QueryParams } from '@shared/types/item'
import { UserGame } from '@shared/entities/game'
import modInspect from './components/mod-inspect.vue'
import { ListQuery, ModInfo, ModInstallPreview, ModOpt, ModPreviewData } from '@shared/types/mod'
import dayjs from 'dayjs'
import { useNotify } from '@renderer/composables/useNotify'
import modUninstall from './components/mod-uninstall.vue'
import comScroll from '@renderer/components/com-scroll.vue'
import ItemForm from './components/item-form.vue'
import formContent from './components/form-content.vue'
import { getAppImageUrl } from '@shared/utils/url'
import ElementsZzz from '@renderer/components/elements-zzz.vue'
import { Splitpanes, Pane, SplitpanesResizedPayload } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useAppSettings } from '@renderer/composables/useAppSettings'
import { useI18n } from 'vue-i18n'
import { gameImageMap } from '@shared/enums/index'
// import { wrapGrid } from 'animate-css-grid'

type List = Array<GameItemRow & { element?: string; rarityBg?: string }>
type TableData = ModInfo & { isChoose: boolean }

const router = useRouter()
router.beforeEach(async (to) => {
  if (!to.meta.requireModPath) {
    return true
  }

  const gameId = to.params.gameId as string
  const game = await window.api.gameApi.getById(gameId)

  if (!game.mod_root_path) {
    return {
      name: 'DefaultSetup',
      params: { gameId }
    }
  }
  return true
})

const route = useRoute()
const { language } = useAppSettings()
const { t } = useI18n()

const activeSection = ref<string>('1')
const gameId = computed(() => {
  return route.params.gameId as string
})
const game = ref<UserGame | undefined>()

const category = computed(() => categoryStore.getState().items)
const level0Filter = computed(() => category.value.filter((e) => e.level === 0))

const queryParams = reactive<QueryParams>({
  get gameId() {
    return gameId.value
  },
  primaryCategoryId: '1',
  secondaryCategoryId: undefined
})
const selectedItem = ref<ItemEntity>()
const selectedItemId = ref<string>()

const getCategoryName = computed(() => {
  const item = category.value.find((e) => e.id == queryParams.primaryCategoryId)
  return item ? item.name : ''
})

const getSectionDisplayName = (section: { name?: string; name_zh_cn?: string }): string => {
  return language.value === 'zh-CN'
    ? section.name_zh_cn || section.name || ''
    : section.name || section.name_zh_cn || ''
}

const getItemDisplayName = (item?: { name?: string; name_zh_cn?: string }): string => {
  if (!item) return ''
  return language.value === 'zh-CN'
    ? item.name_zh_cn || item.name || ''
    : item.name || item.name_zh_cn || ''
}

const getActiveItemName = computed(() => {
  return getItemDisplayName(selectedItem.value)
})

const activeItems = ref<List>()
const searchText = ref<string | undefined>()
const isGettingItems = ref(false)
const isGettingModList = ref(false)

const options = computed(() => [
  { label: t('gameManager.sort.default'), value: 'default' },
  { label: t('gameManager.sort.modCount'), value: 'ModCount' }
])

const SORT_TYPE_KEY_PREFIX = 'game-manager-sort-type-'
const sortType = ref<string>('default')

const selectedText = computed(() => {
  const item = options.value.find((item) => item.value === sortType.value)
  return item?.label || t('gameManager.sort.default')
})

function getSortTypeStorageKey(id: string): string {
  return `${SORT_TYPE_KEY_PREFIX}${id}`
}

function loadSortTypeFromStorage(id: string): string {
  const saved = localStorage.getItem(getSortTypeStorageKey(id))
  return saved === 'ModCount' ? 'ModCount' : 'default'
}

function handleSortList(val: (typeof options.value)[0]) {
  sortType.value = val.value
  if (gameId.value) {
    localStorage.setItem(getSortTypeStorageKey(gameId.value), val.value)
  }
}

const filteredItems = computed(() => {
  if (!activeItems.value) return []

  const keyword = searchText.value?.trim().toLowerCase()
  let result = activeItems.value

  if (keyword) {
    result = result.filter((item) => {
      const name = (item.name ?? '').toLowerCase()
      const nameZhCn = (item.name_zh_cn ?? '').toLowerCase()
      return name.includes(keyword) || nameZhCn.includes(keyword)
    })
  }

  if (sortType.value === 'ModCount') {
    result = [...result].sort((a, b) => {
      const countA = a.mod_count ?? 0
      const countB = b.mod_count ?? 0
      return countB - countA
    })
    return result
  }

  return result.sort((a, b) => {
    if (a.is_custom !== b.is_custom) {
      return b.is_custom - a.is_custom
    }

    if (a.is_custom === 1) {
      return Number(b.id) - Number(a.id)
    }

    return Number(a.id) - Number(b.id)
  })
})

const gameElementList = computed(() => {
  if (!game.value?.id) {
    return []
  }

  return gameImageMap[game.value.id]?.elementList || []
})
const rarityList = computed(() => {
  if (!game.value?.id) {
    return []
  }

  return gameImageMap[game.value.id]?.rarityList || []
})

async function getItems() {
  if (isGettingItems.value) return
  isGettingItems.value = true
  try {
    const tmp = (await window.api.itemApi.list(toRaw(queryParams))) as List

    activeItems.value = tmp.map((e) => {
      let element: string | undefined, rarityBg: string | undefined
      for (const item of e.categoryDtos || []) {
        if (gameElementList.value.includes(item.name as GameGenshinElement)) {
          element = getAppImageUrl(item.cover)
          continue
        }
        if (rarityList.value.includes(item.name)) {
          rarityBg = getAppImageUrl(item.cover)

          continue
        }
      }

      return {
        ...e,
        element,
        rarityBg
      }
    })
  } catch (error) {
    console.error('Failed to retrieve item list:', error)
  } finally {
    isGettingItems.value = false
  }
}

const formContentRef = useTemplateRef('formContentRef')
async function handleDetail(item: GameItemRow) {
  selectedItem.value = item
  selectTableRow.value = undefined
  await nextTick()
  formContentRef.value?.init(item, game.value?.id)
  getModList()
}

const itemFormRef = useTemplateRef('itemFormRef')
const openItemDialog = (): void => {
  itemFormRef.value?.openModal(undefined, game.value?.id)
}

function handleEditItem(item: GameItemRow) {
  itemFormRef.value?.openModal(item as ItemDto, game.value?.id)
}

const notify = useNotify()
const dialogRef = useTemplateRef('dialogRef')
const tableData = ref<TableData[]>([])
const selectTableRow = ref<ModInfo>()
const showModRootDialog = ref(false)
const modRootPath = ref('')
const modRootError = ref('')
const modRootSaving = ref(false)

const isEnableMutipleMod = computed(() => {
  return (
    tableData.value?.reduce((a, b) => {
      return a + +b.enabled
    }, 0) > 1
  )
})

async function openModRootDialog() {
  modRootError.value = ''
  modRootPath.value = game.value?.mod_root_path ?? ''
  showModRootDialog.value = true
}

async function chooseModRootPath(): Promise<void> {
  const selectedPath = await window.api.fileApi.selectDirectory()
  if (selectedPath) {
    modRootPath.value = selectedPath
  }
}

async function saveModRootPath(): Promise<void> {
  if (!game.value) return

  modRootError.value = ''
  modRootSaving.value = true

  try {
    const nextPath = modRootPath.value.trim()
    if (!nextPath) {
      modRootError.value = t('gameManager.selectModRootFirst')
      return
    }

    await window.api.gameApi.update(game.value.id, { mod_root_path: nextPath })
    await window.api.itemApi.checkMod(game.value.id)
    await gameStore.refresh()
    game.value = gameStore.getById(game.value.id)
    await getItems()
    showModRootDialog.value = false
  } catch (err: unknown) {
    modRootError.value = err instanceof Error ? err.message : String(err)
  } finally {
    modRootSaving.value = false
  }
}

function handleRowSelect(item: ModInfo) {
  selectTableRow.value = item
}

const uninstallRef = useTemplateRef('uninstallRef')

function handleModDelCannel() {
  prevDeleteItem.value = []
}

async function handleModInstall(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  const files = event.dataTransfer?.files
  if (!files?.length || !game.value) return
  const res: ModInstallPreview[] = []

  for await (const file of files) {
    const archivePath = window.api.fileApi.getPathForFile(file)
    if (game.value.mod_root_path && selectedItem.value?.name) {
      const items = (await window.api.modApi.inspectArchive({
        archivePath: archivePath,
        category: toRaw(getCategoryName.value),
        itemName: selectedItem.value.name,
        modsRoot: game.value.mod_root_path
      })) as ModInstallPreview
      res.push(items)
    }
  }
  dialogRef.value?.openModal(res)
}

const backToItems = (): void => {
  selectedItem.value = undefined
  getItems()
}

const elementMap = new Map()
async function handleElementSelect(v?: string) {
  queryParams.secondaryCategoryId = v
  await getItems()
}

watch(
  () => route.params.gameId,
  async (newGameId) => {
    if (!newGameId) return
    selectedItemId.value = undefined
    selectedItem.value = undefined
    activeSection.value = '1'
    if (!gameStore.getState().loaded) {
      await gameStore.load()
    }
    if (!categoryStore.getState().loaded) {
      await categoryStore.load()
    }
    category.value.forEach((e) => {
      elementMap.set(e.name, e.id)
    })
    game.value = gameStore.getById(newGameId as string)
    sortType.value = loadSortTypeFromStorage(newGameId as string)
    await getItems()
    initListAnimate()
  },
  { immediate: true }
)

watch(
  activeSection,
  async (v) => {
    selectedItemId.value = undefined
    queryParams.primaryCategoryId = v
    await getItems()
  },
  { immediate: false }
)

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

const onCancel = () => {
  console.log('User canceled')
}

const tableLoading = ref(false)
const onInstall = async (data?: ModPreviewData[]) => {
  tableLoading.value = true
  for await (const item of data || []) {
    if (!game.value || !game.value?.mod_root_path || !item.modName || !selectedItem.value) {
      continue
    }
    await window.api.modApi.install({
      itemData: toRaw(selectedItem.value),
      modRootPath: game.value?.mod_root_path,
      itemName: item.itemName,
      modName: item.modName,
      categoryPathString: [getCategoryName.value],
      archivePath: item.archivePath
    })
  }
  tableLoading.value = false

  getModList()
}

const onOverrideInstall = (data?: ModPreviewData[]) => {
  console.log('Performing overwrite install:', data)
  getModList()
}

async function handleModEnabled(_: unknown, data: ModInfo) {
  const fuc = !data.enabled ? window.api.modApi.disable : window.api.modApi.enable
  if (!selectedItem.value?.name || !game.value?.mod_root_path) return

  const params: ModOpt = {
    itemData: toRaw(selectedItem.value),
    modRootPath: game.value.mod_root_path,
    itemName: selectedItem.value.name,
    modName: data.name,
    categoryPathString: [getCategoryName.value]
  }
  await fuc(params)
  getModList()
}

const chooseMap: Map<string, boolean> = reactive(new Map())
const chooseAll = ref(false)
const indeterminate = computed(() => {
  return chooseMap.size > 0 && chooseMap.size < tableData.value.length
})

function handleChooseAll() {
  tableData.value.forEach((e) => {
    chooseMap.set(e.name, chooseAll.value)
    e.isChoose = chooseAll.value
  })

  if (!chooseAll.value) {
    chooseMap.clear()
  }
}

function handleChoose(item: TableData) {
  if (item.isChoose) {
    chooseMap.set(item.name, item.isChoose)
  } else {
    chooseMap.delete(item.name)
  }

  if (chooseMap.size === tableData.value.length) {
    chooseAll.value = true
  } else if (chooseMap.size === 0) {
    chooseAll.value = false
  }
}

async function getModList() {
  if (isGettingModList.value) return
  isGettingModList.value = true
  try {
    if (!game.value || !game.value?.mod_root_path || !selectedItem.value?.name) {
      tableData.value = []
      return
    }
    const params: ListQuery = {
      modRootPath: game.value.mod_root_path,
      itemName: selectedItem.value.name,
      categoryPathString: [getCategoryName.value]
    }
    const data = (await window.api.modApi.list(params)) as ModInfo[]

    tableData.value = data
      .map((e) => {
        return {
          ...e,
          isChoose: chooseMap.get(e.name) || false
        }
      })
      .sort((a, b) => {
        return +new Date(b.modifiedAt) - +new Date(a.modifiedAt)
      })
    if (tableData.value.length > 0 && !selectTableRow.value) {
      handleRowSelect(tableData.value[0])
    }
  } catch (error) {
    console.error('获取Mod列表失败：', error)
    tableData.value = []
  } finally {
    isGettingModList.value = false
  }
}

async function handleRemoveAllMod() {
  if (chooseMap.size === 0) {
    return notify.warning('请先选择需要卸载的MOD')
  }
  if (!game.value || !game.value?.mod_root_path || !selectedItem.value) {
    return
  }

  const choosedList = tableData.value?.flatMap((e) => {
    if (chooseMap.get(e.name)) {
      return e
    } else {
      return []
    }
  })

  prevDeleteItem.value = choosedList

  uninstallRef.value?.openModal(prevDeleteItem.value)
}

const prevDeleteItem = ref<TableData[]>([])
const deleteNameStr = ref('')
async function handleUninstallMod(item: TableData) {
  deleteNameStr.value = item.name

  prevDeleteItem.value.push(item)

  uninstallRef.value?.openModal(prevDeleteItem.value)
}

async function handleConfirmUninstallMod(toTrash = false) {
  if (!game.value || !game.value?.mod_root_path || !selectedItem.value) {
    return
  }

  const errorstr: string[] = []

  for await (const item of prevDeleteItem.value || []) {
    const res = await window.api.modApi.uninstall({
      itemData: toRaw(selectedItem.value),
      modRootPath: game.value.mod_root_path,
      itemName: selectedItem.value.name,
      modName: item.name,
      categoryPathString: [getCategoryName.value],
      toTrash
    })

    if (!res[0]) {
      errorstr.push(res[1])
    }
  }

  if (errorstr.length === 0) {
    prevDeleteItem.value = []
    getModList()
  } else {
    uninstallRef.value?.setError(errorstr.join(','))
  }
}

const containerRef = useTemplateRef('containerRef')

function initListAnimate() {
  if (!containerRef.value) {
    return
  }

  // wrapGrid(containerRef.value, {
  //   stagger: 0,
  //   duration: 600,
  //   easing: 'easeInOut'
  // })
}

const deleteDialog = ref(false)
const deletingItem = ref<GameItemRow>()
function openDeleteDialog(item: GameItemRow) {
  deletingItem.value = item
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) {
    return
  }

  try {
    await window.api.itemApi.remove(deletingItem.value.id)

    notify.success(t('common.deleteSuccess'))

    deleteDialog.value = false
    deletingItem.value = undefined

    getItems()
  } catch (err) {
    notify.error(t('common.deleteFailed', { err }))
  }
}

const sizes = ref<number[]>(
  JSON.parse(localStorage.getItem(`${gameId.value}layout-sizes`) ?? '[20,60,20]')
)

function handleResize(payload: SplitpanesResizedPayload) {
  sizes.value = payload.panes.map((pane) => pane.size)

  localStorage.setItem(`${gameId.value}layout-sizes`, JSON.stringify(sizes.value))
}

onMounted(() => {})

onUnmounted(() => {})
</script>

<template>
  <div class="h-full w-full">
    <section class="h-full w-full">
      <div v-if="!selectedItem" class="flex flex-col h-full w-full">
        <div class="flex items-center gap-4 justify-between py-4 pr-3 flex-wrap">
          <v-btn
            icon="mdi-cog-outline"
            variant="text"
            :title="t('gameManager.modifyModDir')"
            @click="openModRootDialog"
          />
          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="flat" class="d-flex align-items-center">
                {{ selectedText }}
                <v-icon icon="mdi-chevron-down" class="ml-2" />
              </v-btn>
            </template>

            <v-list density="compact">
              <v-list-item v-for="item in options" :key="item.value" @click="handleSortList(item)">
                <v-list-item-title>{{ item.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <div class="shrink-0 flex gap-3 justify-center">
            <v-chip-group v-model="activeSection" filter mandatory>
              <v-chip
                v-for="section in level0Filter"
                :key="section.id"
                :variant="activeSection === section.id ? 'elevated' : 'tonal'"
                class="cursor-pointer"
                :value="section.id"
              >
                {{ getSectionDisplayName(section) }}
              </v-chip>
            </v-chip-group>
          </div>
          <div class="flex-1 flex justify-center-safe">
            <div class="mx-auto">
              <genshin-elements
                v-if="gameId === '1'"
                @select="handleElementSelect"
              ></genshin-elements>
              <elements-zzz v-else-if="gameId === '2'" @select="handleElementSelect"></elements-zzz>
            </div>
          </div>
          <div class="w-full max-w-60 flex items-center gap-2">
            <v-text-field
              v-model="searchText"
              :label="t('gameManager.searchPlaceholder')"
              :placeholder="t('gameManager.searchPlaceholder')"
              append-inner-icon="mdi-magnify"
              clearable
              single-line
              hide-details
              density="compact"
              color="primary"
              variant="outlined"
            ></v-text-field>
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openItemDialog">{{
            t('gameManager.addItem')
          }}</v-btn>
        </div>

        <div class="flex-1 overflow-hidden">
          <com-scroll class="pb-4 pr-4">
            <div
              ref="containerRef"
              class="containerRef relative grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
            >
              <div v-for="item in filteredItems" :key="item.id">
                <v-card
                  class="cursor-pointer py-2 group"
                  variant="tonal"
                  @click="handleDetail(item)"
                >
                  <div class="w-full relative h-32">
                    <div v-if="item.element" class="absolute -top-1 left-2 z-999">
                      <div class="w-10 h-10">
                        <v-img :src="item.element" cover />
                      </div>
                    </div>
                    <div v-show="item.cover" class="w-32 h-32 mx-auto overflow-hidden">
                      <v-img v-if="item.cover" :src="item.cover" cover />
                    </div>
                    <div
                      v-if="item.mod_count"
                      class="absolute right-4 bottom-0 border-b-4 border-solid border-blue-500 text-[18px] font-bold"
                    >
                      <span>{{ item.mod_count_enable }}/</span>
                      <span>{{ item.mod_count }}</span>
                    </div>

                    <div v-if="item.is_custom" class="absolute right-0 -top-2">
                      <v-menu location="end" :offset="[-8, -12]">
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon="mdi-dots-vertical"
                            variant="text"
                            density="comfortable"
                            @click.stop
                          />
                        </template>

                        <v-list density="compact">
                          <v-list-item
                            prepend-icon="mdi-pencil-outline"
                            :title="t('common.edit')"
                            @click.stop="handleEditItem(item)"
                          />

                          <v-list-item
                            prepend-icon="mdi-delete-outline"
                            :title="t('common.delete')"
                            class="text-error"
                            @click.stop="openDeleteDialog(item)"
                          />
                        </v-list>
                      </v-menu>
                    </div>
                  </div>
                  <div class="w-full gap-3">
                    <div class="text-center">
                      <div class="text-subtitle-1 truncate">{{ getItemDisplayName(item) }}</div>
                      <div class="text-body-2 opacity-70 truncate">
                        {{ language === 'zh-CN' ? item.name : item.name_zh_cn }}
                      </div>
                    </div>
                  </div>
                </v-card>
              </div>
            </div>
            <div v-if="filteredItems.length === 0">
              <v-empty-state :title="t('common.noData')"></v-empty-state>
            </div>
          </com-scroll>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col w-full h-full"
        @dragenter="handleDragEnter"
        @dragover="handleDragOver"
        @drop="handleModInstall"
      >
        <div class="flex items-center gap-3">
          <v-btn icon="mdi-arrow-left" variant="text" @click="backToItems" />
          <div>
            <div class="text-body-2 opacity-70">{{ getActiveItemName }}</div>
          </div>
        </div>

        <div class="flex-1 overflow-hidden">
          <Splitpanes @resized="handleResize">
            <Pane :size="sizes[0]">
              <section>
                <div class="">
                  <form-content
                    ref="formContentRef"
                    :use-mode="'inline'"
                    :game-id="gameId"
                  ></form-content>
                </div>
              </section>
            </Pane>

            <Pane :size="sizes[1]">
              <section
                class="min-w-0 h-full overflow-auto border-x border-black/10 relative pb-15 transition-all duration-200"
              >
                <v-alert
                  v-show="isEnableMutipleMod"
                  text="请注意,启用了多个MOD,可能会有冲突"
                  type="warning"
                  variant="tonal"
                  closable
                ></v-alert>
                <v-table>
                  <thead>
                    <tr>
                      <th>
                        <v-checkbox-btn
                          v-model="chooseAll"
                          color="primary"
                          :indeterminate="indeterminate"
                          @change="handleChooseAll"
                        ></v-checkbox-btn>
                      </th>
                      <th class="text-left">{{ t('gameManager.enabled') }}</th>
                      <th class="text-left">{{ t('gameManager.modName') }}</th>
                      <th class="text-left">{{ t('gameManager.addedAt') }}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in tableData"
                      :key="item.name"
                      :class="[{ 'select-row-color': selectTableRow?.name === item.name }]"
                      tabindex="0"
                      @click.stop="handleRowSelect(item)"
                    >
                      <td @click.stop="() => {}">
                        <v-checkbox-btn
                          v-model="item.isChoose"
                          color="primary"
                          @change="handleChoose(item)"
                        ></v-checkbox-btn>
                      </td>
                      <td>
                        <div class="w-full h-full flex items-center" @click.stop="() => {}">
                          <v-switch
                            v-model="item.enabled"
                            color="primary"
                            hide-details
                            true-icon="mdi-check"
                            false-icon="mdi-close"
                            @change.stop="handleModEnabled($event, item)"
                          ></v-switch>
                        </div>
                      </td>
                      <td>{{ getItemDisplayName(item) }}</td>
                      <td>{{ dayjs(item.modifiedAt).format('YYYY-MM-DD HH:mm:ss') }}</td>
                      <td>
                        <div @click.stop="() => {}">
                          <v-btn
                            variant="plain"
                            icon="mdi-delete-outline"
                            @click="handleUninstallMod(item)"
                          ></v-btn>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <v-overlay
                  :model-value="tableLoading"
                  contained
                  class="align-center justify-center"
                >
                  <v-progress-circular indeterminate size="64" />
                </v-overlay>
                <div class="absolute bottom-5 right-2">
                  <v-btn color="red" @click="handleRemoveAllMod">批量删除</v-btn>
                </div>
              </section>
            </Pane>

            <Pane :size="sizes[2]">
              <section class="pr-4 pl-2">
                <div>
                  <div class="text-body-2 opacity-70">{{ t('gameManager.preview') }}</div>
                  <div v-if="selectTableRow?.cover">
                    <v-img :src="selectTableRow?.cover" cover />
                  </div>
                  <div v-else>
                    <v-alert
                      density="compact"
                      :text="t('gameManager.noPreview')"
                      type="warning"
                    ></v-alert>
                  </div>
                </div>
                <div></div>
              </section>
            </Pane>
          </Splitpanes>
        </div>
      </div>
    </section>
  </div>

  <v-dialog v-model="deleteDialog" max-width="420">
    <v-card>
      <v-card-title>{{ t('common.warning') }}</v-card-title>

      <v-card-text>
        {{ t('gameManager.itemDeleteConfirm', { name: getItemDisplayName(deletingItem) }) }}
        <br />
        {{ t('gameManager.itemDeleteWarning') }}
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn variant="text" @click="deleteDialog = false">{{ t('common.cancel') }}</v-btn>

        <v-btn color="error" variant="flat" @click="confirmDelete">{{ t('common.delete') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showModRootDialog" max-width="560">
    <v-card>
      <v-card-title>{{ t('gameManager.modifyModDirTitle') }}</v-card-title>

      <v-card-text>
        <div class="grid gap-4">
          <v-text-field
            v-model="modRootPath"
            :label="t('gameManager.modRootLabel')"
            density="compact"
          >
            <template #append-inner>
              <v-btn
                icon="mdi-folder-open-outline"
                size="small"
                variant="text"
                @click="chooseModRootPath"
              />
            </template>
          </v-text-field>

          <v-alert v-if="modRootError" type="error" variant="tonal" density="compact">
            {{ modRootError }}
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showModRootDialog = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="primary" :loading="modRootSaving" @click="saveModRootPath">{{
          t('common.save')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <mod-inspect
    ref="dialogRef"
    @cancel="onCancel"
    @install="onInstall"
    @install-all="onInstall"
    @override-install-all="onOverrideInstall"
    @override-install="onOverrideInstall"
  />

  <mod-uninstall
    ref="uninstallRef"
    @delete="handleConfirmUninstallMod"
    @recycle="handleConfirmUninstallMod(true)"
    @cannel="handleModDelCannel"
  ></mod-uninstall>

  <item-form ref="itemFormRef" :game-id="gameId" @update="getItems"></item-form>
</template>

<style scoped>
:deep(.splitpanes .splitpanes__splitter) {
  width: 10px;
  position: relative;
}

:deep(.splitpanes .splitpanes__splitter::after) {
  content: '⋮';

  position: absolute;

  left: 50%;
  top: 50%;

  transform: translate(-50%, -50%);

  opacity: 0.5;

  font-size: 14px;
}

.select-row-color {
  transition: all 0.2s ease-in;
  background-color: var(--color-blue-300);
}

.v-theme--dark .select-row-color {
  background-color: var(--color-blue-600);
}
</style>
