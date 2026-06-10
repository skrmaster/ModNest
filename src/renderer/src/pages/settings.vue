<template>
  <v-container fluid>
    <v-card class="mx-auto" max-width="600">
      <v-card-title>{{ labels.title }}</v-card-title>
      <v-card-text>
        <div class="pl-0">
          <div>
            <div class="mb-2">主题颜色</div>

            <v-radio-group v-model="themeMode" inline>
              <v-radio
                v-for="(e, index) in themeModeOptions"
                :key="index"
                :label="e.label"
                :value="e.value"
              ></v-radio>
            </v-radio-group>
          </div>

          <div>
            <div class="mb-2">语言</div>

            <v-radio-group v-model="language" inline>
              <v-radio
                v-for="(e, index) in languageOptions"
                :key="index"
                :label="e.label"
                :value="e.value"
              ></v-radio>
            </v-radio-group>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppSettings } from '@renderer/composables/useAppSettings'

const { t } = useI18n()
const { themeMode, language } = useAppSettings()

const themeModeOptions = computed(() => [
  { label: t('theme.light'), value: 'light' },
  { label: t('theme.dark'), value: 'dark' },
  { label: t('theme.system'), value: 'system' }
])

const languageOptions = computed(() => [
  { label: t('language.zh'), value: 'zh-CN' },
  { label: t('language.en'), value: 'en-US' }
])

const labels = computed(() => ({
  title: t('settings.title'),
  themeLabel: t('settings.themeLabel'),
  themeHint: t('settings.themeHint'),
  languageLabel: t('settings.languageLabel'),
  languageHint: t('settings.languageHint')
}))
</script>

<style scoped></style>
