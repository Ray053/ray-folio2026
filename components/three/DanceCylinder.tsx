'use client'
import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { DanceVideo } from '@/lib/payload'

const R = 3.0        // cylinder radius (world units) — larger than the ~0.85 ball
const PLANE_W = 1.4
const PLANE_H = 2.4  // portrait dance clips

export function DanceCylinder({ items, groupRef, lowPower }: {
  items: DanceVideo[]
  groupRef: React.RefObject<THREE.Group | null>
  lowPower: boolean
}) {
  const n = Math.max(items.length, 1)
  const [front, setFront] = useState(0)

  const geometry = useMemo(() => new THREE.PlaneGeometry(PLANE_W, PLANE_H), [])
  const materials = useMemo(
    () => items.map(() => new THREE.MeshBasicMaterial({
      color: new THREE.Color('#0033FF'), side: THREE.DoubleSide, toneMapped: false,
    })),
    [items],
  )
  const thumbs = useRef<(THREE.Texture | null)[]>([])

  // Load thumbnails imperatively; solid blue until each resolves.
  useEffect(() => {
    thumbs.current = items.map(() => null)
    const loader = new THREE.TextureLoader()
    items.forEach((it, i) => {
      if (!it.thumbnailSrc) return
      loader.load(it.thumbnailSrc, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        thumbs.current[i] = tex
        materials[i].map = tex
        materials[i].color.set('#ffffff')
        materials[i].needsUpdate = true
      })
    })
    return () => { thumbs.current.forEach(t => t?.dispose()) }
  }, [items, materials])

  // One shared video texture for the camera-facing plane.
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoTex = useMemo(() => {
    if (typeof document === 'undefined') return null
    const v = document.createElement('video')
    v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = 'anonymous'
    videoRef.current = v
    const t = new THREE.VideoTexture(v)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const prevFront = useRef(-1)

  // Camera-facing plane index from the group rotation; setState only on change.
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const step = (Math.PI * 2) / n
    const idx = ((Math.round(-g.rotation.y / step) % n) + n) % n
    if (idx !== front) setFront(idx)
  })

  // Swap the front plane to the (playing) video; restore the previous to its thumbnail.
  useEffect(() => {
    if (lowPower || !videoTex) return
    const p = prevFront.current
    if (p >= 0 && p !== front && materials[p]) {
      materials[p].map = thumbs.current[p] ?? null
      materials[p].color.set(thumbs.current[p] ? '#ffffff' : '#0033FF')
      materials[p].needsUpdate = true
    }
    const src = items[front]?.videoSrc
    const v = videoRef.current
    if (v && src && materials[front]) {
      v.src = src
      v.play().catch(() => {})
      materials[front].map = videoTex
      materials[front].color.set('#ffffff')
      materials[front].needsUpdate = true
    }
    prevFront.current = front
  }, [front, items, lowPower, videoTex, materials])

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
            scale={i === front ? 1.3 : 1}
          />
        )
      })}
    </>
  )
}
