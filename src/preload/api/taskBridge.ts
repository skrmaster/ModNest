import { TaskEvent, TaskSummary } from '@shared/types/task-engine'
import { ipcRenderer, IpcRendererEvent } from 'electron'

export const taskBridge = {
  startGame: (): Promise<TaskSummary> => ipcRenderer.invoke('genshin:start'),

  cancelGame: (): Promise<void> => ipcRenderer.invoke('genshin:cancel'),

  onTaskEvent: (cb: (e: TaskEvent) => void) => {
    const handler = (_: IpcRendererEvent, e: TaskEvent) => cb(e)
    ipcRenderer.on('task:event', handler)
    return () => ipcRenderer.removeListener('task:event', handler)
  }
}
