'use client'
import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { SpawnFn } from './SplinterSystem'
import { getHandLandmarks } from '@/lib/poseTracking'

const HAND_MAP_X = 3.0
const HAND_MAP_Y = 2.4

// ─── Simplex noise (shared) ────────────────────────────────────────────────
const NOISE_FN = /* glsl */`
vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289v4(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289v3(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.,i1.z,i2.z,1.))+
    i.y+vec4(0.,i1.y,i2.y,1.))+
    i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`

const vertexShader = /* glsl */`
  uniform float uTime;
  uniform float uStrength;
  uniform vec2  uMouse;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying float vNoise;

  ${NOISE_FN}

  float sampleNoise(vec3 p){
    return snoise(p*0.6+uTime*0.22)*0.6
         + snoise(p*1.1-uTime*0.16)*0.3
         + snoise(p*2.2+uTime*0.35)*0.1;
  }

  void main(){
    vec3 pos  = position;
    float n   = sampleNoise(pos);

    // Mouse boost
    vec3 mDir = normalize(vec3(uMouse, 0.8));
    float mb  = smoothstep(-0.2,1.0,dot(normalize(pos),mDir))*0.65;
    float str = uStrength*(1.0+mb);

    pos += normal*n*str;
    pos += mDir*mb*0.07;
    // Jitter
    pos += normal*sin(uTime*1.8+length(position)*3.0)*0.012;

    // ── Recalculate displaced normals ──────────────────────────
    // Numerical gradient of the noise = how the surface bends
    float e = 0.025;
    vec3 grad = vec3(
      sampleNoise(position+vec3(e,0,0)) - sampleNoise(position-vec3(e,0,0)),
      sampleNoise(position+vec3(0,e,0)) - sampleNoise(position-vec3(0,e,0)),
      sampleNoise(position+vec3(0,0,e)) - sampleNoise(position-vec3(0,0,e))
    ) / (2.0*e);

    vec3 displacedNormal = normalize(normal - grad * str * 0.8);

    vNoise    = n;
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    vNormal   = normalize(normalMatrix * displacedNormal);
    vViewDir  = normalize(cameraPosition - vWorldPos);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec2  uMouse;

  varying vec3  vNormal;
  varying vec3  vViewDir;
  varying vec3  vWorldPos;
  varying float vNoise;

  // ── Schlick Fresnel ──────────────────────────────────────────
  float schlick(float cosTheta, float F0){
    return F0 + (1.0-F0)*pow(clamp(1.0-cosTheta,0.0,1.0),5.0);
  }

  // ── Blinn-Phong specular lobe ────────────────────────────────
  float spec(vec3 N, vec3 L, vec3 V, float power){
    vec3 H = normalize(L+V);
    return pow(max(dot(N,H),0.0), power);
  }

  void main(){
    vec3  N    = normalize(vNormal);
    vec3  V    = normalize(vViewDir);
    float NdotV = max(dot(N,V), 0.0);

    // ── Three orbiting lights ────────────────────────────────────
    // Key light  — warm blue-white, front-top
    vec3 L1pos = normalize(vec3(
      sin(uTime*0.45)*3.5 + uMouse.x*1.5,
      cos(uTime*0.30)*2.5 + uMouse.y*1.0 + 2.0,
      cos(uTime*0.55)*2.5 + 3.0
    ));
    // Fill light — cooler, side
    vec3 L2pos = normalize(vec3(
      cos(uTime*0.35)*3.0 - 2.0,
      sin(uTime*0.50)*1.5 - 0.5,
      sin(uTime*0.25)*2.5 - 1.5
    ));
    // Rim light  — back, subtle purple-blue
    vec3 L3pos = normalize(vec3(
      -sin(uTime*0.20)*2.5,
       cos(uTime*0.40)*1.5 - 1.0,
      -3.0
    ));

    float NdotL1 = max(dot(N, L1pos), 0.0);
    float NdotL2 = max(dot(N, L2pos), 0.0);
    float NdotL3 = max(dot(N, L3pos), 0.0);

    // ── Iridescent flowing palette (Fuse-style) ──────────────────
    // Cosine gradient (Inigo Quilez) — smooth, vivid hue cycling
    float t = clamp((vNoise + 1.0)*0.5, 0.0, 1.0);

    // Flow coordinate: more spatial variation → a full colour gradient over the blob
    float flow = t * 1.1
               + uTime * 0.06
               + vWorldPos.y * 0.40
               + vWorldPos.x * 0.28
               + (1.0 - NdotV) * 0.30;

    // Vivid blue → violet → magenta → cyan iridescence (higher amplitude)
    vec3 pa = vec3(0.50, 0.45, 0.55);
    vec3 pb = vec3(0.50, 0.48, 0.50);   // bigger amplitude = more saturated
    vec3 pc = vec3(1.00, 1.00, 1.00);
    vec3 pd = vec3(0.12, 0.36, 0.66);
    vec3 albedo = pa + pb * cos(6.28318 * (pc * flow + pd));

    vec3 albedoDeep = pa + pb * cos(6.28318 * (pc * (flow - 0.18) + pd));
    albedo = mix(albedoDeep, albedo, smoothstep(0.0, 1.0, t));

    // ── Diffuse — soft, colour stays vivid (less darkening) ──────
    vec3 diffuse = albedo * (NdotL1*0.22 + NdotL2*0.12 + NdotL3*0.08);

    // ── Specular — colourful sheen, not pure white ───────────────
    float s1 = spec(N, L1pos, V, 300.0) * NdotL1;
    float s2 = spec(N, L1pos, V,  56.0) * NdotL1 * 0.30;
    float s3 = spec(N, L2pos, V, 160.0) * NdotL2 * 0.55;
    float s4 = spec(N, L3pos, V,  90.0) * NdotL3 * 0.32;

    // Highlights pick up a shifted palette hue → oil-slick sheen
    vec3 sheen = pa + pb * cos(6.28318 * (pc * (flow + 0.30) + pd));
    vec3 specWhite = mix(sheen, vec3(1.0), 0.5);
    vec3 specular = specWhite*(s1+s2) + sheen*(s3 + s4);

    // ── Fresnel rim — bright iridescent edge ─────────────────────
    float F = schlick(NdotV, 0.42);
    vec3 rimHue = pa + pb * cos(6.28318 * (pc * (flow + 0.5) + pd));
    vec3 fresnel = mix(rimHue, vec3(0.95, 0.97, 1.0), F) * F * 0.85;

    // ── Fake environment reflection ──────────────────────────────
    vec3 R    = reflect(-V, N);
    float env = pow(max(R.y*0.5+0.5, 0.0), 2.5) * 0.18;
    env      += pow(max(-R.y*0.5+0.5, 0.0), 3.0) * 0.06;

    // ── Ambient occlusion ────────────────────────────────────────
    float ao = clamp(t*0.6 + 0.4, 0.0, 1.0);

    // ── Assemble ─────────────────────────────────────────────────
    // Strong colour base everywhere (not just lit faces) + lighting on top
    vec3 color = albedo * (0.55 + 0.45 * ao)   // vivid colour fills the whole blob
               + diffuse
               + specular
               + fresnel
               + albedo * env;

    // Saturation lift
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, 1.18);

    color = pow(color, vec3(0.92));

    gl_FragColor = vec4(color, 1.0);
  }
`

const _normalMat = new THREE.Matrix3()

export function NoiseBlob({
  spawnRef,
  posRef,
  active = false,
  offset = [0, 0],
  scaleFactor = 1,
  frozenRef,
}: {
  spawnRef?: React.MutableRefObject<SpawnFn | undefined>
  posRef?: React.MutableRefObject<THREE.Vector3>
  active?: boolean
  offset?: [number, number]
  scaleFactor?: number
  frozenRef?: React.MutableRefObject<boolean>
}) {
  const meshRef     = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const lastPt      = useRef<THREE.Vector3 | null>(null)
  const lastTime    = useRef(0)
  const cooldown    = useRef(0)
  const handPos     = useRef(new THREE.Vector2(0, 0))   // tracked target
  const flowTime    = useRef(0)                          // freezes on fist
  const scaleRef    = useRef(scaleFactor)

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!spawnRef?.current || !e.face) return

    cooldown.current = Math.max(0, cooldown.current - 1)
    if (cooldown.current > 0) return

    const now  = performance.now()
    const dt   = Math.max(now - lastTime.current, 1)
    lastTime.current = now

    if (lastPt.current) {
      const dist  = lastPt.current.distanceTo(e.point)
      const speed = (dist / dt) * 1000  // units/s

      if (speed > 1.2) {
        // Transform face normal to world space
        _normalMat.getNormalMatrix(e.object.matrixWorld)
        const worldNormal = e.face.normal.clone().applyMatrix3(_normalMat).normalize()

        const count = Math.min(Math.round(speed * 0.7), 10)
        spawnRef.current(e.point, worldNormal, count)
        cooldown.current = 5
      }
    }

    lastPt.current = e.point.clone()
  }, [spawnRef])

  const uniforms = useMemo(() => ({
    uTime:     { value: 0 },
    uStrength: { value: 0.48 },
    uMouse:    { value: new THREE.Vector2(0, 0) },
  }), [])

  useFrame(({ pointer }, delta) => {
    // Flow time freezes when a fist is held
    const frozen = frozenRef?.current ?? false
    flowTime.current += frozen ? 0 : delta

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = flowTime.current

      const m = materialRef.current.uniforms.uMouse.value as THREE.Vector2
      m.x += (pointer.x - m.x) * 0.06
      m.y += (pointer.y - m.y) * 0.06

      const scrollProgress = Math.min(window.scrollY / window.innerHeight, 1)
      materialRef.current.uniforms.uStrength.value = 0.48 + scrollProgress * 0.18
    }

    // When webcam active, the blob follows the user's hand position
    let targetX = 0, targetY = 0
    if (active) {
      const hands = getHandLandmarks()
      if (hands && hands.length) {
        let sx = 0, sy = 0
        for (const hand of hands) {
          const palm = hand[9] ?? hand[0]
          sx += (0.5 - palm.x) * HAND_MAP_X
          sy += (0.5 - palm.y) * HAND_MAP_Y
        }
        targetX = sx / hands.length
        targetY = sy / hands.length
      }
    }
    handPos.current.x += (targetX - handPos.current.x) * 0.12
    handPos.current.y += (targetY - handPos.current.y) * 0.12

    // Smooth scale changes (when splitting)
    scaleRef.current += (scaleFactor - scaleRef.current) * 0.12

    if (meshRef.current) {
      meshRef.current.rotation.y += (pointer.x * 0.35 - meshRef.current.rotation.y) * 0.04
      meshRef.current.rotation.x += (-pointer.y * 0.25 - meshRef.current.rotation.x) * 0.04
      meshRef.current.position.x = handPos.current.x + offset[0]
      meshRef.current.position.y = handPos.current.y + offset[1]
      meshRef.current.scale.setScalar(scaleRef.current)

      if (posRef) posRef.current.set(handPos.current.x, handPos.current.y, 0)
    }
  })

  return (
    <mesh ref={meshRef} onPointerMove={onPointerMove}>
      <icosahedronGeometry args={[1.4, 5]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}
