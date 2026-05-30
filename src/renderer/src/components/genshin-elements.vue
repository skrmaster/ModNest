<template>
  <v-btn-toggle
    :model-value="selected"
    mandatory
    density="comfortable"
    variant="outlined"
    class="w-100 h-12!"
  >
    <v-tooltip
      v-for="value in elementList"
      :key="value.id"
      location="top"
      :text="getValueText(value)"
    >
      <template #activator="{ props }">
        <v-btn v-bind="props" class="px-0!" @click="handleSelect(value)">
          <div class="w-10 h-10">
            <img :src="value.img" />
          </div>
        </v-btn>
      </template>
    </v-tooltip>
  </v-btn-toggle>
</template>

<script setup lang="ts">
import elements from '@renderer/assets/games/genshin/elements.json'
import { computed, ref } from 'vue'
import { useAppSettings } from '@renderer/composables/useAppSettings'

const setting = useAppSettings()
const svgMap: Record<string, string> = {}
const svgList = import.meta.glob(`@renderer/assets/games/genshin/images/elements/*.svg`, {
  eager: true,
  import: 'default'
}) as Record<string, string>

for (let svgPath in svgList) {
  const name = svgPath.split('/').pop()?.split('.').shift() || ''

  svgMap[name] = svgList[svgPath]
}

const elementList = computed(() => {
  return elements.map((e, i) => ({
    ...e,
    id: i,
    img: svgMap[e.displayName]
  }))
})

const selected = ref<unknown | undefined>()

const emits = defineEmits<{
  select: [v: string | undefined]
}>()

function getValueText(value: (typeof elementList.value)[0]): string {
  if (setting.language.value === 'en-US') {
    return value.internalName
  } else if (setting.language.value === 'zh-CN') {
    return value.zhCN
  } else {
    return ''
  }
}

function handleSelect(value: (typeof elementList.value)[0]): void {
  selected.value = selected.value === value.id ? undefined : value.id
  if (selected.value?.toString()) {
    const name = value.internalName
    emits('select', name)
  } else {
    emits('select', undefined)
  }
}
</script>

<style scoped></style>
