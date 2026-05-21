<template>
  <v-app>
    <div class="w-screen h-screen flex">
      <LeftNav />
      <div class="flex-1 overflow-hidden">
        <router-view />
      </div>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import LeftNav from './components/LeftNav.vue'
</script>

<style scoped></style>
