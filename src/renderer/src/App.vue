<template>
  <v-app>
    <div class="w-screen h-screen flex">
      <LeftNav />
      <v-main class="flex-1 overflow-hidden">
        <div class="pl-3 w-full h-full">
          <router-view />
        </div>
      </v-main>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import LeftNav from './components/left-nav.vue'
</script>

<style scoped></style>
