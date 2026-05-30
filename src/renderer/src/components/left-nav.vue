<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { GameConfig } from '@shared/types/settings'

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
  showHeader: true,
  transitionDuration: 300,
  ...props.config
}))

const defaultGames: GameConfig[] = [
  {
    id: 'genshin-impact',
    nameZh: '原神',
    nameEn: 'Genshin Impact',
    modPath: '',
    image: '',
    imageUrl: '',
    isDefault: true
  },
  {
    id: 'zenless-zone-zero',
    nameZh: '绝区零',
    nameEn: 'Zenless Zone Zero',
    modPath: '',
    image: '',
    imageUrl: '',
    isDefault: true
  }
]

const legacyDefaultIds = new Set(['cyberpunk-2077', 'baldurs-gate-3'])

const { locale, t } = useI18n()
const router = useRouter()

const isExpanded = ref(true)
const drawer = ref(true)
const gameDialog = ref(false)
const games = ref<GameConfig[]>([])
const selectedGameId = ref<string>()
const isSaving = ref(false)
const formError = ref('')
const gameForm = reactive<GameConfig>({
  id: '',
  nameZh: '',
  nameEn: '',
  modPath: '',
  image: '',
  imageUrl: '',
  isDefault: false
})

const currentWidth = computed(() =>
  isExpanded.value ? config.value.expandedWidth : config.value.collapsedWidth
)

const selectedGame = computed(() => games.value.find((game) => game.id === selectedGameId.value))

const toggleMenu = (): void => {
  isExpanded.value = !isExpanded.value
}

const getGameName = (game: GameConfig): string => {
  return locale.value === 'zh-CN' ? game.nameZh || game.nameEn : game.nameEn || game.nameZh
}

const normalizeGameImage = (image: string): string => {
  if (!image.startsWith('file:///')) {
    return image
  }

  const normalizedImage = image.replace(/\\/g, '/')
  const marker = '/game-images/'
  const fileName = normalizedImage.slice(normalizedImage.lastIndexOf(marker) + marker.length)

  return fileName && normalizedImage.includes(marker)
    ? `app-image://cache/${encodeURIComponent(fileName)}`
    : image
}

const getStoredGames = async (): Promise<GameConfig[]> => {
  const storedGames = await window.settingsApi.get<GameConfig[]>('gameConfigs')

  if (!Array.isArray(storedGames) || storedGames.length === 0) {
    return defaultGames
  }

  const storedById = new Map(storedGames.map((game) => [game.id, game]))
  const mergedDefaults = defaultGames.map((game) => ({
    ...game,
    ...storedById.get(game.id),
    isDefault: true
  }))
  const customGames = storedGames.filter(
    (game) =>
      !defaultGames.some((defaultGame) => defaultGame.id === game.id) &&
      !legacyDefaultIds.has(game.id)
  )

  return [...mergedDefaults, ...customGames].map((game) => ({
    ...game,
    image: normalizeGameImage(game.image)
  }))
}

const persistGames = async (): Promise<void> => {
  const plainGames = games.value.map((game) => ({
    id: game.id,
    nameZh: game.nameZh,
    nameEn: game.nameEn,
    modPath: game.modPath,
    image: game.image,
    imageUrl: game.imageUrl ?? '',
    isDefault: game.isDefault
  }))

  await window.settingsApi.set('gameConfigs', plainGames)
}

const openGameConfig = (game: GameConfig): void => {
  selectedGameId.value = game.id
  formError.value = ''
  Object.assign(gameForm, {
    ...game,
    imageUrl: game.imageUrl ?? ''
  })
  gameDialog.value = true
}

const openGame = (game: GameConfig): void => {
  if (!game.modPath) {
    openGameConfig(game)
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
  const customId = `custom-${Date.now()}`

  selectedGameId.value = customId
  formError.value = ''
  Object.assign(gameForm, {
    id: customId,
    nameZh: '',
    nameEn: '',
    modPath: '',
    image: '',
    imageUrl: '',
    isDefault: false
  })
  gameDialog.value = true
}

const chooseModPath = async (): Promise<void> => {
  const selectedPath = await window.fileApi.selectDirectory()

  if (selectedPath) {
    gameForm.modPath = selectedPath
  }
}

const chooseGameImage = async (): Promise<void> => {
  const selectedPath = await window.fileApi.selectImage()

  if (selectedPath) {
    gameForm.image = `file:///${selectedPath.replace(/\\/g, '/')}`
  }
}

const downloadGameImage = async (): Promise<string> => {
  if (!gameForm.imageUrl) {
    return gameForm.image
  }

  try {
    if (typeof window.fileApi.downloadImage === 'function') {
      return await window.fileApi.downloadImage(gameForm.imageUrl, gameForm.id)
    }

    const invoke = window.electron?.ipcRenderer?.invoke

    if (typeof invoke === 'function') {
      return await invoke('download-image', { url: gameForm.imageUrl, gameId: gameForm.id })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes('No handler registered')) {
      throw error
    }
  }

  return gameForm.imageUrl
}

const saveGame = async (): Promise<void> => {
  formError.value = ''
  gameForm.nameZh = gameForm.nameZh.trim()
  gameForm.nameEn = gameForm.nameEn.trim()
  gameForm.modPath = gameForm.modPath.trim()
  gameForm.image = gameForm.image.trim()
  gameForm.imageUrl = gameForm.imageUrl?.trim() ?? ''

  if (!gameForm.nameZh || !gameForm.nameEn || !gameForm.modPath) {
    formError.value = t('games.requiredError')
    return
  }

  isSaving.value = true

  try {
    if (gameForm.imageUrl) {
      gameForm.image = await downloadGameImage()
    }

    const savedGame = { ...gameForm }
    const existingIndex = games.value.findIndex((game) => game.id === savedGame.id)

    if (existingIndex >= 0) {
      games.value[existingIndex] = savedGame
    } else {
      games.value.push(savedGame)
    }

    await persistGames()
    gameDialog.value = false

    router.push({
      name: 'GameManager',
      params: {
        gameId: savedGame.id
      }
    })
  } catch (error) {
    formError.value = error instanceof Error ? error.message : t('games.imageDownloadFailed')
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  games.value = await getStoredGames()
  await persistGames()
})
</script>

<template>
  <div class="shrink-0">
    <v-navigation-drawer v-model="drawer" :width="currentWidth">
      <v-list nav class="h-full flex flex-col">
        <v-list-item v-if="config.showHeader" class="py-5 flex items-center gap-3 min-h-14">
          <template #prepend>
            <v-btn icon size="small" @click="toggleMenu">
              <v-icon icon="mdi-menu" />
            </v-btn>
          </template>

          <transition name="fade" :duration="config.transitionDuration">
            <v-list-item-title v-if="isExpanded" key="title">
              {{ t('nav.headerTitle') }}
            </v-list-item-title>
          </transition>
        </v-list-item>

        <v-divider />

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
                  <v-img v-if="game.image" :src="game.image" cover />
                  <v-icon v-else size="large">mdi-gamepad-variant</v-icon>
                </v-avatar>

                <transition name="fade" :duration="config.transitionDuration">
                  <div v-if="isExpanded" key="game-item" class="min-w-0 flex-1">
                    <v-list-item-title>{{ getGameName(game) }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ game.modPath ? t('games.configured') : t('games.notConfigured') }}
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
                  <v-list-item-title v-if="isExpanded" key="add-game">
                    {{ t('games.addGame') }}
                  </v-list-item-title>
                </transition>
              </div>
            </template>
          </v-list-item>
        </div>

        <v-dialog v-model="gameDialog" max-width="680">
          <v-card>
            <v-card-title class="flex items-center gap-2">
              <v-icon icon="mdi-gamepad-variant" />
              {{ selectedGame ? getGameName(selectedGame) : t('games.customGame') }}
            </v-card-title>

            <v-card-text>
              <div class="grid gap-4">
                <div class="flex items-center gap-4">
                  <v-avatar rounded="0" size="96">
                    <v-img v-if="gameForm.image" :src="gameForm.image" cover />
                    <v-icon v-else size="42">mdi-image-plus</v-icon>
                  </v-avatar>

                  <div class="grid flex-1 gap-3">
                    <v-text-field
                      v-model="gameForm.imageUrl"
                      :label="t('games.imageUrl')"
                      density="compact"
                      hide-details
                    />

                    <v-text-field
                      v-model="gameForm.image"
                      :label="t('games.localImage')"
                      density="compact"
                      hide-details
                    >
                      <template #append-inner>
                        <v-btn
                          icon="mdi-image-outline"
                          size="small"
                          variant="text"
                          @click="chooseGameImage"
                        />
                      </template>
                    </v-text-field>
                  </div>
                </div>

                <div class="grid gap-3 md:grid-cols-2">
                  <v-text-field
                    v-model="gameForm.nameZh"
                    :label="t('games.nameZh')"
                    density="compact"
                  />
                  <v-text-field
                    v-model="gameForm.nameEn"
                    :label="t('games.nameEn')"
                    density="compact"
                  />
                </div>

                <v-text-field
                  v-model="gameForm.modPath"
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
              <v-btn variant="text" @click="gameDialog = false">
                {{ t('games.close') }}
              </v-btn>
              <v-btn color="primary" :loading="isSaving" @click="saveGame">
                {{ t('games.save') }}
              </v-btn>
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
            <v-list-item-title v-if="isExpanded" key="settings">
              {{ t('nav.settings') }}
            </v-list-item-title>
          </transition>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<style scoped></style>
