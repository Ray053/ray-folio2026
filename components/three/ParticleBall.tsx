'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { fibonacciSphere } from '@/lib/particles'

const vertexShader = /* glsl */`
  attribute float aRnd;
  uniform float uExpand;
  uniform float uSize;
  varying float vRnd;
  void main() {
    vRnd = aRnd;
    // drift outward a touch as the ball dissolves
    vec3 p = position * (1.0 + uExpand * (0.15 + aRnd * 0.5));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */`
  precision mediump float;
  uniform float uOpacity;
  varying float vRnd;
  void main() {
    // round point
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float soft = smoothstep(0.25, 0.0, d);
    vec3 blue = vec3(0.000, 0.200, 1.000); // #0033FF
    vec3 lime = vec3(0.800, 1.000, 0.000); // #CCFF00
    vec3 col = mix(blue, lime, step(0.82, vRnd)); // ~18% lime specks
    gl_FragColor = vec4(col, uOpacity * soft);
  }
`

export function ParticleBall({
  count = 1400, radius = 1.4, pointsRef,
}: { count?: number; radius?: number; pointsRef: React.RefObject<THREE.Points | null> }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(fibonacciSphere(count, radius), 3))
    const rnd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const s = Math.sin(i * 12.9898) * 43758.5453 // deterministic pseudo-random
      rnd[i] = s - Math.floor(s)
    }
    geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1))
    return geo
  }, [count, radius])

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 0 }, uExpand: { value: 0 }, uSize: { value: 3.2 } },
  }), [])

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
