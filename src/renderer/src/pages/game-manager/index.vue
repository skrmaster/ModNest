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
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { gameStore } from '@renderer/stores/game-store'
import { categoryStore } from '@renderer/stores/category-store'
import GenshinElements from '@renderer/components/genshin-elements.vue'
import { apiGetItemList } from '@renderer/api/item'
import { ItemEntity } from '@shared/entities/item'
import type { CreateItemDto, UpdateItemDto } from '@shared/dto/item'
import { QueryParams } from '@shared/types/item'
import { UserGame } from '@shared/entities/game'
import modInspect from './components/mod-inspect.vue'
import { ListQuery, ModInfo, ModOpt, ModPreviewData } from '@shared/types/mod.js'
import dayjs from 'dayjs'
import { useNotify } from '@renderer/composables/useNotify.js'
import modUninstall from './components/mod-uninstall.vue'
import comScroll from '@renderer/components/com-scroll.vue'
import { wrapGrid } from 'animate-css-grid'
import { debounce } from '@renderer/utils/base'

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
const { t } = useI18n()

const activeSection = ref<string>('1')
const { gameId } = route.params
const game = ref<UserGame | undefined>()

const category = computed(() => categoryStore.getState().items)
const level0Filter = computed(() => category.value.filter((e) => e.level === 0))

const queryParams = reactive<QueryParams>({
  gameId: gameId as string,
  primaryCategoryId: '1',
  secondaryCategoryId: undefined
})
const selectedItem = ref<ItemEntity>()
const selectedItemId = ref<string>()
const itemDialog = ref(false)
const itemFormError = ref('')
const editingItemId = ref<string>()

const getCategoryName = computed(() => {
  const item = category.value.find((e) => e.id == queryParams.primaryCategoryId)
  return item ? item.name : ''
})

const itemForm = reactive<CreateItemDto>({
  name: '',
  name_zh_cn: '',
  cover: null,
  mod_count: 0,
  game_id: ''
})

const activeItems = ref<ItemEntity[]>()
const searchText = ref<string | undefined>()
// 加载状态，避免重复请求
const isGettingItems = ref(false)
const isGettingModList = ref(false)

// 过滤列表，减少不必要的重计算
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

// 获取列表（动画完全由 filteredItems 的 watch 驱动，这里不再手动触发）
async function getItems() {
  if (isGettingItems.value) return
  isGettingItems.value = true
  try {
    activeItems.value = await apiGetItemList(queryParams)
  } catch (error) {
    console.error('获取物品列表失败：', error)
  } finally {
    isGettingItems.value = false
  }
}

// 防抖后的获取列表方法
const debouncedGetItems = debounce(getItems, 200)

function handleDetail(item: ItemEntity) {
  selectedItem.value = item
  getModList()
}

const openItemDialog = (item?: ItemEntity): void => {
  editingItemId.value = item?.id
}

const saveItem = async (): Promise<void> => {
  itemForm.name_zh_cn = itemForm.name_zh_cn.trim()
  itemForm.name = itemForm.name.trim()
  itemForm.cover = itemForm.cover?.trim() || null

  if (!itemForm.name_zh_cn || !itemForm.name || !itemForm.cover) {
    itemFormError.value = '请填写完整信息'
    return
  }
  itemDialog.value = false
}

const notify = useNotify()
const saveItemInfoLoading = ref(false)
let timer: null | ReturnType<typeof setTimeout> = null

async function saveItemInfo() {
  saveItemInfoLoading.value = true
  try {
    if (!selectedItem.value) return

    const updateItem: UpdateItemDto = {
      name: selectedItem.value.name,
      name_zh_cn: selectedItem.value.name_zh_cn
    }
    await window.api.itemApi.update(toRaw(selectedItem.value.id), updateItem)
  } catch (error) {
    console.log(error)
  } finally {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      saveItemInfoLoading.value = false
      notify.success('保存成功')
    }, 500)
  }
}

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
}

const elementMap = new Map()
async function handleElementSelect(v?: string) {
  const categoryItem = category.value.find((e) => e.name === v)
  queryParams.secondaryCategoryId = categoryItem?.id
  await debouncedGetItems()
}

// 路由监听
watch(
  () => route.params.gameId,
  async (newGameId) => {
    if (!newGameId) return
    selectedItemId.value = undefined
    activeSection.value = '1'
    if (!gameStore.getState().loaded) {
      await gameStore.load()
    }
    game.value = gameStore.getById(newGameId as string)
    await debouncedGetItems()
  },
  { immediate: true, flush: 'post' }
)

// 分类切换监听
watch(
  activeSection,
  async (v) => {
    selectedItemId.value = undefined
    queryParams.primaryCategoryId = v
    await debouncedGetItems()
  },
  { immediate: false, flush: 'post' }
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

// Mod列表获取
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

// ─── 卡片平移动画（两种触发场景分开处理）─────────────────────────────────────
//
// 场景一：搜索/过滤导致卡片增删 → 用 animate-css-grid 的 wrapGrid 自动处理
// 场景二：容器宽度变化导致 grid 重排 → 手写 FLIP，用 rAF 每帧持续预录位置
//
// 场景二的核心时序：
//   ResizeObserver 回调触发时，grid 已经完成 reflow，此时读到的是「新布局」。
//   要做 FLIP 必须知道「旧布局」，所以用 rAF 在每一帧末尾把当前位置写入
//   prevRects 缓存。resize 触发时 prevRects 里存的正好是上一帧（reflow 前）
//   的位置，用它做动画起点，当前读到的新布局做终点，就能正确平移。
//
// 连续快速 resize：
//   每次 ResizeObserver 回调进来时，先把所有正在运行的 CSS transition 强制
//   完成（直接 clearTransition + 归零 transform），再重新计算偏移并启动新
//   transition，这样不会有 transform 叠加累积的问题。

const containerRef = ref<HTMLElement | null>(null)
const CARD_SELECTOR = '.card[data-item]'

// ── 场景一：animate-css-grid 处理增删动画 ────────────────────────────────────
let unwrapGrid: (() => void) | null = null

// ── 场景二：手写 FLIP 处理 resize 平移 ───────────────────────────────────────
// prevRects 由 rAF 每帧持续更新，存储每张卡片「当前帧渲染后的视觉位置」
// （getBoundingClientRect 在 rAF 回调里读取，此时 paint 已完成，值最准确）
const prevRects = new Map<string, { left: number; top: number }>()
let rafLoopId: number | null = null
let resizeObserver: ResizeObserver | null = null
const DURATION = 320 // ms，transition 时长
const EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const WIDTH_THRESHOLD = 10 // px，宽度变化低于此值不触发动画
const MIN_MOVE = 0.5 // px，卡片位移低于此值跳过（避免亚像素抖动）

// 上一次触发动画时的容器宽度，用于阈值判断
let prevContainerWidth = 0
// 动画进行中标志，暂停 rAF 位置记录避免覆盖「旧位置」快照
let isAnimating = false

function getCards(): HTMLElement[] {
  return containerRef.value
    ? Array.from(containerRef.value.querySelectorAll<HTMLElement>(CARD_SELECTOR))
    : []
}

// 每帧末尾记录所有卡片的「最终视觉坐标」
// 动画进行中跳过记录，确保 prevRects 始终是动画开始前的布局快照
function rafLoop() {
  if (!isAnimating) {
    const cards = getCards()
    cards.forEach((el) => {
      const r = el.getBoundingClientRect()
      prevRects.set(el.dataset.item!, { left: r.left, top: r.top })
    })
  }
  rafLoopId = requestAnimationFrame(rafLoop)
}

// 把初始化逻辑抽成函数，方便复用
function initGridAnimation() {
  if (!containerRef.value) return

  // 清理旧的绑定（防止重复初始化）
  unwrapGrid?.()
  resizeObserver?.disconnect()
  if (rafLoopId !== null) cancelAnimationFrame(rafLoopId)
  prevRects.clear()

  const wrapped = wrapGrid(containerRef.value, {
    duration: 350,
    stagger: 12,
    easing: 'easeInOut'
  })
  unwrapGrid = wrapped.unwrapGrid

  rafLoopId = requestAnimationFrame(rafLoop)
  prevContainerWidth = containerRef.value.offsetWidth
  resizeObserver = new ResizeObserver(onContainerResize)
  resizeObserver.observe(containerRef.value)
}

// containerRef 变化时重新初始化（v-if 重建 DOM 后会从 null → 新节点）
watch(containerRef, (el) => {
  if (el) initGridAnimation()
})

function onContainerResize(entries: ResizeObserverEntry[]) {
  const newWidth = entries[0]?.contentRect.width ?? containerRef.value?.offsetWidth ?? 0

  // 宽度变化未超过阈值，不触发动画
  if (Math.abs(newWidth - prevContainerWidth) < WIDTH_THRESHOLD) return
  prevContainerWidth = newWidth

  const cards = getCards()
  if (!cards.length) return

  // 暂停 rAF 位置记录，保护「旧位置」快照不被覆盖
  isAnimating = true

  // step1：立即停止所有 transition，把卡片「冻结」在当前视觉位置
  //        此时 prevRects 里存的正是上一 rAF 帧读到的视觉坐标（含动画中间值）
  cards.forEach((el) => {
    el.style.transition = 'none'
    const prev = prevRects.get(el.dataset.item!)
    if (prev) {
      // 先强制 transform 到当前视觉位置，再清零 grid 布局 transform
      // 目的：让卡片在视觉上不跳动地停在原处
      const r = el.getBoundingClientRect()
      const dx = prev.left - r.left
      const dy = prev.top - r.top
      // 当前 transform 已含上一轮偏移，叠加本次冻结偏移
      const cur = new DOMMatrix(getComputedStyle(el).transform)
      el.style.transform = `translate(${cur.m41 + dx}px, ${cur.m42 + dy}px)`
    }
  })

  // step2：单次 reflow 同时读取所有新坐标（批量读，避免多次强制 reflow）
  void containerRef.value!.offsetWidth
  cards.forEach((el) => (el.style.transform = ''))
  void containerRef.value!.offsetWidth

  // step3：批量读取新坐标，批量写入偏移（读写分离，减少 layout thrashing）
  const deltas = cards.map((el) => {
    const prev = prevRects.get(el.dataset.item!)
    if (!prev) return null
    const newR = el.getBoundingClientRect()
    return { el, dx: prev.left - newR.left, dy: prev.top - newR.top }
  })

  deltas.forEach((d) => {
    if (!d) return
    if (Math.abs(d.dx) < MIN_MOVE && Math.abs(d.dy) < MIN_MOVE) return
    d.el.style.transform = `translate(${d.dx}px, ${d.dy}px)`
  })

  // step4：开启 transition，下一帧归零 transform → 浏览器插值平移到新位置
  // 用两层 rAF 确保浏览器在开启 transition 之前已经 paint 了偏移后的状态
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cards.forEach((el) => {
        el.style.transition = `transform ${DURATION}ms ${EASING}`
        el.style.transform = ''
      })
      // 动画结束后恢复 rAF 位置记录
      setTimeout(() => {
        isAnimating = false
      }, DURATION)
    })
  })
}

onMounted(async () => {
  await nextTick()

  if (!categoryStore.getState().loaded) {
    await categoryStore.load()
  }
  category.value.forEach((e) => {
    elementMap.set(e.name, e.id)
  })

  if (!gameStore.getState().loaded) {
    await gameStore.load()
  }
  game.value = gameStore.getById(gameId as string)

  await debouncedGetItems()
  await nextTick()

  if (containerRef.value) {
    // 场景一：增删动画
    const wrapped = wrapGrid(containerRef.value, {
      duration: 350,
      stagger: 12,
      easing: 'easeInOut'
    })
    unwrapGrid = wrapped.unwrapGrid

    // 场景二：启动 rAF 位置追踪循环 + ResizeObserver
    rafLoopId = requestAnimationFrame(rafLoop)
    prevContainerWidth = containerRef.value.offsetWidth
    resizeObserver = new ResizeObserver(onContainerResize)
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (rafLoopId !== null) cancelAnimationFrame(rafLoopId)
  resizeObserver?.disconnect()
  unwrapGrid?.()
})
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
                v-if="activeSection == '1'"
                @select="handleElementSelect"
              ></genshin-elements>
            </div>
          </div>
          <div class="w-full max-w-120 mx-auto">
            <v-text-field
              v-model="searchText"
              label="搜索"
              placeholder="请输入搜索内容"
              prepend-icon="mdi-magnify"
              clearable
              single-line
              hide-details
              density="comfortable"
              color="primary"
            ></v-text-field>
          </div>
        </div>

        <div class="flex-1 overflow-hidden">
          <com-scroll>
            <div
              ref="containerRef"
              class="containerRef relative grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
            >
              <div :key="'__add__'" class="h-full">
                <v-tooltip text="添加" location="top">
                  <template #activator>
                    <v-card class="cursor-pointer h-full" variant="tonal" @click="openItemDialog()">
                      <div class="flex items-center justify-center w-full h-full">
                        <v-icon :size="40" color="ffffff">mdi-plus</v-icon>
                      </div>
                    </v-card>
                  </template>
                </v-tooltip>
              </div>
              <div
                v-for="item in filteredItems"
                :key="`item-${item.id}`"
                class="relative card"
                :data-item="item.id"
              >
                <v-card class="cursor-pointer py-2" variant="tonal" @click="handleDetail(item)">
                  <div class="w-full relative h-27.5">
                    <div v-show="item.cover" class="w-50 mx-auto">
                      <v-img :src="item.cover" cover />
                    </div>
                    <div
                      v-if="item.mod_count"
                      class="absolute right-4 bottom-0 border-b-2 border-solid border-blue-500"
                    >
                      <span>{{ item.mod_count_enable }}/</span>
                      <span>{{ item.mod_count }}</span>
                    </div>
                  </div>
                  <div class="w-full gap-3">
                    <div class="text-center">
                      <div class="text-subtitle-1 truncate">{{ item.name }}</div>
                      <div class="text-body-2 opacity-70 truncate">{{ item.name_zh_cn }}</div>
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
                <div class="w-74 mx-auto">
                  <v-img
                    v-if="selectedItem.cover"
                    :src="selectedItem.cover"
                    aspect-ratio="1"
                    cover
                  />
                </div>
                <v-text-field
                  v-model="selectedItem.name_zh_cn"
                  class="mt-2"
                  label="中文名称"
                  required
                ></v-text-field>
                <v-text-field v-model="selectedItem.name" label="英文名称" required></v-text-field>
              </div>
              <div class="shrink-0 text-end">
                <v-btn
                  color="primary"
                  variant="flat"
                  :loading="saveItemInfoLoading"
                  @click="saveItemInfo"
                  >保存</v-btn
                >
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

    <v-dialog v-model="itemDialog" max-width="560">
      <v-card>
        <v-card-title>
          {{ editingItemId ? t('gameManager.editItem') : t('gameManager.addItem') }}
        </v-card-title>
        <v-card-text>
          <div class="grid gap-3">
            <v-img v-if="itemForm.cover" :src="itemForm.cover" height="180" cover />
            <div class="grid gap-3 md:grid-cols-2">
              <v-text-field v-model="itemForm.name_zh_cn" label="中文名" density="compact" />
              <v-text-field v-model="itemForm.name" label="英文名" density="compact" />
            </div>
            <v-text-field v-model="itemForm.cover" label="图片" density="compact" />

            <v-alert v-if="itemFormError" type="error" variant="tonal" density="compact">
              {{ itemFormError }}
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="tonal" @click="itemDialog = false">关闭</v-btn>
          <v-btn variant="tonal" color="primary" @click="saveItem">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

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
</template>

<style scoped></style>
