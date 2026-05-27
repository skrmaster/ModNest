<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface MenuItem {
  title: string
  icon?: string
  to?: string
  children?: MenuItem[]
}

interface NavConfig {
  navList?: MenuItem[]
  items?: MenuItem[]
  expandedWidth?: number
  collapsedWidth?: number
  showHeader?: boolean
  headerTitle?: string
  transitionDuration?: number
}

const props = withDefaults(
  defineProps<{
    config?: NavConfig
  }>(),
  {
    config: () => ({})
  }
)

const config = computed(() => ({
  navList: [
    { title: 'nav.home', icon: 'mdi-home', to: '/' },
    {
      title: 'nav.workspace',
      icon: 'mdi-folder',
      children: [
        { title: 'nav.projects', icon: 'mdi-briefcase', to: '/projects' },
        { title: 'nav.reports', icon: 'mdi-file-chart', to: '/reports' }
      ]
    },
    { title: 'nav.messages', icon: 'mdi-message', to: '/' }
  ],
  expandedWidth: 240,
  collapsedWidth: 64,
  showHeader: true,
  transitionDuration: 300,
  ...props.config
}))

const navList = computed<MenuItem[]>(() => config.value.navList ?? config.value.items ?? [])

const { t } = useI18n()

const isExpanded = ref(true)
const drawer = ref(true)
const openItemKey = ref<string | undefined>()

const toggleMenu = (): void => {
  isExpanded.value = !isExpanded.value
}

const toggleGroup = (key: string): void => {
  openItemKey.value = openItemKey.value === key ? undefined : key
}

const currentWidth = computed(() =>
  isExpanded.value ? config.value.expandedWidth : config.value.collapsedWidth
)
</script>

<template>
  <div class="shrink-0">
    <v-navigation-drawer v-model="drawer" :width="currentWidth">
      <v-list v-model="openItemKey" nav class="h-full flex flex-col">
        <!-- Header -->
        <v-list-item v-if="config.showHeader" class="py-5 flex items-center gap-3 min-h-14">
          <template #prepend>
            <v-btn icon size="small" @click="toggleMenu">
              <v-icon icon="mdi-menu" />
            </v-btn>
          </template>

          <transition name="fade" :duration="config.transitionDuration">
            <v-list-item-title v-if="isExpanded" key="title">
              {{ t('nav.headerTitle') }}
            </v-list-item-title>
          </transition>
        </v-list-item>

        <v-divider />

        <!-- Menu Items -->
        <div class="flex flex-col gap-2">
          <template v-for="item in navList" :key="item.title">
            <v-list-item
              v-if="!item.children"
              :to="item.to"
              link
              class="menu-item"
              variant="plain"
              density="compact"
            >
              <template #prepend>
                <div
                  class="flex items-center w-full"
                  :class="[isExpanded ? 'gap-3' : 'justify-center']"
                >
                  <v-icon size="large">{{ item.icon }}</v-icon>

                  <transition name="fade" :duration="config.transitionDuration">
                    <v-list-item-title v-if="isExpanded" key="text">
                      {{ t(item.title) }}
                    </v-list-item-title>
                  </transition>
                </div>
              </template>
            </v-list-item>

            <div v-else class="flex flex-col">
              <v-list-item
                class="menu-item cursor-pointer"
                variant="plain"
                density="compact"
                @click="toggleGroup(item.title)"
              >
                <template #prepend>
                  <div
                    class="flex items-center w-full"
                    :class="[isExpanded ? 'gap-3' : 'justify-center']"
                  >
                    <v-icon size="large">{{ item.icon }}</v-icon>

                    <transition name="fade" :duration="config.transitionDuration">
                      <v-list-item-title v-if="isExpanded" key="text">
                        {{ t(item.title) }}
                      </v-list-item-title>
                    </transition>

                    <div class="flex-1" />
                    <v-icon v-if="isExpanded" size="small">
                      {{ openItemKey === item.title ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                    </v-icon>
                  </div>
                </template>
              </v-list-item>

              <div v-if="isExpanded && openItemKey === item.title" class="pl-8">
                <v-list-item
                  v-for="child in item.children"
                  :key="child.title"
                  :to="child.to"
                  link
                  class="menu-item"
                  variant="plain"
                  density="compact"
                >
                  <template #prepend>
                    <div class="flex items-center gap-3 px-3">
                      <v-icon class="nav-icon" size="large">{{ child.icon }}</v-icon>
                      <v-list-item-title>{{ t(child.title) }}</v-list-item-title>
                    </div>
                  </template>
                </v-list-item>
              </div>
            </div>
          </template>
        </div>

        <v-spacer />
        <v-divider class="my-2" />

        <v-list-item :to="'/settings'" link>
          <template #prepend>
            <v-icon size="large">mdi-cog</v-icon>
          </template>

          <transition name="fade" :duration="config.transitionDuration">
            <v-list-item-title v-if="isExpanded" key="settings">
              {{ t('nav.settings') }}
            </v-list-item-title>
          </transition>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<style scoped></style>
