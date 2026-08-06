'use client'
import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { DanceVideo } from '@/lib/payload'

const R = 2.7        // cylinder radius (world units)
const PLANE_W = 1.0
const PLANE_H = 1.7  // portrait dance clips (smaller cards)
// tints for planes without a video (fallback)
const PALETTE = ['#0033FF', '#00C2FF', '#3D6BFF', '#8AA5FF', '#CCFF00', '#001A80']

export function DanceCylinder({ items, groupRef, lowPower }: {
  items: DanceVideo[]
  groupRef: React.RefObject<THREE.Group | null>
  lowPower: boolean
}) {
  const n = Math.max(items.length, 1)
  const [front, setFront] = useState(0)

  const geometry = useMemo(() => new THREE.PlaneGeometry(PLANE_W, PLANE_H), [])

  // One <video> + VideoTexture per item that has a videoSrc.
  const videos = useMemo(() => items.map(it => {
    if (typeof document === 'undefined' || !it.videoSrc) return null
    const v = document.createElement('video')
    v.src = it.videoSrc
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'
    v.load()
    return v
  }), [items])

  const videoTex = useMemo(() => videos.map(v => {
    if (!v) return null
    const t = new THREE.VideoTexture(v)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }), [videos])

  const materials = useMemo(() => items.map((_, i) => new THREE.MeshBasicMaterial({
    map: videoTex[i] ?? null,
    color: new THREE.Color(videoTex[i] ? '#ffffff' : PALETTE[i % PALETTE.length]),
    side: THREE.DoubleSide, toneMapped: false, transparent: true,
  })), [items, videoTex])

  // Camera-facing plane index from the group rotation; setState only on change.
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const step = (Math.PI * 2) / n
    const idx = ((Math.round(-g.rotation.y / step) % n) + n) % n
    if (idx !== front) setFront(idx)
  })

  // Play the front video, pause the rest (paused ones show their current frame).
  useEffect(() => {
    videos.forEach((v, i) => {
      if (!v) return
      if (i === front && !lowPower) v.play().catch(() => {})
      else v.pause()
    })
  }, [front, videos, lowPower])

  return (
    <>
      {items.map((it, i) => {
        const a = (i / n) * Math.PI * 2
        const x = Math.sin(a) * R
        const z = Math.cos(a) * R
        return (
          <mesh
            key={it.id}
            geometry={geometry}
            material={materials[i]}
            position={[x, 0, z]}
            rotation={[0, a, 0]}
            scale={i === front ? 1.25 : 1}
          />
        )
      })}
    </>
  )
}
