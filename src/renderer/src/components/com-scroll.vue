<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, useTemplateRef } from 'vue'
import type { PropType } from 'vue'
defineOptions({
  inheritAttrs: false
})

const emits = defineEmits<{
  scrollTop: []
  onScroll: []
  scrollBottom: []
}>()

defineProps({
  position: {
    type: String as PropType<'left' | 'right'>,
    default: 'right' as const
  }
})

const scrollContainer = useTemplateRef('scrollContainer')

const contentHeight = ref(0)
const scrollTop = ref(0)
const thumbHeight = ref(0)
const thumbTop = ref(0)
const dragging = ref(false)
const startY = ref(0)
const startScrollTop = ref(0)
const showScrollbar = ref(false)

const contentWidth = ref(0)
const scrollLeft = ref(0)
const thumbWidth = ref(0)
const thumbLeft = ref(0)
const draggingHorizontal = ref(false)
const startX = ref(0)
const startScrollLeft = ref(0)
const showHorizontalScrollbar = ref(false)

let scrollTopOnce = false

const observer = ref<ResizeObserver | null>(null)
const mutationObserver = ref<MutationObserver | null>(null)

const updateScroll = () => {
  if (!scrollContainer.value) return

  requestAnimationFrame(() => {
    nextTick(() => {
      requestAnimationFrame(() => {
        const container = scrollContainer.value
        if (!container) return

        // 垂直滚动
        contentHeight.value = container.scrollHeight
        const containerHeight = container.clientHeight
        thumbHeight.value = Math.max((containerHeight / contentHeight.value) * containerHeight, 30)
        showScrollbar.value = contentHeight.value > containerHeight

        // 水平滚动
        contentWidth.value = container.scrollWidth
        const containerWidth = container.clientWidth
        thumbWidth.value = Math.max((containerWidth / contentWidth.value) * containerWidth, 30)
        showHorizontalScrollbar.value = contentWidth.value > containerWidth
      })
    })
  })
}

const onScroll = () => {
  emits('onScroll')
  updateScroll()
  if (scrollContainer.value) {
    // 更新垂直滚动位置
    const containerHeight = scrollContainer.value.clientHeight
    scrollTop.value = scrollContainer.value.scrollTop
    thumbTop.value = (scrollTop.value / contentHeight.value) * containerHeight

    // 更新水平滚动位置
    const containerWidth = scrollContainer.value.clientWidth
    scrollLeft.value = scrollContainer.value.scrollLeft
    thumbLeft.value = (scrollLeft.value / contentWidth.value) * containerWidth

    if (Math.ceil(scrollTop.value + containerHeight) >= contentHeight.value - 1) {
      emits('scrollBottom')
    }

    if (scrollTop.value == 0 && scrollTopOnce) {
      emits('scrollTop')
      scrollTopOnce = false
    } else {
      scrollTopOnce = true
    }
  }
}

// 垂直滚动条拖拽
const startDrag = (e: MouseEvent) => {
  draggingHorizontal.value = false
  dragging.value = true
  showScrollbar.value = true
  startY.value = e.clientY
  startScrollTop.value = scrollTop.value
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('selectstart', preventSelection)
}

const onDrag = (e: MouseEvent) => {
  if (dragging.value && !draggingHorizontal.value && scrollContainer.value) {
    const deltaY = e.clientY - startY.value
    const containerHeight = scrollContainer.value.clientHeight
    const newScrollTop = startScrollTop.value + (deltaY / containerHeight) * contentHeight.value
    scrollContainer.value.scrollTop = newScrollTop
  }
}

const stopDrag = () => {
  dragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('selectstart', preventSelection)
}

const preventSelection = (e: Event) => e.preventDefault()

// 水平滚动条拖拽
const startHorizontalDrag = (e: MouseEvent) => {
  dragging.value = false
  draggingHorizontal.value = true
  showHorizontalScrollbar.value = true
  startX.value = e.clientX
  startScrollLeft.value = scrollLeft.value
  document.addEventListener('mousemove', onHorizontalDrag)
  document.addEventListener('mouseup', stopHorizontalDrag)
  document.addEventListener('selectstart', preventSelection)
}

const onHorizontalDrag = (e: MouseEvent) => {
  if (draggingHorizontal.value && !dragging.value && scrollContainer.value) {
    e.preventDefault()
    const deltaX = e.clientX - startX.value
    const containerWidth = scrollContainer.value.clientWidth
    const newScrollLeft = startScrollLeft.value + (deltaX / containerWidth) * contentWidth.value
    scrollContainer.value.scrollLeft = newScrollLeft
  }
}

const stopHorizontalDrag = () => {
  draggingHorizontal.value = false
  document.removeEventListener('mousemove', onHorizontalDrag)
  document.removeEventListener('mouseup', stopHorizontalDrag)
  document.removeEventListener('selectstart', preventSelection)
}

// 添加一个方法来处理鼠标进入事件
const handleMouseEnter = () => {
  updateScroll()
  showScrollbar.value =
    contentHeight.value > (scrollContainer.value ? scrollContainer.value.clientHeight : 0)
  showHorizontalScrollbar.value =
    contentWidth.value > (scrollContainer.value ? scrollContainer.value.clientWidth : 0)
}

// 添加一个方法来处理鼠标离开事件
const handleMouseLeave = () => {
  showScrollbar.value = dragging.value
  showHorizontalScrollbar.value = draggingHorizontal.value
}

onMounted(() => {
  updateScroll()

  if (!scrollContainer.value) return

  observer.value = new ResizeObserver(() => {
    requestAnimationFrame(() => {
      nextTick(() => {
        updateScroll()
      })
    })
  })
  observer.value.observe(scrollContainer.value)

  mutationObserver.value = new MutationObserver(() => {
    requestAnimationFrame(() => {
      nextTick(() => {
        updateScroll()
      })
    })
  })
  mutationObserver.value.observe(scrollContainer.value, {
    subtree: true,
    childList: true
  })
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
  if (mutationObserver.value) {
    mutationObserver.value.disconnect()
  }
})

function refresh() {
  scrollTo({ top: 0, left: 0 })
}

function scroll2Bottom() {
  nextTick(() => {
    scrollTo({
      left: 0,
      top: scrollContainer.value?.scrollHeight,
      behavior: 'instant'
    })
  })
}

function scroll2BottomHalfSmooth() {
  nextTick(() => {
    scrollTo({
      left: 0,
      top: (scrollContainer.value?.scrollHeight || 0) + 500,
      behavior: 'smooth'
    })
  })
}

function scrollTo(obj) {
  nextTick(() => {
    scrollContainer.value?.scrollTo({ ...obj })
  })
}

defineExpose({
  refresh,
  scroll2Bottom,
  scrollTo,
  scrollHeight: () => scrollContainer.value!.scrollHeight,
  scroll2BottomHalfSmooth,
  scrollContainer,
  scrollTop,
  scrollLeft
})
</script>

<template>
  <div
    class="scroll-wrapper"
    @mouseenter.stop.prevent="handleMouseEnter"
    @mouseleave.stop.prevent="handleMouseLeave"
  >
    <div ref="scrollContainer" class="scroll-container" v-bind="$attrs" @scroll="onScroll">
      <slot></slot>
    </div>
    <div
      class="scrollbar vertical"
      :style="{
        visibility: showScrollbar ? 'visible' : 'hidden'
      }"
    >
      <div
        class="thumb"
        :style="{ height: thumbHeight + 'px', transform: `translateY(${thumbTop}px)` }"
        @mousedown="startDrag"
      ></div>
    </div>

    <div
      class="scrollbar horizontal"
      :style="{ visibility: showHorizontalScrollbar ? 'visible' : 'hidden' }"
    >
      <div
        class="thumb"
        :style="{ width: thumbWidth + 'px', transform: `translateX(${thumbLeft}px)` }"
        @mousedown="startHorizontalDrag"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.scroll-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 998;
}

.scroll-container {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-container::-webkit-scrollbar {
  display: none;
}

.scrollbar {
  position: absolute;
  transition: visibility 0.3s;
  visibility: hidden;
  border-radius: 3px;
  z-index: 999;
}

.scrollbar.vertical {
  top: 0;
  right: 2px;
  width: 6px;
  height: 100%;
}

.scrollbar.horizontal {
  bottom: 2px;
  left: 0;
  width: 100%;
  height: 6px;
}

.scrollbar.vertical .thumb {
  width: 100%;
  background: rgba(144, 147, 153, 0.5);
  border-radius: 3px;
  cursor: pointer;
}

.scrollbar.horizontal .thumb {
  height: 100%;
  background: rgba(144, 147, 153, 0.5);
  border-radius: 3px;
  cursor: pointer;
}

.thumb:hover {
  background: rgba(144, 147, 153, 0.8);
}
</style>
