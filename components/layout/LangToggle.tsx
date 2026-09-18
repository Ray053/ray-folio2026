'use client'
import { useLocale } from 'next-intl'
import { useRef, useEffect } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import gsap from 'gsap'
import { ease, duration } from '@/lib/motion'

export function LangToggle() {
  const locale   = useLocale()
  const router   = useRouter()
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRef      = useRef<HTMLSpanElement>(null)
  const buttonRefs   = useRef<Record<string, HTMLButtonElement | null>>({})
  const isFirst      = useRef(true)

  function switchLocale(next: string) {
    // A locale switch reloads the whole document (the `[locale]` layout
    // itself changes), which remounts LoadingScreen — flag it so that pass
    // uses the quick fade+fly path instead of replaying the full particle
    // gather intro.
    try { sessionStorage.setItem('skip-intro-particles', '1') } catch {}
    router.replace(pathname, { locale: next })
  }

  // Slide + resize a solid pill behind the active label — a morph instead of
  // an instant colour swap, with a small elastic settle (ease.outBack, the
  // "輕彈效果" token) so switching languages feels like a physical flick.
  // The very first positioning snaps instantly (no grow-in on page load).
  const measure = (animate: boolean) => {
    const container = containerRef.current
    const active = buttonRefs.current[locale]
    const pill = pillRef.current
    if (!container || !active || !pill) return
    const activeRect = active.getBoundingClientRect()
    if (activeRect.width === 0) return // not laid out yet (e.g. hidden mobile menu) — a later re-measure catches it
    const containerRect = container.getBoundingClientRect()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = { x: activeRect.left - containerRect.left, width: activeRect.width }
    if (animate && !reduce) gsap.to(pill, { ...target, duration: duration.slow, ease: ease.outBack })
    else gsap.set(pill, target)
  }

  const measureRef = useRef(measure)
  measureRef.current = measure

  useEffect(() => {
    measure(!isFirst.current)
    isFirst.current = false
  }, [locale])

  // Re-measure on container resize — covers webfont swap reflow and the
  // mobile menu going from display:none to visible, neither of which fire
  // the effect above (locale hasn't changed). Reads the latest `measure` via
  // a ref so it always uses the current locale, not the one at mount time.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => measureRef.current(false))
    ro.observe(container)
    document.fonts?.ready?.then(() => measureRef.current(false))
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="hard-block"
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: '2px',
        fontSize: '13px', fontWeight: 500, padding: '6px 12px', borderRadius: 0,
        boxShadow: '3px 3px 0 var(--color-ink)', fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
      }}
    >
      <span
        ref={pillRef}
        aria-hidden
        style={{
          position: 'absolute', top: '4px', bottom: '4px', left: 0,
          background: 'var(--color-accent)', zIndex: 0,
        }}
      />
      {routing.locales.map((l, i) => (
        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {i > 0 && (
            <span style={{ color: 'var(--color-border)', margin: '0 2px', position: 'relative', zIndex: 1 }}>/</span>
          )}
          <button
            ref={(el) => { buttonRefs.current[l] = el }}
            onClick={() => switchLocale(l)}
            className="nav-lang-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              position: 'relative', zIndex: 1,
              cursor: locale === l ? 'default' : 'pointer',
              color: locale === l ? '#fff' : 'var(--color-text-muted)',
              fontWeight: locale === l ? 600 : 400,
              fontSize: 'inherit',
              fontFamily: 'inherit',
              transition: 'color 0.2s',
            }}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
