<template>
  <v-btn-toggle
    :model-value="selected"
    mandatory
    density="comfortable"
    variant="outlined"
    class="w-100 h-12!"
  >
    <v-tooltip
      v-for="(value, index) in elementList"
      :key="value.id"
      location="top"
      :text="getValueText(value)"
    >
      <template #activator="{ props }">
        <v-btn v-bind="props" class="px-0!" @click="handleSelect(value, index)">
          <div class="w-10 h-10">
            <img :src="value.cover" />
          </div>
        </v-btn>
      </template>
    </v-tooltip>
  </v-btn-toggle>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAppSettings } from '@renderer/composables/useAppSettings'
import { GameElement } from '#types/element'
import { categoryStore } from '@renderer/stores/category-store'
import { getAppImageUrl } from '@shared/utils/url'

const gameElementList: GameElement[] = [
  'anemo',
  'cryo',
  'dendro',
  'electro',
  'geo',
  'hydro',
  'pyro'
]

const setting = useAppSettings()

const elementList = computed(() => {
  const tmp = category.value.flatMap((e) => {
    if (gameElementList.includes(e.name as GameElement)) {
      return {
        ...e,
        cover: getAppImageUrl(e.cover)
      }
    } else {
      return []
    }
  })

  return tmp
})

const selected = ref<unknown | undefined>()

const emits = defineEmits<{
  select: [v: string | undefined]
}>()

function getValueText(value: (typeof elementList.value)[0]): string {
  if (setting.language.value === 'en-US') {
    return value.name
  } else if (setting.language.value === 'zh-CN') {
    return value.name_zh_cn
  } else {
    return ''
  }
}

function handleSelect(value: (typeof elementList.value)[0], index: number): void {
  selected.value = selected.value === index ? undefined : index
  if (selected.value?.toString()) {
    const name = value.name
    emits('select', name)
  } else {
    emits('select', undefined)
  }
}
const category = computed(() => categoryStore.getState().items)

onMounted(async () => {
  if (!categoryStore.getState().loaded) {
    await categoryStore.load()
  }
})
</script>

<style scoped></style>
