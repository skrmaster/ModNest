<template>
  <div class="w-full h-full">
    <div class="prose h-full" @click="onMarkdownClick">
      <com-scroll class="px-5 pb-10">
        <div class="absolute top-0 z-999 w-full left-0">
          <v-alert v-if="errorStr" type="error" closable>{{ errorStr }}</v-alert>
          <v-alert v-if="successPs1Str" type="success" closable>{{ successPs1Str }}</v-alert>
        </div>
        <MdPreview :model-value="mdStr" :preview-theme="'github'" editor-id="help" />
      </com-scroll>
    </div>
  </div>
  <taskStep ref="taskRef"></taskStep>
</template>

<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'
import markdownText from '@renderer/assets/home.md?raw'
import markdownEnText from '@renderer/assets/home-en.md?raw'
import { IMAGE_PROTOCOL } from '@shared/constants/index'
import comScroll from '@renderer/components/com-scroll.vue'
import { useAppSettings } from '@renderer/composables/useAppSettings'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import taskStep from './task-step.vue'

const { t } = useI18n()

const { language } = useAppSettings()
const mdStr = computed(() => {
  return language.value === 'zh-CN' ? markdownText : markdownEnText
})
const errorStr = ref('')
const successPs1Str = ref('')
const taskRef = useTemplateRef('taskRef')

const onMarkdownClick = async (e: MouseEvent) => {
  const target = e.target as HTMLElement

  const link = target.closest('a')

  if (!link?.href) return

  e.preventDefault()

  if (link.href.startsWith('app-action://start-genshin')) {
    taskRef.value?.openModal()
    return
  }

  if (link.href.startsWith(`app-action://internet_outage`)) {
    await window.api.genshinApi.closeNetwork()

    return
  }

  if (link.href.startsWith(`app-image://open-XXMI.msi`)) {
    await window.api.genshinApi.installXXMI()

    return
  }

  if (link.href.startsWith(`${IMAGE_PROTOCOL}://download`)) {
    await window.api.fileApi.openDownload()
    return
  }

  if (link.href.startsWith(`action://updatePs1`)) {
    const [status, error] = await window.api.genshinApi.updatePs1Path()
    if (!status) {
      errorStr.value = error
      successPs1Str.value = ''
    } else {
      errorStr.value = ''
      successPs1Str.value =
        t('home.update') + '2.' + `genshin_bad_network.ps1` + t('common.success')
    }

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
