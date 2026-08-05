import { describe, it, expect } from 'vitest'
import {
  clamp01, lerp, smoothstep, mix2, screenToWorld, ballScale, ballOpacity, JOURNEY,
} from './scrollJourney'

describe('helpers', () => {
  it('clamp01 bounds to [0,1]', () => {
    expect(clamp01(-1)).toBe(0); expect(clamp01(2)).toBe(1); expect(clamp01(0.5)).toBe(0.5)
  })
  it('lerp interpolates', () => {
    expect(lerp(0, 10, 0.5)).toBe(5); expect(lerp(4, 8, 0)).toBe(4)
  })
  it('smoothstep is 0 below, 1 above, 0.5 at midpoint', () => {
    expect(smoothstep(0, 1, -1)).toBe(0)
    expect(smoothstep(0, 1, 2)).toBe(1)
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5)
  })
  it('mix2 interpolates both axes', () => {
    expect(mix2({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 })
  })
})

describe('screenToWorld', () => {
  const vp = { width: 1000, height: 800 }
  const cam = { fov: 40, distance: 6 }
  it('maps screen centre to world origin', () => {
    const w = screenToWorld(500, 400, vp, cam)
    expect(w.x).toBeCloseTo(0); expect(w.y).toBeCloseTo(0)
  })
  it('screen down/right maps to world -y/+x', () => {
    const w = screenToWorld(750, 600, vp, cam)
    expect(w.x).toBeGreaterThan(0)  // right of centre
    expect(w.y).toBeLessThan(0)     // below centre → negative world y
  })
  it('world height at z=0 equals 2*d*tan(fov/2)', () => {
    // point at top edge (py=0) should have worldY = +visibleHeight/2
    const w = screenToWorld(500, 0, vp, cam)
    const vh = 2 * cam.distance * Math.tan((cam.fov / 2) * Math.PI / 180)
    expect(w.y).toBeCloseTo(vh / 2)
  })
})

describe('ballScale', () => {
  it('is large at journey start and small at end', () => {
    expect(ballScale(0)).toBeGreaterThan(ballScale(1))
  })
  it('decreases monotonically (sampled)', () => {
    let prev = ballScale(0)
    for (let p = 0.1; p <= 1; p += 0.1) {
      const cur = ballScale(p)
      expect(cur).toBeLessThanOrEqual(prev + 1e-6)
      prev = cur
    }
  })
  it('stays positive', () => {
    for (let p = 0; p <= 1; p += 0.25) expect(ballScale(p)).toBeGreaterThan(0)
  })
})

describe('ballOpacity', () => {
  it('stays within a sane translucent range', () => {
    for (let p = 0; p <= 1; p += 0.25) {
      const o = ballOpacity(p)
      expect(o).toBeGreaterThan(0.3); expect(o).toBeLessThanOrEqual(1)
    }
  })
})

describe('JOURNEY constants', () => {
  it('exposes camera + opacity tunables', () => {
    expect(JOURNEY.camDistance).toBeGreaterThan(0)
    expect(JOURNEY.camFov).toBeGreaterThan(0)
    expect(JOURNEY.opacity).toBeGreaterThan(0)
  })
})
