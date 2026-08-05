'use client'
import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { NoiseBlob } from './NoiseBlob'
import {
  screenToWorld, mix2, smoothstep, clamp01, ballScale, ballOpacity, JOURNEY, type Vec2,
} from '@/lib/scrollJourney'

// Reads scroll + DOM anchors each frame and drives the ball's position, scale, opacity.
function Controller({ groupRef, reducedMotion }: {
  groupRef: React.RefObject<THREE.Group | null>
  reducedMotion: boolean
}) {
  const { size } = useThree()
  const cam = { fov: JOURNEY.camFov, distance: JOURNEY.camDistance }
  const cur = useRef<Vec2>({ x: 0, y: 0 })

  // Reach the NoiseBlob mesh's ShaderMaterial to write uOpacity directly.
  const setOpacity = (g: THREE.Group, o: number) => {
    const mesh = g.children[0] as THREE.Mesh | undefined
    const mat = mesh?.material as THREE.ShaderMaterial | undefined
    if (mat?.uniforms?.uOpacity) mat.uniforms.uOpacity.value = o
  }

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const vp = { width: size.width, height: size.height }

    if (reducedMotion) {
      // Park statically in the hero (viewport centre), big.
      const w = screenToWorld(vp.width / 2, vp.height * 0.5, vp, cam)
      g.position.set(w.x, w.y, 0)
      g.scale.setScalar(ballScale(0))
      setOpacity(g, ballOpacity(0))
      return
    }

    const scrollY = window.scrollY
    const vh = vp.height

    // Anchor DOM rects (viewport-space).
    const profile = document.getElementById('profile')?.getBoundingClientRect()
    const layerEl = document.getElementById('journey-layer')
    const pathEl = document.getElementById('journey-path') as unknown as SVGPathElement | null
    const layer = layerEl?.getBoundingClientRect()

    // Global progress: 0 at top of page → 1 near the bottom of the trajectory layer.
    const journeyEnd = layer ? scrollY + layer.bottom - vh * 0.5 : vh * 3
    const progress = clamp01(scrollY / Math.max(1, journeyEnd))

    // Candidate anchors in screen px.
    const heroPt: Vec2 = { x: vp.width / 2, y: vh * 0.46 }
    const aboutPt: Vec2 = profile
      ? { x: vp.width / 2, y: profile.top + profile.height / 2 }
      : heroPt

    let trajPt: Vec2 | null = null
    if (layer && pathEl) {
      // progress within the trajectory layer (0 at its top entering, 1 at bottom)
      const tp = clamp01((vh * 0.75 - layer.top) / Math.max(1, layer.height))
      const len = pathEl.getTotalLength()
      const pt = pathEl.getPointAtLength(len * tp) // normalized 0..1 in the layer's viewBox
      trajPt = { x: layer.left + pt.x * layer.width, y: layer.top + pt.y * layer.height }
    }

    // Blend anchors: hero → about (as #profile centre approaches viewport middle),
    // about → trajectory (as the trajectory layer scrolls in).
    const toAbout = profile ? smoothstep(vh * 0.9, vh * 0.5, profile.top + profile.height / 2) : 0
    const toTraj = layer ? smoothstep(vh * 0.6, vh * 0.1, layer.top) : 0
    let target = mix2(heroPt, aboutPt, toAbout)
    if (trajPt) target = mix2(target, trajPt, toTraj)

    // Screen → world, smoothed.
    const world = screenToWorld(target.x, target.y, vp, cam)
    cur.current.x += (world.x - cur.current.x) * 0.15
    cur.current.y += (world.y - cur.current.y) * 0.15
    g.position.set(cur.current.x, cur.current.y, 0)
    g.scale.setScalar(ballScale(progress))
    setOpacity(g, ballOpacity(progress))
  })

  return null
}

export function JourneyBall({ lowPower }: { lowPower: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [inRange, setInRange] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const u = () => setReducedMotion(mq.matches); u()
    mq.addEventListener('change', u)
    return () => mq.removeEventListener('change', u)
  }, [])

  // Pause rendering once fully scrolled past the trajectory layer.
  useEffect(() => {
    const onScroll = () => {
      const layer = document.getElementById('journey-layer')?.getBoundingClientRect()
      setInRange(!layer || layer.bottom > -200)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div aria-hidden style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, JOURNEY.camDistance], fov: JOURNEY.camFov }}
        gl={{ antialias: !lowPower, alpha: true, premultipliedAlpha: false }}
        dpr={lowPower ? 1 : [1, 2]}
        frameloop={inRange ? 'always' : 'never'}
        style={{ background: 'transparent' }}
      >
        <group ref={groupRef}>
          <NoiseBlob active={false} scaleFactor={1} detail={lowPower ? 3 : 5} />
        </group>
        <Controller groupRef={groupRef} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
