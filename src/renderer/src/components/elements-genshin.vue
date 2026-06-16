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
    <v-tooltip v-for="(e, index) in elementList" :key="e.id" location="top" :text="getValueText(e)">
      <template #activator="{ props }">
        <v-btn v-bind="props" ref="btnRefs" class="px-0!" @click="handleSelect(e, index)">
          <div class="w-10 h-10">
            <img :src="e.cover" />
          </div>
        </v-btn>
      </template>
    </v-tooltip>
  </v-btn-toggle>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useAppSettings } from '@renderer/composables/useAppSettings'
import { categoryStore } from '@renderer/stores/category-store'
import { getAppImageUrl } from '@shared/utils/url'
import { GameGenshinElement } from '@shared/types/item'
import { gameGenshinElementList } from '@shared/enums'
import { Category } from '@shared/entities/category'
import { useResizeObserver } from '@vueuse/core'

type Prop = {
  value?: Category[]
}

const propss = withDefaults(defineProps<Prop>(), {
  value: undefined
})

const gameElementList: GameGenshinElement[] = gameGenshinElementList

const btnRefs = useTemplateRef('btnRefs')
const setting = useAppSettings()

const elementList = computed(() => {
  const tmp = category.value.flatMap((e) => {
    if (gameElementList.includes(e.name as GameGenshinElement)) {
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

watch(
  () => propss.value,
  () => {
    let activeItem = ''
    for (const e of propss.value || []) {
      if (elementList.value.map((e) => e.name).includes(e.name as GameGenshinElement)) {
        activeItem = e.name
        break
      }
    }

    const index = elementList.value.map((e) => e.name).findIndex((e) => e === activeItem)
    selected.value = index
    scrollToSelected(index)
  }
)

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
const relativeMap: Map<string, string> = new Map()

const toggleRef = useTemplateRef('toggleRef')
const hasHorizontalScroll = ref(false)

function checkScroll() {
  const el = toggleRef.value?.$el
  if (!el) return

  hasHorizontalScroll.value = el.scrollWidth > el.clientWidth
}
async function scrollToSelected(index: number) {
  await nextTick()
  btnRefs.value?.[index]?.$el.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  })
}

useResizeObserver(toggleRef, () => {
  checkScroll()
})

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
    categoryStore.getState().items.forEach((e) => {
      relativeMap.set(e.id, e.name)
      relativeMap.set(e.name, e.id)
    })
  }
  nextTick(checkScroll)
})
</script>

<style scoped>
.v-btn-toggle {
  overflow-x: auto;
  flex-wrap: nowrap;
}
</style>
