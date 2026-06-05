<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, reactive, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { gameStore } from '@renderer/stores/game-store'
import { categoryStore } from '@renderer/stores/category-store'
import GenshinElements from '@renderer/components/genshin-elements.vue'
import { apiGetItemList } from '@renderer/api/item'
import { ItemEntity } from '@shared/entities/item'
import type { CreateItemDto } from '@shared/dto/item'
import { QueryParams } from '@shared/types/item'
import { UserGame } from '@shared/entities/game'
import modInspect from './components/mod-inspect.vue'

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
      params: {
        gameId
      }
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

const filteredItems = computed(() => {
  const keyword = searchText.value?.trim().toLowerCase()

  if (!keyword) {
    return activeItems.value
  }

  return activeItems.value?.filter((item) => {
    const name = (item.name ?? '').toLowerCase()
    const nameZhCn = (item.name_zh_cn ?? '').toLowerCase()

    return name.includes(keyword) || nameZhCn.includes(keyword)
  })
})

async function getItems() {
  activeItems.value = await apiGetItemList(queryParams)
}

function handleDetail(item: ItemEntity) {
  selectedItem.value = item
}

const openItemDialog = (item?: ItemEntity): void => {
  editingItemId.value = item?.id
}

const saveItem = async (): Promise<void> => {
  itemForm.name_zh_cn = itemForm.name_zh_cn.trim()
  itemForm.name = itemForm.name.trim()
  itemForm.cover = itemForm.cover?.trim() || null

  if (!itemForm.name_zh_cn || !itemForm.name || !itemForm.cover) {
    itemFormError.value = '报错'
    return
  }

  itemDialog.value = false
}

async function handleModInstall(event: DragEvent) {
  const files = event.dataTransfer?.files

  if (!files?.length) {
    return
  }

  if (!game.value) {
    return
  }

  const archivePath = window.api.fileApi.getPathForFile(files[0])

  if (game.value.mod_root_path && selectedItem.value?.name) {
    const items = await window.api.modApi.inspectArchive({
      archivePath: archivePath,
      category: toRaw(getCategoryName.value),
      itemName: selectedItem.value.name,
      modsRoot: game.value.mod_root_path
    })
    console.log(items)
    Object.assign(modData, items)
    dialogVisible.value = true
  }
}

const backToItems = (): void => {
  selectedItem.value = undefined
}

const elementMap = new Map()

async function handleElementSelect(v?: string) {
  const categoryItem = category.value.find((e) => e.name === v)

  if (categoryItem) {
    queryParams.secondaryCategoryId = categoryItem.id
  } else {
    queryParams.secondaryCategoryId = undefined
  }
  await getItems()
}

watch(
  () => route.params.gameId,
  async () => {
    selectedItemId.value = undefined
    activeSection.value = '1'
    if (!gameStore.getState().loaded) {
      await gameStore.load()
    }
  }
)

watch(activeSection, async (v) => {
  selectedItemId.value = undefined
  queryParams.primaryCategoryId = v
  await getItems()
})

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

const dialogVisible = ref(false)

// 模拟从 inspectArchive 获取的数据
const modData = ref({
  archivePath: 'C:/test.zip',
  category: 'characters',
  itemName: 'furina',
  modName: '芙宁娜-白礼服',
  createdAt: '2025-01-01T12:00:00.000Z',
  exists: false, // 改为 true 即可看到覆盖安装按钮
  previewImage: 'preview.png'
})

// 预览图（可以是本地路径、网络地址、base64）
const previewUrl = ref('https://xxx.com/preview.jpg')

// 取消
const onCancel = () => {
  console.log('用户取消')
}

// 安装
const onInstall = (form) => {
  console.log('执行安装：', form)
}

// 覆盖安装
const onOverrideInstall = (form) => {
  console.log('执行覆盖安装：', form)
}

onMounted(async () => {
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

  await getItems()
})

onUnmounted(() => {})

onBeforeUnmount(() => {})
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
          <div class="w-full h-full overflow-auto">
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
              <div v-for="(item, index) in filteredItems" :key="index" class="card height-20">
                <v-card
                  class="character-card cursor-pointer"
                  variant="tonal"
                  @click="handleDetail(item)"
                >
                  <div class="w-full p-3">
                    <div class="w-50 mx-auto">
                      <v-img v-if="item.cover" :src="item.cover" cover />
                    </div>
                  </div>
                  <v-card-text class="character-card__body">
                    <div class="w-full gap-3">
                      <div class="min-w-0 text-center">
                        <div class="text-subtitle-1 truncate">{{ item.name }}</div>
                        <div class="text-body-2 opacity-70 truncate">{{ item.name_zh_cn }}</div>
                      </div>
                      <div class="flex shrink-0 items-center gap-1">
                        <v-chip size="small" color="primary" variant="tonal">
                          {{ item.mod_count }}
                        </v-chip>
                        <v-btn icon="mdi-pencil-outline" size="small" variant="text" />
                        <v-btn icon="mdi-delete-outline" size="small" variant="text" />
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </div>
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
          <div class="grid min-h-130 h-full gap-4 xl:grid-cols-[280px_1fr_320px]">
            <section class="border-r border-black/10 pr-4">
              <v-img v-if="selectedItem.cover" :src="selectedItem.cover" aspect-ratio="1" cover />
              <div class="mt-3 text-subtitle-1">{{ selectedItem.name_zh_cn }}</div>
              <div class="text-body-2 opacity-70">{{ selectedItem.name }}</div>
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
                  <!-- <tr v-for="item in desserts" :key="item.name">
                  <td>{{ item.name }}</td>
                  <td>{{ item.calories }}</td>
                </tr> -->
                </tbody>
              </v-table>
            </section>

            <section class="border-l border-black/10 pl-4">
              <div class="mb-3 text-subtitle-1">配置</div>
              <div class="mt-3 text-body-2 opacity-70">预览</div>
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
    v-model="dialogVisible"
    :data="modData"
    :preview-image-url="previewUrl"
    @cancel="onCancel"
    @install="onInstall"
    @override-install="onOverrideInstall"
  />
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
