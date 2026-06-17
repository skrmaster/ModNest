<template>
  <v-snackbar v-model="store.show" :color="store.color" location="top" timeout="5000">
    {{ store.text }}

    <template #actions>
      <v-btn icon="mdi-close" variant="text" @click="store.show = false" />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useSnackbarStore } from '@renderer/stores/snackbar'

const store = useSnackbarStore()
</script>
