<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { UserGame } from '@shared/entities/game'
import { gameStore } from '@renderer/stores/game-store'

const route = useRoute()
const router = useRouter()

const game = ref<UserGame | undefined>()
const modPath = ref('')
const saving = ref(false)
const error = ref('')

async function loadGame(gameIdParam: unknown): Promise<void> {
  const gameId = gameIdParam
  game.value = gameStore.getById(gameId as string)

  if (!game.value) {
    router.push('/')
    return
  }

  modPath.value = game.value.mod_root_path ?? ''
}

onMounted(() => {
  loadGame(route.params.gameId)
})

watch(
  () => route.params.gameId,
  (gameId) => {
    error.value = ''
    loadGame(gameId)
  }
)

async function chooseModPath(): Promise<void> {
  const selectedPath = await window.api.fileApi.selectDirectory()

  if (selectedPath) {
    modPath.value = selectedPath
  }
}

async function save(): Promise<void> {
  if (!game.value) return

  error.value = ''
  saving.value = true

  try {
    const nextPath = modPath.value.trim()

    if (!nextPath) {
      error.value = '请先配置 Mod 路径'
      return
    }

    await window.api.gameApi.update(game.value.id, { mod_root_path: nextPath })
    await window.api.itemApi.checkMod(game.value.id)
    gameStore.refresh()
    router.push({ name: 'GameManager', params: { gameId: game.value.id } })
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="h-full p-6">
    <div class="mx-auto grid max-w-xl gap-5">
      <div>
        <h2 class="text-2xl font-medium">配置</h2>
        <p class="mt-1 text-body-2 opacity-70">默认游戏只需要配置 Mod 路径</p>
      </div>

      <v-card v-if="game" variant="outlined">
        <v-card-text class="grid gap-4">
          <div class="flex items-center gap-2">
            <v-avatar rounded="0" size="40">
              <v-img v-if="game.cover" :src="game.cover" cover />
            </v-avatar>
            <div>
              <div class="text-subtitle-1">{{ game.name_zh_cn || game.name }}</div>
              <div class="text-body-2 opacity-70">{{ game.name }}</div>
            </div>
          </div>

          <v-text-field v-model="modPath" label="Mod 路径" density="compact">
            <template #append-inner>
              <v-btn
                icon="mdi-folder-open-outline"
                size="small"
                variant="text"
                @click="chooseModPath"
              />
            </template>
          </v-text-field>

          <v-alert v-if="error" type="error" variant="tonal" density="compact">
            {{ error }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" :loading="saving" @click="save">保存并进入管理页</v-btn>
        </v-card-actions>
      </v-card>

      <div v-else class="text-body-2 opacity-70">正在加载...</div>
    </div>
  </div>
</template>
