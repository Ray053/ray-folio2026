'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ease, duration } from '@/lib/motion'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const sunRef = useRef<HTMLSpanElement>(null)
  const moonRef = useRef<HTMLSpanElement>(null)
  const isFirst = useRef(true)

  useEffect(() => {
    // theme-init (layout.tsx) already set the class before hydration —
    // just read it back so this component's state agrees with the DOM.
    setDark(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  // Morph between sun/moon — a quarter-turn + crossfade (ease.outBack, the
  // "輕彈效果" token) instead of an instant icon swap.
  useEffect(() => {
    if (!mounted) return
    const sun = sunRef.current
    const moon = moonRef.current
    if (!sun || !moon) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isFirst.current || reduce) {
      gsap.set(sun,  { opacity: dark ? 0 : 1, rotate: 0, scale: 1 })
      gsap.set(moon, { opacity: dark ? 1 : 0, rotate: 0, scale: 1 })
      isFirst.current = false
      return
    }
    gsap.to(dark ? sun : moon, { opacity: 0, rotate: -90, scale: 0.5, duration: duration.base, ease: ease.hover })
    gsap.fromTo(dark ? moon : sun,
      { opacity: 0, rotate: 90, scale: 0.5 },
      { opacity: 1, rotate: 0, scale: 1, duration: duration.slow, ease: ease.outBack })
  }, [dark, mounted])

  function toggle() {
    const next = !dark
    setDark(next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="hard-block"
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '39px', height: '39px', flexShrink: 0,
        boxShadow: '3px 3px 0 var(--color-ink)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer', padding: 0,
      }}
    >
      <span ref={sunRef} style={{ position: 'absolute', display: 'flex' }}>
        <SunIcon />
      </span>
      <span ref={moonRef} style={{ position: 'absolute', display: 'flex' }}>
        <MoonIcon />
      </span>
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}
