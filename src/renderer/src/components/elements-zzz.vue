<template>
  <v-btn-toggle
    ref="toggleRef"
    :model-value="selected"
    mandatory
    density="comfortable"
    variant="outlined"
    class="w-100"
    :class="hasHorizontalScroll ? 'h-18!' : 'h-12!'"
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useAppSettings } from '@renderer/composables/useAppSettings'
import { categoryStore } from '@renderer/stores/category-store'
import { getAppImageUrl } from '@shared/utils/url'
import { gameZZZElementList } from '@shared/enums'
import { GameZZZElement } from '@shared/types/item'

const gameElementList: GameZZZElement[] = gameZZZElementList

const setting = useAppSettings()

const elementList = computed(() => {
  const tmp = category.value.flatMap((e) => {
    if (gameElementList.includes(e.name as GameZZZElement)) {
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
  const categoryItem = category.value.find((e) => e.name === value.name)
  if (selected.value?.toString() && categoryItem) {
    emits('select', categoryItem.id)
  } else {
    emits('select', undefined)
  }
}
const category = computed(() => categoryStore.getState().items)

const toggleRef = ref()
const hasHorizontalScroll = ref(false)

function checkScroll() {
  const el = toggleRef.value.$el as HTMLElement
  if (!el) return

  hasHorizontalScroll.value = el.scrollWidth > el.clientWidth
}

watch(
  () => elementList,
  async () => {
    await nextTick()
    checkScroll()
  },
  { deep: true }
)
onMounted(async () => {
  if (!categoryStore.getState().loaded) {
    await categoryStore.load()
  }
  nextTick(checkScroll)
})
</script>

<style scoped></style>
