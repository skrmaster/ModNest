<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppSettings } from '@renderer/composables/useSettings'

interface MenuItem {
  title: string
  icon: string
  to: string
}

interface NavConfig {
  items?: MenuItem[]
  expandedWidth?: number
  collapsedWidth?: number
  showHeader?: boolean
  headerTitle?: string
  transitionDuration?: number
}

// Props
const props = withDefaults(
  defineProps<{
    config?: NavConfig
  }>(),
  {
    config: () => ({})
  }
)

// 合并配置
const config = computed(() => ({
  items: [{ title: 'Home', icon: 'mdi-home', to: '/' }],
  expandedWidth: 240,
  collapsedWidth: 64,
  showHeader: true,
  headerTitle: '应用导航',
  transitionDuration: 300,
  ...props.config
}))

const { language } = useAppSettings()

const isExpanded = ref(true)
const drawer = ref(true)

const toggleMenu = (): void => {
  isExpanded.value = !isExpanded.value
}

const currentWidth = computed(() =>
  isExpanded.value ? config.value.expandedWidth : config.value.collapsedWidth
)
</script>

<template>
  <div class="nav-wrapper">
    <v-navigation-drawer
      v-model="drawer"
      :width="currentWidth"
      permanent
      app
      class="nav-drawer"
      :style="{
        '--transition-duration': `${config.transitionDuration}ms`
      }"
    >
      <v-list nav class="h-full flex flex-col">
        <!-- Header -->
        <v-list-item v-if="config.showHeader" class="toolbar-top">
          <template #prepend>
            <v-btn icon size="small" class="toggle-btn" @click="toggleMenu">
              <v-icon>
                {{ isExpanded ? 'mdi-chevron-left' : 'mdi-chevron-right' }}
              </v-icon>
            </v-btn>
          </template>

          <transition name="fade" :duration="config.transitionDuration">
            <v-list-item-title v-if="isExpanded" key="title" class="nav-title">
              {{ config.headerTitle }}
            </v-list-item-title>
          </transition>
        </v-list-item>

        <v-divider />

        <!-- Menu Items -->
        <div>
          <v-list-item
            v-for="item in config.items"
            :key="item.title"
            :to="item.to"
            link
            class="menu-item"
          >
            <template #prepend>
              <v-icon size="large">{{ item.icon }}</v-icon>
            </template>

            <transition name="fade" :duration="config.transitionDuration">
              <v-list-item-title v-if="isExpanded" key="text">
                {{ item.title }}
              </v-list-item-title>
            </transition>
          </v-list-item>
        </div>

        <v-spacer />
        <v-divider class="my-2" />

        <v-list-item :to="'/settings'" link class="menu-item bottom-item">
          <template #prepend>
            <v-icon size="large">mdi-cog</v-icon>
          </template>

          <transition name="fade" :duration="config.transitionDuration">
            <v-list-item-title v-if="isExpanded" key="settings">
              {{ language === 'en' ? 'Settings' : '设置' }}
            </v-list-item-title>
          </transition>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<style scoped>
.nav-wrapper {
  height: 100%;
}

.nav-drawer {
  transition: width var(--transition-duration) ease-in-out !important;
}

.toolbar-top {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
  min-height: 56px;
}

.nav-title {
  font-weight: 600;
  white-space: nowrap;
}

.menu-item {
  transition: padding var(--transition-duration) ease-in-out;
}

.toggle-btn {
  flex-shrink: 0;
  transition: transform var(--transition-duration) ease-in-out;
}

/* Fade 过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-duration) ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* 平滑的高度和宽度变化 */
:deep(.v-navigation-drawer) {
  transition: width var(--transition-duration) ease-in-out !important;
}

:deep(.v-list-item) {
  transition: padding var(--transition-duration) ease-in-out;
}
</style>
