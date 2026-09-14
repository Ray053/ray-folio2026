'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { duration, ease } from './motion'

/**
 * Pulls the ref'd element toward the cursor while hovered, then releases with
 * an elastic snap-back (ease.outBack — CLAUDE.md's "輕彈效果" token). Skipped
 * on touch/coarse pointers and prefers-reduced-motion.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.35) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return

    const xTo = gsap.quickTo(el, 'x', { duration: duration.base, ease: ease.outExpo })
    const yTo = gsap.quickTo(el, 'y', { duration: duration.base, ease: ease.outExpo })

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      xTo((e.clientX - rect.left - rect.width / 2) * strength)
      yTo((e.clientY - rect.top - rect.height / 2) * strength)
    }
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: duration.slow, ease: ease.outBack })

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [strength])

  return ref
}
