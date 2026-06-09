<template>
  <v-dialog v-model="itemDialog" max-width="660">
    <v-card>
      <v-card-title> 新增一项 </v-card-title>
      <v-card-text>
        <div class="flex flex-col gap-3">
          <div class="flex justify-center">
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
              <v-icon :size="80" class="text-grey-darken-2">mdi-panorama-variant-outline</v-icon>
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

          <div class="flex">
            <v-radio-group v-model="imageType" class="d-flex flex-col w-full">
              <div class="d-flex flex-col">
                <v-radio value="one" label="网络图片"></v-radio>
                <div class="d-flex gap-2">
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
                    class="mt-1"
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

              <div class="d-flex flex-col">
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

          <div>
            <v-sheet class="mx-auto">
              <v-chip-group
                v-model="selectedCategoryIds"
                multiple
                show-arrows
                column
                active-class="primary"
                class="pa-2"
              >
                <v-chip
                  v-for="n in listCategory"
                  :key="n.id"
                  :value="n.id"
                  class="ma-1"
                  rounded
                  color="primary"
                >
                  {{ n.name_zh_cn }}
                </v-chip>
              </v-chip-group>
            </v-sheet>
          </div>

          <v-alert v-if="formErrorMessage" type="error" variant="tonal" density="compact">
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
import { useNotify } from '@renderer/composables/useNotify'
import { CreateItemDto } from '@shared/dto/item'
import { getUserImageUrl } from '@shared/utils/getPath'
import { computed, onMounted, reactive, ref, toRaw } from 'vue'
import { categoryStore } from '@renderer/stores/category-store'

const itemDialog = ref(false)
const imageType = ref('one')
const coverUrl = ref('')
const localFile = ref(null)
const showImageCover = ref('')
const isDownloading = ref(false)

const listCategory = computed(() => {
  return categoryStore.getState().items
})

const itemForm = reactive<CreateItemDto>({
  name: '',
  name_zh_cn: '',
  cover: null,
  mod_count: 0,
  game_id: '',
  is_custom: 0,
  mod_count_enable: 0,
  category_ids: []
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

const selectedCategoryIds = ref<string[]>([])

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
    itemForm.cover = await window.api.fileApi.downloadImage(coverUrl.value)

    showImageCover.value = itemForm.cover ? getUserImageUrl(itemForm.cover) : ''
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

const notify = useNotify()
const saveItem = async (): Promise<void> => {
  if (!validateForm() || !game_id) return

  const itemDto: CreateItemDto = {
    name: itemForm.name.trim(),
    name_zh_cn: itemForm.name_zh_cn.trim(),
    cover: itemForm.cover,
    mod_count: 0,
    game_id,
    is_custom: 1,
    mod_count_enable: 0,
    category_ids: toRaw(selectedCategoryIds.value)
  }

  const data: {
    changes: number
    lastInsertRowid: number | bigint
  } = await window.api.itemApi.create(itemDto)

  if (data.changes !== 0) {
    itemDialog.value = false
  } else {
    notify.error('添加失败')
  }
}

let game_id: string | undefined
function openModal(gameId?: string) {
  game_id = gameId
  resetForm()
  itemDialog.value = true
}

onMounted(async () => {
  if (!categoryStore.getState().loaded) {
    await categoryStore.load()
  }
})

defineExpose({
  openModal
})
</script>

<style scoped></style>
