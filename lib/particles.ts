/** Evenly distributed points on a sphere (Fibonacci spiral). Returns count*3 floats. */
export function fibonacciSphere(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5)) // golden angle
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2 // 1 → -1
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    out[i * 3]     = Math.cos(theta) * r * radius
    out[i * 3 + 1] = y * radius
    out[i * 3 + 2] = Math.sin(theta) * r * radius
  }
  return out
}
