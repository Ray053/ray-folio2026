'use client'
import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { LiquidSculpture, MetalStudio } from './LiquidSculpture'
import { ParticleBall } from './ParticleBall'
import { DanceCylinder } from './DanceCylinder'
import type { DanceVideo } from '@/lib/payload'
import {
  screenToWorld, mix2, smoothstep, clamp01, lerp, ballScale, heroShapeMorph, heroSphereBlend, JOURNEY, type Vec2,
} from '@/lib/scrollJourney'

// Reads scroll + DOM anchors each frame and drives the ball's position, scale, opacity.
function Controller({ groupRef, pointsRef, cylinderRef, pointerRef, reducedMotion }: {
  groupRef: React.RefObject<THREE.Group | null>
  pointsRef: React.RefObject<THREE.Points | null>
  cylinderRef: React.RefObject<THREE.Group | null>
  pointerRef: React.RefObject<{ x: number; y: number; active: boolean }>
  reducedMotion: boolean
}) {
  const { size, camera } = useThree()
  const cam = { fov: JOURNEY.camFov, distance: JOURNEY.camDistance }
  const cur = useRef<Vec2>({ x: 0, y: 0 })
  const hover = useRef(0)
  const projected = useRef(new THREE.Vector3())
  const lightRef = useRef<THREE.DirectionalLight>(null)

  // Drive coverage independently of the metal's subtle surface transparency.
  const setOpacity = (g: THREE.Group, o: number) => {
    const shape = g.getObjectByName('liquid-shape') as THREE.Mesh | undefined
    const shapeMat = shape?.material as THREE.ShaderMaterial | undefined
    const morph = shapeMat?.uniforms?.uMorph?.value as number | undefined
    const sphereBlend = heroSphereBlend(morph ?? 1)
    if (shapeMat?.uniforms?.uOpacity) shapeMat.uniforms.uOpacity.value = o * (1 - sphereBlend)
    const sphere = g.getObjectByName('liquid-sphere') as THREE.Mesh | undefined
    const sphereMat = sphere?.material as THREE.ShaderMaterial | undefined
    if (sphere && sphereMat) {
      sphereMat.uniforms.uOpacity.value = o * sphereBlend
      sphere.visible = o * sphereBlend > 0.001
    }
    if (shape) shape.visible = o * (1 - sphereBlend) > 0.001
  }

  const setShapeMorph = (g: THREE.Group, morph: number) => {
    const mesh = g.getObjectByName('liquid-shape') as THREE.Mesh | undefined
    const mat = mesh?.material as THREE.ShaderMaterial | undefined
    if (mat?.uniforms?.uMorph) mat.uniforms.uMorph.value = morph
  }

  // `target` is the already-blended mouse direction (idle drift <-> real
  // pointer, mixed by hover proximity upstream) and `hoverUniform` likewise
  // blends the idle shimmer baseline with real hover strength.
  const setBlobMouse = (g: THREE.Group, target: { x: number; y: number }, hoverUniform: number, damping: number) => {
    const mesh = g.getObjectByName('liquid-shape') as THREE.Mesh | undefined
    const mat = mesh?.material as THREE.ShaderMaterial | undefined
    const mouse = mat?.uniforms?.uMouse?.value as THREE.Vector2 | undefined
    if (mouse) {
      mouse.x += (target.x - mouse.x) * damping
      mouse.y += (target.y - mouse.y) * damping
    }
    if (mat?.uniforms?.uHover) mat.uniforms.uHover.value = hoverUniform
  }

  useFrame((state, delta) => {
    const g = groupRef.current
    if (!g) return
    const vp = { width: size.width, height: size.height }

    if (reducedMotion) {
      // Park statically in the hero (viewport centre), big.
      const w = screenToWorld(vp.width * .5, vp.height * .5, vp, cam)
      g.position.set(w.x, w.y, 0)
      g.scale.setScalar(ballScale(0) * (vp.width < 768 ? 0.64 : 1))
      setShapeMorph(g, 0)
      setOpacity(g, 1)
      g.rotation.set(1.17, .06, -.12)
      hover.current = 0
      if (lightRef.current) {
        lightRef.current.position.set(-3, 4, 5)
        lightRef.current.intensity = 2
      }
      g.position.y += window.scrollY / vp.height * 4.37
      return
    }

    const scrollY = window.scrollY
    const vh = vp.height
    setShapeMorph(g, heroShapeMorph(scrollY, vh))

    // Anchor DOM rects (viewport-space).
    const profile = document.getElementById('profile')?.getBoundingClientRect()
    const layerEl = document.getElementById('journey-layer')
    const pathEl = document.getElementById('journey-path') as unknown as SVGPathElement | null
    const layer = layerEl?.getBoundingClientRect()

    // Global progress: 0 at top of page → 1 near the bottom of the trajectory layer.
    const journeyEnd = layer ? scrollY + layer.bottom - vh * 0.5 : vh * 3
    const progress = clamp01(scrollY / Math.max(1, journeyEnd))

    // Candidate anchors in screen px.
    const heroPt: Vec2 = { x: vp.width * .5, y: vh * .5 }
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
    const heroMorph = heroShapeMorph(scrollY, vh)
    const baseTiltX = lerp(1.17, 0, heroMorph)
    const baseTurnY = lerp(.06, 0, heroMorph)
    const damping = 1 - Math.exp(-10 * Math.min(delta, .05))
    projected.current.copy(g.position).project(camera)
    const worldHeight = 2 * JOURNEY.camDistance * Math.tan(THREE.MathUtils.degToRad(JOURNEY.camFov / 2))
    const radiusX = 3.2 * g.scale.x / (worldHeight * vp.width / vp.height)
    const radiusY = 2 * g.scale.y / worldHeight
    const localX = (pointerRef.current.x - projected.current.x) / radiusX
    const localY = (pointerRef.current.y - projected.current.y) / radiusY
    const proximity = pointerRef.current.active ? 1 - smoothstep(.8, 1.5, Math.hypot(localX, localY)) : 0
    hover.current += (proximity - hover.current) * damping
    const mouseX = THREE.MathUtils.clamp(localX, -1, 1)
    const mouseY = THREE.MathUtils.clamp(localY, -1, 1)

    // Idle life: without this the sculpture only reads as "liquid chrome"
    // while actively hovered — a slow autonomous sway + a wandering phantom
    // light keep the surface highlights drifting at rest too, like a piece
    // on a turntable rather than a frozen render.
    const t = state.clock.elapsedTime
    const idleSwayY = Math.sin(t * 0.42) * 0.26
    const idleSwayX = Math.cos(t * 0.32) * 0.09
    const idleMouseX = Math.sin(t * 0.52) * 0.55
    const idleMouseY = Math.cos(t * 0.4) * 0.45
    const idleHover = 0.16 + 0.08 * Math.sin(t * 0.75)
    const targetMouseX = lerp(idleMouseX, mouseX, hover.current)
    const targetMouseY = lerp(idleMouseY, mouseY, hover.current)
    const hoverUniform = Math.max(hover.current, idleHover)

    g.rotation.y += (baseTurnY + idleSwayY + mouseX * .16 * hover.current - g.rotation.y) * damping
    g.rotation.x += (baseTiltX + idleSwayX - mouseY * .10 * hover.current - g.rotation.x) * damping
    g.rotation.z = lerp(-.12, 0, heroMorph)
    setBlobMouse(g, { x: targetMouseX, y: targetMouseY }, hoverUniform, damping)
    if (lightRef.current) {
      lightRef.current.position.x = -3 + idleMouseX * 2 + mouseX * hover.current * 5
      lightRef.current.position.y = 4 + idleMouseY * 1.5 + mouseY * hover.current * 3
      lightRef.current.intensity = 2 + hoverUniform * 1.2
    }
    // Settle to a small particle ball at the dance centre — it shrinks as the
    // section pins so the orbiting video cards become the focus, then grows
    // back to full size in the pin's tail as the cards disperse toward the footer.
    const danceScale = lerp(0.45, 1.0, smoothstep(0.82, 1, dancePin))
    const responsiveScale = vp.width < 768 ? lerp(0.64, 0.82, progress) : 1
    const solidScale = Math.min(ballScale(progress), lerp(1, .5, heroMorph))
    g.scale.setScalar(lerp(solidScale, danceScale, toDance) * responsiveScale)

    // Cross-fade mesh → particle ball across the dance morph.
    const morph = toDance
    setOpacity(g, 1 - morph)
    const pts = pointsRef.current
    const pMat = pts?.material as THREE.ShaderMaterial | undefined
    if (pMat?.uniforms) {
      pMat.uniforms.uOpacity.value = morph
      pMat.uniforms.uExpand.value = morph
      pMat.uniforms.uTime.value += delta
      const m = pMat.uniforms.uMouse.value as THREE.Vector2
      m.x += (pointerRef.current.x - m.x) * 0.08
      m.y += (pointerRef.current.y - m.y) * 0.08
    }
    if (pts && !reducedMotion) pts.rotation.y += 0.0016

    // Dance ring: a perspective carousel centred on the ball. It makes exactly
    // ONE full revolution over the pin so every clip passes the camera-facing
    // front once. A scale in/out (assemble → disperse) avoids a hard pop when
    // the section enters/leaves — all cards stay visible through the middle.
    const cyl = cylinderRef.current
    if (cyl) {
      cyl.position.copy(g.position)
      cyl.rotation.y = reducedMotion ? 0 : dancePin * Math.PI * 2
      const inOut = smoothstep(0, 0.12, dancePin) * (1 - smoothstep(0.9, 1, dancePin))
      cyl.scale.setScalar(inOut)
      cyl.visible = toDance > 0.01 && inOut > 0.01
    }
  })

  return <directionalLight ref={lightRef} position={[-3, 4, 5]} intensity={2} color="#dbeaff" />
}

export function JourneyBall({ lowPower, danceItems = [] }: { lowPower: boolean; danceItems?: DanceVideo[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const cylinderRef = useRef<THREE.Group>(null)
  const pointerRef = useRef({ x: 0, y: 0, active: false })
  const backdropRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [inRange, setInRange] = useState(true)

  // Global pointer (normalized -1..1) — feeds the particle disturbance without
  // the R3F canvas needing to capture events (so page hovers still work).
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
      pointerRef.current.active = true
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    const onLeave = () => { pointerRef.current = { x: 0, y: 0, active: false } }
    document.addEventListener('mouseleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const u = () => setReducedMotion(mq.matches); u()
    mq.addEventListener('change', u)
    return () => mq.removeEventListener('change', u)
  }, [])

  // Pause rendering once fully scrolled past the trajectory layer.
  useEffect(() => {
    const onScroll = () => {
      if (backdropRef.current) backdropRef.current.style.opacity = String(Math.max(0, 1 - window.scrollY / Math.max(1, window.innerHeight)))
      const dance = document.getElementById('dance-zone')?.getBoundingClientRect()
      const layer = document.getElementById('journey-layer')?.getBoundingClientRect()
      const bottom = dance ? dance.bottom : (layer ? layer.bottom : 1)
      setInRange(bottom > -200)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (<>
    <div aria-hidden ref={backdropRef} style={{position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none'}}>
      <div className="hero-stage" />
    </div>
    <div aria-hidden style={{
      position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, JOURNEY.camDistance], fov: JOURNEY.camFov }}
        gl={{ antialias: !lowPower, alpha: true, premultipliedAlpha: false }}
        dpr={lowPower ? 1 : [1, 2]}
        frameloop={inRange ? 'always' : 'never'}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <group ref={groupRef}>
          <LiquidSculpture lowPower={lowPower} reducedMotion={reducedMotion} />
          <ParticleBall pointsRef={pointsRef} count={lowPower ? 600 : 1400} />
        </group>
        <group ref={cylinderRef} visible={false}>
          <DanceCylinder items={danceItems} groupRef={cylinderRef} lowPower={lowPower} />
        </group>
        <Controller groupRef={groupRef} pointsRef={pointsRef} cylinderRef={cylinderRef} pointerRef={pointerRef} reducedMotion={reducedMotion} />
        <MetalStudio />
        <ambientLight intensity={0.15} />
      </Canvas>
    </div></>
  )
}
