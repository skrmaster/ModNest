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
import type { ItemDto } from '@shared/dto/item'
import { QueryParams } from '@shared/types/item'
import { UserGame } from '@shared/entities/game'
import modInspect from './components/mod-inspect.vue'
import { ListQuery, ModInfo, ModOpt, ModPreviewData } from '@shared/types/mod'
import dayjs from 'dayjs'
import { useNotify } from '@renderer/composables/useNotify'
import modUninstall from './components/mod-uninstall.vue'
import comScroll from '@renderer/components/com-scroll.vue'
// import { wrapGrid } from 'animate-css-grid'
import { debounce } from '@renderer/utils/base'
import ItemForm from './components/item-form.vue'
import formContent from './components/form-content.vue'

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

const activeItems = ref<ItemDto[]>()
const searchText = ref<string | undefined>()
const isGettingItems = ref(false)
const isGettingModList = ref(false)

const filteredItems = computed(() => {
  if (!activeItems.value) return []
  const keyword = searchText.value?.trim().toLowerCase()
  if (!keyword) {
    return [...activeItems.value]
  }
  return activeItems.value.filter((item) => {
    const name = (item.name ?? '').toLowerCase()
    const nameZhCn = (item.name_zh_cn ?? '').toLowerCase()
    return name.includes(keyword) || nameZhCn.includes(keyword)
  })
})

async function getItems() {
  if (isGettingItems.value) return
  isGettingItems.value = true
  try {
    activeItems.value = await window.api.itemApi.list(toRaw(queryParams))
  } catch (error) {
    console.error('获取物品列表失败：', error)
  } finally {
    isGettingItems.value = false
  }
}

const debouncedGetItems = debounce(getItems, 200)

const formContentRef = useTemplateRef('formContentRef')
async function handleDetail(item: ItemDto) {
  selectedItem.value = item
  await nextTick()
  formContentRef.value?.init(item, game.value?.id)
  getModList()
}

const itemFormRef = useTemplateRef('itemFormRef')
const openItemDialog = (): void => {
  itemFormRef.value?.openModal(undefined, game.value?.id)
}

function handleEditItem(item: ItemEntity) {
  itemFormRef.value?.openModal(item as ItemDto, game.value?.id)
}

const notify = useNotify()
const dialogRef = useTemplateRef('dialogRef')
const tableData = ref<ModInfo[]>([])
const selectTableRow = ref<ModInfo>()

function handleRowSelect(item: ModInfo) {
  selectTableRow.value = item
}

const uninstallRef = useTemplateRef('uninstallRef')
const uninstallData = ref<ModInfo>()

async function handleDelete(data: ModInfo) {
  uninstallData.value = data
  uninstallRef.value?.openModal(data)
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
  const categoryItem = category.value.find((e) => e.name === v)
  queryParams.secondaryCategoryId = categoryItem?.id
  await debouncedGetItems()
}

watch(
  () => route.params.gameId,
  async (newGameId) => {
    if (!newGameId) return
    selectedItemId.value = undefined
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
    await debouncedGetItems()
    initListAnimate()
  },
  { immediate: true }
)

watch(
  activeSection,
  async (v) => {
    selectedItemId.value = undefined
    queryParams.primaryCategoryId = v
    await debouncedGetItems()
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
const deletingItem = ref<ItemDto>()
function openDeleteDialog(item: ItemDto) {
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
                v-if="activeSection == '1' && gameId === '1'"
                @select="handleElementSelect"
              ></genshin-elements>
            </div>
          </div>
          <div class="w-full max-w-120 mx-auto flex items-center gap-2">
            <v-text-field
              v-model="searchText"
              label="搜索"
              placeholder="请输入搜索内容"
              prepend-icon="mdi-magnify"
              clearable
              single-line
              hide-details
              color="primary"
            ></v-text-field>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openItemDialog">添加项目</v-btn>
          </div>
        </div>

        <div class="flex-1 overflow-hidden">
          <com-scroll class="pb-4">
            <div
              ref="containerRef"
              class="containerRef relative grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
            >
              <div v-for="item in filteredItems" :key="item.id">
                <v-card
                  class="cursor-pointer py-2 group"
                  variant="tonal"
                  @click="handleDetail(item)"
                >
                  <div class="w-full relative h-32">
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
            <div class="text-body-2 opacity-70">{{ selectedItem.name }}</div>
          </div>
        </div>

        <div class="flex-1 overflow-hidden">
          <div class="grid min-h-130 h-full gap-4 xl:grid-cols-[320px_1fr_320px]">
            <section class="border-r border-black/10 pr-4 flex flex-col pb-4">
              <div class="">
                <form-content ref="formContentRef" :use-mode="'inline'"></form-content>
              </div>
            </section>

            <section class="min-w-0 overflow-auto">
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

            <section class="border-l border-black/10 px-4">
              <div>
                <div class="text-body-2 opacity-70">MOD预览</div>
                <v-img v-if="selectTableRow?.cover" :src="selectTableRow?.cover" />
                <div v-else>
                  <v-alert density="compact" text="暂无预览" title="" type="warning"></v-alert>
                </div>
              </div>
              <div></div>
            </section>
          </div>
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
        此操作会删除改项目下的所有mod。
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

  <item-form ref="itemFormRef" @update="getItems"></item-form>
</template>

<style scoped></style>
