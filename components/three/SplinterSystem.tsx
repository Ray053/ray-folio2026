'use client'
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type SpawnFn = (
  point: THREE.Vector3,
  normal: THREE.Vector3,
  count?: number
) => void

type Splinter = {
  pos:      THREE.Vector3
  vel:      THREE.Vector3
  rotAxis:  THREE.Vector3
  rotSpeed: number
  angle:    number
  scale:    number
  life:     number
  maxLife:  number
}

const MAX   = 128
const dummy = new THREE.Object3D()
const color = new THREE.Color()

export function SplinterSystem({
  spawnRef,
}: {
  spawnRef: React.MutableRefObject<SpawnFn | undefined>
}) {
  const meshRef   = useRef<THREE.InstancedMesh>(null)
  const particles = useRef<Splinter[]>([])

  const geo = useRef(new THREE.TetrahedronGeometry(0.12, 0))
  const mat = useRef(new THREE.MeshBasicMaterial({ vertexColors: true }))

  // Register the spawn function so NoiseBlob can call it
  useEffect(() => {
    spawnRef.current = (point, normal, count = 6) => {
      for (let i = 0; i < count; i++) {
        const outward = normal.clone().normalize()
        const rand = new THREE.Vector3(
          (Math.random() - 0.5) * 4.5,
          (Math.random() - 0.5) * 4.5 + 0.5,
          (Math.random() - 0.5) * 4.5,
        )
        particles.current.push({
          pos:      point.clone().addScaledVector(normal, 0.06 + Math.random() * 0.14),
          vel:      outward.multiplyScalar(2.0 + Math.random() * 3.0).add(rand),
          rotAxis:  new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
          rotSpeed: (Math.random() - 0.5) * 8,
          angle:    Math.random() * Math.PI * 2,
          scale:    1.0 + Math.random() * 2.0,
          life:     0,
          maxLife:  38 + Math.floor(Math.random() * 28),
        })
      }
      if (particles.current.length > MAX) {
        particles.current = particles.current.slice(-MAX)
      }
    }
  }, [spawnRef])

  useFrame((_, dt) => {
    const mesh = meshRef.current
    if (!mesh) return

    particles.current = particles.current.filter(p => p.life < p.maxLife)
    const n = particles.current.length

    for (let i = 0; i < n; i++) {
      const p = particles.current[i]

      // Physics
      p.vel.y   -= 2.2 * dt
      p.vel.multiplyScalar(0.96)
      p.pos.addScaledVector(p.vel, dt)
      p.angle   += p.rotSpeed * dt
      p.life++

      const t = p.life / p.maxLife
      const s = p.scale * (1 - t * 0.70) * 0.26

      dummy.position.copy(p.pos)
      dummy.setRotationFromAxisAngle(p.rotAxis, p.angle)
      dummy.scale.setScalar(Math.max(s, 0.001))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // Metallic blue-white → dark fade
      const b = Math.pow(1 - t, 0.6)
      color.setRGB(b * 0.48, b * 0.72, b * 0.95)
      mesh.setColorAt(i, color)
    }

    // Hide unused slots
    for (let i = n; i < mesh.count; i++) {
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo.current, mat.current, MAX]}
      frustumCulled={false}
    />
  )
}
