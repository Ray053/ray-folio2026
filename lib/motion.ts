export const ease = {
  outExpo:  'power4.out',
  inOut:    'power2.inOut',
  outBack:  'back.out(1.4)',
  smooth:   'power1.inOut',
} as const

export const duration = {
  fast:   0.15,
  base:   0.4,
  slow:   0.7,
  slower: 1.2,
  scene:  2.0,
} as const

export const scrollTriggerDefaults = {
  scrub: 1,
  start: 'top 85%',
  end:   'top 20%',
} as const
