<template>
  <v-dialog v-model="showDialog" max-width="800" persistent>
    <v-card>
      <v-card-title class="text-h5 font-weight-bold bg-primary text-white">
        {{
          data.exists
            ? t('gameManager.modInspect.existsTitle')
            : t('gameManager.modInspect.previewTitle')
        }}
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row no-gutters>
          <v-col cols="12" md="6" class="d-flex justify-center align-center pa-4">
            <div class="preview-image-container">
              <v-img
                :src="previewImageUrl"
                :alt="t('gameManager.modInspect.previewAlt')"
                aspect-ratio="16/9"
                max-width="320"
                contain
                class="rounded-lg shadow-sm border"
              />
              <div v-if="!previewImageUrl" class="text-center py-10 text-medium-emphasis">
                {{ t('gameManager.noPreview') }}
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="6" class="pa-4">
            <v-form class="d-flex flex-column gap-4">
              <v-text-field
                v-model="localForm.modName"
                :label="t('gameManager.modInspect.modNameLabel')"
                :placeholder="t('gameManager.modInspect.modNamePlaceholder')"
                variant="outlined"
                required
              />

              <v-text-field
                v-model="localForm.createdAt"
                :label="t('gameManager.modInspect.createdAtLabel')"
                :placeholder="t('gameManager.modInspect.createdAtPlaceholder')"
                variant="outlined"
                readonly
                color="default"
              />

              <v-alert
                v-if="data.exists"
                color="warning"
                border="start"
                icon="mdi-alert"
                class="mt-2"
              >
                {{ t('gameManager.modInspect.existsWarning') }}
              </v-alert>
            </v-form>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="px-6 pb-6 justify-end gap-2">
        <v-btn color="grey" @click="handleCancel">{{ t('common.cancel') }}</v-btn>

        <v-btn v-if="!data.exists" color="primary" @click="handleInstall">{{
          t('gameManager.modInspect.install')
        }}</v-btn>

        <v-btn v-if="data.exists" color="red-darken-1" @click="handleOverrideInstall">
          {{ t('gameManager.modInspect.overrideInstall') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ModPreviewData } from '@shared/types/mod'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const showDialog = ref(false)
const data = ref<ModPreviewData>({} as ModPreviewData)
const previewImageUrl = ref('')

const localForm = ref<Partial<ModPreviewData>>({
  modName: '',
  createdAt: ''
})

const emit = defineEmits<{
  cancel: []
  install: [form: Partial<ModPreviewData>, data: ModPreviewData]
  overrideInstall: [form: Partial<ModPreviewData>, data: ModPreviewData]
}>()

function openModal(info: ModPreviewData, preview = '') {
  data.value = info
  previewImageUrl.value = preview

  localForm.value.modName = info.modName
  localForm.value.createdAt = info.createdAt

  showDialog.value = true
}

const handleCancel = () => {
  emit('cancel')
  showDialog.value = false
}

const handleInstall = () => {
  emit('install', localForm.value, data.value)
  showDialog.value = false
}

const handleOverrideInstall = () => {
  emit('overrideInstall', localForm.value, data.value)
  showDialog.value = false
}

defineExpose({
  openModal
})
</script>

<style scoped>
.preview-image-container {
  width: 100%;
  max-width: 320px;
}
</style>
