'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NoiseBlob } from './NoiseBlob'
import { SplinterSystem, type SpawnFn } from './SplinterSystem'
import { BlobTrail } from './BlobTrail'
import { getGestures } from '@/lib/handGestures'

const MAX_BLOBS = 5

// Reads hand gestures each frame: fist → freeze, pinch edge → split,
// hand gone → reset to one blob
function GestureController({
  active,
  frozenRef,
  onPinch,
  onReset,
}: {
  active: boolean
  frozenRef: React.MutableRefObject<boolean>
  onPinch: () => void
  onReset: () => void
}) {
  const wasPinch  = useRef(false)
  const absent    = useRef(0)
  const lostFired = useRef(false)

  useFrame(() => {
    if (!active) {
      frozenRef.current = false
      wasPinch.current = false
      absent.current = 0
      lostFired.current = false
      return
    }
    const g = getGestures()

    if (!g.present) {
      // Hand left the frame — reset to a single blob after a short grace period
      absent.current++
      frozenRef.current = false
      wasPinch.current = false
      if (absent.current > 28 && !lostFired.current) {
        onReset()
        lostFired.current = true
      }
      return
    }

    absent.current = 0
    lostFired.current = false
    frozenRef.current = g.fist
    if (g.pinch && !wasPinch.current) onPinch()
    wasPinch.current = g.pinch
  })
  return null
}

export function NoiseBlobScene({
  active = false,
  inView = true,
  lowPower = false,
}: {
  active?: boolean
  inView?: boolean
  lowPower?: boolean
}) {
  const spawnRef = useRef<SpawnFn | undefined>(undefined)
  const posRef   = useRef(new THREE.Vector3(0, 0, 0))
  const frozenRef = useRef(false)
  const [count, setCount] = useState(1)

  // Reset to a single blob when webcam turns off
  useEffect(() => { if (!active) setCount(1) }, [active])

  const onPinch = useCallback(() => {
    setCount((c) => Math.min(c + 1, MAX_BLOBS))
  }, [])

  const onReset = useCallback(() => setCount(1), [])

  // Ring layout of the blobs around the tracked centre
  const blobs = Array.from({ length: count }, (_, i) => {
    if (count === 1) return { offset: [0, 0] as [number, number], scale: 1 }
    const a = (i / count) * Math.PI * 2 - Math.PI / 2
    const r = 1.7
    return {
      offset: [Math.cos(a) * r, Math.sin(a) * r] as [number, number],
      scale: 0.7,
    }
  })

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{ antialias: !lowPower, alpha: true, premultipliedAlpha: false }}
      dpr={lowPower ? 1 : [1, 2]}
      frameloop={inView ? 'always' : 'never'}
      style={{ background: 'transparent' }}
    >
      <BlobTrail posRef={posRef} active={active} />
      <SplinterSystem spawnRef={spawnRef} />
      <GestureController active={active} frozenRef={frozenRef} onPinch={onPinch} onReset={onReset} />
      {blobs.map((b, i) => (
        <NoiseBlob
          key={i}
          spawnRef={i === 0 ? spawnRef : undefined}
          posRef={i === 0 ? posRef : undefined}
          active={active}
          offset={b.offset}
          scaleFactor={b.scale}
          frozenRef={frozenRef}
          detail={lowPower ? 3 : 5}
        />
      ))}
    </Canvas>
  )
}
