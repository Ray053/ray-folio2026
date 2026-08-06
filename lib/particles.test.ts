import { describe, it, expect } from 'vitest'
import { fibonacciSphere } from './particles'

describe('fibonacciSphere', () => {
  it('returns count*3 floats', () => {
    expect(fibonacciSphere(100, 1).length).toBe(300)
  })
  it('every point lies on the sphere of the given radius', () => {
    const r = 1.4
    const p = fibonacciSphere(200, r)
    for (let i = 0; i < p.length; i += 3) {
      const d = Math.hypot(p[i], p[i + 1], p[i + 2])
      expect(d).toBeCloseTo(r, 4)
    }
  })
  it('handles count 1 without NaN', () => {
    const p = fibonacciSphere(1, 2)
    expect(p.length).toBe(3)
    expect(Number.isNaN(p[0])).toBe(false)
  })
})
