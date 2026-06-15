<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useGameCover } from '@renderer/composables/useGameCover'
import { gameStore } from '@renderer/stores/game-store'
import type { UserGame } from '@shared/entities/game'
import type { CreateGameDto } from '@shared/dto/game'

interface NavConfig {
  expandedWidth?: number
  collapsedWidth?: number
  showHeader?: boolean
  headerTitle?: string
  transitionDuration?: number
}

const props = withDefaults(
  defineProps<{
    config?: NavConfig
  }>(),
  {
    config: () => ({})
  }
)

const config = computed(() => ({
  expandedWidth: 240,
  collapsedWidth: 64,
  collapseBreakpoint: 800,
  showHeader: true,
  transitionDuration: 300,
  ...props.config
}))

type ListItem = UserGame

const { locale, t } = useI18n()
const router = useRouter()
const isExpanded = ref(true)
const userToggled = ref(false)
const drawer = ref(true)
const gameDialog = ref(false)
const games = computed(() => gameStore.getState().items)
const selectedGameId = ref<string>()
const isSaving = ref(false)
const formError = ref('')
const gameForm = reactive<CreateGameDto>({
  name: '',
  name_zh_cn: '',
  mod_root_path: '',
  cover: ''
})

const isDefaultGame = (gameId?: string): boolean => gameId === '1' || gameId === '2'
const isDefaultSelected = computed(() => isDefaultGame(selectedGameId.value))

const currentWidth = computed(() =>
  isExpanded.value ? config.value.expandedWidth : config.value.collapsedWidth
)

const toggleMenu = (): void => {
  isExpanded.value = !isExpanded.value
  userToggled.value = true
}

let _resizeTimer: ReturnType<typeof setTimeout> | null = null

const handleResizeEvent = (): void => {
  if (_resizeTimer) clearTimeout(_resizeTimer)

  _resizeTimer = setTimeout(() => {
    if (userToggled.value) return

    const shouldCollapse = window.innerWidth <= config.value.collapseBreakpoint
    if (shouldCollapse === !isExpanded.value) {
      return
    }

    isExpanded.value = !shouldCollapse
  }, 120)
}

const getGameName = (game: ListItem): string => {
  return locale.value === 'zh-CN' ? game.name_zh_cn || game.name : game.name || game.name_zh_cn
}

const openGame = (game: ListItem): void => {
  if (!game.mod_root_path) {
    router.push({ name: 'DefaultSetup', params: { gameId: game.id } })
    return
  }

  router.push({
    name: 'GameManager',
    params: {
      gameId: game.id
    }
  })
}

const openCustomGame = (): void => {
  selectedGameId.value = undefined
  formError.value = ''
  Object.assign(gameForm, {
    id: undefined,
    name_zh_cn: '',
    name: '',
    mod_root_path: '',
    cover: ''
  })
  gameDialog.value = true
}

const chooseModPath = async (): Promise<void> => {
  const selectedPath = await window.api.fileApi.selectDirectory()

  if (selectedPath) {
    gameForm.mod_root_path = selectedPath
  }
}

const { selectCover, downloadCover } = useGameCover()

const chooseCover = async (): Promise<void> => {
  gameForm.cover = await selectCover()
}

const saveGame = async (): Promise<void> => {
  formError.value = ''
  gameForm.name_zh_cn = gameForm.name_zh_cn.trim()
  gameForm.name = gameForm.name.trim()
  gameForm.mod_root_path = gameForm.mod_root_path.trim()
  gameForm.cover = gameForm.cover?.trim()

  const isDefault = isDefaultGame(selectedGameId.value)

  if (!isDefault) {
    if (!gameForm.name_zh_cn || !gameForm.name || !gameForm.mod_root_path) {
      formError.value = t('games.requiredError')
      return
    }
  } else {
    if (!gameForm.mod_root_path) {
      formError.value = t('games.requiredError')
      return
    }
  }

  isSaving.value = true

  try {
    if (isDefault && selectedGameId.value) {
      await window.api.gameApi.update(selectedGameId.value, {
        mod_root_path: gameForm.mod_root_path
      })
      await gameStore.refresh()
      gameDialog.value = false
      router.push({ name: 'GameManager', params: { gameId: selectedGameId.value } })
      return
    }

    if (gameForm.cover) {
      gameForm.cover = await downloadCover(gameForm.cover, gameForm.name)
    }

    const result = await window.api.gameApi.create({
      name: gameForm.name,
      name_zh_cn: gameForm.name_zh_cn,
      mod_root_path: gameForm.mod_root_path,
      cover: gameForm.cover
    })

    await gameStore.refresh()
    gameDialog.value = false

    router.push({
      name: 'GameManager',
      params: {
        gameId: result.id
      }
    })
  } catch (error) {
    formError.value = error instanceof Error ? error.message : t('games.imageDownloadFailed')
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  if (!gameStore.getState().loaded) {
    await gameStore.load()
  }
  handleResizeEvent()
  window.addEventListener('resize', handleResizeEvent)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResizeEvent)
  if (_resizeTimer) {
    clearTimeout(_resizeTimer)
    _resizeTimer = null
  }
})
</script>

<template>
  <v-navigation-drawer
    v-model="drawer"
    :width="currentWidth"
    :mini-variant="!isExpanded"
    :mini-variant-width="config.collapsedWidth"
    :permanent="true"
    :class="{ 'icon-only': !isExpanded }"
  >
    <v-list nav class="h-full flex flex-col">
      <v-list-item v-if="config.showHeader" class="pb-3 flex items-center gap-3 min-h-14">
        <template #prepend>
          <v-btn icon size="small" @click="toggleMenu">
            <v-icon icon="mdi-menu" />
          </v-btn>
        </template>
        <v-list-item-title v-if="isExpanded" key="title"> 主页 </v-list-item-title>
      </v-list-item>

      <v-divider class="pt-3" />

      <div class="flex flex-col gap-2">
        <v-list-item
          v-for="game in games"
          :key="game.id"
          class="menu-item cursor-pointer"
          variant="plain"
          density="compact"
          color="primary"
          @click="openGame(game)"
        >
          <template #prepend>
            <div
              class="flex items-center w-full"
              :class="[isExpanded ? 'gap-3' : 'justify-center']"
            >
              <v-avatar size="34" rounded="0">
                <v-img v-if="game.cover" :src="game.cover" cover />
                <v-icon v-else size="large">mdi-gamepad-variant</v-icon>
              </v-avatar>

              <transition name="fade" :duration="config.transitionDuration">
                <div v-if="isExpanded" key="game-item" class="min-w-0 flex-1">
                  <v-list-item-title>{{ getGameName(game) }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ game.mod_root_path ? '已配置' : '未配置' }}
                  </v-list-item-subtitle>
                </div>
              </transition>
            </div>
          </template>
        </v-list-item>

        <v-list-item
          class="menu-item cursor-pointer"
          variant="plain"
          density="compact"
          @click="openCustomGame"
        >
          <template #prepend>
            <div
              class="flex items-center w-full"
              :class="[isExpanded ? 'gap-3' : 'justify-center']"
            >
              <v-icon size="large">mdi-plus-circle-outline</v-icon>

              <transition name="fade" :duration="config.transitionDuration">
                <v-list-item-title v-if="isExpanded" key="add-game">添加游戏</v-list-item-title>
              </transition>
            </div>
          </template>
        </v-list-item>
      </div>

      <v-dialog v-model="gameDialog" max-width="680">
        <v-card>
          <v-card-title class="flex items-center gap-2">
            {{ !gameForm.id ? '添加游戏' : '配置游戏信息' }}
          </v-card-title>

          <v-card-text>
            <div class="grid gap-4">
              <div v-if="!isDefaultSelected" class="flex items-center gap-4">
                <v-avatar rounded="0" size="96">
                  <v-img v-if="gameForm.cover" :src="gameForm.cover" cover />
                  <v-icon v-else size="42">mdi-image-plus</v-icon>
                </v-avatar>

                <div class="grid flex-1 gap-3">
                  <v-text-field
                    v-model="gameForm.cover"
                    :label="'图片URL'"
                    density="compact"
                    hide-details
                  />

                  <v-text-field
                    v-model="gameForm.cover"
                    :label="'本地图片'"
                    density="compact"
                    hide-details
                  >
                    <template #append-inner>
                      <v-btn
                        icon="mdi-image-outline"
                        size="small"
                        variant="text"
                        @click="chooseCover"
                      />
                    </template>
                  </v-text-field>
                </div>
              </div>

              <div v-if="!isDefaultSelected" class="grid gap-3 md:grid-cols-2">
                <v-text-field
                  v-model="gameForm.name_zh_cn"
                  :label="'游戏名称-中文'"
                  density="compact"
                />
                <v-text-field v-model="gameForm.name" :label="'游戏名称-英文'" density="compact" />
              </div>

              <v-text-field
                v-model="gameForm.mod_root_path"
                :label="'mod存放目录'"
                density="compact"
                required
              >
                <template #append-inner>
                  <v-btn
                    icon="mdi-folder-open-outline"
                    size="small"
                    variant="text"
                    @click="chooseModPath"
                  />
                </template>
              </v-text-field>

              <v-alert v-if="formError" type="error" variant="tonal" density="compact">
                {{ formError }}
              </v-alert>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="gameDialog = false"> 取消 </v-btn>
            <v-btn color="primary" :loading="isSaving" @click="saveGame"> 保存 </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-spacer />
      <v-divider class="my-2" />

      <v-list-item :to="'/settings'" link>
        <template #prepend>
          <v-icon size="large">mdi-cog</v-icon>
        </template>

        <transition name="fade" :duration="config.transitionDuration">
          <v-list-item-title v-if="isExpanded" key="settings"> 设置 </v-list-item-title>
        </transition>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
.icon-only .v-list-item-title,
.icon-only .v-list-item-subtitle {
  opacity: 0;
  width: 0 !important;
  max-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  display: none;
}

.icon-only .menu-item > * {
  justify-content: center !important;
}

.v-list-item-title,
.v-list-item-subtitle {
  transition: opacity 120ms linear;
}
</style>
