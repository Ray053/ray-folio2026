'use client'
import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { NoiseBlob } from './NoiseBlob'
import { ParticleBall } from './ParticleBall'
import { DanceCylinder } from './DanceCylinder'
import type { DanceVideo } from '@/lib/payload'
import {
  screenToWorld, mix2, smoothstep, clamp01, lerp, ballScale, ballOpacity, JOURNEY, type Vec2,
} from '@/lib/scrollJourney'

// Reads scroll + DOM anchors each frame and drives the ball's position, scale, opacity.
function Controller({ groupRef, pointsRef, cylinderRef, reducedMotion }: {
  groupRef: React.RefObject<THREE.Group | null>
  pointsRef: React.RefObject<THREE.Points | null>
  cylinderRef: React.RefObject<THREE.Group | null>
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

  useFrame((state, delta) => {
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

    // Blend anchors: hero → about → trajectory → dance-zone centre.
    const toAbout = profile ? smoothstep(vh * 0.9, vh * 0.5, profile.top + profile.height / 2) : 0
    const toTraj = layer ? smoothstep(vh * 0.6, vh * 0.1, layer.top) : 0
    let target = mix2(heroPt, aboutPt, toAbout)
    if (trajPt) target = mix2(target, trajPt, toTraj)

    // Dance zone (tall pinned section): centre the ball in the viewport as it
    // pins; dancePin = progress through the sticky span (drives the cylinder).
    const dance = document.getElementById('dance-zone')?.getBoundingClientRect()
    const toDance = dance ? smoothstep(vh * 0.6, 0, dance.top) : 0
    const danceCenter: Vec2 = { x: vp.width / 2, y: vh * 0.5 }
    target = mix2(target, danceCenter, toDance)
    const dancePin = dance ? clamp01(-dance.top / Math.max(1, dance.height - vh)) : 0

    // Screen → world, smoothed.
    const world = screenToWorld(target.x, target.y, vp, cam)
    cur.current.x += (world.x - cur.current.x) * 0.15
    cur.current.y += (world.y - cur.current.y) * 0.15
    g.position.set(cur.current.x, cur.current.y, 0)
    // Settle to a compact particle ball at the dance centre — small enough
    // to leave room for the video cards that orbit around it in Phase 2b.
    g.scale.setScalar(lerp(ballScale(progress), 0.85, toDance))

    // Cross-fade mesh → particle ball across the dance morph.
    const morph = toDance
    setOpacity(g, ballOpacity(progress) * (1 - morph))
    const pts = pointsRef.current
    const pMat = pts?.material as THREE.ShaderMaterial | undefined
    if (pMat?.uniforms) {
      pMat.uniforms.uOpacity.value = morph
      pMat.uniforms.uExpand.value = morph
      pMat.uniforms.uTime.value += delta
      const m = pMat.uniforms.uMouse.value as THREE.Vector2
      m.x += (state.pointer.x - m.x) * 0.08
      m.y += (state.pointer.y - m.y) * 0.08
    }
    if (pts && !reducedMotion) pts.rotation.y += 0.0016

    // Dance cylinder: centre on the ball, rotate by pin progress; near the end
    // of the pin, slide the cards off to the right and fade them out.
    const cyl = cylinderRef.current
    if (cyl) {
      cyl.position.copy(g.position)
      cyl.rotation.y = reducedMotion ? 0 : dancePin * Math.PI * 2
      // cards slide IN from the right on enter, OUT to the right on exit
      const enterT = smoothstep(0.0, 0.12, dancePin)
      const exitT = smoothstep(0.82, 1.0, dancePin)
      cyl.position.x = g.position.x + (1 - enterT) * 9 + exitT * 9
      const cardsOpacity = enterT * (1 - exitT)
      cyl.children.forEach(ch => {
        const mat = (ch as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
        if (mat && 'opacity' in mat) mat.opacity = cardsOpacity
      })
      cyl.visible = toDance > 0.01 && cardsOpacity > 0.001
    }
  })

  return null
}

export function JourneyBall({ lowPower, danceItems = [] }: { lowPower: boolean; danceItems?: DanceVideo[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const cylinderRef = useRef<THREE.Group>(null)
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
      const dance = document.getElementById('dance-zone')?.getBoundingClientRect()
      const layer = document.getElementById('journey-layer')?.getBoundingClientRect()
      const bottom = dance ? dance.bottom : (layer ? layer.bottom : 1)
      setInRange(bottom > -200)
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
          <ParticleBall pointsRef={pointsRef} count={lowPower ? 600 : 1400} />
        </group>
        <group ref={cylinderRef} visible={false}>
          <DanceCylinder items={danceItems} groupRef={cylinderRef} lowPower={lowPower} />
        </group>
        <Controller groupRef={groupRef} pointsRef={pointsRef} cylinderRef={cylinderRef} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
