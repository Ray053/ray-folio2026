'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const JourneyBall = dynamic(
  () => import('./JourneyBall').then(m => m.JourneyBall),
  { ssr: false }
)

export function JourneyBallMount() {
  const [lowPower, setLowPower] = useState(false)
  const [webgl, setWebgl] = useState(true)
  useEffect(() => {
    setLowPower(window.matchMedia('(max-width: 768px), (pointer: coarse)').matches)
    try {
      const c = document.createElement('canvas')
      setWebgl(!!(c.getContext('webgl2') || c.getContext('webgl')))
    } catch { setWebgl(false) }
  }, [])
  if (!webgl) return null
  return <JourneyBall lowPower={lowPower} />
}
