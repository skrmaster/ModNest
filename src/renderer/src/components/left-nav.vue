<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useGameCover } from '@renderer/composables/useGameCover'
import { gameStore } from '@renderer/stores/game-store'
import type { UserGame } from '@shared/entities/game'
import type { CreateGameDto } from '@shared/dto/game'
import { getUserImageUrl } from '@shared/utils/url'
import comScroll from './com-scroll.vue'

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
const deleteDialog = ref(false)
const deleteTarget = ref<ListItem | null>(null)
const deleteLoading = ref(false)
const deleteError = ref('')
const games = computed(() => gameStore.getState().items)
const selectedGameId = ref<string>()
const isSaving = ref(false)
const formError = ref('')
const gameForm = reactive<CreateGameDto>({
  name: '',
  name_zh_cn: '',
  mod_root_path: '',
  cover: '',
  is_custom: 1
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
  gameCoverUrl.value = ''
  showGameCover.value = ''
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

const { selectCover, downloadCover: downloadGameCover } = useGameCover()
const gameCoverUrl = ref('')
const isDownloadingCover = ref(false)
const showGameCover = ref('')

const chooseGameCover = async (): Promise<void> => {
  const localUrl = await selectCover()
  if (localUrl) {
    const fileName = await downloadGameCover(localUrl, gameForm.name || 'game')
    gameCoverUrl.value = fileName
    gameForm.cover = fileName
    showGameCover.value = fileName
  }
}

const downloadGameCoverImage = async (): Promise<void> => {
  if (!gameCoverUrl.value) {
    return
  }

  try {
    isDownloadingCover.value = true
    const fileName = await downloadGameCover(gameCoverUrl.value, gameForm.name || 'game')

    gameForm.cover = fileName
    showGameCover.value = getUserImageUrl(fileName)
  } finally {
    isDownloadingCover.value = false
  }
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
      gameForm.cover = gameForm.cover?.trim()
    }

    const result = await window.api.gameApi.create({
      name: gameForm.name,
      name_zh_cn: gameForm.name_zh_cn,
      mod_root_path: gameForm.mod_root_path,
      cover: gameForm.cover,
      is_custom: 1
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

const openDeleteGame = (game: ListItem): void => {
  if (isDefaultGame(game.id)) {
    return
  }

  deleteError.value = ''
  deleteTarget.value = game
  deleteDialog.value = true
}

const confirmDeleteGame = async (): Promise<void> => {
  if (!deleteTarget.value) return

  deleteError.value = ''
  deleteLoading.value = true

  try {
    await window.api.gameApi.remove(deleteTarget.value.id)
    await gameStore.refresh()
    deleteDialog.value = false
    const currentGameId = router.currentRoute.value.params.gameId
    if (currentGameId === deleteTarget.value.id) {
      router.push({ name: 'Home' })
    }
    deleteTarget.value = null
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : String(error)
  } finally {
    deleteLoading.value = false
  }
}

// const modSiteList = ref([
//   {
//     name: 'GameBanana',
//     href: 'https://gamebanana.com'
//   },
//   {
//     name: '미호요스킨모드 채널',
//     href: 'https://arca.live/b/genshinskinmode?category=%EC%A7%88%EB%AC%B8(%EB%AA%A8%EB%93%9C%EC%A0%9C%EC%9E%91)'
//   },
//   {
//     name: 'https://huihui168.org',
//     href: 'Hui站'
//   }
// ])

function gohome() {
  router.push('/')
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
      <v-list-item
        v-if="config.showHeader"
        class="pb-3 flex items-center gap-3 min-h-14"
        @click="gohome"
      >
        <template #prepend>
          <v-btn icon size="small" @click="toggleMenu">
            <v-icon icon="mdi-menu" />
          </v-btn>
        </template>
        <v-list-item-title v-if="isExpanded" key="title">{{ t('nav.home') }}</v-list-item-title>
      </v-list-item>

      <v-divider class="pt-3" />

      <div class="flex-1 min-h-0 overflow-hidden">
        <com-scroll>
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
                  :class="[isExpanded ? 'justify-between gap-3' : 'justify-center']"
                >
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <v-avatar size="34" rounded="0">
                      <v-img v-if="game.cover" :src="game.cover" cover />
                      <v-icon v-else size="large">mdi-gamepad-variant</v-icon>
                    </v-avatar>

                    <transition name="fade" :duration="config.transitionDuration">
                      <div v-if="isExpanded" key="game-item" class="min-w-0">
                        <v-list-item-title class="truncate">{{
                          getGameName(game)
                        }}</v-list-item-title>
                        <v-list-item-subtitle class="truncate">
                          {{
                            game.mod_root_path ? t('games.configured') : t('games.notConfigured')
                          }}
                        </v-list-item-subtitle>
                      </div>
                    </transition>
                  </div>
                </div>
              </template>
              <template #append>
                <div v-if="isExpanded && !isDefaultGame(game.id)" class="shrink-0">
                  <v-btn icon size="small" variant="text" @click.stop="openDeleteGame(game)">
                    <v-icon icon="mdi-delete-outline" />
                  </v-btn>
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
                    <v-list-item-title v-if="isExpanded" key="add-game">{{
                      t('games.addGame')
                    }}</v-list-item-title>
                  </transition>
                </div>
              </template>
            </v-list-item>
          </div>
        </com-scroll>
      </div>

      <v-divider class="my-2" />

      <v-list-item :to="'/settings'" link>
        <template #prepend>
          <v-icon size="large">mdi-cog</v-icon>
        </template>

        <transition name="fade" :duration="config.transitionDuration">
          <v-list-item-title v-if="isExpanded" key="settings">{{
            t('nav.settings')
          }}</v-list-item-title>
        </transition>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-dialog v-model="gameDialog" max-width="680">
    <v-card>
      <v-card-title class="flex items-center gap-2">
        {{ !gameForm.id ? t('games.addGame') : t('games.configureGame') }}
      </v-card-title>

      <v-card-text>
        <div class="grid gap-4">
          <div v-if="!isDefaultSelected">
            <div class="flex justify-center mb-4">
              <v-img
                v-if="showGameCover"
                :src="showGameCover"
                height="180"
                width="240"
                contain
                class="rounded-md cursor-pointer"
                @click="chooseGameCover"
              >
                <template #placeholder>
                  <div class="d-flex fill-height align-center justify-center bg-grey-lighten-2">
                    <v-progress-circular indeterminate size="20" />
                  </div>
                </template>
                <template #error>
                  <div class="d-flex fill-height align-center justify-center bg-grey-lighten-2">
                    <v-icon size="48" class="text-grey-darken-2">mdi-alert</v-icon>
                  </div>
                </template>
              </v-img>
              <div
                v-else
                class="text-center pa-4 bg-grey-lighten-2 rounded-md cursor-pointer w-60"
                @click="chooseGameCover"
              >
                <v-icon size="80" class="text-grey-darken-2">mdi-panorama-variant-outline</v-icon>
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <v-text-field
                v-model="gameForm.name_zh_cn"
                :label="t('games.nameZh')"
                density="compact"
              />
              <v-text-field v-model="gameForm.name" :label="t('games.nameEn')" density="compact" />
            </div>

            <div class="flex gap-2">
              <v-text-field
                v-model="gameCoverUrl"
                :label="t('games.imageUrl')"
                density="compact"
                class="flex-1"
                append-icon="mdi-paperclip"
                @click:append="chooseGameCover"
              />
              <v-btn variant="flat" class="mt-1" @click="downloadGameCoverImage">
                <v-progress-circular
                  v-if="isDownloadingCover"
                  indeterminate
                  size="16"
                  color="white"
                  class="mr-1"
                />
                {{ t('games.import') }}
              </v-btn>
            </div>
          </div>

          <v-text-field
            v-model="gameForm.mod_root_path"
            :label="t('games.modPath')"
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
        <v-btn variant="text" @click="gameDialog = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="primary" :loading="isSaving" @click="saveGame">{{ t('games.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="420">
    <v-card>
      <v-card-title>{{ t('common.warning') }}</v-card-title>

      <v-card-text>
        <div class="flex gap-2 items-center">
          <div>{{ t('games.deleteConfirm') }}</div>
          <div class="font-medium my-2">
            {{ deleteTarget?.name_zh_cn || deleteTarget?.name }}
          </div>
        </div>
        <div class="text-[16px] opacity-70">
          {{ t('games.deleteWarning') }}
        </div>
        <v-alert v-if="deleteError" type="error" variant="tonal" density="compact">
          {{ deleteError }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="error" :loading="deleteLoading" @click="confirmDeleteGame">{{
          t('common.delete')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
