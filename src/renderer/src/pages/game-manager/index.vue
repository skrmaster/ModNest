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
import { QueryParams } from '@shared/types/item'
import { UserGame } from '@shared/entities/game'
import modInspect from './components/mod-inspect.vue'
import { ListQuery, ModInfo, ModOpt, ModPreviewData } from '@shared/types/mod'
import dayjs from 'dayjs'
import { useNotify } from '@renderer/composables/useNotify'
import modUninstall from './components/mod-uninstall.vue'
import comScroll from '@renderer/components/com-scroll.vue'
import ItemForm from './components/item-form.vue'
import formContent from './components/form-content.vue'
import type { GameGenshinElement } from '#types/element'
import { getAppImageUrl } from '@shared/utils/url.js'
import ElementsZzz from '@renderer/components/elements-zzz.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useAppSettings } from '@renderer/composables/useAppSettings'
// import { wrapGrid } from 'animate-css-grid'

type List = Array<GameItemRow & { element?: string; rarityBg?: string }>

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

const getActiveItemName = computed(() => {
  return language.value === 'zh-CN' ? selectedItem.value?.name_zh_cn : selectedItem.value?.name
})

const activeItems = ref<List>()
const searchText = ref<string | undefined>()
const isGettingItems = ref(false)
const isGettingModList = ref(false)

const options = ref([
  { label: '默认排序', value: 'default' },
  { label: 'Mod数量', value: 'ModCount' }
])
const selectedText = ref('默认排序')
const sortType = ref<string>('default')
function handleSortList(val: (typeof options.value)[0]) {
  sortType.value = val.value
  selectedText.value = val.label
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
  } else {
    result = [...result]
  }

  return result
})

const gameImageMap: Record<
  string,
  {
    elementList: string[]
    rarityList: string[]
  }
> = {
  1: {
    elementList: ['anemo', 'cryo', 'dendro', 'electro', 'geo', 'hydro', 'pyro'],
    rarityList: ['rarity3', 'rarity4', 'rarity5']
  },
  2: {
    elementList: ['physical', 'ice', 'fire', 'ether', 'electric'],
    rarityList: ['rarity3', 'rarity4', 'rarity5']
  }
}
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
    console.error('获取物品列表失败：', error)
  } finally {
    isGettingItems.value = false
  }
}

const formContentRef = useTemplateRef('formContentRef')
async function handleDetail(item: GameItemRow) {
  selectedItem.value = item
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
const tableData = ref<ModInfo[]>([])
const selectTableRow = ref<ModInfo>()
const showModRootDialog = ref(false)
const modRootPath = ref('')
const modRootError = ref('')
const modRootSaving = ref(false)

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
      modRootError.value = '请先选择 Mod 根目录'
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
const uninstallData = ref<ModInfo>()

async function handleDelete(data: ModInfo) {
  uninstallData.value = data
  uninstallRef.value?.openModal(data)
  selectTableRow.value = undefined
}

async function handleDeleteMod() {
  if (
    !game.value ||
    !game.value?.mod_root_path ||
    !selectedItem.value ||
    !uninstallData.value?.name
  ) {
    return
  }
  const res = await window.api.modApi.uninstall({
    itemData: toRaw(selectedItem.value),
    modRootPath: game.value.mod_root_path,
    itemName: selectedItem.value.name,
    modName: uninstallData.value.name,
    categoryPathString: [getCategoryName.value],
    toTrash: false
  })

  if (res[0]) {
    uninstallRef.value?.closeModal()
  } else {
    uninstallRef.value?.setError(res[1])
  }
  getModList()
}

async function handleMoveRecycle() {
  if (
    !game.value ||
    !game.value?.mod_root_path ||
    !selectedItem.value ||
    !uninstallData.value?.name
  ) {
    return
  }
  const res = await window.api.modApi.uninstall({
    itemData: toRaw(selectedItem.value),
    modRootPath: game.value.mod_root_path,
    itemName: selectedItem.value.name,
    modName: uninstallData.value.name,
    categoryPathString: [getCategoryName.value],
    toTrash: true
  })

  if (res[0]) {
    uninstallRef.value?.closeModal()
  } else {
    uninstallRef.value?.setError(res[1])
  }
  getModList()
}

async function handleModInstall(event: DragEvent) {
  event.stopPropagation()
  const files = event.dataTransfer?.files
  if (!files?.length || !game.value) return

  const archivePath = window.api.fileApi.getPathForFile(files[0])
  if (game.value.mod_root_path && selectedItem.value?.name) {
    const items = await window.api.modApi.inspectArchive({
      archivePath: archivePath,
      category: toRaw(getCategoryName.value),
      itemName: selectedItem.value.name,
      modsRoot: game.value.mod_root_path
    })
    dialogRef.value?.openModal(items)
  }
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
  console.log('用户取消')
}

const onInstall = async (form: Partial<ModPreviewData>, data: ModPreviewData) => {
  if (!game.value || !game.value?.mod_root_path || !form.modName || !selectedItem.value) {
    return
  }
  await window.api.modApi.install({
    itemData: toRaw(selectedItem.value),
    modRootPath: game.value?.mod_root_path,
    itemName: data.itemName,
    categoryPathString: [getCategoryName.value],
    archivePath: data.archivePath
  })
  getModList()
}

const onOverrideInstall = (form) => {
  console.log('执行覆盖安装：', form)
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
    const data = await window.api.modApi.list(params)
    tableData.value = data
    if (tableData.value.length > 0) {
      handleRowSelect(tableData.value[0])
    }
  } catch (error) {
    console.error('获取Mod列表失败：', error)
    tableData.value = []
  } finally {
    isGettingModList.value = false
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

    notify.success('删除成功')

    deleteDialog.value = false
    deletingItem.value = undefined

    getItems()
  } catch (err) {
    notify.error(`删除失败：${err}`)
  }
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
            title="修改Mod目录"
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
                {{ section.name_zh_cn }}
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
              label="请输入搜索名称"
              placeholder="请输入搜索名称"
              append-inner-icon="mdi-magnify"
              clearable
              single-line
              hide-details
              density="compact"
              color="primary"
              variant="outlined"
            ></v-text-field>
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openItemDialog">添加项目</v-btn>
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
                    <div v-if="item.element" class="absolute -top-1 left-2">
                      <div class="w-10 h-10">
                        <v-img :src="item.element" cover />
                      </div>
                    </div>
                    <div v-show="item.cover" class="w-32 h-32 mx-auto overflow-hidden">
                      <v-img v-if="item.cover" :src="item.cover" cover />
                    </div>
                    <div
                      v-if="item.mod_count"
                      class="absolute right-4 bottom-0 border-b-2 border-solid border-blue-500"
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
                            title="编辑"
                            @click.stop="handleEditItem(item)"
                          />

                          <v-list-item
                            prepend-icon="mdi-delete-outline"
                            title="删除"
                            class="text-error"
                            @click.stop="openDeleteDialog(item)"
                          />
                        </v-list>
                      </v-menu>
                    </div>
                  </div>
                  <div class="w-full gap-3">
                    <div class="text-center">
                      <div class="text-subtitle-1 truncate">{{ item.name }}</div>
                      <div class="text-body-2 opacity-70 truncate">
                        {{ item.name_zh_cn }}
                      </div>
                    </div>
                  </div>
                </v-card>
              </div>
            </div>
            <div v-if="filteredItems.length === 0">
              <v-empty-state title="暂无数据"></v-empty-state>
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
          <Splitpanes>
            <Pane :size="20">
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

            <Pane :size="60">
              <section class="min-w-0 h-full overflow-auto border-x border-black/10">
                <v-table>
                  <thead>
                    <tr>
                      <th class="text-left">启用</th>
                      <th class="text-left">mod名称</th>
                      <th class="text-left">添加时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in tableData"
                      :key="item.name"
                      :class="[{ 'bg-blue-200': selectTableRow?.name === item.name }]"
                      tabindex="0"
                      @click.stop="handleRowSelect(item)"
                      @keydown.delete="handleDelete(item)"
                    >
                      <td>
                        <v-checkbox-btn
                          v-model="item.enabled"
                          @change.stop="handleModEnabled($event, item)"
                        ></v-checkbox-btn>
                      </td>
                      <td>{{ item.name }}</td>
                      <td>{{ dayjs(item.modifiedAt).format('YYYY-MM-DD HH:mm:ss') }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </section>
            </Pane>

            <Pane :size="20">
              <section>
                <div>
                  <div class="text-body-2 opacity-70">预览图</div>
                  <div v-if="selectTableRow?.cover" class="px-4">
                    <v-img :src="selectTableRow?.cover" cover />
                  </div>
                  <div v-else>
                    <v-alert density="compact" text="暂无预览" title="" type="warning"></v-alert>
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
      <v-card-title> 注意 </v-card-title>

      <v-card-text>
        确定删除
        <strong>{{ deletingItem?.name_zh_cn }}</strong>
        吗？
        <br />
        MOD会保留在磁盘上。
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn variant="text" @click="deleteDialog = false"> 取消 </v-btn>

        <v-btn color="error" variant="flat" @click="confirmDelete"> 删除 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <mod-inspect
    ref="dialogRef"
    @cancel="onCancel"
    @install="onInstall"
    @override-install="onOverrideInstall"
  />

  <mod-uninstall
    ref="uninstallRef"
    @delete="handleDeleteMod"
    @recycle="handleMoveRecycle"
  ></mod-uninstall>

  <item-form ref="itemFormRef" :game-id="gameId" @update="getItems"></item-form>

  <v-dialog v-model="showModRootDialog" max-width="560">
    <v-card>
      <v-card-title>修改 Mod 根目录</v-card-title>

      <v-card-text>
        <div class="grid gap-4">
          <v-text-field v-model="modRootPath" label="Mod 根目录" density="compact">
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
        <v-btn variant="text" @click="showModRootDialog = false">取消</v-btn>
        <v-btn color="primary" :loading="modRootSaving" @click="saveModRootPath">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
</style>
