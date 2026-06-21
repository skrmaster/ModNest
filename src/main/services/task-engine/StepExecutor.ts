import type { StepDefinition } from '@shared/types/task-engine'

export class StepExecutor<TCtx> {
  async run(
    def: StepDefinition<TCtx>,
    ctx: TCtx,
    signal: AbortSignal,
    onAttempt: (attempt: number) => void
  ): Promise<void> {
    const maxRetries = def.maxRetries ?? 0
    let attempt = 0

    while (true) {
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')

      attempt++
      onAttempt(attempt)

      try {
        await def.execute(ctx, signal)
        return
      } catch (err) {
        if (signal.aborted || attempt > maxRetries) throw err
        await sleep(100 * 2 ** (attempt - 1))
      }
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
