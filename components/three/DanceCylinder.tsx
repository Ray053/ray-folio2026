'use client'
import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { DanceVideo } from '@/lib/payload'

const R = 2.7        // cylinder radius (world units)
const H = 1.6        // base plane height; width follows each video's aspect ratio
const FRONT = 1.25   // front-plane enlarge factor
// tints for planes without a video (fallback)
const PALETTE = ['#0033FF', '#00C2FF', '#3D6BFF', '#8AA5FF', '#CCFF00', '#001A80']

export function DanceCylinder({ items, groupRef, lowPower }: {
  items: DanceVideo[]
  groupRef: React.RefObject<THREE.Group | null>
  lowPower: boolean
}) {
  const n = Math.max(items.length, 1)
  const [front, setFront] = useState(0)

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []) // unit plane; scaled per frame
  const aspects = useRef<number[]>(items.map(() => 9 / 16))          // updated on metadata load
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  // One <video> + VideoTexture per item; capture natural aspect on metadata load.
  const videos = useMemo(() => items.map((it, i) => {
    if (typeof document === 'undefined' || !it.videoSrc) return null
    const v = document.createElement('video')
    v.src = it.videoSrc
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'
    v.addEventListener('loadedmetadata', () => {
      if (v.videoWidth && v.videoHeight) aspects.current[i] = v.videoWidth / v.videoHeight
    })
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

  // Front index from the group rotation + size each plane to its video aspect.
  useFrame(() => {
    const g = groupRef.current
    if (g) {
      const step = (Math.PI * 2) / n
      const idx = ((Math.round(-g.rotation.y / step) % n) + n) % n
      if (idx !== front) setFront(idx)
    }
    for (let i = 0; i < n; i++) {
      const m = meshRefs.current[i]
      if (!m) continue
      const asp = aspects.current[i] || (9 / 16)
      const f = i === front ? FRONT : 1
      m.scale.set(H * asp * f, H * f, 1)
    }
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
        return (
          <mesh
            key={it.id}
            ref={el => { meshRefs.current[i] = el }}
            geometry={geometry}
            material={materials[i]}
            position={[Math.sin(a) * R, 0, Math.cos(a) * R]}
            rotation={[0, a, 0]}
          />
        )
      })}
    </>
  )
}
