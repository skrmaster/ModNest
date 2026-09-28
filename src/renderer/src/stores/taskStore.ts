import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StepState, TaskStatus, TaskEvent } from '@shared/types/task-engine'

export const useTaskStore = defineStore('task', () => {
  const steps = ref<StepState[]>([])
  const status = ref<TaskStatus>('idle')
  const durationMs = ref(0)
  const globalError = ref<string>()

  const isRunning = computed(() => status.value === 'running')
  const isTerminated = computed(() => ['success', 'cancelled', 'error'].includes(status.value))
  const progress = computed(() => {
    if (!steps.value.length) return 0
    const done = steps.value.filter((s) => s.status === 'success' || s.status === 'skipped').length
    return Math.round((done / steps.value.length) * 100)
  })

  function applyEvent(event: TaskEvent) {
    if (event.type === 'step' && event.step) {
      const idx = steps.value.findIndex((s) => s.id === event.step!.id)
      idx >= 0 ? (steps.value[idx] = event.step) : steps.value.push(event.step)
    }
    if (event.summary) {
      status.value = event.summary.status
      durationMs.value = event.summary.durationMs
      globalError.value = event.summary.error
      event.summary.steps.forEach((s) => {
        const idx = steps.value.findIndex((x) => x.id === s.id)
        idx >= 0 ? (steps.value[idx] = s) : steps.value.push(s)
      })
    }
  }

  function reset() {
    steps.value = []
    status.value = 'idle'
    durationMs.value = 0
    globalError.value = undefined
  }

  return {
    steps,
    status,
    isRunning,
    isTerminated,
    progress,
    durationMs,
    globalError,
    applyEvent,
    reset
  }
})
