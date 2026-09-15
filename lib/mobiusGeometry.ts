import * as THREE from 'three'

type Options = {
  uSegments?: number
  crossSegments?: number
  ringRadius?: number
  halfWidth?: number
  halfThickness?: number
  sphereRadius?: number
  /** Amplitude of the depth wobble (`sin(2u)`) that bends the ring out of
   *  its plane twice per revolution. Raising this relative to `ringRadius`
   *  is what makes the band read as a figure-eight/infinity symbol rather
   *  than a flat twisted ring when seen edge-on. */
  depthWave?: number
}

/**
 * A closed, thick Mobius-inspired band made by sweeping an elliptical ribbon
 * cross-section around a circle while rotating that cross-section by 180deg.
 * Each vertex also carries a spherical destination for the scroll morph.
 */
export function createMobiusMorphGeometry({
  uSegments = 160,
  crossSegments = 24,
  ringRadius = 1.02,
  halfWidth = 0.50,
  halfThickness = 0.30,
  sphereRadius = 1.4,
  depthWave = 0.62,
}: Options = {}): THREE.BufferGeometry {
  if (crossSegments % 2 !== 0) throw new Error('crossSegments must be even')

  const count = uSegments * crossSegments
  const sphere = new Float32Array(count * 3)
  const mobius = new Float32Array(count * 3)
  const sphereNormal = new Float32Array(count * 3)
  const indices: number[] = []

  for (let uIndex = 0; uIndex < uSegments; uIndex += 1) {
    const u = uIndex / uSegments * Math.PI * 2
    const halfTurn = u * 0.5
    const cosU = Math.cos(u)
    const sinU = Math.sin(u)
    const cosHalf = Math.cos(halfTurn)
    const sinHalf = Math.sin(halfTurn)

    // The broad ribbon direction rotates from radial/in-plane to camera-depth;
    // its narrow thickness direction stays perpendicular to it.
    const widthDir = new THREE.Vector3(cosU * cosHalf, sinU * cosHalf, sinHalf)
    const thicknessDir = new THREE.Vector3(-cosU * sinHalf, -sinU * sinHalf, cosHalf)
    const center = new THREE.Vector3(ringRadius * cosU, ringRadius * sinU, depthWave * Math.sin(2 * u))

    for (let crossIndex = 0; crossIndex < crossSegments; crossIndex += 1) {
      const theta = crossIndex / crossSegments * Math.PI * 2
      const widthCoord = halfWidth * Math.cos(theta)
      const thicknessCoord = halfThickness * Math.sin(theta)
      const i = uIndex * crossSegments + crossIndex
      const offset = i * 3

      const point = center.clone()
        .addScaledVector(widthDir, widthCoord)
        .addScaledVector(thicknessDir, thicknessCoord)
      mobius.set([point.x, point.y, point.z], offset)

      // The angular destination respects the half-turn seam. The temporary
      // double cover is handed off to a clean sphere at the morph endpoint.
      const latitude = theta + halfTurn
      const cosLat = Math.cos(latitude)
      const sx = sphereRadius * cosLat * cosU
      const sy = sphereRadius * cosLat * sinU
      const sz = sphereRadius * Math.sin(latitude)
      sphere.set([sx, sy, sz], offset)
      sphereNormal.set([sx / sphereRadius, sy / sphereRadius, sz / sphereRadius], offset)
    }
  }

  const seamShift = crossSegments / 2
  for (let uIndex = 0; uIndex < uSegments; uIndex += 1) {
    const atSeam = uIndex === uSegments - 1
    const nextU = atSeam ? 0 : uIndex + 1
    for (let crossIndex = 0; crossIndex < crossSegments; crossIndex += 1) {
      const nextCross = (crossIndex + 1) % crossSegments
      const shifted = atSeam ? (crossIndex + seamShift) % crossSegments : crossIndex
      const shiftedNext = atSeam ? (nextCross + seamShift) % crossSegments : nextCross
      const a = uIndex * crossSegments + crossIndex
      const b = uIndex * crossSegments + nextCross
      const c = nextU * crossSegments + shifted
      const d = nextU * crossSegments + shiftedNext
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(mobius.slice(), 3))
  geometry.setAttribute('aMobius', new THREE.BufferAttribute(mobius, 3))
  geometry.setAttribute('aSphereNormal', new THREE.BufferAttribute(sphereNormal, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.setAttribute('aMobiusNormal', geometry.getAttribute('normal').clone())
  geometry.setAttribute('position', new THREE.BufferAttribute(sphere, 3))
  geometry.computeBoundingSphere()
  geometry.boundingSphere!.radius = Math.max(sphereRadius, ringRadius + halfWidth + depthWave + 0.2)
  return geometry
}
