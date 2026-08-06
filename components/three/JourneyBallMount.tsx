'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'

const JourneyBall = dynamic(
  () => import('./JourneyBall').then(m => m.JourneyBall),
  { ssr: false }
)

export function JourneyBallMount() {
  const [mounted, setMounted] = useState(false)
  const [lowPower, setLowPower] = useState(false)
  const [webgl, setWebgl] = useState(true)

  useEffect(() => {
    setMounted(true)
    setLowPower(window.matchMedia('(max-width: 768px), (pointer: coarse)').matches)
    try {
      const c = document.createElement('canvas')
      setWebgl(!!(c.getContext('webgl2') || c.getContext('webgl')))
    } catch { setWebgl(false) }
  }, [])

  // Portal to <body> so the fixed canvas escapes transformed ancestors
  // (PageTransition uses will-change:transform, which would otherwise make
  // position:fixed resolve against that full-height wrapper instead of the viewport).
  if (!mounted || !webgl) return null
  return createPortal(<JourneyBall lowPower={lowPower} />, document.body)
}
