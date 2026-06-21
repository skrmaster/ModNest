import { EventEmitter } from 'events'
import type { StepDefinition, StepState, TaskEvent, TaskSummary } from '@shared/types/task-engine'
import { StepExecutor } from './StepExecutor'

export class TaskRunner<TCtx = unknown> extends EventEmitter {
  private abortController: AbortController | null = null
  private executor = new StepExecutor<TCtx>()

  get signal() {
    return this.abortController?.signal ?? null
  }

  cancel() {
    this.abortController?.abort()
  }

  async run(taskId: string, steps: StepDefinition<TCtx>[], ctx: TCtx): Promise<TaskSummary> {
    this.abortController = new AbortController()
    const { signal } = this.abortController
    const startedAt = Date.now()

    const stateMap = new Map<string, StepState>(
      steps.map((s) => [
        s.id,
        {
          id: s.id,
          name: s.name,
          status: 'pending',
          attempt: 0,
          maxRetries: s.maxRetries ?? 0
        }
      ])
    )

    const emit = (type: TaskEvent['type'], step?: StepState, summary?: TaskSummary) => {
      this.emit('event', { taskId, type, step, summary } satisfies TaskEvent)
    }

    const getState = (id: string) => stateMap.get(id)!
    const setState = (id: string, patch: Partial<StepState>) => {
      stateMap.set(id, { ...getState(id), ...patch })
    }

    for (const def of steps) {
      if (signal.aborted) break

      const depsFailed = def.dependsOn?.some((depId) => getState(depId).status !== 'success')
      if (depsFailed) {
        setState(def.id, { status: 'skipped' })
        emit('step', { ...getState(def.id) })
        continue
      }

      setState(def.id, { status: 'running', startedAt: Date.now() })
      emit('step', { ...getState(def.id) })

      try {
        await this.executor.run(def, ctx, signal, (attempt) => {
          setState(def.id, { attempt })
          emit('step', { ...getState(def.id) })
        })

        setState(def.id, {
          status: 'success',
          finishedAt: Date.now()
        })
        emit('step', { ...getState(def.id) })
      } catch (err) {
        const isCancelled = signal.aborted

        setState(def.id, {
          status: isCancelled ? 'skipped' : 'error',
          finishedAt: Date.now(),
          error: isCancelled ? undefined : err instanceof Error ? err.message : String(err)
        })
        emit('step', { ...getState(def.id) })

        if (!isCancelled) {
          const summary: TaskSummary = {
            taskId,
            status: 'error',
            steps: [...stateMap.values()],
            durationMs: Date.now() - startedAt,
            error: String(err)
          }
          emit('error', undefined, summary)
          return summary
        }
        break
      }
    }

    const status = signal.aborted ? 'cancelled' : 'success'
    const summary: TaskSummary = {
      taskId,
      status,
      steps: [...stateMap.values()],
      durationMs: Date.now() - startedAt
    }
    emit(status === 'cancelled' ? 'cancelled' : 'done', undefined, summary)
    return summary
  }
}
