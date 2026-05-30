<template>
  <v-app>
    <div class="w-screen h-screen flex">
      <LeftNav />
      <v-main>
        <div class="flex-1 overflow-hidden ml-3">
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
