<template>
  <v-card-text>
    <div class="flex flex-col gap-3">
      <div class="flex justify-center">
        <v-img
          v-if="showImageCover"
          :src="showImageCover"
          height="180"
          contain
          class="rounded-md"
          @click="chooseFile"
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
      <div
        :class="[
          {
            'grid gap-3 md:grid-cols-2': propUseMode !== 'inline',
            'flex flex-col gap-3': propUseMode === 'inline'
          }
        ]"
      >
        <v-text-field
          v-model="itemForm.name_zh_cn"
          required
          :label="t('gameManager.nameZh')"
          density="compact"
          :error-messages="nameZhError ? [nameZhError] : []"
        />
        <v-text-field
          v-model="itemForm.name"
          required
          :label="t('gameManager.nameEn')"
          density="compact"
          :error-messages="nameError ? [nameError] : []"
        />
      </div>

      <div class="flex gap-2">
        <v-text-field
          v-model="coverUrl"
          :label="t('gameManager.imageUrl')"
          density="compact"
          class="flex-1"
          append-icon="mdi-paperclip"
          :error-messages="coverUrlError ? [coverUrlError] : []"
          @click:append="chooseFile"
        />
        <v-btn variant="flat" class="mt-1" @click="downloadCover">
          <v-progress-circular
            v-if="isDownloading"
            indeterminate
            size="16"
            color="white"
            class="mr-1"
          />
          {{ t('games.import') }}
        </v-btn>
      </div>

      <div>
        <v-sheet class="mx-auto">
          <v-chip-group
            v-model="selectedCategoryIds"
            multiple
            show-arrows
            column
            required
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
              {{ language === 'zh-CN' ? n.name_zh_cn || n.name : n.name || n.name_zh_cn }}
            </v-chip>
          </v-chip-group>
        </v-sheet>
      </div>

      <com-scroll>
        <elements-genshin
          v-if="gameId == '1'"
          :value="secondaryCategoryId"
          @select="handleCategoryAdd"
        ></elements-genshin>
        <elements-ZZZ
          v-else-if="gameId == '2'"
          :value="secondaryCategoryId"
          @select="handleCategoryAdd"
        ></elements-ZZZ>
      </com-scroll>

      <v-alert v-if="formErrorMessage" type="error" variant="tonal" density="compact">
        {{ formErrorMessage }}
      </v-alert>
    </div>
  </v-card-text>

  <v-card-actions>
    <v-spacer />
    <v-btn v-if="propUseMode !== 'inline'" @click="closeDialog">{{ t('common.close') }}</v-btn>
    <v-btn
      variant="flat"
      color="primary"
      :loading="saveItemInfoLoading"
      :disabled="isDownloading"
      @click="saveItem"
    >
      {{ t('common.save') }}
    </v-btn>
  </v-card-actions>
</template>

<script setup lang="ts">
import { useNotify } from '@renderer/composables/useNotify'
import { useAppSettings } from '@renderer/composables/useAppSettings'
import { CreateItemDto, GameItemRow, ItemDto, UpdateItemDto } from '@shared/dto/item'
import { extractImageFileName, getUserImageUrl } from '@shared/utils/url'
import { computed, onMounted, reactive, ref, toRaw, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { language } = useAppSettings()
import { categoryStore } from '@renderer/stores/category-store'
import { UseMode } from '@shared/types/formContent'
import ElementsGenshin from '@renderer/components/elements-genshin.vue'
import ElementsZZZ from '@renderer/components/elements-zzz.vue'
import comScroll from '@renderer/components/com-scroll.vue'
import { Category } from '@shared/entities/category'
import { gameImageMap } from '@shared/enums'

type Prop = {
  useMode?: UseMode
  gameId: string
}

const props = withDefaults(defineProps<Prop>(), {
  useMode: 'dialog'
})

const propUseMode = toRef(() => props.useMode)

const itemDialog = ref(false)
const coverUrl = ref('')
const localFile = ref(null)
const showImageCover = ref('')
const isDownloading = ref(false)

const listCategory = computed(() => {
  return categoryStore.getState().items.filter((e) => e.level === 0)
})

const itemForm = reactive<CreateItemDto | ItemDto>({
  name: '',
  name_zh_cn: '',
  cover: null,
  mod_count: 0,
  game_id: '',
  is_custom: 0,
  mod_count_enable: 0,
  category_ids: []
})

const emits = defineEmits<{
  update: []
  close: []
}>()
const formErrorMessage = ref('')
const nameZhError = ref('')
const nameError = ref('')
const coverUrlError = ref('')
const localFileError = ref('')
const categoryErr = ref('')

const clearErrors = () => {
  formErrorMessage.value = ''
  nameZhError.value = ''
  nameError.value = ''
  coverUrlError.value = ''
  localFileError.value = ''
  categoryErr.value = ''
}

const resetForm = () => {
  coverUrl.value = ''
  localFile.value = null
  showImageCover.value = ''
  isDownloading.value = false

  itemForm.name = ''
  itemForm.name_zh_cn = ''
  itemForm.cover = null
  itemForm.game_id = ''
  itemForm.id = undefined
  selectedCategoryIds.value = []

  clearErrors()
}

const selectedCategoryIds = ref<string[]>([])

const closeDialog = () => {
  emits('close')
}

const secondaryCategorySelectedId = ref()
function handleCategoryAdd(v?: string) {
  if (!v) {
    return
  }
  secondaryCategorySelectedId.value = v
}

const downloadCover = async () => {
  clearErrors()
  if (!coverUrl.value) {
    coverUrlError.value = t('games.enterImageUrl')
    return
  }

  try {
    isDownloading.value = true
    itemForm.cover = await window.api.fileApi.downloadImage(coverUrl.value)

    showImageCover.value = itemForm.cover ? getUserImageUrl(itemForm.cover) : ''
  } catch (err) {
    formErrorMessage.value = t('games.imageDownloadFailed', { err })
  } finally {
    isDownloading.value = false
  }
}

async function chooseFile() {
  const localUrl = await window.api.fileApi.selectImage()
  if (!localUrl) {
    return
  }

  const fileName = await window.api.fileApi.downloadImage(localUrl)
  coverUrl.value = fileName
  itemForm.cover = fileName
  showImageCover.value = getUserImageUrl(fileName)
}

const validateForm = (): boolean => {
  clearErrors()
  let valid = true

  const zh = itemForm.name_zh_cn?.trim()
  if (!zh) {
    nameZhError.value = t('gameManager.nameZhRequired')
    valid = false
  }

  const en = itemForm.name?.trim()
  if (!en) {
    nameError.value = t('gameManager.nameEnRequired')
    valid = false
  }
  formErrorMessage.value = ''

  // if (!showImageCover.value) {
  //   formErrorMessage.value += '请完善图片'
  //   valid = false
  // }

  if (selectedCategoryIds.value.length <= 0) {
    formErrorMessage.value += t('gameManager.selectCategory')
    valid = false
  }

  return valid
}

const notify = useNotify()
const saveItemInfoLoading = ref(false)
let timer: null | ReturnType<typeof setTimeout> = null

const saveItem = async (): Promise<void> => {
  if (!validateForm() || !game_id.value) return

  if (!showImageCover.value) {
    await downloadCover()
  }

  if (isDownloading.value) {
    formErrorMessage.value = t('gameManager.savingImageWait')
    return
  }

  if (saveItemInfoLoading.value) {
    return
  }
  saveItemInfoLoading.value = true
  const category_ids = toRaw([
    ...new Set(selectedCategoryIds.value.concat([toRaw(secondaryCategorySelectedId.value)]))
  ]).filter(Boolean)

  if (editData.value) {
    try {
      const updateData: UpdateItemDto = {
        name: itemForm.name.trim(),
        name_zh_cn: itemForm.name_zh_cn.trim(),
        cover: extractImageFileName(itemForm.cover),
        category_ids
      }
      console.log(updateData)

      await window.api.itemApi.update(editData.value.id, updateData)
      notify.success(t('common.updateSuccess'))
      emits('update')
    } catch (error) {
      console.log(error)
    } finally {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        saveItemInfoLoading.value = false
        emits('close')
      }, 500)
    }

    return
  }

  const itemDto: CreateItemDto = {
    name: itemForm.name.trim(),
    name_zh_cn: itemForm.name_zh_cn.trim(),
    cover: itemForm.cover,
    mod_count: 0,
    game_id: game_id.value,
    is_custom: 1,
    mod_count_enable: 0,
    category_ids
  }

  try {
    const data: {
      changes: number
      lastInsertRowid: number | bigint
    } = await window.api.itemApi.create(itemDto)

    if (data.changes !== 0) {
      emits('update')
    } else {
      notify.error(t('common.addFailed'))
    }
  } catch (error) {
    console.log(error)
  } finally {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      saveItemInfoLoading.value = false
      emits('close')
    }, 500)
  }
}

const game_id = ref<string | undefined>()
const editData = ref<undefined | GameItemRow>()
const secondaryCategoryId = ref<Category[]>()
const gameElementList = computed(() => {
  if (!game_id.value) {
    return []
  }

  return gameImageMap[game_id.value]?.elementList || []
})

async function init(itemData?: GameItemRow, gameId?: string) {
  game_id.value = gameId
  resetForm()
  if (itemData) {
    Object.assign(itemForm, itemData)
    showImageCover.value = itemForm.cover || ''
    const data = await window.api.categoryApi.findCategoriesByItemId(itemData.id)
    coverUrl.value = extractImageFileName(itemData.cover) || ''
    selectedCategoryIds.value = data
      .filter((e) => e.level === 0)
      .map((e) => {
        return e.id.toString()
      })
    secondaryCategoryId.value = data.filter((e) => gameElementList.value.includes(e.name))
    secondaryCategorySelectedId.value = secondaryCategoryId.value[0].id
    editData.value = itemData
  } else {
    editData.value = undefined
  }

  itemDialog.value = true
}

onMounted(async () => {
  if (!categoryStore.getState().loaded) {
    await categoryStore.load()
  }
})

defineExpose({
  init
})
</script>

<style scoped></style>
