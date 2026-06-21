export type TaskStatus = 'idle' | 'running' | 'cancelled' | 'success' | 'error'
export type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped'

export interface StepDefinition<TCtx = unknown> {
  id: string
  name: string
  dependsOn?: string[]
  maxRetries?: number
  execute(ctx: TCtx, signal: AbortSignal): Promise<void>
}

export interface StepState {
  id: string
  name: string
  status: StepStatus
  attempt: number
  maxRetries: number
  startedAt?: number
  finishedAt?: number
  error?: string
}

export interface TaskEvent {
  taskId: string
  type: 'step' | 'done' | 'cancelled' | 'error'
  step?: StepState
  summary?: TaskSummary
}

export interface TaskSummary {
  taskId: string
  status: TaskStatus
  steps: StepState[]
  durationMs: number
  error?: string
}

export interface RunTaskOptions {
  taskId: string
}
