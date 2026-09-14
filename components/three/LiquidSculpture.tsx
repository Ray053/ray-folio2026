'use client'

import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { createMobiusMorphGeometry } from '@/lib/mobiusGeometry'

// A lightly translucent blue metal, retaining the studio reflections.
function createMetal(sphere = false) {
  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uMorph: { value: sphere ? 1 : 0 },
    uOpacity: { value: sphere ? 0 : 1 },
    uHover: { value: 0 },
  }
  const material = Object.assign(new THREE.MeshPhysicalMaterial({
    color: '#0c3fc4', metalness: 0.92, roughness: 0.14,
    clearcoat: 0.8, clearcoatRoughness: 0.08,
    envMapIntensity: 2.0, side: THREE.DoubleSide,
    transparent: true, opacity: 1, depthWrite: false, forceSinglePass: true,
  }), { uniforms })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = `
      attribute vec3 aMobius;
      attribute vec3 aMobiusNormal;
      attribute vec3 aSphereNormal;
      uniform float uTime;
      uniform float uMorph;
      uniform vec2 uMouse;
      varying vec3 vMetalLocal;
      // Fast ripple layered under a slower, larger-wavelength swell so the
      // idle body visibly bulges and settles rather than just shimmering.
      float flow(vec3 p) {
        float fast = sin(p.x*2.4 + p.y*1.3 + uTime*.32)
          * sin(p.z*2.1 - p.y*1.8 - uTime*.24);
        float swell = sin(p.x*0.9 - p.z*0.7 + uTime*.15)
          * cos(p.y*0.8 + uTime*.11);
        return fast + swell * 0.7;
      }
    ` + shader.vertexShader
    shader.vertexShader = shader.vertexShader
      .replace('#include <beginnormal_vertex>', `
        vec3 objectNormal = normalize(mix(aMobiusNormal, aSphereNormal, uMorph) + vec3(0.00001));
        vec3 samplePosition = mix(aMobius, position, uMorph);
        // Idle breathing: the whole deformation slowly grows/relaxes even at
        // rest, instead of holding a constant-amplitude ripple.
        float breathe = 1.0 + 0.45 * sin(uTime * 0.55);
        float e = .015;
        vec3 gradient = vec3(
          flow(samplePosition + vec3(e,0,0)) - flow(samplePosition - vec3(e,0,0)),
          flow(samplePosition + vec3(0,e,0)) - flow(samplePosition - vec3(0,e,0)),
          flow(samplePosition + vec3(0,0,e)) - flow(samplePosition - vec3(0,0,e))
        ) / (2. * e);
        objectNormal = normalize(objectNormal - (gradient - objectNormal * dot(gradient, objectNormal)) * mix(.05, .09, uMorph) * breathe);
      `)
      .replace('#include <begin_vertex>', `
        vec3 transformed = mix(aMobius, position, uMorph);
        float strength = mix(.05, .09, uMorph) * breathe;
        vec3 mouseDirection = normalize(vec3(uMouse, 1.3));
        float pull = pow(max(dot(normalize(transformed), mouseDirection), 0.), 5.);
        transformed += objectNormal * flow(transformed) * strength;
        transformed += mouseDirection * pull * length(uMouse) * .045;
        vMetalLocal = transformed;
      `)
    shader.fragmentShader = `
      uniform float uOpacity;
      uniform float uMorph;
      uniform float uHover;
      uniform float uTime;
      uniform vec2 uMouse;
      varying vec3 vMetalLocal;
      float metalHash(vec3 p) {
        p = fract(p * .3183099 + vec3(.17, .31, .73));
        p *= 17.;
        return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
      }
    ` + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <clipping_planes_fragment>', `
        #include <clipping_planes_fragment>
        // Screen-door coverage avoids transparent back faces / ghost spheres.
        float coverage = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
        ${sphere ? 'if (coverage >= uOpacity) discard;' : 'if (coverage < 1. - uOpacity) discard;'}
      `)
      .replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        float grain = metalHash(floor(vMetalLocal * 420.));
        // Blossom: a bloom that opens from the point on the surface facing the
        // pointer, like light unfurling outward in soft petals (haoqi-style
        // cursor bloom), growing in radius as uHover ramps 0->1.
        vec3 mouseDir = normalize(vec3(uMouse, 1.3));
        float toCursor = clamp(dot(normalize(vMetalLocal + vec3(.0001)), mouseDir), -1., 1.);
        float blossomRadius = mix(.6, -.25, uHover);
        float blossomFalloff = smoothstep(blossomRadius, 1., toCursor);
        float petals = .55 + .45 * sin(atan(vMetalLocal.y, vMetalLocal.x) * 7. + uTime * 1.6);
        float blossom = blossomFalloff * mix(.6, 1., petals) * uHover;
        roughnessFactor = clamp(roughnessFactor + (grain - .5) * .07 - uHover * .035 - blossom * .12, .1, .32);
      `)
      .replace('#include <opaque_fragment>', `
        // Deeper cavity contrast: the shaded side sinks toward near-black-blue
        // so lit ridges read as distinct highlight bands, not a flat wash.
        float cavity = mix(.28 + .72 * smoothstep(.5, 1.22, length(vMetalLocal.xy)), 1., uMorph);
        outgoingLight *= cavity * (.9 + grain * .16);
        // Thin blue body, denser grazing edges: DOM copy remains visible
        // through the surface while reflections still describe its volume.
        // Rendered in front of the copy (not behind it), so we can afford a
        // near-opaque body — this is what keeps the blue from washing out
        // against the page's light background, and lets reflections read.
        float glassEdge = pow(1. - abs(dot(normal, normalize(vViewPosition))), 2.);
        diffuseColor.a *= .74 + .24 * glassEdge;
        // Deep electric-blue tint: crush red/green, keep blue hot, so the
        // metal reads as saturated blue chrome rather than pale grey-lilac.
        outgoingLight *= vec3(.24, .42, 1.18);
        outgoingLight += vec3(.0, .015, .28);

        // Drifting light sweep across the brushed surface — two offset bands
        // moving at different rates read as reflections sliding over metal,
        // like the reference lamp's shifting highlight/shadow play.
        float sweep = sin(dot(vMetalLocal, vec3(1.1, .7, .4)) * 2.6 + uTime * .5) * .5 + .5;
        float sweep2 = sin(dot(vMetalLocal, vec3(-.6, 1.3, .9)) * 3.1 - uTime * .35) * .5 + .5;
        float bands = mix(sweep, sweep2, .5);
        outgoingLight *= .7 + bands * .55;
        outgoingLight += vec3(.03, .09, .22) * pow(bands, 3.) * (1. - uMorph * .4);

        // Hover blossom glow: bright cyan-white core blooming outward from the
        // cursor and fading back into the deep blue body.
        outgoingLight += vec3(.25, .6, 1.3) * blossom * 2.0;
        outgoingLight += vec3(.75, .92, 1.0) * pow(blossom, 4.) * 2.2;
        diffuseColor.a = clamp(diffuseColor.a + blossom * .3, 0., 1.);

        outgoingLight *= 1. + uHover * .18;
        #include <opaque_fragment>
      `)
  }
  material.customProgramCacheKey = () => `blue-glass-metal-v9-${sphere}`
  return material
}

// Draw only the nearest surface into depth first. This allows the page to show
// through without accumulating translucent rear faces or exposing mesh seams.
function createDepthPass(material: ReturnType<typeof createMetal>) {
  const depth = material.clone()
  depth.onBeforeCompile = material.onBeforeCompile
  depth.customProgramCacheKey = material.customProgramCacheKey
  depth.transparent = false
  depth.colorWrite = false
  depth.depthWrite = true
  return depth
}

export function LiquidSculpture({ lowPower, reducedMotion }: { lowPower: boolean; reducedMotion: boolean }) {
  const resources = useMemo(() => {
    const shape = createMobiusMorphGeometry({ uSegments: lowPower ? 128 : 224, crossSegments: lowPower ? 32 : 48 })
    const sphere = new THREE.SphereGeometry(1.4, lowPower ? 64 : 96, lowPower ? 48 : 64)
    sphere.setAttribute('aMobius', sphere.getAttribute('position').clone())
    sphere.setAttribute('aMobiusNormal', sphere.getAttribute('normal').clone())
    sphere.setAttribute('aSphereNormal', sphere.getAttribute('normal').clone())
    const shapeMaterial = createMetal()
    const sphereMaterial = createMetal(true)
    return { shape, sphere, shapeMaterial, sphereMaterial,
      shapeDepth: createDepthPass(shapeMaterial), sphereDepth: createDepthPass(sphereMaterial) }
  }, [lowPower])

  useEffect(() => () => {
    Object.values(resources).forEach((resource) => resource.dispose())
  }, [resources])

  useFrame((_, delta) => {
    const { shapeMaterial, sphereMaterial } = resources
    if (reducedMotion) {
      shapeMaterial.uniforms.uMouse.value.set(0, 0)
      sphereMaterial.uniforms.uMouse.value.set(0, 0)
      shapeMaterial.uniforms.uHover.value = 0
      sphereMaterial.uniforms.uHover.value = 0
      return
    }
    shapeMaterial.uniforms.uTime.value += Math.min(delta, .05)
    sphereMaterial.uniforms.uTime.value = shapeMaterial.uniforms.uTime.value
    sphereMaterial.uniforms.uMouse.value.copy(shapeMaterial.uniforms.uMouse.value)
    sphereMaterial.uniforms.uHover.value = shapeMaterial.uniforms.uHover.value
  })

  return <group>
    <mesh name="liquid-shape" geometry={resources.shape} material={resources.shapeMaterial} renderOrder={1}>
      <mesh geometry={resources.shape} material={resources.shapeDepth} />
    </mesh>
    <mesh name="liquid-sphere" geometry={resources.sphere} material={resources.sphereMaterial} visible={false} renderOrder={1}>
      <mesh geometry={resources.sphere} material={resources.sphereDepth} />
    </mesh>
  </group>
}

/** Baked once; no HDR download, no per-frame environment capture. */
export function MetalStudio() {
  return <Environment resolution={256} frames={1}>
    <color attach="background" args={['#15213e']} />
    <Lightformer position={[-3, 3, 4]} scale={[5, 8, 1]} intensity={4} color="#dbeaff" />
    <Lightformer position={[4, 1, 2]} scale={[1.1, 5, 1]} intensity={4} color="#5de3ff" />
    <Lightformer position={[0, 5, -2]} scale={[5, 2, 1]} intensity={5} color="#eef5ff" />
    <Lightformer position={[-2, -3, 2]} scale={[4, .8, 1]} intensity={2} color="#1655ff" />
    <Lightformer position={[1, 0, -4]} scale={[2, 4, 1]} intensity={3} color="#3478ff" />
    <Lightformer position={[0, 0, 5]} scale={[8, 8, 1]} intensity={0.65} color="#77aaff" />
  </Environment>
}
