<template>
  <div class="w-full h-full">
    <div class="prose h-full" @click="onMarkdownClick">
      <com-scroll class="px-5 pb-10">
        <MdPreview :model-value="mdStr" editor-id="help" />
      </com-scroll>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'
import markdownText from '@renderer/assets/home.md?raw'
import markdownEnText from '@renderer/assets/home-en.md?raw'
import { IMAGE_PROTOCOL } from '@shared/constants/index'
import comScroll from '@renderer/components/com-scroll.vue'
import { useAppSettings } from '@renderer/composables/useAppSettings'
import { computed } from 'vue'

const { language } = useAppSettings()
const mdStr = computed(() => {
  return language.value === 'zh-CN' ? markdownText : markdownEnText
})

const onMarkdownClick = async (e: MouseEvent) => {
  const target = e.target as HTMLElement

  const link = target.closest('a')

  if (!link?.href) return

  e.preventDefault()

  if (link.href.startsWith(`${IMAGE_PROTOCOL}://download`)) {
    await window.api.fileApi.openDownload()
    return
  }

  await window.api.fileApi.openLink(link.href)
}
</script>

<style>
.prose ol {
  list-style-type: decimal !important;
}

.prose ul {
  list-style-type: disc !important;
}
</style>
