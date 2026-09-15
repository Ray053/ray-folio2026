'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const CURSOR_BLUE = '#0033FF'
const REST_SIZE = 16
const HOVER_SIZE = 44
const RING_SIZE = 40

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, summary, label'

/**
 * Dual-circle mouse-follow cursor (dot + ring), portaled to <body>. Hides the
 * native OS cursor and mirrors it with fixed-position divs whose transform is
 * updated on every mousemove — same mechanic as arturospatino.com, tinted
 * blue. `mix-blend-mode: exclusion` on the wrapper keeps it visible against
 * any background, same as the reference site's white version.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    mountedRef.current = true
    document.documentElement.style.cursor = 'none'

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // Dot snaps to the real pointer immediately; the ring lerps toward it
    // every frame, producing the trailing-delay look of the reference site.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ringPos = { ...target }
    let raf = 0

    const setTransform = (el: HTMLDivElement, x: number, y: number) => {
      el.style.transform = `translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`
    }

    const tick = () => {
      ringPos.x += (target.x - ringPos.x) * 0.18
      ringPos.y += (target.y - ringPos.y) * 0.18
      setTransform(ring, ringPos.x, ringPos.y)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onMove = (e: MouseEvent) => {
      dot.style.opacity = '1'
      ring.style.opacity = '0.5'
      target.x = e.clientX
      target.y = e.clientY
      setTransform(dot, e.clientX, e.clientY)
    }
    const onLeave = () => {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.(INTERACTIVE_SELECTOR)) {
        dot.style.width = `${HOVER_SIZE}px`
        dot.style.height = `${HOVER_SIZE}px`
      }
    }
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.(INTERACTIVE_SELECTOR)) {
        dot.style.width = `${REST_SIZE}px`
        dot.style.height = `${REST_SIZE}px`
      }
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mouseout', onOut)

    return () => {
      document.documentElement.style.cursor = ''
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mouseout', onOut)
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: 9999,
          border: `1.5px solid ${CURSOR_BLUE}`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: REST_SIZE,
          height: REST_SIZE,
          borderRadius: 9999,
          background: CURSOR_BLUE,
          boxShadow: '0 0 0 1.5px rgba(255,255,255,0.6)',
          opacity: 0,
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        }}
      />
    </div>,
    document.body,
  )
}
