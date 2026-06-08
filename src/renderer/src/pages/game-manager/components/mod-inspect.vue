<template>
  <v-dialog v-model="showDialog" max-width="800" persistent>
    <v-card>
      <v-card-title class="text-h5 font-weight-bold bg-primary text-white">
        {{ data.exists ? 'Mod 已存在 - 覆盖安装' : 'Mod 安装预览' }}
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row no-gutters>
          <v-col cols="12" md="6" class="d-flex justify-center align-center pa-4">
            <div class="preview-image-container">
              <v-img
                :src="previewImageUrl"
                alt="Mod 预览图"
                aspect-ratio="16/9"
                max-width="320"
                contain
                class="rounded-lg shadow-sm border"
              />
              <div v-if="!previewImageUrl" class="text-center py-10 text-medium-emphasis">
                无预览图
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="6" class="pa-4">
            <v-form class="d-flex flex-column gap-4">
              <v-text-field
                v-model="localForm.modName"
                label="Mod 名称"
                placeholder="请输入 Mod 名称"
                variant="outlined"
                required
              />

              <v-text-field
                v-model="localForm.createdAt"
                label="创建时间"
                placeholder="创建时间"
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
                该 Mod 已存在，覆盖安装会替换原有文件！
              </v-alert>
            </v-form>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="px-6 pb-6 justify-end gap-2">
        <v-btn color="grey" @click="handleCancel"> 取消 </v-btn>

        <v-btn v-if="!data.exists" color="primary" @click="handleInstall"> 安装 </v-btn>

        <v-btn v-if="data.exists" color="red-darken-1" @click="handleOverrideInstall">
          覆盖安装
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ModPreviewData } from '@shared/types/mod'
import { ref } from 'vue'

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
