import { onUnmounted } from 'vue'
import { useTaskStore } from '@renderer/stores/taskStore'
import type { TaskEvent } from '@shared/types/task-engine'

export function useTaskEngine(taskId: string) {
  const store = useTaskStore()
  let unsubscribe: (() => void) | null = null

  const start = async () => {
    store.reset()

    unsubscribe?.()
    unsubscribe = window.api.taskBridge.onTaskEvent((event: TaskEvent) => {
      if (event.taskId !== taskId) return
      store.applyEvent(event)
    })

    return window.api.taskBridge.startGame()
  }

  const cancel = () => window.api.taskBridge.cancelGame()

  onUnmounted(() => {
    unsubscribe?.()
  })

  return { store, start, cancel }
}
