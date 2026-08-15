import { type Ref, type ComponentPublicInstance, nextTick, onUnmounted } from 'vue'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

interface CachedItem {
  rect: Rect
  animation?: Animation
}

function getRelativeRect(containerRect: DOMRect, el: HTMLElement): Rect {
  const r = el.getBoundingClientRect()
  return {
    top: Math.max(r.top - containerRect.top, 0),
    left: Math.max(r.left - containerRect.left, 0),
    width: r.width,
    height: r.height
  }
}

export function useGridAnimate(
  containerRef: Ref<HTMLElement | ComponentPublicInstance | null>,
  options: { duration?: number; stagger?: number } = {}
) {
  const { duration = 350, stagger = 20 } = options
  const cache = new Map<string, CachedItem>()
  let idCounter = 0

  function getContainer(): HTMLElement | null {
    const v = containerRef.value
    if (!v) return null
    if ('$el' in v) return (v as ComponentPublicInstance).$el as HTMLElement
    return v as HTMLElement
  }

  function ensureId(el: HTMLElement): string {
    if (!el.dataset.flipId) el.dataset.flipId = String(++idCounter)
    return el.dataset.flipId
  }

  function snapshot() {
    const container = getContainer()
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    Array.from(container.children as HTMLCollectionOf<HTMLElement>).forEach((el) => {
      const id = ensureId(el)
      const existing = cache.get(id)
      cache.set(id, {
        ...(existing ?? {}),
        rect: getRelativeRect(containerRect, el)
      })
    })
  }

  async function flip() {
    await nextTick()
    const container = getContainer()
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const children = Array.from(container.children as HTMLCollectionOf<HTMLElement>)

    children.forEach((el, i) => {
      const id = ensureId(el)
      const prev = cache.get(id)
      const next = getRelativeRect(containerRect, el)

      if (!prev) {
        cache.set(id, { rect: next })
        return
      }

      const translateX = prev.rect.left - next.left
      const translateY = prev.rect.top - next.top
      const scaleX = prev.rect.width / next.width
      const scaleY = prev.rect.height / next.height

      const hasMoved =
        Math.abs(translateX) > 0.5 ||
        Math.abs(translateY) > 0.5 ||
        Math.abs(scaleX - 1) > 0.01 ||
        Math.abs(scaleY - 1) > 0.01

      if (!hasMoved) {
        cache.set(id, { rect: next })
        return
      }

      prev.animation?.cancel()

      el.style.transformOrigin = '0 0'
      const child = el.children[0] as HTMLElement | undefined
      if (child) child.style.transformOrigin = '0 0'

      const fromTransform = `translateX(${translateX}px) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`
      const fromChildTransform = `scaleX(${1 / scaleX}) scaleY(${1 / scaleY})`

      const anim = el.animate(
        [
          { transform: fromTransform },
          { transform: 'translateX(0) translateY(0) scaleX(1) scaleY(1)' }
        ],
        {
          duration,
          delay: stagger * i,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          fill: 'both'
        }
      )

      if (child) {
        child.animate([{ transform: fromChildTransform }, { transform: 'scaleX(1) scaleY(1)' }], {
          duration,
          delay: stagger * i,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          fill: 'both'
        })
      }

      anim.onfinish = () => {
        el.style.transform = ''
        if (child) child.style.transform = ''
        cache.set(id, { rect: next })
      }

      cache.set(id, { rect: next, animation: anim })
    })
  }

  let resizeObserver: ResizeObserver | null = null

  function observeResize() {
    const container = getContainer()
    if (!container || resizeObserver) return

    resizeObserver = new ResizeObserver(() => {
      snapshot()
      requestAnimationFrame(() => requestAnimationFrame(() => flip()))
    })

    resizeObserver.observe(container)
  }

  function cleanup() {
    resizeObserver?.disconnect()
    resizeObserver = null
    cache.forEach((item) => item.animation?.cancel())
    cache.clear()
  }

  onUnmounted(cleanup)

  return { snapshot, flip, observeResize, cleanup }
}
