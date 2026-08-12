'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * A live local-time readout pinned to the top-left corner. It stays hidden
 * until the visitor scrolls near the bottom of the page, then slides in from
 * off-screen (top-left). Updates every second. Portaled to <body> so its
 * position:fixed escapes PageTransition's transformed wrapper.
 */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)
  const [shown, setShown] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Tick every second (mounts client-side only → avoids SSR hydration mismatch).
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Reveal only after the visitor is already at the very bottom (footer fully
  // reached) AND keeps scrolling DOWN — an overscroll gesture. The viewport
  // doesn't move further; that extra downward intent is what triggers it.
  useEffect(() => {
    // "At bottom" = the footer element itself is fully scrolled into view
    // (its bottom edge has reached the viewport bottom). Tying to the footer
    // rect avoids false positives inside the tall pinned dance section, where
    // document.scrollHeight math under Lenis is unreliable.
    const atBottom = () => {
      const footer = document.getElementById('site-footer')
      if (!footer) return false
      return footer.getBoundingClientRect().bottom <= window.innerHeight + 2
    }
    let over = 0
    const THRESHOLD = 140 // px of extra downward scroll past the bottom

    const onWheel = (e: WheelEvent) => {
      if (atBottom() && e.deltaY > 0) {
        over = Math.min(over + e.deltaY, THRESHOLD)
        if (over >= THRESHOLD) setShown(true)
      }
    }
    // Touch: track downward drag while pinned at the bottom.
    let touchY = 0
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0 }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0
      if (atBottom() && touchY - y > 0) {
        over = Math.min(over + (touchY - y), THRESHOLD)
        if (over >= THRESHOLD) setShown(true)
      }
      touchY = y
    }
    // Leaving the bottom hides it again and resets the overscroll counter.
    const onScroll = () => { if (!atBottom()) { over = 0; setShown(false) } }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const time = now
    ? now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'
  const zone = now
    ? new Intl.DateTimeFormat('en', { timeZoneName: 'short' }).formatToParts(now)
        .find(p => p.type === 'timeZoneName')?.value ?? ''
    : ''

  if (!mounted) return null

  return createPortal(
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 'clamp(16px, 3vw, 32px)',
        left: 'clamp(16px, 3vw, 32px)',
        zIndex: 40,
        pointerEvents: 'none',
        transform: shown ? 'translate(0, 0)' : 'translate(calc(-100% - 40px), calc(-100% - 40px))',
        opacity: shown ? 1 : 0,
        transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
      }}
    >
      <div
        className="hard-block"
        style={{
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
          }}
        >
          Local Time {zone}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            fontSize: 'clamp(20px, 2.4vw, 30px)', fontWeight: 700,
            letterSpacing: '0.04em', lineHeight: 1,
            color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums',
          }}
        >
          {time}
        </span>
      </div>
    </div>,
    document.body,
  )
}
