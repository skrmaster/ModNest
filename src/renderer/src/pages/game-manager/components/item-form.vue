<template>
  <v-dialog v-model="itemDialog" max-width="560">
    <v-card>
      <v-card-title> 编辑 </v-card-title>
      <v-card-text>
        <div class="grid gap-3">
          <div>
            <v-img
              v-if="showImageCover"
              :src="showImageCover"
              height="180"
              contain
              class="rounded-md"
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

            <div v-else class="text-center pa-4 bg-grey-lighten-2 rounded-md">
              <v-icon :size="60" class="text-grey-darken-2">mdi-panorama-variant-outline</v-icon>
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <v-text-field
              v-model="itemForm.name_zh_cn"
              required
              label="中文名"
              density="compact"
              :error-messages="nameZhError ? [nameZhError] : []"
            />
            <v-text-field
              v-model="itemForm.name"
              required
              label="英文名"
              density="compact"
              :error-messages="nameError ? [nameError] : []"
            />
          </div>

          <div class="flex gap-2">
            <v-radio-group v-model="imageType" class="d-flex flex-col gap-4 w-full">
              <div class="d-flex flex-col gap-2">
                <v-radio value="one" label="网络图片"></v-radio>
                <div class="d-flex gap-2 align-start">
                  <v-text-field
                    v-model="coverUrl"
                    :disabled="imageType !== 'one' || isDownloading"
                    label="图片链接"
                    density="compact"
                    class="flex-1"
                    :error-messages="coverUrlError ? [coverUrlError] : []"
                  />
                  <v-btn
                    color="primary"
                    :disabled="imageType !== 'one' || !coverUrl || isDownloading"
                    class="mt-3"
                    @click="downloadCover"
                  >
                    <v-progress-circular
                      v-if="isDownloading"
                      indeterminate
                      size="16"
                      color="white"
                      class="mr-1"
                    />
                    {{ isDownloading ? '下载中...' : '下载' }}
                  </v-btn>
                </div>
              </div>

              <div class="d-flex flex-col gap-2">
                <v-radio value="two" label="本地图片"></v-radio>
                <v-file-input
                  v-model="localFile"
                  :disabled="imageType !== 'two'"
                  prepend-icon=""
                  label="选择图片"
                  accept="image/*"
                  density="compact"
                  :error-messages="localFileError ? [localFileError] : []"
                  @update:model-value="selectLocalCover"
                />
              </div>
            </v-radio-group>
          </div>

          <v-alert
            v-if="formErrorMessage"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            {{ formErrorMessage }}
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">关闭</v-btn>
        <v-btn variant="flat" color="primary" :disabled="isDownloading" @click="saveItem">
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { CreateItemDto } from '@shared/dto/item'
import { reactive, ref } from 'vue'

const itemDialog = ref(false)
const imageType = ref('one')
const coverUrl = ref('')
const localFile = ref(null)
const showImageCover = ref('')
const isDownloading = ref(false)

const itemForm = reactive<CreateItemDto>({
  name: '',
  name_zh_cn: '',
  cover: null,
  mod_count: 0,
  game_id: ''
})

const formErrorMessage = ref('')
const nameZhError = ref('')
const nameError = ref('')
const coverUrlError = ref('')
const localFileError = ref('')

const clearErrors = () => {
  formErrorMessage.value = ''
  nameZhError.value = ''
  nameError.value = ''
  coverUrlError.value = ''
  localFileError.value = ''
}

const resetForm = () => {
  imageType.value = 'one'
  coverUrl.value = ''
  localFile.value = null
  showImageCover.value = ''
  isDownloading.value = false

  itemForm.name = ''
  itemForm.name_zh_cn = ''
  itemForm.cover = null
  itemForm.game_id = ''

  clearErrors()
}

const closeDialog = () => {
  itemDialog.value = false
  setTimeout(() => {
    resetForm()
  }, 300)
}

const downloadCover = async () => {
  clearErrors()
  if (!coverUrl.value) {
    coverUrlError.value = '请输入图片链接'
    return
  }

  try {
    isDownloading.value = true
    const fileName = await window.api.fileApi.downloadImage(coverUrl.value)
    const coverPath = `app-image://user-images/${fileName}`

    showImageCover.value = coverPath
    itemForm.cover = coverPath
  } catch (err) {
    formErrorMessage.value = `图片下载失败：${err}`
  } finally {
    isDownloading.value = false
  }
}

const selectLocalCover = (file) => {
  clearErrors()
  if (!file) return
  showImageCover.value = URL.createObjectURL(file)
}

const validateForm = (): boolean => {
  clearErrors()
  let valid = true

  const zh = itemForm.name_zh_cn?.trim()
  if (!zh) {
    nameZhError.value = '中文名不能为空'
    valid = false
  }

  const en = itemForm.name?.trim()
  if (!en) {
    nameError.value = '英文名不能为空'
    valid = false
  }

  if (imageType.value === 'one') {
    if (!itemForm.cover) {
      formErrorMessage.value = '请下载网络图片'
      valid = false
    }
  } else if (imageType.value === 'two') {
    if (!itemForm.cover && !localFile.value) {
      formErrorMessage.value = '请选择本地图片'
      valid = false
    }
  }

  return valid
}

const saveItem = async (): Promise<void> => {
  if (!validateForm()) return

  itemForm.name_zh_cn = itemForm.name_zh_cn.trim()
  itemForm.name = itemForm.name.trim()

  itemDialog.value = false
}

function openModal() {
  resetForm()
  itemDialog.value = true
}

defineExpose({
  openModal
})
</script>

<style scoped></style>
