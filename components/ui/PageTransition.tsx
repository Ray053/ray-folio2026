'use client'
import { useRef, useEffect } from 'react'
import { usePathname } from '@/i18n/navigation'
import gsap from 'gsap'

/**
 * Replays an enter animation (fade + slide up) on every route change.
 * Keyed internally off the pathname so navigating remounts the inner node.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      gsap.set(el, { opacity: 1, y: 0 })
      return
    }
    gsap.fromTo(el,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }
    )
  }, [pathname])

  return (
    <div key={pathname} ref={ref} style={{ willChange: 'transform, opacity' }}>
      {children}
    </div>
  )
}
