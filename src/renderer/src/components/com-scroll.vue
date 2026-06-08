<template>
  <div class="com-scroll" :class="{ always: always }">
    <div class="scroll-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  always?: boolean
}
defineProps<Props>()
</script>

<style scoped>
.com-scroll {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.scroll-content {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  padding-right: 4px;
  box-sizing: border-box;
  scrollbar-gutter: stable;
}

.scroll-content::-webkit-scrollbar {
  width: 6px;
}

.scroll-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.scroll-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.com-scroll:hover .scroll-content::-webkit-scrollbar-thumb {
  opacity: 1 !important;
}

.com-scroll.always .scroll-content::-webkit-scrollbar-thumb {
  opacity: 1;
}

* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.com-scroll:hover * {
  scrollbar-color: rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.05);
}

.com-scroll.always * {
  scrollbar-color: rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.05);
}
</style>
