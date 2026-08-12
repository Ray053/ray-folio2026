'use client'
import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { DanceVideo } from '@/lib/payload'

const R = 3.0        // ring radius around the ball
const H = 1.3        // base plane height; width follows each video's aspect ratio
const FRONT = 1.35   // front-plane enlarge factor
// tints for planes without a video (fallback)
const PALETTE = ['#0033FF', '#00C2FF', '#3D6BFF', '#8AA5FF', '#CCFF00', '#001A80']
// working default clips to fall back to when a CMS media file is missing
const DANCE_FALLBACK = ['/dance1.webm', '/dance2.webm', '/dance3.mp4']

/**
 * A rotating 3D ring of dance clips around the particle ball. All cards stay
 * visible (perspective makes the far ones smaller / angled); the card nearest
 * the camera enlarges and plays its video. The ring's rotation + scale are
 * driven by the parent group (from JourneyBall's controller).
 */
export function DanceCylinder({ items, groupRef, lowPower }: {
  items: DanceVideo[]
  groupRef: React.RefObject<THREE.Group | null>
  lowPower: boolean
}) {
  const n = Math.max(items.length, 1)
  const [front, setFront] = useState(0)

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const aspects = useRef<number[]>(items.map(() => 9 / 16))
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  const videos = useMemo(() => items.map((it, i) => {
    if (typeof document === 'undefined' || !it.videoSrc) return null
    const v = document.createElement('video')
    v.src = it.videoSrc
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'
    v.addEventListener('loadedmetadata', () => {
      if (v.videoWidth && v.videoHeight) aspects.current[i] = v.videoWidth / v.videoHeight
    })
    v.addEventListener('error', () => {
      const fb = DANCE_FALLBACK[i % DANCE_FALLBACK.length]
      if (!v.src.endsWith(fb)) { v.src = fb; v.load() }
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

  // Each frame: size every plane to its video aspect + pick the front-most
  // (nearest-camera) card to enlarge. All cards stay visible.
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const rot = g.rotation.y
    let frontI = 0
    let frontZ = -Infinity
    for (let i = 0; i < n; i++) {
      const m = meshRefs.current[i]
      if (!m) continue
      const worldAngle = (i / n) * Math.PI * 2 + rot
      const asp = aspects.current[i] || (9 / 16)
      m.scale.set(H * asp, H, 1)
      const z = Math.cos(worldAngle)
      if (z > frontZ) { frontZ = z; frontI = i }
    }
    if (frontI !== front) setFront(frontI)
    const fm = meshRefs.current[front]
    if (fm) {
      const asp = aspects.current[front] || (9 / 16)
      fm.scale.set(H * asp * FRONT, H * FRONT, 1)
    }
  })

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
