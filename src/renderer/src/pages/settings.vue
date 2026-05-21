<template>
  <v-container class="settings-page" fluid>
    <v-card class="mx-auto" max-width="600">
      <v-card-title>{{ labels.title }}</v-card-title>
      <v-card-text>
        <div class="setting-group">
          <v-select
            v-model="themeMode"
            :items="themeModeOptions"
            :label="labels.themeLabel"
            item-title="label"
            item-value="value"
            density="comfortable"
          />
          <div class="hint">{{ labels.themeHint }}</div>
        </div>

        <div class="setting-group">
          <v-select
            v-model="language"
            :items="languageOptions"
            :label="labels.languageLabel"
            item-title="label"
            item-value="value"
            density="comfortable"
          />
          <div class="hint">{{ labels.languageHint }}</div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppSettings } from '@renderer/composables/useSettings'

const { themeMode, language } = useAppSettings()

const themeModeOptions = computed(() =>
  language.value === 'en'
    ? [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'System', value: 'system' }
      ]
    : [
        { label: '浅色', value: 'light' },
        { label: '深色', value: 'dark' },
        { label: '跟随系统', value: 'system' }
      ]
)

const languageOptions = computed(() =>
  language.value === 'en'
    ? [
        { label: 'English', value: 'en' },
        { label: 'Chinese', value: 'zh' }
      ]
    : [
        { label: '中文', value: 'zh' },
        { label: '英语', value: 'en' }
      ]
)

const labels = computed(() => {
  if (language.value === 'en') {
    return {
      title: 'Application Settings',
      themeLabel: 'Theme Mode',
      themeHint: 'Choose Light, Dark, or Follow System preferences.',
      languageLabel: 'Language',
      languageHint: 'Choose English or Chinese as the interface language.'
    }
  }

  return {
    title: '设置',
    themeLabel: '主题模式',
    themeHint: '选择浅色、深色或跟随系统。',
    languageLabel: '语言',
    languageHint: '选择英语或中文，默认中文。'
  }
})
</script>

<style scoped>
.settings-page {
  min-height: calc(100vh - 32px);
  padding: 24px 16px;
}

.setting-group {
  margin-bottom: 24px;
}

.hint {
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.92rem;
}
</style>
