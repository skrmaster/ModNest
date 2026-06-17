<template>
  <v-dialog v-model="showDialog" max-width="800" persistent>
    <div class="h-[80vh] flex flex-col justify-center-safe">
      <com-scroll
        class="p-2"
        :class="[
          {
            'flex flex-col justify-center-safe': data?.length === 1
          }
        ]"
      >
        <v-card v-for="(e, i) in data" :key="i" class="w-full my-2">
          <v-card-text>
            <v-row no-gutters>
              <v-col cols="12" md="6" class="d-flex justify-center align-center">
                <div class="w-50">
                  <v-img
                    v-if="e.previewImage"
                    :src="e.previewImage"
                    :alt="t('gameManager.categories.modInspect.previewAlt')"
                    aspect-ratio="16/9"
                    max-width="200"
                    contain
                    class="rounded-lg shadow-sm border mx-auto"
                  />
                  <div v-else class="text-center py-10 text-medium-emphasis">
                    {{ t('gameManager.noPreview') }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-alert class="mb-4">
                  {{
                    e.exists
                      ? t('gameManager.categories.modInspect.existsTitle')
                      : t('gameManager.categories.modInspect.previewTitle')
                  }}
                </v-alert>
                <v-alert class="mb-4">
                  <template #title>
                    <p class="text-[12px]">
                      {{ t('gameManager.categories.modInspect.createdAtLabel') }}
                    </p>
                  </template>
                  {{ e.createdAt }}
                </v-alert>
                <v-form class="d-flex flex-column gap-4">
                  <v-text-field
                    v-model="e.modName"
                    :label="t('gameManager.categories.modInspect.modNameLabel')"
                    :placeholder="t('gameManager.categories.modInspect.modNamePlaceholder')"
                    variant="outlined"
                    required
                  />

                  <v-alert
                    v-if="e.exists"
                    color="warning"
                    border="start"
                    icon="mdi-alert"
                    class="mt-2"
                  >
                    {{ t('gameManager.categories.modInspect.existsWarning') }}
                  </v-alert>
                </v-form>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions class="px-6 pb-6 justify-end gap-2">
            <v-btn v-if="data?.length && data?.length > 1" color="red" @click="handleDelete(i)">{{
              t('common.delete')
            }}</v-btn>
            <v-btn v-else @click="handleCancel">{{ t('common.cancel') }}</v-btn>
            <v-btn v-if="!e.exists" color="primary" @click="handleInstall">{{
              t('gameManager.categories.modInspect.install')
            }}</v-btn>

            <v-btn v-else color="warning" @click="handleOverrideInstall">
              {{ t('gameManager.categories.modInspect.overrideInstall') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </com-scroll>
    </div>
    <div v-if="data?.length && data?.length > 1" class="mt-2 flex justify-end-safe gap-4 px-2">
      <v-btn @click="handleCancel">{{ t('common.cancel') }}</v-btn>
      <v-btn v-if="!hasExistsMod" color="primary" @click="handleInstallAll">{{
        t('common.allInstall')
      }}</v-btn>
      <v-btn v-else color="warning" @click="handleOverrideInstallAll">{{
        t('common.allCoverInstall')
      }}</v-btn>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { ModPreviewData } from '@shared/types/mod'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import comScroll from '@renderer/components/com-scroll.vue'
import dayjs from 'dayjs'
const { t } = useI18n()

const showDialog = ref(false)
const data = ref<ModPreviewData[]>()
const hasExistsMod = computed(() => {
  return data.value?.some((e) => e.exists)
})

const emit = defineEmits<{
  cancel: []
  install: [data?: ModPreviewData[]]
  overrideInstall: [data?: ModPreviewData[]]
  installAll: [data?: ModPreviewData[]]
  overrideInstallAll: [data?: ModPreviewData[]]
}>()

function openModal(info: ModPreviewData[]) {
  data.value = info
    .map((e) => {
      return {
        ...e,
        createdAt: dayjs(e.createdAt).format('YYYY-MM-DD HH:mm:ss')
      }
    })
    .sort((a, b) => {
      const aI = a.previewImage ? 1 : 0
      const bI = b.previewImage ? 1 : 0

      return bI - aI
    })
  showDialog.value = true
}

function handleDelete(i: number) {
  data.value?.splice(i, 1)
}

const handleCancel = () => {
  emit('cancel')
  showDialog.value = false
}

const handleInstall = () => {
  emit('install', data.value)
  showDialog.value = false
}

const handleOverrideInstall = () => {
  emit('overrideInstall', data.value)
  showDialog.value = false
}

function handleInstallAll() {
  emit('installAll', data.value)
  showDialog.value = false
}

function handleOverrideInstallAll() {
  emit('overrideInstallAll', data.value)
  showDialog.value = false
}

defineExpose({
  openModal
})
</script>

<style scoped></style>
