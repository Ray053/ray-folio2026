'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAX = 900

export function BlobTrail({
  posRef,
  active,
}: {
  posRef: React.MutableRefObject<THREE.Vector3>
  active: boolean
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const matRef    = useRef<THREE.ShaderMaterial>(null)
  const cursor    = useRef(0)
  const lastEmit  = useRef(new THREE.Vector3())

  // Per-particle CPU state
  const life    = useRef(new Float32Array(MAX))   // current age
  const maxLife = useRef(new Float32Array(MAX))   // lifespan
  const seedArr = useRef(new Float32Array(MAX))
  const velArr  = useRef(new Float32Array(MAX * 3))

  const { geometry, positions, aLife, aSeed } = useMemo(() => {
    const positions = new Float32Array(MAX * 3)
    const aLife     = new Float32Array(MAX)
    const aSeed     = new Float32Array(MAX)
    const geometry  = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aLife', new THREE.BufferAttribute(aLife, 1))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1))
    return { geometry, positions, aLife, aSeed }
  }, [])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSize: { value: 26 },
  }), [])

  useFrame(({ clock }, dt) => {
    const pos = posRef.current

    // Emit along the path when the blob has moved enough
    if (active) {
      const moved = pos.distanceTo(lastEmit.current)
      if (moved > 0.015) {
        const count = Math.min(Math.ceil(moved / 0.03), 6)
        for (let k = 0; k < count; k++) {
          const i = cursor.current
          const t = k / Math.max(count, 1)
          const ix = i * 3
          positions[ix]     = lastEmit.current.x + (pos.x - lastEmit.current.x) * t + (Math.random()-0.5)*0.12
          positions[ix + 1] = lastEmit.current.y + (pos.y - lastEmit.current.y) * t + (Math.random()-0.5)*0.12
          positions[ix + 2] = (Math.random()-0.5)*0.12
          velArr.current[ix]     = (Math.random()-0.5)*0.12
          velArr.current[ix + 1] = (Math.random()-0.5)*0.12 + 0.05
          velArr.current[ix + 2] = (Math.random()-0.5)*0.12
          life.current[i]    = 0
          maxLife.current[i] = 0.9 + Math.random() * 0.8
          seedArr.current[i] = Math.random()
          cursor.current = (i + 1) % MAX
        }
        lastEmit.current.copy(pos)
      }
    }

    // Update + write attributes
    for (let i = 0; i < MAX; i++) {
      const ml = maxLife.current[i]
      if (ml <= 0) { aLife[i] = 0; continue }
      life.current[i] += dt
      const t = life.current[i] / ml
      if (t >= 1) { aLife[i] = 0; maxLife.current[i] = 0; continue }

      const ix = i * 3
      positions[ix]     += velArr.current[ix]     * dt
      positions[ix + 1] += velArr.current[ix + 1] * dt
      positions[ix + 2] += velArr.current[ix + 2] * dt

      aLife[i] = 1 - t
      aSeed[i] = seedArr.current[i]
    }

    if (pointsRef.current) {
      const g = pointsRef.current.geometry
      ;(g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
      ;(g.getAttribute('aLife') as THREE.BufferAttribute).needsUpdate = true
      ;(g.getAttribute('aSeed') as THREE.BufferAttribute).needsUpdate = true
    }
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        vertexShader={/* glsl */`
          uniform float uSize;
          attribute float aLife;
          attribute float aSeed;
          varying float vLife;
          varying float vSeed;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * aLife * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vLife = aLife;
            vSeed = aSeed;
          }
        `}
        fragmentShader={/* glsl */`
          uniform float uTime;
          varying float vLife;
          varying float vSeed;
          vec3 palette(float t){
            vec3 a = vec3(0.52, 0.45, 0.58);
            vec3 b = vec3(0.45, 0.42, 0.45);
            vec3 c = vec3(1.0);
            vec3 d = vec3(0.15, 0.35, 0.62);
            return a + b * cos(6.28318 * (c * t + d));
          }
          void main(){
            vec2 cc = gl_PointCoord - 0.5;
            float dist = length(cc);
            if (dist > 0.5) discard;
            float soft = smoothstep(0.5, 0.04, dist);
            vec3 col = palette(vSeed + uTime * 0.05);
            gl_FragColor = vec4(col, soft * vLife * 0.55);
          }
        `}
      />
    </points>
  )
}
