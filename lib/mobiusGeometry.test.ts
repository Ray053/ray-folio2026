import { describe, expect, it } from 'vitest'
import { createMobiusMorphGeometry } from './mobiusGeometry'

describe('createMobiusMorphGeometry', () => {
  it('has no open edges, including the half-turn seam', () => {
    const geometry = createMobiusMorphGeometry({ uSegments: 48, crossSegments: 16 })
    const edges = new Map<string, number>()
    const index = geometry.index!
    for (let i = 0; i < index.count; i += 3) {
      const tri = [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
      for (let j = 0; j < 3; j++) {
        const a = tri[j], b = tri[(j + 1) % 3]
        const key = `${Math.min(a, b)}:${Math.max(a, b)}`
        edges.set(key, (edges.get(key) ?? 0) + 1)
      }
    }
    expect([...edges.values()].every((count) => count === 2)).toBe(true)
    geometry.dispose()
  })

  it('provides finite unit normals and bounds both morph endpoints', () => {
    const geometry = createMobiusMorphGeometry()
    const normals = geometry.getAttribute('aMobiusNormal')
    const ring = geometry.getAttribute('aMobius')
    for (let i = 0; i < normals.count; i++) {
      expect(Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i))).toBeCloseTo(1, 4)
      expect(Math.hypot(ring.getX(i), ring.getY(i), ring.getZ(i))).toBeLessThan(geometry.boundingSphere!.radius)
    }
    geometry.dispose()
  })

  it('builds a closed sculptural band with both width and physical thickness', () => {
    const geometry = createMobiusMorphGeometry({ uSegments: 48, crossSegments: 16 })
    const mobius = geometry.getAttribute('aMobius')
    const firstRing = Array.from({ length: 16 }, (_, i) => ({
      x: mobius.getX(i),
      y: mobius.getY(i),
      z: mobius.getZ(i),
    }))
    const zSpread = Math.max(...firstRing.map((p) => p.z)) - Math.min(...firstRing.map((p) => p.z))
    const xSpread = Math.max(...firstRing.map((p) => p.x)) - Math.min(...firstRing.map((p) => p.x))

    expect(xSpread).toBeGreaterThan(0.9)
    expect(zSpread).toBeGreaterThan(0.25)
    expect(geometry.index?.count).toBe(48 * 16 * 6)
    geometry.dispose()
  })

  it('provides a spherical destination for every sculptural vertex', () => {
    const geometry = createMobiusMorphGeometry({ uSegments: 32, crossSegments: 12 })
    const positions = geometry.getAttribute('position')
    const mobius = geometry.getAttribute('aMobius')

    expect(positions.count).toBe(mobius.count)
    for (let i = 0; i < positions.count; i += 17) {
      const radius = Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i))
      expect(radius).toBeCloseTo(1.4, 4)
    }
    geometry.dispose()
  })
})
